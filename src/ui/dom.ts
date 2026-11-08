export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function field(label: string, control: HTMLElement, hint?: string): HTMLElement {
  const wrapper = el('div');
  const labelNode = el('label', 'ps-label', label);
  wrapper.append(labelNode, control);
  if (hint) wrapper.append(el('p', 'ps-hint', hint));
  return wrapper;
}

export function textarea(className: string, placeholder = ''): HTMLTextAreaElement {
  const node = el('textarea', `ps-textarea ps-mono ${className}`);
  node.placeholder = placeholder;
  node.spellcheck = false;
  return node;
}

export function input(placeholder = '', mono = false): HTMLInputElement {
  const node = el('input', `ps-input${mono ? ' ps-mono' : ''}`);
  node.type = 'text';
  node.placeholder = placeholder;
  return node;
}

export function relativeTime(iso: string | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return true;
  return target.isContentEditable;
}
