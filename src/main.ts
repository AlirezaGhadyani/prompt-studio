import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';
import { Store } from './state/store.ts';
import { App } from './ui/app.ts';

const root = document.querySelector('#root') as HTMLElement;
const host = connectHost();
const store = new Store();
const app = new App(store, host);

let mounted = false;

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  store.setContext(context);
  if (mounted) return;
  mounted = true;
  app.mount(context);
  void store.init(host, context);
});

host.onSession((session) => {
  store.setSessionOpen(session !== null);
});

// The panel only runs inside OpenChamber; this covers a plain-file preview.
window.setTimeout(() => {
  if (mounted) return;
  root.textContent = 'Open Prompt Studio from OpenChamber → Settings → Extensions.';
  root.style.padding = '16px';
}, 2500);
