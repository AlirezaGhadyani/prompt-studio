import type { HostClient, HostReadyContext } from '@openchamber/sdk';
import {
  mountBanner,
  mountButton,
  mountEmpty,
  mountList,
  mountMenu,
  mountSearchField,
  mountSelect,
  mountTabs,
} from '@openchamber/sdk/ui';
import type { Notice, Store } from '../state/store.ts';
import { starterTemplates } from '../templates/starter.ts';
import { clear, el, isTextEntry, relativeTime } from './dom.ts';
import {
  confirmDialog,
  isDialogOpen,
  openCategoriesDialog,
  openExportDialog,
  openImportDialog,
} from './dialogs.ts';
import { EditorView } from './editor.ts';

export class App {
  private readonly store: Store;
  private readonly host: HostClient;
  private readonly editor: EditorView;
  private readonly root: HTMLElement;
  private readonly libraryPane: HTMLElement;
  private readonly editorPane: HTMLElement;
  private readonly listRoot: HTMLElement;
  private readonly noticeRoot: HTMLElement;
  private readonly editorEmptyRoot: HTMLElement;
  private list: ReturnType<typeof mountList> | null = null;
  private tabs: ReturnType<typeof mountTabs> | null = null;
  private categorySelect: ReturnType<typeof mountSelect> | null = null;
  private search: ReturnType<typeof mountSearchField> | null = null;
  private noticeHandle: { dispose: () => void } | null = null;
  private editorEmpty: { dispose: () => void } | null = null;
  private noticeKey = '';
  private editorToken = '';
  private noticeTimer: number | null = null;
  private mounted = false;

  constructor(store: Store, host: HostClient) {
    this.store = store;
    this.host = host;
    this.root = document.querySelector('#root') as HTMLElement;
    this.libraryPane = el('div', 'ps-library');
    this.editorPane = el('div', 'ps-editor-pane');
    this.listRoot = el('div', 'ps-list');
    this.noticeRoot = el('div', 'ps-notice');
    this.editorEmptyRoot = el('div', 'ps-empty');
    this.libraryPane.append(this.listRoot);
    this.editorPane.append(this.editorEmptyRoot);
    this.editor = new EditorView(store, {
      onBack: () => this.store.showLibrary(),
      onDelete: (id) => void this.requestDelete(id),
      onDuplicate: (id) => void this.store.duplicate(id),
      onExport: (id) => void this.exportIds([id], 'This template'),
      onMove: (id, direction) => void this.store.move(id, direction),
    });
  }

