import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Library, type StorageAdapter } from '../src/storage/library.ts';
import { STORAGE_VALUE_LIMIT } from '../src/templates/schema.ts';

class MemoryAdapter implements StorageAdapter {
  private readonly map = new Map<string, unknown>();
  writes = 0;

  async get(key: string): Promise<unknown> {
    if (!this.map.has(key)) return undefined;
    return JSON.parse(JSON.stringify(this.map.get(key)));
  }

  async set(key: string, value: unknown): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
    if (bytes > STORAGE_VALUE_LIMIT) throw new Error(`value for ${key} is too large (${bytes})`);
    this.map.set(key, JSON.parse(JSON.stringify(value)));
    this.writes += 1;
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }

  rawKeys(): string[] {
    return [...this.map.keys()].sort();
  }
}

const make = async (): Promise<{ adapter: MemoryAdapter; library: Library }> => {
  const adapter = new MemoryAdapter();
  const library = new Library(adapter);
  await library.load();
  return { adapter, library };
};

test('a fresh library starts with the default categories and no templates', async () => {
  const { library } = await make();
  assert.equal(library.getEntries().length, 0);
  assert.equal(library.getCategories().length, 10);
  assert.equal(library.getCategories()[0]?.id, 'requirements');
});

test('create, update, delete and restore survive a reload', async () => {
  const { adapter, library } = await make();
  const created = await library.create({ name: 'Alpha', body: 'Prompt A', categoryId: 'bugs' });
  assert.equal(library.getEntries().length, 1);

  const updated = await library.update(created.id, { body: 'Prompt B' });
  assert.equal(updated.body, 'Prompt B');
  assert.equal(updated.revision, 2);

  const reloaded = new Library(adapter);
  await reloaded.load();
  const stored = await reloaded.getTemplate(created.id);
  assert.equal(stored?.body, 'Prompt B');
  assert.equal(stored?.categoryId, 'bugs');

  await reloaded.remove(created.id);
  assert.equal(reloaded.getEntries().length, 0);

  await reloaded.restore(stored!);
  assert.equal(reloaded.getEntries().length, 1);
  assert.equal((await reloaded.getTemplate(created.id))?.name, 'Alpha');
});

test('duplicate copies the body and gives a distinct id and name', async () => {
  const { library } = await make();
  const source = await library.create({ name: 'Alpha', body: 'Prompt', fields: [{ key: 'x', label: 'X' }] });
  const copy = await library.duplicate(source.id);
  assert.notEqual(copy.id, source.id);
  assert.equal(copy.name, 'Alpha (copy)');
  assert.equal(copy.body, source.body);
  assert.equal(copy.fields.length, 1);
  assert.equal(library.getEntries().length, 2);
});

test('reorder swaps neighbours and keeps the index consistent', async () => {
  const { library } = await make();
  const a = await library.create({ name: 'A', body: 'a' });
  const b = await library.create({ name: 'B', body: 'b' });
  assert.deepEqual(library.getEntries().map((entry) => entry.name), ['A', 'B']);

  await library.reorder(b.id, -1);
  assert.deepEqual(library.getEntries().map((entry) => entry.name), ['B', 'A']);
  assert.equal((await library.getTemplate(a.id))?.order, 2);

  // Moving past the edge is a no-op, not an error.
  await library.reorder(b.id, -1);
  assert.deepEqual(library.getEntries().map((entry) => entry.name), ['B', 'A']);
});

test('deleting a category moves its templates to General and keeps them', async () => {
  const { library } = await make();
  const category = await library.addCategory('Client work');
  const template = await library.create({ name: 'Client prompt', body: 'Body', categoryId: category.id });

  const moved = await library.deleteCategory(category.id);
  assert.equal(moved, 1);
  assert.equal(library.getCategories().some((item) => item.id === category.id), false);
  assert.equal(library.getEntries()[0]?.categoryId, 'general');
  assert.equal((await library.getTemplate(template.id))?.categoryId, 'general');
});

test('General cannot be deleted and duplicate category names are refused', async () => {
  const { library } = await make();
  await assert.rejects(() => library.deleteCategory('general'));
  await library.addCategory('Extra');
  await assert.rejects(() => library.addCategory(' extra '));
});

test('the index is split into chunks and still reloads', async () => {
  const { adapter, library } = await make();
  for (let index = 0; index < 130; index += 1) {
    await library.create({ name: `Template ${index}`, body: `Body ${index}` });
  }
  assert.equal(library.getEntries().length, 130);
  assert.ok(adapter.rawKeys().filter((key) => key.startsWith('idx:')).length >= 2);

  const reloaded = new Library(adapter);
  await reloaded.load();
  assert.equal(reloaded.getEntries().length, 130);
});

test('a template above the storage value limit is refused', async () => {
  const { library } = await make();
  const huge = 'x'.repeat(STORAGE_VALUE_LIMIT + 100);
  await assert.rejects(() => library.create({ name: 'Huge', body: huge }), /too large/);
  assert.equal(library.getEntries().length, 0);
});

test('import policies: skip, copy and replace', async () => {
  const { library } = await make();
  await library.create({ name: 'Alpha', body: 'Original', categoryId: 'bugs' });

  const incoming = [
    {
      id: 'import-1',
      name: 'Alpha',
      description: '',
      categoryId: 'bugs',
      body: 'Imported',
      fields: [],
      tags: [],
      favorite: false,
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      revision: 1,
    },
  ];

  const skipped = await library.importTemplates(incoming, 'skip');
  assert.equal(skipped.skipped, 1);
  assert.equal((await library.getTemplate(library.getEntries()[0]!.id))?.body, 'Original');

  const copied = await library.importTemplates(incoming, 'copy');
  assert.equal(copied.added, 1);
  assert.equal(library.getEntries().length, 2);
  assert.ok(library.getEntries().some((entry) => entry.name === 'Alpha (copy)'));

  const replaced = await library.importTemplates(incoming, 'replace');
  assert.equal(replaced.replaced, 1);
  const bodies = await Promise.all(
    library.getEntries().map(async (entry) => (await library.getTemplate(entry.id))?.body),
  );
  assert.ok(bodies.includes('Imported'));
  assert.equal(library.getEntries().length, 2);
});

test('export then import reproduces templates and categories', async () => {
  const { library } = await make();
  const category = await library.addCategory('Team');
  await library.create({ name: 'One', body: 'First', categoryId: category.id, tags: ['x'] });
  await library.create({ name: 'Two', body: 'Second', categoryId: 'review' });

  const document = await library.exportDocument();
  const json = JSON.stringify(document);

  const target = await make();
  const parsed = target.library.parseDocument(JSON.parse(json));
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  assert.equal(parsed.categories.length, 1);
  const outcome = await target.library.importTemplates(parsed.templates, 'skip', parsed.categories);
  assert.equal(outcome.added, 2);
  assert.equal(target.library.getEntries().length, 2);
  assert.ok(target.library.getCategories().some((item) => item.name === 'Team'));
});

test('parseDocument rejects a foreign or malformed document', async () => {
  const { library } = await make();
  assert.equal(library.parseDocument({ version: 2, templates: [] }).ok, false);
  assert.equal(library.parseDocument({ format: 'other', templates: [] }).ok, false);
  assert.equal(library.parseDocument({ templates: [] }).ok, false);
  assert.equal(library.parseDocument({ templates: [{ name: '', body: '' }] }).ok, true);
});
