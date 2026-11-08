import { mountButton } from '@openchamber/sdk/ui';
import type { Store } from '../state/store.ts';
import type { DuplicatePolicy } from '../storage/library.ts';
import type { Category, TemplateField } from '../templates/schema.ts';
import { CLIPBOARD_LIMIT } from '../templates/schema.ts';
import { clear, el, field, input, textarea } from './dom.ts';

export interface DialogHandle {
  close: () => void;
}

interface DialogAction {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  /** Keeps the dialog open after the action finishes. */
  keepOpen?: boolean;
}

interface DialogOptions {
  title: string;
  body: HTMLElement;
  actions: DialogAction[];
  onClose?: () => void;
  wide?: boolean;
}

let openCount = 0;

export function openDialog(options: DialogOptions): DialogHandle {
  const overlay = el('div', 'ps-overlay');
  const dialog = el('div', options.wide ? 'ps-dialog' : 'ps-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', options.title);
  dialog.style.position = 'relative';
  if (options.wide) dialog.style.maxWidth = '680px';

  const heading = el('h3', undefined, options.title);
  dialog.append(heading, options.body);

  const actions = el('div', 'ps-actions');
  dialog.append(actions);
  overlay.append(dialog);

  const close = (): void => {
    if (!overlay.parentNode) return;
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
    openCount = Math.max(0, openCount - 1);
    options.onClose?.();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  for (const action of options.actions) {
    const holder = el('span');
    actions.append(holder);
    mountButton(holder, {
      label: action.label,
      variant: action.variant ?? 'secondary',
      size: 'sm',
      disabled: action.disabled,
      onClick: () => {
        void Promise.resolve(action.onClick())
          .then(() => {
            if (!action.keepOpen) close();
          })
          .catch(() => undefined);
      },
    });
  }

  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', onKeyDown);
  document.body.append(overlay);
  openCount += 1;

  const firstInput = overlay.querySelector<HTMLElement>('input, textarea, button');
  firstInput?.focus();

  return { close };
}

export function isDialogOpen(): boolean {
  return openCount > 0;
}

export function confirmDialog(
  title: string,
  message: string,
  confirmLabel: string,
  destructive = false,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const decide = (value: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(value);
      handle.close();
    };
    const body = el('p', 'ps-mini', message);
    body.style.margin = '0';
    const handle = openDialog({
      title,
      body,
      onClose: () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      },
      actions: [
        { label: 'Cancel', onClick: () => decide(false) },
        {
          label: confirmLabel,
          variant: destructive ? 'destructive' : 'default',
          onClick: () => decide(true),
        },
      ],
    });
  });
}

export function openExportDialog(store: Store, json: string, scopeLabel: string): void {
  const body = el('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '8px';

  const area = textarea('ps-canonical');
  area.value = json;
  area.readOnly = true;
  area.style.height = '40vh';
  area.style.minHeight = '200px';

  const meta = el('p', 'ps-hint', `${scopeLabel} · ${json.length.toLocaleString()} characters`);
  const hint = el(
    'p',
    'ps-hint',
    json.length > CLIPBOARD_LIMIT
      ? `Longer than the ${CLIPBOARD_LIMIT.toLocaleString()}-character clipboard limit. Click the text, press Ctrl/Cmd+A, then Ctrl/Cmd+C.`
      : 'Copy saves this JSON to the clipboard. Keep it as your backup.',
  );

  body.append(area, meta, hint);

  const canCopy = json.length <= CLIPBOARD_LIMIT;
  openDialog({
    title: 'Export templates',
    body,
    wide: true,
    actions: [
      {
        label: canCopy ? 'Copy' : 'Select all',
        variant: 'default',
        keepOpen: true,
        onClick: async () => {
          if (!canCopy) {
            area.focus();
            area.select();
            return;
          }
          await store.copyText(json);
        },
      },
      { label: 'Close', onClick: () => undefined },
    ],
  });
}

export function openImportDialog(store: Store): void {
  const body = el('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '10px';

  const area = textarea('ps-canonical', 'Paste a Prompt Studio JSON export here');
  area.style.height = '28vh';
  area.style.minHeight = '140px';

  const fileRow = el('div', 'ps-row');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.className = 'ps-input ps-grow';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    area.value = await file.text();
    area.dispatchEvent(new Event('input'));
  });

  const policyRow = el('div', 'ps-row');
  const policyLabel = el('label', 'ps-label', 'If a template already exists');
  policyLabel.style.margin = '0';
  const policy = document.createElement('select');
  policy.className = 'ps-select ps-grow';
  for (const [value, label] of [
    ['skip', 'Skip it (recommended)'],
    ['copy', 'Import as a copy'],
    ['replace', 'Replace the existing template'],
  ] as const) {
    const option = el('option', undefined, label);
    option.value = value;
    policy.append(option);
  }
  policyRow.append(policyLabel, policy);

  fileRow.append(fileInput);
  body.append(area, fileRow, policyRow);

  openDialog({
    title: 'Import templates',
    body,
    wide: true,
    actions: [
      {
        label: 'Import',
        variant: 'default',
        onClick: async () => {
          const text = area.value.trim();
          if (!text) {
            area.focus();
            return;
          }
          await store.importText(text, policy.value as DuplicatePolicy);
        },
      },
      { label: 'Cancel', onClick: () => undefined },
    ],
  });
}

