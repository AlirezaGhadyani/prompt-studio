import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HostClient, HostReadyContext } from '@openchamber/sdk';
import { Store } from '../src/state/store.ts';
import { COMPOSE_LIMIT, STORAGE_VALUE_LIMIT } from '../src/templates/schema.ts';

interface ComposeCall {
  text: string;
  mode?: 'replace' | 'append';
}

async function makeStore(options: { sessionOpen: boolean }) {
  const calls: ComposeCall[] = [];
  const toasts: string[] = [];
  const map = new Map<string, unknown>();
  const host = {
    storage: {
      get: async (key: string) => map.get(key),
      set: async (key: string, value: unknown) => {
        const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
        if (bytes > STORAGE_VALUE_LIMIT) throw new Error('too large');
        map.set(key, value);
      },
      delete: async (key: string) => map.delete(key),
      keys: async () => [...map.keys()],
    },
    compose: async (request: ComposeCall) => {
      calls.push(request);
    },
    toast: (request: { message: string }) => {
      toasts.push(request.message);
    },
    writeClipboard: async () => true,
  } as unknown as HostClient;

  const context = {
    theme: { mode: 'dark', tokens: {} },
    locale: 'en',
    directory: '/tmp',
    session: options.sessionOpen ? { id: 'ses_test', title: 'Test', busy: false } : null,
    surface: 'panel',
    item: null,
    connection: { connected: false, account: '' },
    settings: {},
  } as unknown as HostReadyContext;

  const store = new Store();
  await store.init(host, context);
  return { store, calls, toasts };
}

test('insert refuses to compose without an open session', async () => {
  const { store, calls } = await makeStore({ sessionOpen: false });
  await store.newTemplate();
  store.setDraftMeta({ name: 'Test' });
  store.setCanonicalBody('Do the thing');

  await store.insert('replace');

  assert.equal(calls.length, 0);
  assert.equal(store.getState().notice?.tone, 'warning');
  assert.match(store.getState().notice?.title ?? '', /Open a chat/);
});

test('insert refuses an empty prompt', async () => {
  const { store, calls } = await makeStore({ sessionOpen: true });
  await store.newTemplate();
  await store.insert('replace');
  assert.equal(calls.length, 0);
  assert.equal(store.getState().notice?.tone, 'error');
});

test('insert refuses text above the composer limit instead of truncating it', async () => {
  const { store, calls } = await makeStore({ sessionOpen: true });
  await store.newTemplate();
  store.setDraftMeta({ name: 'Long' });
  store.setCanonicalBody('x'.repeat(COMPOSE_LIMIT + 1));

  await store.insert('append');

  assert.equal(calls.length, 0);
  assert.equal(store.getState().notice?.tone, 'error');
  assert.match(store.getState().notice?.body ?? '', /16,000/);
});

test('insert passes the exact text and mode to compose', async () => {
  const { store, calls, toasts } = await makeStore({ sessionOpen: true });
  await store.newTemplate();
  store.setDraftMeta({ name: 'Test' });
  store.setCanonicalBody('Line one\n\nLine two');

  await store.insert('replace');
  await store.insert('append');

  assert.deepEqual(calls, [
    { text: 'Line one\n\nLine two', mode: 'replace' },
    { text: 'Line one\n\nLine two', mode: 'append' },
  ]);
  assert.equal(toasts.length, 2);
  assert.equal(store.getState().notice, null);
});

test('field values render into the prompt until the prompt is edited by hand', async () => {
  const { store } = await makeStore({ sessionOpen: true });
  await store.newTemplate();
  store.setDraftMeta({ name: 'Fields' });
  store.setCanonicalBody('Build {{feature}}.');
  store.addField({ key: 'feature', label: 'Feature', required: true, kind: 'text' });

  store.setFieldValue('feature', 'export');
  assert.equal(store.getState().draft?.prompt, 'Build export.');

  store.setPrompt('Hand written');
  store.setFieldValue('feature', 'import');
  assert.equal(store.getState().draft?.prompt, 'Hand written');

  store.applyFieldValues();
  assert.equal(store.getState().draft?.prompt, 'Build import.');
});