  mount(context: HostReadyContext): void {
    if (this.mounted) return;
    this.mounted = true;

    const app = el('div', 'ps-app');
    app.dataset.surface = context.surface;

    const top = el('div', 'ps-top');
    top.append(el('h1', 'ps-title', 'Prompt Studio'));

    const searchRow = el('div', 'ps-row');
    const searchHolder = el('span', 'ps-grow');
    const newHolder = el('span');
    searchRow.append(searchHolder, newHolder);

    const filters = el('div', 'ps-filters');
    const tabsHolder = el('div');
    const categoryHolder = el('div');
    filters.append(searchRow, tabsHolder, categoryHolder);

    const main = el('div', 'ps-main');
    main.append(this.libraryPane, this.editorPane);

    app.append(top, filters, this.noticeRoot, main);
    clear(this.root);
    this.root.append(app);

    this.search = mountSearchField(searchHolder, {
      value: this.store.getState().query,
      placeholder: 'Search templates',
      label: 'Search templates',
      onChange: (value) => this.store.setQuery(value),
    });

    mountButton(newHolder, {
      label: 'New',
      variant: 'default',
      size: 'sm',
      onClick: () => void this.store.newTemplate(),
    });

    const menuHolder = el('span');
    top.append(menuHolder);
    mountMenu(menuHolder, {
      label: 'Menu',
      variant: 'ghost',
      size: 'sm',
      items: [
        { id: 'starter', label: 'Load starter templates' },
        { id: 'import', label: 'Import templates…' },
        { separator: true },
        { id: 'export-all', label: 'Export all…' },
        { id: 'export-filtered', label: 'Export filtered…' },
        { separator: true },
        { id: 'categories', label: 'Manage categories…' },
        { id: 'reload', label: 'Reload library' },
      ],
      onSelect: (id) => void this.handleMenu(id),
    });

    this.tabs = mountTabs(tabsHolder, {
      items: [
        { id: 'all', label: 'All' },
        { id: 'favorites', label: 'Favorites' },
        { id: 'recent', label: 'Recent' },
      ],
      activeId: this.store.getState().tab,
      onChange: (id) => this.store.setTab(id as 'all' | 'favorites' | 'recent'),
    });

    this.categorySelect = mountSelect(categoryHolder, {
      value: '',
      options: [{ id: '', label: 'All categories' }],
      searchable: true,
      onChange: (id) => this.store.setCategoryFilter(id || null),
    });

    this.list = mountList(this.listRoot, {
      items: [],
      onSelect: (id) => void this.store.openTemplate(id),
      emptyText: 'No templates',
    });

    document.addEventListener('keydown', (event) => {
      if (isDialogOpen()) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        void this.store.newTemplate();
        return;
      }
      if (!modifier && event.key === '/' && !isTextEntry(event.target)) {
        event.preventDefault();
        this.focusSearch();
        return;
      }
      if (event.key === 'Escape' && !isTextEntry(event.target) && this.store.getState().view === 'editor') {
        this.store.showLibrary();
      }
    });

