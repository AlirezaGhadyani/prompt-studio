import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_CATEGORIES,
  listPlaceholders,
  missingRequiredFields,
  normalizeFields,
  normalizeTemplate,
  renderTemplate,
} from '../src/templates/schema.ts';

test('normalizeTemplate rejects a missing name or body', () => {
  assert.equal(normalizeTemplate({ body: 'x' }, DEFAULT_CATEGORIES).ok, false);
  assert.equal(normalizeTemplate({ name: 'x' }, DEFAULT_CATEGORIES).ok, false);
  assert.equal(normalizeTemplate({ name: 'x', body: '   ' }, DEFAULT_CATEGORIES).ok, false);
});

test('normalizeTemplate fills defaults and resolves a category by name', () => {
  const result = normalizeTemplate(
    { name: 'Feature', body: 'Do it', category: 'Bug Fixing', tags: ['a', 'A', 'b'] },
    DEFAULT_CATEGORIES,
  );
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.template.categoryId, 'bugs');
  assert.deepEqual(result.template.tags, ['a', 'b']);
  assert.equal(result.template.revision, 1);
  assert.equal(result.template.fields.length, 0);
  assert.match(result.template.id, /^t-/);
});

test('normalizeTemplate falls back to General for unknown categories', () => {
  const result = normalizeTemplate({ name: 'X', body: 'Y', categoryId: 'missing' }, DEFAULT_CATEGORIES);
  assert.ok(result.ok);
  if (result.ok) assert.equal(result.template.categoryId, 'general');
});

test('renderTemplate replaces placeholders and keeps unknown ones', () => {
  const fields = normalizeFields([
    { key: 'feature', label: 'Feature' },
    { key: 'constraint', label: 'Constraint', required: true },
  ]);
  const body = 'Build {{feature}} with {{constraint}} and {{other}}.';
  const values = { feature: 'CSV export', constraint: 'offline only' };
  assert.equal(renderTemplate(body, fields, values), 'Build CSV export with offline only and {{other}}.');
});

test('missingRequiredFields reports only empty required fields', () => {
  const fields = normalizeFields([
    { key: 'a', label: 'A', required: true },
    { key: 'b', label: 'B', required: true },
    { key: 'c', label: 'C' },
  ]);
  const missing = missingRequiredFields(fields, { a: 'set', b: '   ' });
  assert.deepEqual(missing.map((field) => field.key), ['b']);
});

test('normalizeFields drops invalid and duplicate keys', () => {
  const fields = normalizeFields([
    { key: 'good_key', label: 'Good' },
    { key: '2bad', label: 'Bad' },
    { key: 'good_key', label: 'Duplicate' },
    { key: 'missing_label' },
  ]);
  assert.deepEqual(fields.map((field) => field.key), ['good_key']);
});

test('listPlaceholders finds each placeholder once', () => {
  assert.deepEqual(listPlaceholders('{{a}} {{ b }} {{a}}'), ['a', 'b']);
});
