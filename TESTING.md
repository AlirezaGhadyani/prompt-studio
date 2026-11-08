# Testing report

Run on 2026-11-08 against OpenChamber 2.7.0 and `@openchamber/sdk` 2.7.0.

## Automated

```
npm run typecheck   → tsc --noEmit, exit 0
npm test            → 34 tests, 34 pass, 0 fail
npm run build       → panel/main.js 218.5 KB, IIFE
```

Coverage:

- **schema** — required name/body, category by id or name, tag dedupe, placeholder replacement,
  required-field detection, invalid and duplicate field keys.
- **library** — fresh library, create/update/delete/restore across a reload, duplicate naming, reorder
  and its edge, category deletion reassigning to General, General protection, duplicate category names,
  index chunking past 120 templates, 64 KiB rejection, import policies (skip/copy/replace), export →
  import round trip with categories, malformed documents.
- **store** — insert without a session, empty prompt, 16,001 characters, exact text and mode passed to
  `compose`, field rendering until manual edits, explicit re-render.
- **migration** — frontmatter parsing, body preservation, `$ARGUMENTS` → `{{request}}` field, empty
  body skipped, category heuristics, stable ids and collision handling.
- **manifest** — parsed by the SDK's own `parseManifestJson`, zero capabilities, panel files present,
  bundle is a classic script.

The suite uses an in-memory adapter that enforces the same 64 KiB value limit as the host, so storage
behaviour is tested without OpenChamber.

## Manual, in the running app

The extension was installed from the folder through the real server (`POST /api/guests`) and driven in
the web UI at `http://127.0.0.1:57123`.

- [x] Install: card created, `enabled: true`, `capabilities: { requested: [], granted: [] }`.
- [x] Rail icon appears in **Panel surfaces**; the panel loads with the app theme.
- [x] Empty state shows "No templates yet…".
- [x] Create: name, description, body, category; **Create template** shows "Template created."
- [x] Reload the whole page: the template is still listed (storage persistence).
- [x] Placeholder **Add {{feature}}** creates a multiline field; the field list shows
  `{{feature}} · multiline`.
- [x] Save changes persists the field; reopening the template shows the Fields form.
- [x] Typing in a field re-renders the prompt live
  (`Implement {{feature}}` → `Implement CSV export`).
- [x] **Replace composer** puts the exact prompt in the chat box and shows
  "Prompt replaced in the composer."; the composer stays editable and nothing is sent.
- [x] **Append** adds a second copy after the existing composer text.
- [x] The composer was cleared afterwards; no message was sent during testing.
- [x] Import from a `.json` file: 19 added, 0 replaced, 0 skipped, 0 rejected; categories and
  descriptions came through.
- [x] Search filters by description and tags, not just names.
- [x] Delete shows a confirmation, removes the row, and offers **Undo** in the notice.
- [x] Export dialog reports 35,921 characters and, above the clipboard limit, offers **Select all**
  with the manual-copy hint instead of a Copy that would fail.

## Not verified

- The full-screen **Extension pages** layout (`contributes.page`) was not opened; the rail panel was.
  Both use the same page and state.
- Light theme was not visually checked; colours come from `applyHostReady` tokens.
- Multi-window storage conflicts (two panels editing one template) are not tested.
- The 32,000-character clipboard, the 16,000-character composer limit on the host side, and the 64 KiB
  storage limit are enforced by code and unit tests, not by forcing the host to reject a call.
