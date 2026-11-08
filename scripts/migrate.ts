import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildMigrationDocument,
  convertEntry,
  type ConversionNote,
  type SourceEntry,
} from '../src/migration/convert.ts';
import { DEFAULT_CATEGORIES, nowIso, type Template } from '../src/templates/schema.ts';

const home = os.homedir();
const configDir = path.join(home, '.config', 'opencode');
const snippetDirs = [path.join(configDir, 'snippets'), path.join(configDir, 'snippet')];
const commandDir = path.join(configDir, 'commands');
const outDir = path.join(process.cwd(), 'migration');
const backupDir = path.join(outDir, 'backup');

interface ReadFailure {
  path: string;
  reason: string;
}

function readDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir).filter((name) => name.endsWith('.md')).sort();
  } catch {
    return [];
  }
}

function readEntry(
  dir: string,
  name: string,
  kind: SourceEntry['kind'],
): { entry: SourceEntry | null; failure: ReadFailure | null } {
  const filePath = path.join(dir, name);
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink() && !fs.existsSync(filePath)) {
      return { entry: null, failure: { path: filePath, reason: 'broken symlink' } };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return { entry: { kind, name: name.replace(/\.md$/, ''), path: filePath, raw }, failure: null };
  } catch (error) {
    return {
      entry: null,
      failure: { path: filePath, reason: error instanceof Error ? error.message : 'unreadable' },
    };
  }
}

function backup(entry: SourceEntry): void {
  const target = path.join(backupDir, entry.kind === 'snippet' ? 'snippets' : 'commands', `${entry.name}.md`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, entry.raw, 'utf8');
}

const failures: ReadFailure[] = [];
const entries: SourceEntry[] = [];

// Later directories win, matching OpenChamber's load order (`snippet/` over `snippets/`).
for (const dir of snippetDirs) {
  for (const name of readDir(dir)) {
    const { entry, failure } = readEntry(dir, name, 'snippet');
    if (failure) {
      failures.push(failure);
      continue;
    }
    if (!entry) continue;
    const existing = entries.findIndex((item) => item.kind === 'snippet' && item.name === entry.name);
    if (existing >= 0) entries[existing] = entry;
    else entries.push(entry);
  }
}

for (const name of readDir(commandDir)) {
  const { entry, failure } = readEntry(commandDir, name, 'command');
  if (failure) {
    failures.push(failure);
    continue;
  }
  if (entry) entries.push(entry);
}

const now = nowIso();
const usedIds = new Set<string>();
const produced: Array<{ template: Template; sourcePath: string }> = [];
const notes: ConversionNote[] = [];
const duplicates: string[] = [];
const seenNames = new Map<string, string>();

let order = 1;
for (const entry of entries) {
  const converted = convertEntry(entry, DEFAULT_CATEGORIES, now, order, usedIds);
  notes.push(...converted.notes);
  if (!converted.template) continue;
  const key = converted.template.name.toLowerCase();
  const previous = seenNames.get(key);
  if (previous) {
    duplicates.push(`${converted.template.name} (${entry.path}) also produced by ${previous}`);
    continue;
  }
  seenNames.set(key, entry.path);
  produced.push({ template: converted.template, sourcePath: entry.path });
  order += 1;
}

for (const entry of entries) backup(entry);

fs.mkdirSync(outDir, { recursive: true });
const document = buildMigrationDocument(
  produced.map((item) => item.template),
  DEFAULT_CATEGORIES,
  now,
);
fs.writeFileSync(path.join(outDir, 'prompt-studio-migration.json'), `${JSON.stringify(document, null, 2)}\n`);

const snippetCount = entries.filter((entry) => entry.kind === 'snippet').length;
const commandCount = entries.filter((entry) => entry.kind === 'command').length;
const categoryName = (id: string): string =>
  DEFAULT_CATEGORIES.find((category) => category.id === id)?.name ?? 'General';

const report: string[] = [
  '# Prompt Studio migration report',
  '',
  `Generated ${now}`,
  '',
  '## Summary',
  '',
  `- Snippets read: ${snippetCount}`,
  `- Commands read: ${commandCount}`,
  `- Templates produced: ${produced.length}`,
  `- Unreadable entries: ${failures.length}`,
  `- Duplicate names skipped: ${duplicates.length}`,
  '',
  '## Templates',
  '',
  '| Template | Source | Category | Fields |',
  '|---|---|---|---|',
  ...produced.map(({ template, sourcePath }) => {
    return `| ${template.name} | ${path.relative(home, sourcePath)} | ${categoryName(template.categoryId)} | ${template.fields.length} |`;
  }),
  '',
];

if (notes.length > 0) {
  report.push('## Conversions', '', '| Entry | Change |', '|---|---|');
  for (const note of notes) report.push(`| ${path.relative(home, note.entry)} | ${note.note} |`);
  report.push('');
}

if (duplicates.length > 0) {
  report.push('## Duplicates', '');
  for (const duplicate of duplicates) report.push(`- ${duplicate}`);
  report.push('');
}

if (failures.length > 0) {
  report.push('## Could not be migrated', '', '| Path | Reason |', '|---|---|');
  for (const failure of failures) report.push(`| ${path.relative(home, failure.path)} | ${failure.reason} |`);
  report.push('');
  report.push(
    'These entries were left untouched. Most are symlinks whose target no longer exists; restore the',
    'target file and run `npm run migrate` again, or recreate the prompt by hand in Prompt Studio.',
    '',
  );
}

report.push(
  '## Cleanup',
  '',
  'Nothing was deleted or modified. After importing `prompt-studio-migration.json` and checking the',
  'templates, remove the old entries by hand in OpenChamber → Settings → Snippets and Settings → Commands.',
  '',
  'A copy of every readable source file is in `migration/backup/`.',
  '',
);

fs.writeFileSync(path.join(outDir, 'migration-report.md'), `${report.join('\n')}\n`);

console.log(
  `Migrated ${produced.length} templates (${snippetCount} snippets, ${commandCount} commands); ` +
    `${failures.length} unreadable, ${duplicates.length} duplicates.`,
);
console.log(`Wrote ${path.join(outDir, 'prompt-studio-migration.json')}`);
