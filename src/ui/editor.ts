import { mountButton, mountMenu, mountTabs } from '@openchamber/sdk/ui';
import type { Draft, EditorTab, Store } from '../state/store.ts';
import { COMPOSE_LIMIT, listPlaceholders, missingRequiredFields } from '../templates/schema.ts';
import { clear, el, field, input, textarea } from './dom.ts';
import { openFieldDialog, toTemplateField, type FieldDraft } from './dialogs.ts';

export interface EditorCallbacks {
  onBack: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

export class EditorView {
  readonly root: HTMLElement;
  private readonly store: Store;
  private readonly callbacks: EditorCallbacks;
  private draft: Draft | null = null;
  private handles: Array<{ dispose: () => void }> = [];
  private titleNode: HTMLElement | null = null;
  private starHolder: HTMLElement | null = null;
  private promptArea: HTMLTextAreaElement | null = null;
  private canonicalArea: HTMLTextAreaElement | null = null;
  private counterNode: HTMLElement | null = null;
  private warningSlot: HTMLElement | null = null;
  private manualNote: HTMLElement | null = null;
  private placeholderSlot: HTMLElement | null = null;
  private placeholderKey = '';

  constructor(store: Store, callbacks: EditorCallbacks) {
    this.store = store;
    this.callbacks = callbacks;
    this.root = el('div', 'ps-editor');
  }

  destroy(): void {
    for (const handle of this.handles) handle.dispose();
    this.handles = [];
    clear(this.root);
  }

  mount(draft: Draft): void {
    this.destroy();
    this.draft = draft;
    this.promptArea = null;
    this.canonicalArea = null;

    const head = el('div', 'ps-head');
    const backHolder = el('span');
    head.append(backHolder);
    this.handles.push(
      mountButton(backHolder, {
        label: 'Back',
        variant: 'ghost',
        size: 'xs',
        onClick: () => this.callbacks.onBack(),
      }),
    );

    this.titleNode = el('div', 'ps-head-title', draft.name || (draft.isNew ? 'New template' : 'Untitled'));
    head.append(this.titleNode);

    this.starHolder = el('span');
    head.append(this.starHolder);

    if (!draft.isNew && draft.id) {
      const id = draft.id;
      const entry = this.store.getState().entries.find((item) => item.id === id);
      this.handles.push(
        mountButton(this.starHolder, {
          label: entry?.favorite ? '★' : '☆',
          variant: 'ghost',
          size: 'xs',
          onClick: () => void this.store.toggleFavorite(id),
        }),
      );

      const menuHolder = el('span');
      head.append(menuHolder);
      this.handles.push(
        mountMenu(menuHolder, {
          label: 'Actions',
          variant: 'ghost',
          size: 'xs',
          items: [
            { id: 'duplicate', label: 'Duplicate' },
            { id: 'move-up', label: 'Move up' },
            { id: 'move-down', label: 'Move down' },
            { id: 'export', label: 'Export this template' },
            { separator: true },
            { id: 'delete', label: 'Delete', destructive: true },
          ],
          onSelect: (action) => {
            if (action === 'duplicate') this.callbacks.onDuplicate(id);
            if (action === 'move-up') this.callbacks.onMove(id, -1);
            if (action === 'move-down') this.callbacks.onMove(id, 1);
            if (action === 'export') this.callbacks.onExport(id);
            if (action === 'delete') this.callbacks.onDelete(id);
          },
        }),
      );
    }

    const tabsHolder = el('div', 'ps-tabs');
    this.handles.push(
      mountTabs(tabsHolder, {
        items: [
          { id: 'prompt', label: 'Prompt' },
          { id: 'template', label: 'Template' },
        ],
        activeId: draft.tab,
        onChange: (id) => this.store.setEditorTab(id as EditorTab),
      }),
    );

    const body = el('div', 'ps-body');
    const foot = el('div', 'ps-foot');

    this.root.append(head, tabsHolder, body, foot);

    if (draft.tab === 'prompt') this.buildPromptTab(body, foot);
    else this.buildTemplateTab(body, foot);

    this.update(draft);
  }

  /** Called on every store notification; never rebuilds the active inputs. */
  update(draft: Draft): void {
    this.draft = draft;
    if (this.titleNode) this.titleNode.textContent = draft.name || (draft.isNew ? 'New template' : 'Untitled');

    if (draft.tab === 'prompt') {
      if (this.promptArea && this.promptArea.value !== draft.prompt) {
        const start = this.promptArea.selectionStart;
        const end = this.promptArea.selectionEnd;
        this.promptArea.value = draft.prompt;
        try {
          this.promptArea.setSelectionRange(start, end);
        } catch {
          // The element may not be focused; selection is best effort.
        }
      }
      this.paintPromptMeta(draft);
      if (this.manualNote) this.manualNote.hidden = !draft.manualEdits;
    } else {
      this.paintPlaceholders(draft);
    }
  }

