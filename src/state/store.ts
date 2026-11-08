import type { HostClient, HostReadyContext } from '@openchamber/sdk';
import {
  COMPOSE_LIMIT,
  CLIPBOARD_LIMIT,
  GENERAL_CATEGORY_ID,
  createId,
  indexEntry,
  missingRequiredFields,
  normalizeFields,
  renderTemplate,
  type Category,
  type IndexEntry,
  type Template,
  type TemplateField,
} from '../templates/schema.ts';
import { Library, LibraryError, type DuplicatePolicy, type StorageAdapter } from '../storage/library.ts';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export interface Notice {
  tone: NoticeTone;
  title: string;
  body?: string;
}

export type LibraryTab = 'all' | 'favorites' | 'recent';
export type EditorTab = 'prompt' | 'template';
export type InsertMode = 'replace' | 'append';

export interface Draft {
  /** null until the first save of a new template. */
  id: string | null;
  isNew: boolean;
  name: string;
  description: string;
  categoryId: string;
  tags: string;
  canonicalBody: string;
  fields: TemplateField[];
  values: Record<string, string>;
  prompt: string;
  manualEdits: boolean;
  tab: EditorTab;
  dirty: boolean;
}

export interface AppState {
  phase: 'loading' | 'ready' | 'error';
  fatal: string | null;
  categories: Category[];
  entries: IndexEntry[];
  query: string;
  tab: LibraryTab;
  categoryFilter: string | null;
  view: 'library' | 'editor';
  draft: Draft | null;
  saving: boolean;
  notice: Notice | null;
  lastDeleted: { template: Template; name: string } | null;
  surface: HostReadyContext['surface'];
  sessionOpen: boolean;
  /** Bumped when the editor must be rebuilt from the draft. */
  editorNonce: number;
}

const EMPTY_DRAFT = (categoryId: string): Draft => ({
  id: null,
  isNew: true,
  name: '',
  description: '',
  categoryId,
  tags: '',
  canonicalBody: '',
  fields: [],
  values: {},
  prompt: '',
  manualEdits: false,
  tab: 'template',
  dirty: false,
});

export class Store {
  private host: HostClient | null = null;
  private library: Library | null = null;
  private listeners = new Set<() => void>();
  private state: AppState = {
    phase: 'loading',
    fatal: null,
    categories: [],
    entries: [],
    query: '',
    tab: 'all',
    categoryFilter: null,
    view: 'library',
    draft: null,
    saving: false,
    notice: null,
    lastDeleted: null,
    surface: 'panel',
    sessionOpen: false,
    editorNonce: 0,
  };

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  setContext(context: HostReadyContext): void {
    this.set({
      surface: context.surface,
      sessionOpen: context.session !== null,
    });
  }

  setSessionOpen(open: boolean): void {
    if (this.state.sessionOpen === open) return;
    this.set({ sessionOpen: open });
  }

  async copyText(text: string): Promise<void> {
    if (text.length > CLIPBOARD_LIMIT) {
      this.set({
        notice: {
          tone: 'warning',
          title: `That text is ${text.length.toLocaleString()} characters.`,
          body: `Clipboard writes stop at ${CLIPBOARD_LIMIT.toLocaleString()}. Select it in the dialog and copy it.`,
        },
      });
      return;
    }
    try {
      await this.requireHost().writeClipboard(text);
      await this.requireHost().toast({ kind: 'success', message: 'Copied.' });
    } catch (error) {
      this.set({
        notice: { tone: 'error', title: 'Copy failed.', body: error instanceof Error ? error.message : undefined },
      });
    }
  }

  async init(host: HostClient, context: HostReadyContext): Promise<void> {
    this.host = host;
    this.setContext(context);
    const adapter: StorageAdapter = {
      get: (key) => host.storage.get(key),
      set: (key, value) => host.storage.set(key, value as never),
      delete: (key) => host.storage.delete(key),
      keys: () => host.storage.keys(),
    };
    this.library = new Library(adapter);
    try {
      await this.library.load();
      this.set({
        phase: 'ready',
        categories: this.library.getCategories(),
        entries: this.library.getEntries(),
      });
    } catch (error) {
      this.set({
        phase: 'error',
        fatal: error instanceof Error ? error.message : 'Could not read the prompt library.',
      });
    }
  }

