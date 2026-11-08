import {
  DEFAULT_CATEGORIES,
  GENERAL_CATEGORY_ID,
  SCHEMA_VERSION,
  STORAGE_VALUE_LIMIT,
  byteLength,
  createId,
  exportTemplate,
  indexEntry,
  isCategoryId,
  normalizeTemplate,
  nowIso,
  type Category,
  type IndexEntry,
  type Template,
} from '../templates/schema.ts';

/** The small slice of `host.storage` the library needs. */
export interface StorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

interface LibraryMeta {
  schemaVersion: number;
  categories: Category[];
  chunks: number;
  updatedAt: string;
}

export interface ImportOutcome {
  added: number;
  replaced: number;
  skipped: number;
  rejected: Array<{ name: string; reason: string }>;
}

export type DuplicatePolicy = 'skip' | 'replace' | 'copy';

const META_KEY = 'meta';
const INDEX_PREFIX = 'idx:';
const TEMPLATE_PREFIX = 't:';

/** About 45 KB per chunk, comfortably under the 64 KiB value limit. */
const CHUNK_SIZE = 120;

export class LibraryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LibraryError';
  }
}

export class Library {
  private readonly adapter: StorageAdapter;
  private readonly now: () => string;
  private categories: Category[] = DEFAULT_CATEGORIES.map((category) => ({ ...category }));
  private entries: IndexEntry[] = [];
  private chunks = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(adapter: StorageAdapter, now: () => string = nowIso) {
    this.adapter = adapter;
    this.now = now;
  }