    this.store.subscribe(() => this.render());
    this.render();
  }

  private focusSearch(): void {
    const input = this.root.querySelector('.ps-filters input');
    if (input instanceof HTMLElement) input.focus();
  }

  private async requestDelete(id: string): Promise<void> {
    const entry = this.store.getState().entries.find((item) => item.id === id);
    const name = entry?.name ?? 'this template';
    const confirmed = await confirmDialog(
      `Delete "${name}"?`,
      'You can restore it once from the notice afterwards. Export first to keep a permanent copy.',
      'Delete',
      true,
    );
    if (confirmed) await this.store.remove(id);
  }

  private async handleMenu(id: string): Promise<void> {
    if (id === 'starter') {
      await this.store.importStarter(starterTemplates);
      return;
    }
    if (id === 'import') {
      openImportDialog(this.store);
      return;
    }
    if (id === 'categories') {
      openCategoriesDialog(this.store);
      return;
    }
    if (id === 'export-all') {
      await this.exportAll('all', 'All templates');
      return;
    }
    if (id === 'export-filtered') {
      await this.exportAll('filtered', 'Filtered templates');
      return;
    }
    if (id === 'reload') {
      this.store.reload();
    }
  }

  private async exportAll(scope: 'all' | 'filtered', label: string): Promise<void> {
    try {
      const json = await this.store.buildExport(scope);
      openExportDialog(this.store, json, label);
    } catch (error) {
      this.store.setNotice({
        tone: 'error',
        title: 'Could not build the export.',
        body: error instanceof Error ? error.message : undefined,
      });
    }
  }

  private async exportIds(ids: string[], label: string): Promise<void> {
    try {
      const json = await this.store.buildExportIds(ids);
      openExportDialog(this.store, json, label);
    } catch (error) {
      this.store.setNotice({
        tone: 'error',
        title: 'Could not build the export.',
        body: error instanceof Error ? error.message : undefined,
      });
    }
  }

  private render(): void {
    if (!this.mounted) return;
    const state = this.store.getState();
    const app = this.root.querySelector('.ps-app') as HTMLElement | null;
    if (app) app.dataset.surface = state.surface;

    const showEditor = state.view === 'editor' && state.draft !== null;
    const wide = state.surface === 'page';
    this.libraryPane.hidden = !wide && showEditor;
    this.editorPane.hidden = !wide && !showEditor;

    if (state.phase === 'loading') {
      this.list?.update({ items: [], emptyText: 'Loading library…' });
      return;
    }
    if (state.phase === 'error') {
      this.list?.update({ items: [], emptyText: state.fatal ?? 'Could not read the library.' });
      return;
    }

    const entries = this.store.visibleEntries();
    const categoryName = (id: string): string =>
      state.categories.find((category) => category.id === id)?.name ?? 'General';
    const items = entries.map((entry) => ({
      id: entry.id,
      title: `${entry.favorite ? '★ ' : ''}${entry.name}`,
      subtitle: [categoryName(entry.categoryId), entry.description].filter(Boolean).join(' · ').slice(0, 140),
      meta: entry.lastUsedAt ? relativeTime(entry.lastUsedAt) : entry.fieldCount > 0 ? `${entry.fieldCount} fields` : '',
    }));
    const emptyText =
      state.entries.length === 0
        ? 'No templates yet. Create one, or load the starter set from the menu.'
        : state.tab === 'recent'
          ? 'No recently used templates.'
          : 'No templates match.';
    this.list?.update({ items, selectedId: state.draft?.id ?? null, emptyText });

    this.tabs?.update({
      items: [
        { id: 'all', label: 'All', count: state.entries.length },
        { id: 'favorites', label: 'Favorites', count: state.entries.filter((entry) => entry.favorite).length },
        { id: 'recent', label: 'Recent', count: state.entries.filter((entry) => entry.lastUsedAt).length },
      ],
      activeId: state.tab,
    });

    this.categorySelect?.update({
      value: state.categoryFilter ?? '',
      options: [
        { id: '', label: 'All categories' },
        ...state.categories.map((category) => ({ id: category.id, label: category.name })),
      ],
    });

    this.renderNotice(state.notice, state.lastDeleted !== null);

    if (showEditor && state.draft) {
      this.disposeEmpty();
      if (!this.editor.root.parentNode) this.editorPane.append(this.editor.root);
      const token = `${state.draft.id ?? 'new'}:${state.draft.tab}:${state.editorNonce}`;
      if (token !== this.editorToken) {
        this.editorToken = token;
        this.editor.mount(state.draft);
      } else {
        this.editor.update(state.draft);
      }
    } else {
      this.editor.destroy();
      this.editorToken = '';
      this.showEditorEmpty(wide);
    }
  }

  private showEditorEmpty(wide: boolean): void {
    this.disposeEmpty();
    if (!wide) return;
    this.editorEmpty = mountEmpty(this.editorEmptyRoot, {
      title: 'Select a template',
      body: 'Pick one on the left to customize and insert it.',
      action: { label: 'Create template', onClick: () => void this.store.newTemplate() },
    });
  }

  private disposeEmpty(): void {
    this.editorEmpty?.dispose();
    this.editorEmpty = null;
  }

  private renderNotice(notice: Notice | null, canUndo: boolean): void {
    const key = notice ? `${notice.tone}|${notice.title}|${notice.body ?? ''}|${canUndo}` : '';
    if (key === this.noticeKey) return;
    this.noticeKey = key;

    if (!notice) {
      this.noticeHandle?.dispose();
      this.noticeHandle = null;
      clear(this.noticeRoot);
      return;
    }
    clear(this.noticeRoot);
    this.noticeHandle?.dispose();
    const undo =
      canUndo && notice.tone === 'success' && notice.title.startsWith('Deleted')
        ? { label: 'Undo', onClick: () => void this.store.undoDelete() }
        : undefined;
    this.noticeHandle = mountBanner(this.noticeRoot, {
      tone: notice.tone,
      title: notice.title,
      body: notice.body,
      action: undo,
    });

    if (this.noticeTimer !== null) window.clearTimeout(this.noticeTimer);
    if (notice.tone === 'success' || notice.tone === 'info') {
      this.noticeTimer = window.setTimeout(() => {
        this.noticeTimer = null;
        this.store.dismissNotice();
      }, 8000);
    }
  }

  /** Kept for callers that need the host (dialogs use the store). */
  getHost(): HostClient {
    return this.host;
  }
}