  dismissNotice(): void {
    this.set({ notice: null });
  }

  setNotice(notice: Notice | null): void {
    this.set({ notice });
  }

  private requireLibrary(): Library {
    if (!this.library) throw new LibraryError('The library is still loading.');
    return this.library;
  }

  private requireHost(): HostClient {
    if (!this.host) throw new Error('OpenChamber is not connected.');
    return this.host;
  }

  private refreshFromLibrary(): void {
    if (!this.library) return;
    this.set({ categories: this.library.getCategories(), entries: this.library.getEntries() });
  }

  private reportError(error: unknown, fallback: string): void {
    const message = error instanceof Error ? error.message : fallback;
    this.set({ notice: { tone: 'error', title: fallback, body: message } });
  }

  // ---- filters -------------------------------------------------------------

  setQuery(query: string): void {
    this.set({ query });
  }

  setTab(tab: LibraryTab): void {
    this.set({ tab });
  }

  setCategoryFilter(id: string | null): void {
    this.set({ categoryFilter: id });
  }

  /** Entries after search, tab and category filters, in library order. */
  visibleEntries(): IndexEntry[] {
    const { entries, query, tab, categoryFilter } = this.state;
    const needle = query.trim().toLowerCase();
    let list = entries;
    if (tab === 'favorites') list = list.filter((entry) => entry.favorite);
    if (tab === 'recent') {
      list = list
        .filter((entry) => entry.lastUsedAt)
        .sort((a, b) => String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)))
        .slice(0, 12);
    }
    if (categoryFilter) list = list.filter((entry) => entry.categoryId === categoryFilter);
    if (needle) {
      list = list.filter((entry) => {
        const haystack = `${entry.name}\n${entry.description}\n${entry.tags.join(' ')}`.toLowerCase();
        return haystack.includes(needle);
      });
    }
    return list;
  }

  // ---- library view --------------------------------------------------------

  showLibrary(): void {
    this.set({ view: 'library' });
  }

  async newTemplate(): Promise<void> {
    const categoryId = this.state.categoryFilter ?? GENERAL_CATEGORY_ID;
    this.set({
      view: 'editor',
      draft: EMPTY_DRAFT(categoryId),
      editorNonce: this.state.editorNonce + 1,
      notice: null,
    });
  }

  async openTemplate(id: string): Promise<void> {
    const library = this.requireLibrary();
    try {
      const template = await library.getTemplate(id);
      if (!template) {
        this.set({ notice: { tone: 'error', title: 'That template no longer exists.' } });
        this.refreshFromLibrary();
        return;
      }
      const values: Record<string, string> = {};
      for (const field of template.fields) values[field.key] = field.defaultValue ?? '';
      const prompt = template.fields.length
        ? renderTemplate(template.body, template.fields, values)
        : template.body;
      this.set({
        view: 'editor',
        draft: {
          id: template.id,
          isNew: false,
          name: template.name,
          description: template.description,
          categoryId: template.categoryId,
          tags: template.tags.join(', '),
          canonicalBody: template.body,
          fields: template.fields,
          values,
          prompt,
          manualEdits: false,
          tab: 'prompt',
          dirty: false,
        },
        editorNonce: this.state.editorNonce + 1,
        notice: null,
      });
    } catch (error) {
      this.reportError(error, 'Could not open the template.');
    }
  }

  // ---- draft editing -------------------------------------------------------

  private patchDraft(patch: Partial<Draft>): void {
    if (!this.state.draft) return;
    this.state = {
      ...this.state,
      draft: { ...this.state.draft, ...patch, dirty: true },
    };
    this.notify();
  }

  setDraftMeta(patch: { name?: string; description?: string; categoryId?: string; tags?: string }): void {
    this.patchDraft(patch);
  }

  setEditorTab(tab: EditorTab): void {
    if (!this.state.draft) return;
    if (this.state.draft.tab === tab) return;
    this.set({ draft: { ...this.state.draft, tab } });
  }

  setPrompt(text: string): void {
    const draft = this.state.draft;
    if (!draft) return;
    this.set({ draft: { ...draft, prompt: text, manualEdits: true, dirty: true } });
  }

  setCanonicalBody(text: string): void {
    const draft = this.state.draft;
    if (!draft) return;
    const prompt = draft.manualEdits ? draft.prompt : renderTemplate(text, draft.fields, draft.values);
    this.set({ draft: { ...draft, canonicalBody: text, prompt, dirty: true } });
  }

  setFieldValue(key: string, value: string): void {
    const draft = this.state.draft;
    if (!draft) return;
    const values = { ...draft.values, [key]: value };
    const prompt = draft.manualEdits
      ? draft.prompt
      : renderTemplate(draft.canonicalBody, draft.fields, values);
    this.set({ draft: { ...draft, values, prompt, dirty: true } });
  }

  applyFieldValues(): void {
    const draft = this.state.draft;
    if (!draft) return;
    const prompt = renderTemplate(draft.canonicalBody, draft.fields, draft.values);
    this.set({ draft: { ...draft, prompt, manualEdits: false, dirty: true } });
  }

  addField(field: TemplateField): void {
    const draft = this.state.draft;
    if (!draft) return;
    if (draft.fields.some((item) => item.key === field.key)) {
      this.set({ notice: { tone: 'error', title: `A field named "${field.key}" already exists.` } });
      return;
    }
    const fields = [...draft.fields, field];
    const values = { ...draft.values, [field.key]: field.defaultValue ?? '' };
    const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, fields, values);
    this.set({
      draft: { ...draft, fields, values, prompt, dirty: true },
      notice: null,
      editorNonce: this.state.editorNonce + 1,
    });
  }

  updateField(key: string, patch: Partial<TemplateField>): void {
    const draft = this.state.draft;
    if (!draft) return;
    const fields = draft.fields.map((field) => (field.key === key ? { ...field, ...patch, key } : field));
    const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, fields, draft.values);
    this.set({
      draft: { ...draft, fields, prompt, dirty: true },
      editorNonce: this.state.editorNonce + 1,
    });
  }

  removeField(key: string): void {
    const draft = this.state.draft;
    if (!draft) return;
    const values = { ...draft.values };
    delete values[key];
    const fields = draft.fields.filter((field) => field.key !== key);
    const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, fields, values);
    this.set({
      draft: { ...draft, fields, values, prompt, dirty: true },
      editorNonce: this.state.editorNonce + 1,
    });
  }

  resetPromptToTemplate(): void {
    const draft = this.state.draft;
    if (!draft) return;
    const prompt = renderTemplate(draft.canonicalBody, draft.fields, draft.values);
    this.set({ draft: { ...draft, prompt, manualEdits: false } });
  }

  // ---- persistence ---------------------------------------------------------

  async saveDraft(): Promise<void> {
    const draft = this.state.draft;
    if (!draft || !this.library) return;
    if (!draft.name.trim()) {
      this.set({ notice: { tone: 'error', title: 'Give the template a name before saving.' }, draft: { ...draft, tab: 'template' } });
      return;
    }
    if (!draft.canonicalBody.trim()) {
      this.set({ notice: { tone: 'error', title: 'The template body is empty.' }, draft: { ...draft, tab: 'template' } });
      return;
    }
    this.set({ saving: true });
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        categoryId: draft.categoryId,
        tags: draft.tags,
        body: draft.canonicalBody,
        fields: draft.fields,
      };
      let saved: Template;
      if (draft.isNew) {
        saved = await this.library.create(payload);
      } else if (draft.id) {
        saved = await this.library.update(draft.id, payload);
      } else {
        throw new LibraryError('The draft has no template id.');
      }
      this.refreshFromLibrary();
      const values: Record<string, string> = {};
      for (const field of saved.fields) values[field.key] = draft.values[field.key] ?? field.defaultValue ?? '';
      const prompt = draft.manualEdits
        ? draft.prompt
        : renderTemplate(saved.body, saved.fields, values);
      this.set({
        saving: false,
        editorNonce: this.state.editorNonce + 1,
        draft: {
          ...draft,
          id: saved.id,
          isNew: false,
          canonicalBody: saved.body,
          fields: saved.fields,
          values,
          prompt,
          dirty: false,
        },
        notice: { tone: 'success', title: draft.isNew ? 'Template created.' : 'Template saved.' },
      });
    } catch (error) {
      this.set({ saving: false });
      this.reportError(error, 'Could not save the template.');
    }
  }

  // ---- composer ------------------------------------------------------------

  private draftText(): string {
    return (this.state.draft?.prompt ?? '').trim();
  }

  async insert(mode: InsertMode): Promise<void> {
    const text = this.draftText();
    if (!text) {
      this.set({ notice: { tone: 'error', title: 'The prompt is empty. Nothing to insert.' } });
      return;
    }
    if (text.length > COMPOSE_LIMIT) {
      this.set({
        notice: {
          tone: 'error',
          title: `The prompt is ${text.length.toLocaleString()} characters.`,
          body: `The composer accepts ${COMPOSE_LIMIT.toLocaleString()}. Shorten it, or use Copy and paste in parts.`,
        },
      });
      return;
    }
    if (!this.state.sessionOpen) {
      this.set({
        notice: {
          tone: 'warning',
          title: 'Open a chat first.',
          body: 'The composer belongs to a session. Use Copy to take the prompt with you.',
        },
      });
      return;
    }
    try {
      await this.requireHost().compose({ text, mode });
      const host = this.requireHost();
      await host.toast({ kind: 'success', message: mode === 'replace' ? 'Prompt replaced in the composer.' : 'Prompt appended to the composer.' });
      const id = this.state.draft?.id;
      if (id) {
        await this.library?.touch(id);
        this.refreshFromLibrary();
      }
    } catch (error) {
      this.set({
        notice: {
          tone: 'error',
          title: 'Could not reach the composer.',
          body: error instanceof Error ? error.message : 'The host did not accept the text. Use Copy instead.',
        },
      });
    }
  }

  /** Returns true when the whole prompt fit in one clipboard write. */
  async copyPrompt(): Promise<boolean> {
    const text = this.draftText();
    if (!text) {
      this.set({ notice: { tone: 'error', title: 'The prompt is empty.' } });
      return false;
    }
    if (text.length > CLIPBOARD_LIMIT) {
      this.set({
        notice: {
          tone: 'warning',
          title: `The prompt is ${text.length.toLocaleString()} characters.`,
          body: `Clipboard writes stop at ${CLIPBOARD_LIMIT.toLocaleString()}. Select the text in the editor and copy it.`,
        },
      });
      return false;
    }
    try {
      await this.requireHost().writeClipboard(text);
      await this.requireHost().toast({ kind: 'success', message: 'Prompt copied.' });
      return true;
    } catch (error) {
      this.set({
        notice: { tone: 'error', title: 'Copy failed.', body: error instanceof Error ? error.message : undefined },
      });
      return false;
    }
  }

  // ---- template management -------------------------------------------------

  async duplicate(id: string): Promise<void> {
    if (!this.library) return;
    try {
      const copy = await this.library.duplicate(id);
      this.refreshFromLibrary();
      await this.openTemplate(copy.id);
      this.set({ notice: { tone: 'success', title: `Duplicated as "${copy.name}".` } });
    } catch (error) {
      this.reportError(error, 'Could not duplicate the template.');
    }
  }

  async remove(id: string): Promise<void> {
    if (!this.library) return;
    try {
      const template = await this.library.getTemplate(id);
      await this.library.remove(id);
      this.refreshFromLibrary();
      this.set({
        view: 'library',
        draft: null,
        lastDeleted: template ? { template, name: template.name } : null,
        notice: { tone: 'success', title: template ? `Deleted "${template.name}".` : 'Template deleted.' },
      });
    } catch (error) {
      this.reportError(error, 'Could not delete the template.');
    }
  }

  async undoDelete(): Promise<void> {
    const last = this.state.lastDeleted;
    if (!last || !this.library) return;
    try {
      await this.library.restore(last.template);
      this.refreshFromLibrary();
      this.set({ lastDeleted: null, notice: { tone: 'success', title: `Restored "${last.name}".` } });
    } catch (error) {
      this.reportError(error, 'Could not restore the template.');
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!this.library) return;
    const entry = this.state.entries.find((item) => item.id === id);
    if (!entry) return;
    try {
      await this.library.setFavorite(id, !entry.favorite);
      this.refreshFromLibrary();
      const draft = this.state.draft;
      if (draft?.id === id) this.set({ draft: { ...draft }, editorNonce: this.state.editorNonce + 1 });
    } catch (error) {
      this.reportError(error, 'Could not update the favorite.');
    }
  }

  async move(id: string, direction: -1 | 1): Promise<void> {
    if (!this.library) return;
    try {
      await this.library.reorder(id, direction);
      this.refreshFromLibrary();
    } catch (error) {
      this.reportError(error, 'Could not reorder the template.');
    }
  }

  // ---- categories ----------------------------------------------------------

  async addCategory(name: string): Promise<boolean> {
    if (!this.library) return false;
    try {
      await this.library.addCategory(name);
      this.refreshFromLibrary();
      return true;
    } catch (error) {
      this.reportError(error, 'Could not add the category.');
      return false;
    }
  }

  async renameCategory(id: string, name: string): Promise<boolean> {
    if (!this.library) return false;
    try {
      await this.library.renameCategory(id, name);
      this.refreshFromLibrary();
      return true;
    } catch (error) {
      this.reportError(error, 'Could not rename the category.');
      return false;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.library) return;
    try {
      const moved = await this.library.deleteCategory(id);
      this.refreshFromLibrary();
      this.set({
        categoryFilter: this.state.categoryFilter === id ? null : this.state.categoryFilter,
        notice: {
          tone: 'success',
          title: 'Category deleted.',
          body: moved > 0 ? `${moved} template${moved === 1 ? '' : 's'} moved to General.` : undefined,
        },
      });
    } catch (error) {
      this.reportError(error, 'Could not delete the category.');
    }
  }

  // ---- import / export -----------------------------------------------------

  async buildExport(scope: 'all' | 'filtered' | 'current'): Promise<string> {
    const library = this.requireLibrary();
    let ids: string[] | undefined;
    if (scope === 'current') {
      const id = this.state.draft?.id;
      ids = id ? [id] : [];
    } else if (scope === 'filtered') {
      ids = this.visibleEntries().map((entry) => entry.id);
    }
    const document = await library.exportDocument(ids);
    return JSON.stringify(document, null, 2);
  }

  async buildExportIds(ids: readonly string[]): Promise<string> {
    const document = await this.requireLibrary().exportDocument(ids);
    return JSON.stringify(document, null, 2);
  }

  async importText(text: string, policy: DuplicatePolicy): Promise<void> {
    const library = this.requireLibrary();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.set({ notice: { tone: 'error', title: 'That is not valid JSON.' } });
      return;
    }
    const document = library.parseDocument(parsed);
    if (!document.ok) {
      this.set({ notice: { tone: 'error', title: 'Import rejected.', body: document.error } });
      return;
    }
    try {
      const outcome = await library.importTemplates(document.templates, policy, document.categories);
      this.refreshFromLibrary();
      const parts = [
        `${outcome.added} added`,
        `${outcome.replaced} replaced`,
        `${outcome.skipped} skipped`,
        `${outcome.rejected.length + document.errors.length} rejected`,
      ];
      this.set({
        notice: {
          tone: outcome.rejected.length || document.errors.length ? 'warning' : 'success',
          title: 'Import finished.',
          body: parts.join(' · '),
        },
      });
    } catch (error) {
      this.reportError(error, 'Import failed.');
    }
  }

  /** Adds the bundled starter library, skipping templates that already exist. */
  async importStarter(templates: Template[]): Promise<void> {
    const library = this.requireLibrary();
    try {
      const outcome = await library.importTemplates(templates, 'skip');
      this.refreshFromLibrary();
      this.set({
        notice: {
          tone: 'success',
          title: 'Starter templates loaded.',
          body: `${outcome.added} added · ${outcome.skipped} already present`,
        },
      });
    } catch (error) {
      this.reportError(error, 'Could not load the starter templates.');
    }
  }

  /** Rebuilds the index entry list after an external change. */
  reload(): void {
    this.refreshFromLibrary();
    this.set({ editorNonce: this.state.editorNonce + 1 });
  }

  /** Exposed for tests and for the editor's placeholder hints. */
  static normalizeFields = normalizeFields;
  static missingRequiredFields = missingRequiredFields;
  static createId = createId;
}