  /** Lists placeholders in the body that have no field yet, as you type. */
  private paintPlaceholders(draft: Draft): void {
    if (!this.placeholderSlot) return;
    const missing = listPlaceholders(draft.canonicalBody).filter(
      (key) => !draft.fields.some((templateField) => templateField.key === key),
    );
    const signature = missing.join('|');
    if (signature === this.placeholderKey) return;
    this.placeholderKey = signature;
    clear(this.placeholderSlot);
    if (missing.length === 0) return;

    const hint = el('div', 'ps-block');
    hint.append(el('p', 'ps-hint', `Placeholders without a field: ${missing.map((item) => `{{${item}}}`).join(', ')}`));
    const row = el('div', 'ps-actions-row');
    for (const missingKey of missing) {
      const holder = el('span');
      row.append(holder);
      this.handles.push(
        mountButton(holder, {
          label: `Add {{${missingKey}}}`,
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            this.store.addField(
              toTemplateField({
                key: missingKey,
                label: missingKey.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase()),
                description: '',
                placeholder: '',
                required: false,
                defaultValue: '',
                kind: 'multiline',
              }),
            );
          },
        }),
      );
    }
    hint.append(row);
    this.placeholderSlot.append(hint);
  }

  private paintPromptMeta(draft: Draft): void {
    if (!this.counterNode) return;
    const length = draft.prompt.trim().length;
    this.counterNode.textContent = `${length.toLocaleString()} / ${COMPOSE_LIMIT.toLocaleString()}`;
    this.counterNode.dataset.state = length > COMPOSE_LIMIT ? 'error' : length > COMPOSE_LIMIT * 0.9 ? 'warn' : 'ok';

    const missing = missingRequiredFields(draft.fields, draft.values);
    if (!this.warningSlot) return;
    clear(this.warningSlot);
    if (missing.length > 0) {
      this.warningSlot.append(
        el('p', 'ps-hint ps-missing', `Required: ${missing.map((item) => item.label).join(', ')}`),
      );
    }
    if (length > COMPOSE_LIMIT) {
      this.warningSlot.append(
        el('p', 'ps-hint ps-missing', 'Over the composer limit. Shorten the prompt, or copy and paste in parts.'),
      );
    }
  }

  private buildPromptTab(body: HTMLElement, foot: HTMLElement): void {
    const draft = this.draft;
    if (!draft) return;

    if (draft.fields.length > 0) {
      const block = el('div', 'ps-block');
      block.append(el('div', 'ps-block-title', 'Fields'));

      for (const templateField of draft.fields) {
        const value = draft.values[templateField.key] ?? '';
        const control: HTMLInputElement | HTMLTextAreaElement =
          templateField.kind === 'multiline'
            ? textarea('', templateField.placeholder ?? '')
            : input(templateField.placeholder ?? '');
        control.value = value;
        control.addEventListener('input', () => this.store.setFieldValue(templateField.key, control.value));
        const label = `${templateField.label}${templateField.required ? ' *' : ''}`;
        const wrapper = field(label, control, templateField.description);
        block.append(wrapper);
      }

      const note = el('div', 'ps-actions-row');
      note.append(el('span', 'ps-hint', 'The prompt was edited by hand, so fields no longer update it.'));
      const applyHolder = el('span');
      note.append(applyHolder);
      this.handles.push(
        mountButton(applyHolder, {
          label: 'Apply fields',
          variant: 'secondary',
          size: 'xs',
          onClick: () => this.store.applyFieldValues(),
        }),
      );
      note.hidden = !draft.manualEdits;
      this.manualNote = note;
      block.append(note);
      body.append(block);
    } else if (!draft.isNew && draft.id) {
      const row = el('div', 'ps-actions-row');
      const saveHolder = el('span');
      row.append(saveHolder);
      this.handles.push(
        mountButton(saveHolder, {
          label: 'Save prompt as template body',
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            this.store.setCanonicalBody(draft.prompt);
            void this.store.saveDraft();
          },
        }),
      );
      body.append(row);
    }

    this.promptArea = textarea('ps-prompt', 'The prompt that will be inserted');
    this.promptArea.value = draft.prompt;
    this.promptArea.addEventListener('input', () => {
      if (this.promptArea) this.store.setPrompt(this.promptArea.value);
    });
    body.append(
      field('Prompt', this.promptArea, 'This is what gets inserted. Edit it freely; the template stays intact.'),
    );

    this.warningSlot = el('div');
    body.append(this.warningSlot);

    this.counterNode = el('span', 'ps-foot-meta');
    foot.append(this.counterNode);

    const replaceHolder = el('span');
    const appendHolder = el('span');
    const copyHolder = el('span');
    foot.prepend(replaceHolder, appendHolder, copyHolder);
    this.handles.push(
      mountButton(replaceHolder, {
        label: 'Replace composer',
        variant: 'default',
        size: 'sm',
        onClick: () => void this.store.insert('replace'),
      }),
      mountButton(appendHolder, {
        label: 'Append',
        variant: 'secondary',
        size: 'sm',
        onClick: () => void this.store.insert('append'),
      }),
      mountButton(copyHolder, {
        label: 'Copy',
        variant: 'ghost',
        size: 'sm',
        onClick: () => void this.store.copyPrompt(),
      }),
    );
  }

  private buildTemplateTab(body: HTMLElement, foot: HTMLElement): void {
    const draft = this.draft;
    if (!draft) return;

    const nameInput = input('Template name');
    nameInput.value = draft.name;
    nameInput.addEventListener('input', () => this.store.setDraftMeta({ name: nameInput.value }));

    const descriptionInput = input('What this template is for');
    descriptionInput.value = draft.description;
    descriptionInput.addEventListener('input', () => this.store.setDraftMeta({ description: descriptionInput.value }));

    const category = document.createElement('select');
    category.className = 'ps-select';
    for (const item of this.store.getState().categories) {
      const option = el('option', undefined, item.name);
      option.value = item.id;
      category.append(option);
    }
    category.value = draft.categoryId;
    category.addEventListener('change', () => this.store.setDraftMeta({ categoryId: category.value }));

    const tagsInput = input('engineering, feature');
    tagsInput.value = draft.tags;
    tagsInput.addEventListener('input', () => this.store.setDraftMeta({ tags: tagsInput.value }));

    body.append(
      field('Name', nameInput),
      field('Description', descriptionInput),
      field('Category', category),
      field('Tags', tagsInput, 'Comma separated. Search matches them.'),
    );

    const fieldsBlock = el('div', 'ps-block');
    const fieldsHead = el('div', 'ps-actions-row');
    fieldsHead.append(el('div', 'ps-block-title', 'Structured fields'));
    const addHolder = el('span');
    fieldsHead.append(addHolder);
    this.handles.push(
      mountButton(addHolder, {
        label: 'Add field',
        variant: 'secondary',
        size: 'xs',
        onClick: () => {
          openFieldDialog('Add field', emptyField(), (value) => this.store.addField(toTemplateField(value)));
        },
      }),
    );
    fieldsBlock.append(fieldsHead);

    if (draft.fields.length === 0) {
      fieldsBlock.append(el('p', 'ps-hint', 'No fields. The prompt is a single editable text.'));
    }

    for (const templateField of draft.fields) {
      const row = el('div', 'ps-field-row');
      const info = el('div', 'ps-grow');
      info.append(
        el('div', undefined, `${templateField.label}${templateField.required ? ' *' : ''}`),
        el('div', 'ps-mini', `{{${templateField.key}}} · ${templateField.kind === 'multiline' ? 'multiline' : 'text'}`),
      );
      const editHolder = el('span');
      const removeHolder = el('span');
      row.append(info, editHolder, removeHolder);
      this.handles.push(
        mountButton(editHolder, {
          label: 'Edit',
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            openFieldDialog(
              `Edit "${templateField.label}"`,
              {
                key: templateField.key,
                label: templateField.label,
                description: templateField.description ?? '',
                placeholder: templateField.placeholder ?? '',
                required: templateField.required,
                defaultValue: templateField.defaultValue ?? '',
                kind: templateField.kind,
              },
              (value) => this.store.updateField(templateField.key, toTemplateField(value)),
            );
          },
        }),
        mountButton(removeHolder, {
          label: 'Remove',
          variant: 'ghost',
          size: 'xs',
          onClick: () => this.store.removeField(templateField.key),
        }),
      );
      fieldsBlock.append(row);
    }
    body.append(fieldsBlock);

    this.placeholderSlot = el('div');
    this.placeholderKey = '';
    body.append(this.placeholderSlot);
    this.paintPlaceholders(draft);

    this.canonicalArea = textarea('ps-canonical', 'The template body. Use {{field_key}} for structured values.');
    this.canonicalArea.value = draft.canonicalBody;
    this.canonicalArea.addEventListener('input', () => {
      if (this.canonicalArea) this.store.setCanonicalBody(this.canonicalArea.value);
    });
    body.append(
      field('Template body', this.canonicalArea, 'Saved as the template. The Prompt tab is what gets inserted.'),
    );

    const saveHolder = el('span');
    foot.append(saveHolder);
    this.handles.push(
      mountButton(saveHolder, {
        label: draft.isNew ? 'Create template' : 'Save changes',
        variant: 'default',
        size: 'sm',
        loading: this.store.getState().saving,
        onClick: () => void this.store.saveDraft(),
      }),
    );
    if (draft.isNew) {
      foot.append(el('span', 'ps-hint', 'Saves into your library.'));
    }
  }
}

function emptyField(): FieldDraft {
  return {
    key: '',
    label: '',
    description: '',
    placeholder: '',
    required: false,
    defaultValue: '',
    kind: 'multiline',
  };
}
