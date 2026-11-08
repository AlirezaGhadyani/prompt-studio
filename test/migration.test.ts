import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryFor, convertEntry, splitFrontmatter } from '../src/migration/convert.ts';
import { DEFAULT_CATEGORIES } from '../src/templates/schema.ts';

const now = '2026-11-08T00:00:00.000Z';

test('splitFrontmatter reads description and aliases', () => {
  const { meta, body } = splitFrontmatter('---\ndescription: A test\naliases: [a, b]\n---\n\nBody text');
  assert.equal(meta.description, 'A test');
  assert.deepEqual(meta.aliases, ['a', 'b']);
  assert.equal(body, 'Body text');
});

test('splitFrontmatter keeps a file without frontmatter whole', () => {
  const { meta, body } = splitFrontmatter('Just text');
  assert.deepEqual(meta, {});
  assert.equal(body, 'Just text');
});

test('snippets keep their body and description', () => {
  const result = convertEntry(
    {
      kind: 'snippet',
      name: 'spec',
      path: '/tmp/snippets/spec.md',
      raw: '---\ndescription: Turn a request into requirements\n---\n\nOBJECTIVE\nDo it',
    },
    DEFAULT_CATEGORIES,
    now,
    1,
    new Set(),
  );
  assert.ok(result.template);
  assert.equal(result.template?.body, 'OBJECTIVE\nDo it');
  assert.equal(result.template?.description, 'Turn a request into requirements');
  assert.equal(result.template?.categoryId, 'requirements');
  assert.deepEqual(result.template?.tags, ['migrated', 'snippet']);
});

test('commands turn $ARGUMENTS into an editable required field', () => {
  const result = convertEntry(
    {
      kind: 'command',
      name: 'bug-fixing',
      path: '/tmp/commands/bug-fixing.md',
      raw: '---\ndescription: Investigate and fix a bug\n---\n\nFix this bug: $ARGUMENTS\n\nReport evidence.',
    },
    DEFAULT_CATEGORIES,
    now,
    1,
    new Set(),
  );
  assert.ok(result.template);
  assert.equal(result.template?.body, 'Fix this bug: {{request}}\n\nReport evidence.');
  assert.equal(result.template?.fields.length, 1);
  assert.equal(result.template?.fields[0]?.key, 'request');
  assert.equal(result.template?.fields[0]?.required, true);
  assert.ok(result.notes.some((note) => note.note.includes('$ARGUMENTS')));
});

test('an empty body is skipped with a note instead of an empty template', () => {
  const result = convertEntry(
    { kind: 'snippet', name: 'empty', path: '/tmp/empty.md', raw: '---\ndescription: x\n---\n' },
    DEFAULT_CATEGORIES,
    now,
    1,
    new Set(),
  );
  assert.equal(result.template, null);
  assert.equal(result.notes.length, 1);
});

test('category heuristics cover the library names', () => {
  assert.equal(categoryFor('bug-fixing', ''), 'bugs');
  assert.equal(categoryFor('spec', ''), 'requirements');
  assert.equal(categoryFor('review', ''), 'review');
  assert.equal(categoryFor('mystery', ''), 'general');
});

test('ids are stable and collisions get a generated id', () => {
  const first = convertEntry(
    { kind: 'snippet', name: 'spec', path: '/a', raw: 'Body' },
    DEFAULT_CATEGORIES,
    now,
    1,
    new Set(),
  );
  assert.equal(first.template?.id, 'migrated-snippet-spec');

  const used = new Set(['migrated-snippet-spec']);
  const second = convertEntry(
    { kind: 'snippet', name: 'spec', path: '/b', raw: 'Body' },
    DEFAULT_CATEGORIES,
    now,
    2,
    used,
  );
  assert.notEqual(second.template?.id, 'migrated-snippet-spec');
  assert.ok(second.template?.id.startsWith('migrated-'));
});
