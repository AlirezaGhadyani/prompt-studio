import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { parseManifestJson } from '@openchamber/sdk/schemas';

const root = path.resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as Record<string, unknown>;
const manifest = (packageJson as { openchamber?: Record<string, unknown> }).openchamber;

test('the package manifest parses with the installed SDK', () => {
  assert.ok(manifest, 'package.json has an openchamber block');
  const result = parseManifestJson(JSON.stringify(packageJson));
  assert.equal(result.ok, true, result.ok ? '' : result.message);
  if (!result.ok) return;
  assert.equal(result.manifest.apiVersion, 1);
  assert.equal(result.manifest.contributes.panel?.id, 'prompt-studio');
  assert.equal(result.manifest.contributes.panel?.name, 'Prompt Studio');
  assert.equal(result.manifest.contributes.panel?.entry, 'panel/index.html');
  assert.equal(result.manifest.contributes.page, true);
});

test('the extension asks for no capabilities', () => {
  const contributes = (manifest as { contributes?: Record<string, unknown> }).contributes ?? {};
  assert.equal(contributes.capabilities, undefined);
  assert.equal(contributes.filesystem, undefined);
  assert.equal(contributes.integration, undefined);
  assert.equal(contributes.service, undefined);
  assert.equal(contributes.origins, undefined);
});

test('the panel entry files exist in the package', () => {
  assert.ok(fs.existsSync(path.join(root, 'panel/index.html')));
  assert.ok(fs.existsSync(path.join(root, 'panel/main.js')));
  const html = fs.readFileSync(path.join(root, 'panel/index.html'), 'utf8');
  assert.match(html, /<script src="main\.js"><\/script>/);
});

test('the built bundle is a classic script, not an ES module', () => {
  const bundle = fs.readFileSync(path.join(root, 'panel/main.js'), 'utf8');
  assert.equal(/^\s*import\s/m.test(bundle), false, 'bundle must not use import statements');
  assert.equal(/^\s*export\s/m.test(bundle), false, 'bundle must not use export statements');
  assert.ok(bundle.includes('connectHost'));
});
