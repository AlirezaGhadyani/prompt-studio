/**
 * Data model for Prompt Studio.
 *
 * A template is stored once and referenced by a stable id. Categories are
 * referenced by id so renaming one never rewrites templates.
 */

export const SCHEMA_VERSION = 1;

/** `host.compose` refuses text outside this range (after trim). */
export const COMPOSE_LIMIT = 16000;

/** `host.storage` refuses a JSON value above this size (UTF-8 bytes). */
export const STORAGE_VALUE_LIMIT = 65536;

/** `host.writeClipboard` refuses text above this size. */
export const CLIPBOARD_LIMIT = 32000;

export type FieldKind = 'text' | 'multiline';

export interface TemplateField {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
  kind: FieldKind;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  body: string;
  fields: TemplateField[];
  tags: string[];
  favorite: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  revision: number;
}

/** Metadata kept in the index so the library lists without reading bodies. */
export interface IndexEntry {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  tags: string[];
  favorite: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  fieldCount: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  builtIn: boolean;
}

export const GENERAL_CATEGORY_ID = 'general';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'requirements', name: 'Requirements & Planning', order: 0, builtIn: true },
  { id: 'research', name: 'Research & Investigation', order: 1, builtIn: true },
  { id: 'implementation', name: 'Feature Implementation', order: 2, builtIn: true },
  { id: 'bugs', name: 'Bug Fixing', order: 3, builtIn: true },
  { id: 'refactoring', name: 'Refactoring', order: 4, builtIn: true },
  { id: 'architecture', name: 'Architecture', order: 5, builtIn: true },
  { id: 'review', name: 'Code Review', order: 6, builtIn: true },
  { id: 'testing', name: 'Testing & Quality Assurance', order: 7, builtIn: true },
  { id: 'performance', name: 'Performance Optimization', order: 8, builtIn: true },
  { id: GENERAL_CATEGORY_ID, name: 'General', order: 9, builtIn: true },
];

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const FIELD_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

export function nowIso(): string {
  return new Date().toISOString();
}

/** Uses crypto.randomUUID where the frame has it; the sandbox origin may not. */
export function createId(prefix = 't'): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto?.randomUUID) return `${prefix}-${globalCrypto.randomUUID()}`;
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function normalizeTagList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    const tag = String(item).trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function isCategoryId(value: string, categories: readonly Category[]): boolean {
  return categories.some((category) => category.id === value);
}

export function resolveCategoryId(value: unknown, categories: readonly Category[]): string {
  const raw = String(value ?? '').trim();
  if (!raw) return GENERAL_CATEGORY_ID;
  const byId = categories.find((category) => category.id === raw);
  if (byId) return byId.id;
  const byName = categories.find((category) => category.name.toLowerCase() === raw.toLowerCase());
  return byName ? byName.id : GENERAL_CATEGORY_ID;
}

function parseField(input: unknown, seen: Set<string>): TemplateField | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const key = String(record.key ?? '').trim();
  const label = String(record.label ?? '').trim();
  if (!FIELD_KEY_PATTERN.test(key) || !label || seen.has(key)) return null;
  seen.add(key);
  const kind = record.kind === 'multiline' || record.multiline === true ? 'multiline' : 'text';
  const field: TemplateField = { key, label, required: record.required === true, kind };
  const description = String(record.description ?? '').trim();
  if (description) field.description = description;
  const placeholder = String(record.placeholder ?? '').trim();
  if (placeholder) field.placeholder = placeholder;
  const defaultValue = record.defaultValue ?? record.default;
  if (defaultValue !== undefined && defaultValue !== null) field.defaultValue = String(defaultValue);
  return field;
}

export function normalizeFields(input: unknown): TemplateField[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const fields: TemplateField[] = [];
  for (const item of input) {
    const field = parseField(item, seen);
    if (field) fields.push(field);
  }
  return fields;
}

export interface TemplateInput {
  id?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  category?: string;
  body?: string;
  fields?: unknown;
  tags?: unknown;
  favorite?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
  revision?: number;
}

export type NormalizeResult =
  | { ok: true; template: Template }
  | { ok: false; error: string };

/**
 * Turns stored or imported data into a valid template. Missing optional parts
 * are filled; a missing name or body is an error, never a silent default.
 */
export function normalizeTemplate(
  input: unknown,
  categories: readonly Category[],
  fallbackOrder = 0,
): NormalizeResult {
  if (!input || typeof input !== 'object') return { ok: false, error: 'not an object' };
  const record = input as TemplateInput;
  const name = String(record.name ?? '').trim();
  if (!name) return { ok: false, error: 'name is required' };
  if (name.length > 200) return { ok: false, error: 'name is longer than 200 characters' };
  const body = typeof record.body === 'string' ? record.body : '';
  if (!body.trim()) return { ok: false, error: 'prompt body is required' };

  const rawId = String(record.id ?? '').trim();
  const id = ID_PATTERN.test(rawId) ? rawId : createId();
  const categoryId = resolveCategoryId(record.categoryId ?? record.category, categories);
  const createdAt = String(record.createdAt ?? '').trim() || nowIso();
  const updatedAt = String(record.updatedAt ?? '').trim() || createdAt;
  const order = Number.isFinite(record.order) ? Number(record.order) : fallbackOrder;
  const revision = Number.isFinite(record.revision) ? Math.max(1, Number(record.revision)) : 1;
  const lastUsedAt = String(record.lastUsedAt ?? '').trim();

  const template: Template = {
    id,
    name,
    description: String(record.description ?? '').trim(),
    categoryId,
    body,
    fields: normalizeFields(record.fields),
    tags: normalizeTagList(record.tags),
    favorite: record.favorite === true,
    order,
    createdAt,
    updatedAt,
    revision,
  };
  if (lastUsedAt) template.lastUsedAt = lastUsedAt;
  return { ok: true, template };
}

export function indexEntry(template: Template): IndexEntry {
  const entry: IndexEntry = {
    id: template.id,
    name: template.name,
    description: template.description,
    categoryId: template.categoryId,
    tags: template.tags,
    favorite: template.favorite,
    order: template.order,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    fieldCount: template.fields.length,
  };
  if (template.lastUsedAt) entry.lastUsedAt = template.lastUsedAt;
  return entry;
}

/** Field values replace `{{key}}`; unknown placeholders stay visible on purpose. */
export function renderTemplate(
  body: string,
  fields: readonly TemplateField[],
  values: Readonly<Record<string, string>>,
): string {
  let output = body;
  for (const field of fields) {
    const value = (values[field.key] ?? field.defaultValue ?? '').trim();
    output = output.split(`{{${field.key}}}`).join(value);
  }
  return output.trim();
}

export function missingRequiredFields(
  fields: readonly TemplateField[],
  values: Readonly<Record<string, string>>,
): TemplateField[] {
  return fields.filter((field) => field.required && !(values[field.key] ?? field.defaultValue ?? '').trim());
}

export function listPlaceholders(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(PLACEHOLDER_PATTERN)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}

export function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function exportTemplate(template: Template): Record<string, unknown> {
  const record: Record<string, unknown> = {
    id: template.id,
    name: template.name,
    description: template.description,
    categoryId: template.categoryId,
    body: template.body,
    fields: template.fields,
    tags: template.tags,
    favorite: template.favorite,
    order: template.order,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    revision: template.revision,
  };
  if (template.lastUsedAt) record.lastUsedAt = template.lastUsedAt;
  return record;
}
