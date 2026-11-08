import {
  createId,
  normalizeTemplate,
  type Category,
  type Template,
} from '../templates/schema.ts';

export interface SourceEntry {
  kind: 'snippet' | 'command';
  /** File name without extension. */
  name: string;
  path: string;
  raw: string;
}

export interface ConversionNote {
  entry: string;
  note: string;
}

export interface ConvertedEntry {
  template: Template | null;
  notes: ConversionNote[];
}

const ARGUMENT_PATTERN = /\$ARGUMENTS\b/g;

export function splitFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw.trim() };
  const meta: Record<string, unknown> = {};
  for (const line of (match[1] ?? '').split(/\r?\n/)) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (!key || !value) continue;
    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
      meta[key] = value;
    } else {
      meta[key] = value;
    }
  }
  return { meta, body: (match[2] ?? '').trim() };
}

/** Category heuristics for migrated entries. The name wins; the description is the fallback. */
export function categoryFor(name: string, description: string): string {
  return matchCategory(name) ?? matchCategory(description) ?? 'general';
}

function matchCategory(text: string): string | null {
  const value = text.toLowerCase();
  if (/\b(bug|bugs|defect|debug|troubleshoot|incident)\b/.test(value)) return 'bugs';
  if (/\b(refactor|refactoring|cleanup|restructure)\b/.test(value)) return 'refactoring';
  if (/\b(perf|performance|optimi[sz]e?|latency|benchmark|bottleneck)\b/.test(value)) return 'performance';
  if (/\b(review|reviews|audit|critique)\b/.test(value)) return 'review';
  if (/\b(arch|architecture|architect|design|adr)\b/.test(value)) return 'architecture';
  if (/\b(test|tests|testing|tdd|qa|quality|verify|verification)\b/.test(value)) return 'testing';
  if (/\b(implement|implements|implementation|feature|features|build|develop)\b/.test(value)) {
    return 'implementation';
  }
  if (/\b(spec|specification|requirement|requirements|plan|planning|prd|brief)\b/.test(value)) {
    return 'requirements';
  }
  if (/\b(research|investigat\w*|explore|diagnose|analyse|analyze)\b/.test(value)) return 'research';
  return null;
}

export function humanizeName(name: string): string {
  const words = name.replace(/[-_]+/g, ' ').trim();
  return words.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Turns one snippet or command file into a template. Commands keep their body
 * verbatim except `$ARGUMENTS`, which becomes a required structured field so
 * the prompt stays editable in Prompt Studio.
 */
export function convertEntry(
  entry: SourceEntry,
  categories: readonly Category[],
  now: string,
  order: number,
  usedIds: Set<string>,
): ConvertedEntry {
  const { meta, body: rawBody } = splitFrontmatter(entry.raw);
  const notes: ConversionNote[] = [];
  if (!rawBody.trim()) {
    return { template: null, notes: [{ entry: entry.path, note: 'empty body, skipped' }] };
  }

  let body = rawBody;
  const fields: Template['fields'] = [];
  if (entry.kind === 'command') {
    const matches = body.match(ARGUMENT_PATTERN);
    if (matches && matches.length > 0) {
      body = body.replace(ARGUMENT_PATTERN, '{{request}}');
      fields.push({
        key: 'request',
        label: 'Request',
        description: 'The arguments the slash command used to receive.',
        placeholder: 'What should the agent work on?',
        required: true,
        kind: 'multiline',
      });
      notes.push({
        entry: entry.path,
        note: `replaced ${matches.length} $ARGUMENTS with {{request}} and added a Request field`,
      });
    }
  }

  const description =
    typeof meta.description === 'string' ? meta.description : `Migrated from ${entry.kind} "${entry.name}".`;
  const categoryId = categoryFor(entry.name, description);

  let id = `migrated-${entry.kind}-${slug(entry.name) || 'entry'}`;
  if (usedIds.has(id)) id = createId('migrated');
  usedIds.add(id);

  const candidate = {
    id,
    name: humanizeName(entry.name),
    description,
    categoryId,
    body,
    fields,
    tags: ['migrated', entry.kind],
    favorite: false,
    order,
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };
  const normalized = normalizeTemplate(candidate, categories, order);
  if (!normalized.ok) {
    return { template: null, notes: [{ entry: entry.path, note: normalized.error }] };
  }
  return { template: normalized.template, notes };
}

export function buildMigrationDocument(
  templates: readonly Template[],
  categories: readonly Category[],
  exportedAt: string,
): Record<string, unknown> {
  return {
    format: 'prompt-studio',
    version: 1,
    exportedAt,
    categories: categories.map(({ id, name }) => ({ id, name })),
    templates: templates.map((template) => ({
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
    })),
  };
}