  /** Runs writes one after another so two edits never interleave. */
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation, operation);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async load(): Promise<void> {
    const meta = await this.adapter.get(META_KEY);
    if (!this.isMeta(meta)) {
      await this.writeMeta();
      this.entries = [];
      this.chunks = 0;
      return;
    }
    this.categories = meta.categories;
    this.chunks = meta.chunks;
    const chunks = await Promise.all(
      Array.from({ length: meta.chunks }, (_, index) => this.adapter.get(`${INDEX_PREFIX}${index}`)),
    );
    const entries: IndexEntry[] = [];
    for (const chunk of chunks) {
      if (!Array.isArray(chunk)) continue;
      for (const item of chunk) {
        if (item && typeof item === 'object' && typeof (item as IndexEntry).id === 'string') {
          entries.push(item as IndexEntry);
        }
      }
    }
    this.entries = entries.sort(compareEntries);
  }

  private isMeta(value: unknown): value is LibraryMeta {
    if (!value || typeof value !== 'object') return false;
    const meta = value as LibraryMeta;
    return (
      meta.schemaVersion === SCHEMA_VERSION &&
      Array.isArray(meta.categories) &&
      meta.categories.length > 0 &&
      Number.isInteger(meta.chunks) &&
      meta.chunks >= 0
    );
  }

  private async writeMeta(): Promise<void> {
    const meta: LibraryMeta = {
      schemaVersion: SCHEMA_VERSION,
      categories: this.categories,
      chunks: this.chunks,
      updatedAt: this.now(),
    };
    if (byteLength(meta) > STORAGE_VALUE_LIMIT) throw new LibraryError('Category list is too large to store.');
    await this.adapter.set(META_KEY, meta);
  }

  private async writeIndex(): Promise<void> {
    const entries = [...this.entries].sort(compareEntries);
    const chunkCount = Math.max(1, Math.ceil(entries.length / CHUNK_SIZE));
    for (let index = 0; index < chunkCount; index += 1) {
      const slice = entries.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
      const value = slice;
      if (byteLength(value) > STORAGE_VALUE_LIMIT) {
        throw new LibraryError('Template index is too large to store.');
      }
      await this.adapter.set(`${INDEX_PREFIX}${index}`, value);
    }
    for (let index = chunkCount; index < this.chunks; index += 1) {
      await this.adapter.delete(`${INDEX_PREFIX}${index}`);
    }
    this.entries = entries;
    this.chunks = chunkCount;
    await this.writeMeta();
  }

  private async writeTemplate(template: Template): Promise<void> {
    const payload = { ...template };
    if (byteLength(payload) > STORAGE_VALUE_LIMIT) {
      throw new LibraryError(
        `"${template.name}" is too large to store. Shorten the prompt below 60,000 characters.`,
      );
    }
    await this.adapter.set(`${TEMPLATE_PREFIX}${template.id}`, payload);
  }

  getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  getEntries(): IndexEntry[] {
    return [...this.entries];
  }

  getCategoryName(id: string): string {
    return this.categories.find((category) => category.id === id)?.name ?? 'General';
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const stored = await this.adapter.get(`${TEMPLATE_PREFIX}${id}`);
    if (stored === undefined || stored === null) return undefined;
    const result = normalizeTemplate(stored, this.categories, this.nextOrder());
    return result.ok ? result.template : undefined;
  }

  nextOrder(): number {
    return this.entries.reduce((max, entry) => Math.max(max, entry.order), 0) + 1;
  }

  async create(input: Record<string, unknown>): Promise<Template> {
    return this.enqueue(async () => {
      const result = normalizeTemplate({ ...input, id: createId() }, this.categories, this.nextOrder());
      if (!result.ok) throw new LibraryError(result.error);
      const template = result.template;
      await this.writeTemplate(template);
      this.entries = [...this.entries, indexEntry(template)];
      await this.writeIndex();
      return template;
    });
  }

  async update(id: string, patch: Record<string, unknown>): Promise<Template> {
    return this.enqueue(async () => {
      const existing = await this.getTemplate(id);
      if (!existing) throw new LibraryError('Template no longer exists. Reload the library.');
      const merged = { ...existing, ...patch, id, revision: existing.revision + 1, updatedAt: this.now() };
      const result = normalizeTemplate(merged, this.categories, existing.order);
      if (!result.ok) throw new LibraryError(result.error);
      const template = result.template;
      await this.writeTemplate(template);
      this.entries = this.entries.map((entry) => (entry.id === id ? indexEntry(template) : entry));
      await this.writeIndex();
      return template;
    });
  }

  async remove(id: string): Promise<void> {
    return this.enqueue(async () => {
      await this.adapter.delete(`${TEMPLATE_PREFIX}${id}`);
      this.entries = this.entries.filter((entry) => entry.id !== id);
      await this.writeIndex();
    });
  }

  /** Puts a deleted template back with its original id and metadata. */
  async restore(template: Template): Promise<void> {
    return this.enqueue(async () => {
      const result = normalizeTemplate(template, this.categories, this.nextOrder());
      if (!result.ok) throw new LibraryError(result.error);
      const restored = result.template;
      await this.writeTemplate(restored);
      if (!this.entries.some((entry) => entry.id === restored.id)) {
        this.entries = [...this.entries, indexEntry(restored)];
        await this.writeIndex();
      }
    });
  }

  async duplicate(id: string): Promise<Template> {
    const source = await this.getTemplate(id);
    if (!source) throw new LibraryError('Template no longer exists. Reload the library.');
    return this.create({
      ...exportTemplate(source),
      id: createId(),
      name: `${source.name} (copy)`,
      order: this.nextOrder(),
      createdAt: this.now(),
      updatedAt: this.now(),
      revision: 1,
    });
  }

  async setFavorite(id: string, favorite: boolean): Promise<void> {
    return this.enqueue(async () => {
      const entry = this.entries.find((item) => item.id === id);
      if (!entry) throw new LibraryError('Template no longer exists.');
      this.entries = this.entries.map((item) => (item.id === id ? { ...item, favorite } : item));
      await this.writeIndex();
      const template = await this.getTemplate(id);
      if (template) {
        await this.writeTemplate({ ...template, favorite });
      }
    });
  }

  async touch(id: string): Promise<void> {
    return this.enqueue(async () => {
      const usedAt = this.now();
      this.entries = this.entries.map((entry) => (entry.id === id ? { ...entry, lastUsedAt: usedAt } : entry));
      await this.writeIndex();
      const template = await this.getTemplate(id);
      if (template) await this.writeTemplate({ ...template, lastUsedAt: usedAt });
    });
  }

  /** Moves a template one slot up (-1) or down (+1) in the library order. */
  async reorder(id: string, direction: -1 | 1): Promise<void> {
    return this.enqueue(async () => {
      const sorted = [...this.entries].sort(compareEntries);
      const index = sorted.findIndex((entry) => entry.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sorted.length) return;
      const current = sorted[index];
      const neighbour = sorted[target];
      if (!current || !neighbour) return;
      const currentOrder = current.order;
      const neighbourOrder = neighbour.order;
      this.entries = this.entries.map((entry) => {
        if (entry.id === current.id) return { ...entry, order: neighbourOrder };
        if (entry.id === neighbour.id) return { ...entry, order: currentOrder };
        return entry;
      });
      await this.writeIndex();
      for (const entryId of [current.id, neighbour.id]) {
        const template = await this.getTemplate(entryId);
        if (!template) continue;
        const order = this.entries.find((entry) => entry.id === entryId)?.order ?? template.order;
        await this.writeTemplate({ ...template, order });
      }
    });
  }

  async addCategory(name: string): Promise<Category> {
    const trimmed = name.trim();
    if (!trimmed) throw new LibraryError('Category name is required.');
    if (trimmed.length > 60) throw new LibraryError('Category name is longer than 60 characters.');
    if (this.categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new LibraryError('A category with that name already exists.');
    }
    const category: Category = {
      id: createId('c'),
      name: trimmed,
      order: this.categories.reduce((max, item) => Math.max(max, item.order), 0) + 1,
      builtIn: false,
    };
    this.categories = [...this.categories, category];
    await this.enqueue(() => this.writeMeta());
    return category;
  }

  async renameCategory(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new LibraryError('Category name is required.');
    if (trimmed.length > 60) throw new LibraryError('Category name is longer than 60 characters.');
    if (this.categories.some((item) => item.id !== id && item.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new LibraryError('A category with that name already exists.');
    }
    if (!this.categories.some((item) => item.id === id)) throw new LibraryError('Category no longer exists.');
    this.categories = this.categories.map((item) => (item.id === id ? { ...item, name: trimmed } : item));
    await this.enqueue(() => this.writeMeta());
  }

  /** Templates of a deleted category move to General; none are deleted. */
  async deleteCategory(id: string): Promise<number> {
    if (id === GENERAL_CATEGORY_ID) throw new LibraryError('General cannot be deleted.');
    if (!this.categories.some((category) => category.id === id)) return 0;
    return this.enqueue(async () => {
      const affected = this.entries.filter((entry) => entry.categoryId === id);
      for (const entry of affected) {
        const template = await this.getTemplate(entry.id);
        if (!template) continue;
        await this.writeTemplate({ ...template, categoryId: GENERAL_CATEGORY_ID, updatedAt: this.now() });
      }
      this.entries = this.entries.map((entry) =>
        entry.categoryId === id ? { ...entry, categoryId: GENERAL_CATEGORY_ID } : entry,
      );
      await this.writeIndex();
      this.categories = this.categories.filter((category) => category.id !== id);
      await this.writeMeta();
      return affected.length;
    });
  }

  async importTemplates(
    incoming: readonly Template[],
    policy: DuplicatePolicy,
    newCategories: readonly Category[] = [],
  ): Promise<ImportOutcome> {
    const outcome: ImportOutcome = { added: 0, replaced: 0, skipped: 0, rejected: [] };
    return this.enqueue(async () => {
      for (const category of newCategories) {
        if (this.categories.some((item) => item.name.toLowerCase() === category.name.toLowerCase())) continue;
        this.categories = [...this.categories, category];
      }
      if (newCategories.length > 0) await this.writeMeta();

      const entries = [...this.entries];
      const byName = new Map(entries.map((entry) => [duplicateKey(entry.name, entry.categoryId), entry]));
      const byId = new Map(entries.map((entry) => [entry.id, entry]));

      for (const candidate of incoming) {
        try {
          const existing = byId.get(candidate.id) ?? byName.get(duplicateKey(candidate.name, candidate.categoryId));
          if (!existing) {
            const template = { ...candidate, order: nextOrderFrom(entries) };
            await this.writeTemplate(template);
            entries.push(indexEntry(template));
            byId.set(template.id, indexEntry(template));
            byName.set(duplicateKey(template.name, template.categoryId), indexEntry(template));
            outcome.added += 1;
            continue;
          }
          if (policy === 'skip') {
            outcome.skipped += 1;
            continue;
          }
          if (policy === 'replace') {
            const replaced: Template = {
              ...candidate,
              id: existing.id,
              order: existing.order,
              createdAt: existing.createdAt,
              updatedAt: this.now(),
              revision: 1,
            };
            await this.writeTemplate(replaced);
            const nextEntry = indexEntry(replaced);
            entries[entries.findIndex((entry) => entry.id === existing.id)] = nextEntry;
            byId.set(replaced.id, nextEntry);
            byName.set(duplicateKey(replaced.name, replaced.categoryId), nextEntry);
            outcome.replaced += 1;
            continue;
          }
          const copy: Template = {
            ...candidate,
            id: createId(),
            name: uniqueCopyName(candidate.name, entries),
            order: nextOrderFrom(entries),
            createdAt: this.now(),
            updatedAt: this.now(),
            revision: 1,
          };
          await this.writeTemplate(copy);
          const copyEntry = indexEntry(copy);
          entries.push(copyEntry);
          byId.set(copy.id, copyEntry);
          byName.set(duplicateKey(copy.name, copy.categoryId), copyEntry);
          outcome.added += 1;
        } catch (error) {
          outcome.rejected.push({
            name: candidate.name,
            reason: error instanceof Error ? error.message : 'could not be stored',
          });
        }
      }
      this.entries = entries;
      await this.writeIndex();
      return outcome;
    });
  }

  async exportDocument(ids?: readonly string[]): Promise<Record<string, unknown>> {
    const wanted = ids && ids.length > 0 ? new Set(ids) : null;
    const templates: Template[] = [];
    for (const entry of [...this.entries].sort(compareEntries)) {
      if (wanted && !wanted.has(entry.id)) continue;
      const template = await this.getTemplate(entry.id);
      if (template) templates.push(template);
    }
    return {
      format: 'prompt-studio',
      version: SCHEMA_VERSION,
      exportedAt: this.now(),
      categories: this.categories.map(({ id, name }) => ({ id, name })),
      templates: templates.map(exportTemplate),
    };
  }

  /**
   * Validates an imported document and resolves its categories. Categories the
   * library does not have yet are returned so the caller can add them, which
   * keeps an imported library intact instead of dropping everything to General.
   */
  parseDocument(
    raw: unknown,
  ):
    | { ok: true; templates: Template[]; categories: Category[]; errors: Array<{ name: string; reason: string }> }
    | { ok: false; error: string } {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Not a JSON object.' };
    const document = raw as { format?: unknown; version?: unknown; templates?: unknown; categories?: unknown };
    if (document.format !== undefined && document.format !== 'prompt-studio') {
      return { ok: false, error: 'This file is not a Prompt Studio export.' };
    }
    if (document.version !== undefined && document.version !== 1) {
      return { ok: false, error: `Unsupported version ${String(document.version)}. This build reads version 1.` };
    }
    if (!Array.isArray(document.templates)) return { ok: false, error: 'The file has no templates array.' };
    if (document.templates.length === 0) return { ok: false, error: 'The file contains no templates.' };
    if (document.templates.length > 2000) return { ok: false, error: 'The file has more than 2,000 templates.' };

    const extra: Category[] = [];
    if (Array.isArray(document.categories)) {
      const usedNames = new Set(this.categories.map((category) => category.name.toLowerCase()));
      const usedIds = new Set(this.categories.map((category) => category.id));
      for (const item of document.categories) {
        if (!item || typeof item !== 'object') continue;
        const record = item as { id?: unknown; name?: unknown };
        const name = String(record.name ?? '').trim();
        if (!name || name.length > 60) continue;
        if (usedNames.has(name.toLowerCase())) continue;
        const rawId = String(record.id ?? '').trim();
        const id =
          /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(rawId) && !usedIds.has(rawId) ? rawId : createId('c');
        extra.push({ id, name, order: this.categories.length + extra.length, builtIn: false });
        usedNames.add(name.toLowerCase());
        usedIds.add(id);
      }
    }

    const categories = [...this.categories, ...extra];
    const templates: Template[] = [];
    const errors: Array<{ name: string; reason: string }> = [];
    for (const item of document.templates) {
      const result = normalizeTemplate(item, categories, 0);
      if (result.ok) templates.push(result.template);
      else {
        const name =
          item && typeof item === 'object' && typeof (item as { name?: unknown }).name === 'string'
            ? String((item as { name?: unknown }).name)
            : 'unnamed';
        errors.push({ name, reason: result.error });
      }
    }
    return { ok: true, templates, categories: extra, errors };
  }

  hasCategory(id: string): boolean {
    return isCategoryId(id, this.categories);
  }
}

function compareEntries(a: IndexEntry, b: IndexEntry): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.name.localeCompare(b.name);
}

function duplicateKey(name: string, categoryId: string): string {
  return `${name.trim().toLowerCase()}::${categoryId}`;
}

function nextOrderFrom(entries: readonly IndexEntry[]): number {
  return entries.reduce((max, entry) => Math.max(max, entry.order), 0) + 1;
}

function uniqueCopyName(name: string, entries: readonly IndexEntry[]): string {
  const base = `${name} (copy)`;
  const taken = new Set(entries.map((entry) => entry.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let index = 2;
  while (taken.has(`${base} ${index}`.toLowerCase())) index += 1;
  return `${base} ${index}`;
}