export function openCategoriesDialog(store: Store): void {
  const body = el('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '10px';

  const list = el('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '6px';

  const render = (categories: Category[]): void => {
    clear(list);
    for (const category of categories) {
      const row = el('div', 'ps-field-row');
      const nameInput = input();
      nameInput.value = category.name;
      nameInput.className = 'ps-input ps-grow';

      const save = el('span');
      mountButton(save, {
        label: 'Rename',
        variant: 'secondary',
        size: 'xs',
        onClick: async () => {
          const next = nameInput.value.trim();
          if (next === category.name) return;
          if (await store.renameCategory(category.id, next)) render(store.getState().categories);
        },
      });

      const remove = el('span');
      mountButton(remove, {
        label: 'Delete',
        variant: 'ghost',
        size: 'xs',
        onClick: async () => {
          const confirmed = await confirmDialog(
            `Delete "${category.name}"?`,
            'Templates in this category move to General. No template is deleted.',
            'Delete category',
            true,
          );
          if (!confirmed) return;
          await store.deleteCategory(category.id);
          render(store.getState().categories);
        },
      });

      if (category.id === 'general') {
        save.setAttribute('aria-hidden', 'true');
        save.style.visibility = 'hidden';
      }

      row.append(nameInput, save, remove);
      list.append(row);
    }
  };
  render(store.getState().categories);

  const addRow = el('div', 'ps-field-row');
  const newName = input('New category name');
  const add = el('span');
  mountButton(add, {
    label: 'Add',
    variant: 'default',
    size: 'xs',
    onClick: async () => {
      const name = newName.value.trim();
      if (!name) {
        newName.focus();
        return;
      }
      if (await store.addCategory(name)) {
        newName.value = '';
        render(store.getState().categories);
      }
    },
  });
  addRow.append(newName, add);

  body.append(list, el('p', 'ps-hint', 'Deleting a category never deletes its templates.'), addRow);

  openDialog({
    title: 'Categories',
    body,
    wide: true,
    actions: [{ label: 'Close', onClick: () => undefined }],
  });
}

export interface FieldDraft {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  defaultValue: string;
  kind: 'text' | 'multiline';
}

export function openFieldDialog(
  title: string,
  initial: FieldDraft,
  onSubmit: (field: FieldDraft) => void,
): void {
  const body = el('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '10px';

  const labelInput = input('Feature name');
  labelInput.value = initial.label;
  const keyInput = input('feature_name', true);
  keyInput.value = initial.key;
  const descriptionInput = input('What this field means');
  descriptionInput.value = initial.description;
  const placeholderInput = input('Shown inside the empty field');
  placeholderInput.value = initial.placeholder;
  const defaultInput = input('Used when the field is left empty');
  defaultInput.value = initial.defaultValue;

  const kind = document.createElement('select');
  kind.className = 'ps-select';
  for (const [value, label] of [
    ['text', 'Single line'],
    ['multiline', 'Multiple lines'],
  ] as const) {
    const option = el('option', undefined, label);
    option.value = value;
    kind.append(option);
  }
  kind.value = initial.kind;

  const requiredWrap = el('label', 'ps-row');
  const required = document.createElement('input');
  required.type = 'checkbox';
  required.checked = initial.required;
  requiredWrap.append(required, el('span', undefined, 'Required'));

  const error = el('p', 'ps-hint ps-field-error');
  error.style.display = 'none';

  body.append(
    field('Label', labelInput),
    field('Key', keyInput, 'Used as {{key}} in the template body.'),
    field('Description', descriptionInput),
    field('Placeholder', placeholderInput),
    field('Default value', defaultInput),
    field('Input type', kind),
    requiredWrap,
    error,
  );

  const submit = (): void => {
    const label = labelInput.value.trim();
    const key = keyInput.value.trim();
    if (!label || !key) {
      error.textContent = 'Label and key are required.';
      error.style.display = 'block';
      return;
    }
    if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(key)) {
      error.textContent = 'Key must start with a letter and use letters, digits, or underscores.';
      error.style.display = 'block';
      return;
    }
    onSubmit({
      key,
      label,
      description: descriptionInput.value.trim(),
      placeholder: placeholderInput.value.trim(),
      defaultValue: defaultInput.value.trim(),
      required: required.checked,
      kind: kind.value === 'multiline' ? 'multiline' : 'text',
    });
  };

  openDialog({
    title,
    body,
    wide: true,
    actions: [
      { label: 'Save field', variant: 'default', onClick: submit },
      { label: 'Cancel', onClick: () => undefined },
    ],
  });

  labelInput.addEventListener('input', () => {
    if (keyInput.dataset.touched === 'true') return;
    const key = labelInput.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    keyInput.value = key;
  });
  keyInput.addEventListener('input', () => {
    keyInput.dataset.touched = 'true';
  });
}

export function toTemplateField(value: FieldDraft): TemplateField {
  const field: TemplateField = {
    key: value.key,
    label: value.label,
    required: value.required,
    kind: value.kind,
  };
  if (value.description) field.description = value.description;
  if (value.placeholder) field.placeholder = value.placeholder;
  if (value.defaultValue) field.defaultValue = value.defaultValue;
  return field;
}
