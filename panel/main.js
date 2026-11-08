"use strict";
(() => {
  // node_modules/@openchamber/sdk/dist/api-version.js
  var OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
  var OPENCHAMBER_SDK_API_VERSION = 1;

  // node_modules/@openchamber/sdk/dist/scrollbar-style.js
  var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
  var GUEST_SCROLLBAR_CSS = `
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
  function installGuestScrollbarActivity(doc) {
    const root2 = doc.documentElement;
    if (root2.hasAttribute("data-oc-scrollbar-activity"))
      return;
    root2.setAttribute("data-oc-scrollbar-activity", "");
    const timers = /* @__PURE__ */ new WeakMap();
    doc.addEventListener("scroll", (event) => {
      const target = event.target === doc ? root2 : event.target;
      if (!(target instanceof Element))
        return;
      if (!target.hasAttribute("data-oc-scrolling"))
        target.setAttribute("data-oc-scrolling", "");
      const pending = timers.get(target);
      if (pending !== void 0)
        clearTimeout(pending);
      timers.set(target, setTimeout(() => {
        timers.delete(target);
        target.removeAttribute("data-oc-scrolling");
      }, 1e3));
    }, { capture: true, passive: true });
  }
  var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;

  // node_modules/@openchamber/sdk/dist/workspace.js
  var GUEST_STORAGE_KEY_MAX = 128;
  var GUEST_STORAGE_VALUE_BYTES = 65536;

  // node_modules/@openchamber/sdk/dist/shells.js
  var GUEST_SHELL_ID_MAX = 128;
  var GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;

  // node_modules/@openchamber/sdk/dist/status-controls.js
  var GUEST_STATUS_CONTROLS_MAX = 4;
  var GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
  var GUEST_STATUS_CONTROL_LABEL_MAX = 60;
  var GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
  var GUEST_STATUS_CONTROL_VALUE_MAX = 80;
  var isControlObject = (value) => Object(value) === value && !Array.isArray(value);
  var hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
  var isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
  var isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
  var isGuestStatusControls = (controls) => {
    if (!Array.isArray(controls) || controls.length > GUEST_STATUS_CONTROLS_MAX)
      return false;
    const ids = /* @__PURE__ */ new Set();
    for (const control of controls) {
      if (!isControlObject(control) || !GUEST_STATUS_CONTROL_ID.test(control.id) || !isLabel(control.label))
        return false;
      if (control.disabled !== void 0 && control.disabled !== true && control.disabled !== false)
        return false;
      if (ids.has(control.id))
        return false;
      ids.add(control.id);
      if (control.kind === "button") {
        if (!hasOnlyKeys(control, ["kind", "id", "label", "disabled"]))
          return false;
        continue;
      }
      if (control.kind !== "select" || !hasOnlyKeys(control, ["kind", "id", "label", "value", "options", "disabled"]))
        return false;
      if (!isValue(control.value) || !Array.isArray(control.options) || control.options.length < 1 || control.options.length > GUEST_STATUS_CONTROL_OPTIONS_MAX)
        return false;
      const values = /* @__PURE__ */ new Set();
      for (const option of control.options) {
        if (!isControlObject(option) || !hasOnlyKeys(option, ["value", "label"]) || !isValue(option.value) || !isLabel(option.label) || values.has(option.value))
          return false;
        values.add(option.value);
      }
      if (!values.has(control.value))
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/manifest.js
  var TRACKER_URL_TOKENS = ["{id}", "{segment}", "{segments+}"];
  var TRACKER_URL_TOKEN_SET = new Set(TRACKER_URL_TOKENS);

  // node_modules/@openchamber/sdk/dist/session-events.js
  var GUEST_SESSION_EVENT_TYPES = [
    "turn-finished",
    "turn-failed",
    "permission-asked",
    "question-asked",
    "turn-started",
    "session-created",
    "session-archived",
    "session-deleted"
  ];
  var SESSION_EVENTS_IDLE_MS = 10 * 6e4;
  var EVENT_TYPES = new Set(GUEST_SESSION_EVENT_TYPES);

  // node_modules/@openchamber/sdk/dist/service-host.js
  var SERVICE_SCHEDULE_IDLE_MS = 10 * 6e4;
  var MENTIONS_IDLE_MS = 10 * 6e4;

  // node_modules/@openchamber/sdk/dist/file-editor.js
  var GUEST_FILE_EDITOR_CONTENT_MAX = 2e7;
  var GUEST_FILE_EDITOR_VERSION_MAX = 256;
  var fileEditorPayloadSize = (value) => "bytes" in value ? value.bytes.byteLength : value.content.length;
  var sameFileEditorDocument = (left, right) => {
    if (left.path !== right.path || left.readOnly !== right.readOnly)
      return false;
    if (left.encoding === "text" || right.encoding === "text") {
      return left.encoding === "text" && right.encoding === "text" && left.content === right.content;
    }
    if (left.bytes.byteLength !== right.bytes.byteLength)
      return false;
    for (let index = 0; index < left.bytes.byteLength; index += 1) {
      if (left.bytes[index] !== right.bytes[index])
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/popover.js
  var GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
  var GUEST_POPOVER_COORDINATE_MAX = 1e5;
  var GUEST_POPOVER_WIDTH_MIN = 160;
  var GUEST_POPOVER_WIDTH_MAX = 640;
  var GUEST_POPOVER_HEIGHT_MIN = 48;
  var GUEST_POPOVER_HEIGHT_MAX = 480;
  var GUEST_POPOVER_DATA_MAX = 16e3;
  var GUEST_POPOVER_DATA_DEPTH_MAX = 32;
  var GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
  var hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
    if (--budget.remaining < 0 || depth >= GUEST_POPOVER_DATA_DEPTH_MAX)
      return false;
    if (value === null)
      return true;
    const children = Array.isArray(value) ? value : Object(value) === value ? Object.values(value) : [];
    for (const item of children) {
      if (!hasBoundedJsonTree(item, depth + 1, budget))
        return false;
    }
    return true;
  };
  var isFiniteJson = (value) => {
    if (value === null || value === true || value === false)
      return true;
    if (Array.isArray(value))
      return Object.keys(value).every((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length) && value.every(isFiniteJson);
    if (Object(value) === value) {
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype) && Object.values(value).every(isFiniteJson);
    }
    return String(value) === value || Number.isFinite(value);
  };
  var isGuestPopoverRequest = (request) => {
    try {
      if (String(request.id) !== request.id || !GUEST_POPOVER_ID.test(request.id) || !Number.isFinite(request.anchor.x) || Math.abs(request.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.y) || Math.abs(request.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.width) || !Number.isFinite(request.anchor.height) || request.anchor.width <= 0 || request.anchor.height <= 0 || request.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request.width) || request.width < GUEST_POPOVER_WIDTH_MIN || request.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request.height) || request.height < GUEST_POPOVER_HEIGHT_MIN || request.height > GUEST_POPOVER_HEIGHT_MAX || request.side !== void 0 && !GUEST_POPOVER_SIDES.includes(request.side) || request.focus !== void 0 && request.focus !== true && request.focus !== false || !hasBoundedJsonTree(request.data) || !isFiniteJson(request.data))
        return false;
      return JSON.stringify(request.data).length <= GUEST_POPOVER_DATA_MAX;
    } catch {
      return false;
    }
  };

  // node_modules/@openchamber/sdk/dist/contract.js
  var GUEST_BLOCK_ANSWER_MAX = 2e3;
  var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
  var isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
  var isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
  var GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
  var isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
  var GUEST_TOAST_MAX = 500;
  var GUEST_CLIPBOARD_TEXT_MAX = 32e3;
  var GUEST_COMPOSE_TEXT_MAX = 16e3;
  var GUEST_ATTACH_ID_MAX = 128;
  var GUEST_ATTACH_TITLE_MAX = 200;
  var GUEST_ATTACH_URL_MAX = 2e3;
  var GUEST_ATTACH_TEXT_MAX = 16e3;
  var GUEST_ATTACH_AUTHOR_MAX = 80;
  var GUEST_ATTACH_BRANCH_MAX = 200;
  var GUEST_ATTACH_DATA_MAX = 16e3;
  var GUEST_REQUEST_PATH_MAX = 2e3;
  var GUEST_REQUEST_TIMEOUT_MS = 2e4;
  var GUEST_FILE_PATH_MAX = 1024;
  var GUEST_FILE_CONTENT_MAX = 2e6;
  var GUEST_GENERATE_PROMPT_MAX = 64e3;
  var GUEST_GENERATE_SYSTEM_MAX = 8e3;
  var GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4e3;
  var GUEST_GENERATE_TIMEOUT_MS = 96e4;
  var GUEST_GENERATE_LATE_KEEP_MS = 60 * 6e4;
  var GUEST_BADGE_MAX = 999;
  var GUEST_FRAME_HEIGHT_MAX = 1e4;
  var GUEST_RESOLVE_ERROR_MAX = 500;
  var HOST_REQUEST_ERROR_CODES = [
    "HOST_UNAVAILABLE",
    "HOST_TIMEOUT",
    "HOST_REJECTED",
    "DISCONNECTED",
    "DISABLED",
    "BAD_PATH",
    "NO_INTEGRATION",
    "NO_SERVICE",
    "SERVICE_FAILED",
    "REQUEST_FAILED",
    "RESPONSE_TOO_LARGE",
    "NO_SESSION",
    "SESSION_BUSY",
    "NOT_GRANTED",
    "NO_DIRECTORY",
    "NOT_FOUND",
    "FILE_TOO_LARGE",
    "DENIED",
    "NO_MODEL",
    "MODEL_FAILED",
    "UNSUPPORTED"
  ];
  var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
  var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
  var isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
  var resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
  var isJsonValue = (value) => {
    if (value === void 0)
      return false;
    if (value === null || value === true || value === false)
      return true;
    if (String(value) === value)
      return true;
    if (Number(value) === value)
      return Number.isFinite(value);
    if (Array.isArray(value))
      return value.every(isJsonValue);
    if (Object(value) === value)
      return Object.values(value).every(isJsonValue);
    return false;
  };
  var isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
  var clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
  var clampAttachRequest = (request) => {
    const id = request.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
    const title = request.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
    const url = request.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
    const text = request.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
    const author = request.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
    const kind = request.kind === "pull" ? "pull" : "issue";
    const next = {
      providerId: request.providerId.trim(),
      id,
      title: title || id,
      url,
      kind
    };
    if (text) {
      next.text = text;
    }
    if (author) {
      next.author = author;
    }
    if (kind === "pull") {
      const head = clampBranch(request.branches?.head);
      const base = clampBranch(request.branches?.base);
      if (head && base) {
        next.branches = { head, base };
      }
    }
    if (isAttachData(request.data)) {
      next.data = request.data;
    }
    return next;
  };
  var clampStartSessionRequest = (request) => {
    const next = clampAttachRequest(request);
    if (request.projectId)
      next.projectId = request.projectId;
    if (request.navigation)
      next.navigation = request.navigation;
    if (request.worktree) {
      next.worktree = request.worktree;
    }
    return next;
  };
  var clampPromptRequest = (request) => {
    const next = {
      text: request.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
    };
    if (request.send) {
      next.send = true;
    }
    return next;
  };
  var clampBadgeCount = (count) => {
    if (count === null || !Number.isFinite(count))
      return null;
    return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
  };
  var clampFrameHeight = (height) => {
    if (!Number.isFinite(height))
      return 0;
    return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
  };
  var isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\0") && !value.includes("\\");
  var isGuestRequestPath = (value) => {
    if (!value.startsWith("/") || value.includes("\0") || value.includes("\\") || value.includes("://")) {
      return false;
    }
    if (value.length > GUEST_REQUEST_PATH_MAX) {
      return false;
    }
    const segments = value.split("/");
    return !segments.some((segment) => segment === "." || segment === "..");
  };
  var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
  var isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
  var isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
  var isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
  var isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
  var isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
  var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
  var isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
  var isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
  var HOST_PUSH_TYPES = /* @__PURE__ */ new Set([
    "workspace",
    "shells",
    "ready",
    "directory",
    "session",
    "connection",
    "settings",
    "session-lifecycle",
    "item",
    "resolve",
    "action",
    "service-event",
    "status-control-event",
    "popover-closed",
    "file-open",
    "file-snapshot",
    "file-saved",
    "generate-late"
  ]);
  var asWireRecord = (data) => Object(data) === data ? data : null;
  var isNonEmptyString = (value) => String(value) === value && value.length > 0;
  var readResultMessage = (wire) => {
    if (!isNonEmptyString(wire.id))
      return null;
    if (wire.ok === true) {
      const message = {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: true
      };
      if (Object(wire.payload) === wire.payload) {
        message.payload = wire.payload;
      }
      return message;
    }
    if (wire.ok === false && isNonEmptyString(wire.error)) {
      return {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: false,
        error: wire.error,
        code: resolveHostRequestErrorCode(isNonEmptyString(wire.code) ? wire.code : void 0)
      };
    }
    return null;
  };
  var readHostMessage = (data) => {
    const wire = asWireRecord(data);
    if (!wire || wire.channel !== OPENCHAMBER_SDK_CHANNEL || wire.v !== OPENCHAMBER_SDK_API_VERSION)
      return null;
    if (wire.type === "result")
      return readResultMessage(wire);
    if (!HOST_PUSH_TYPES.has(String(wire.type)) || Object(wire.payload) !== wire.payload)
      return null;
    return wire;
  };

  // node_modules/@openchamber/sdk/dist/host.js
  var isKeyEvent = (event) => "key" in event && "metaKey" in event && "ctrlKey" in event;
  var isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
  var HostRequestError = class extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.name = "HostRequestError";
      this.code = code;
    }
  };
  var rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
  var rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
  var deviceStorageScope = (options) => {
    if (options === void 0)
      return void 0;
    if (Object(options) !== options || Array.isArray(options) || options.scope !== void 0 && options.scope !== "instance" && options.scope !== "device") {
      throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
    }
    return options.scope === "device" ? "device" : void 0;
  };
  var nextId = (n) => {
    n.value += 1;
    return `oc-${n.value}`;
  };
  var connectHost = (options = {}) => {
    const target = options.target ?? ("window" in globalThis ? window : null);
    if (!target) {
      throw new HostRequestError("HOST_UNAVAILABLE", "No window. connectHost runs in a browser frame.");
    }
    const acceptSource = options.acceptSource ?? ((source) => source === target.parent);
    const requestTimeoutMs = options.requestTimeoutMs ?? GUEST_REQUEST_TIMEOUT_MS;
    const readyListeners = /* @__PURE__ */ new Set();
    const directoryListeners = /* @__PURE__ */ new Set();
    const sessionListeners = /* @__PURE__ */ new Set();
    const lifecycleListeners = /* @__PURE__ */ new Set();
    const connectionListeners = /* @__PURE__ */ new Set();
    const settingsListeners = /* @__PURE__ */ new Set();
    const itemListeners = /* @__PURE__ */ new Set();
    const blockListeners = /* @__PURE__ */ new Set();
    const serviceEventListeners = /* @__PURE__ */ new Set();
    const statusControlListeners = /* @__PURE__ */ new Set();
    const popoverClosedListeners = /* @__PURE__ */ new Set();
    const lateGenerateListeners = /* @__PURE__ */ new Set();
    const unclaimedLateGenerate = [];
    let resolveHandler = null;
    let actionHandler = null;
    const fileOpenListeners = /* @__PURE__ */ new Set();
    const fileSavedListeners = /* @__PURE__ */ new Set();
    let fileSnapshotHandler = null;
    let lastFile = null;
    let saveShortcutInstalled = false;
    const pending = /* @__PURE__ */ new Map();
    const workspaceListeners = /* @__PURE__ */ new Map();
    const shellsListeners = /* @__PURE__ */ new Map();
    let disposed = false;
    const ids = { value: 0 };
    let lastReady = null;
    let lastLifecycle = null;
    let popoverPointerActive = false;
    let popoverFocusActive = false;
    let popoverActivityReported = null;
    const lifecycleFromSession = (session) => {
      if (!session)
        return null;
      return {
        sessionId: session.id,
        phase: session.busy ? "started" : "completed"
      };
    };
    const post = (message) => {
      target.parent.postMessage(message, "*");
    };
    const listenForLateGenerate = () => {
      if (disposed || target.parent === target || lateGenerateListeners.size === 0 || lastReady?.features?.lateGenerateResults !== true)
        return;
      post({ channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION, type: "generate-late-listen" });
    };
    const emit = (listeners, value) => {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(error);
        }
      }
    };
    const onMessage = (event) => {
      if (!(event instanceof MessageEvent))
        return;
      if (!acceptSource(event.source))
        return;
      const message = readHostMessage(event.data);
      if (!message)
        return;
      if (message.type === "workspace") {
        const listener = workspaceListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "shells") {
        const listener = shellsListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "ready") {
        lastReady = message.payload;
        lastLifecycle = lifecycleFromSession(message.payload.session);
        emit(readyListeners, message.payload);
        emit(directoryListeners, message.payload.directory);
        emit(sessionListeners, message.payload.session);
        if (lastLifecycle) {
          emit(lifecycleListeners, lastLifecycle);
        }
        emit(connectionListeners, message.payload.connection);
        emit(settingsListeners, message.payload.settings);
        emit(itemListeners, message.payload.item);
        if (message.payload.block)
          emit(blockListeners, message.payload.block);
        listenForLateGenerate();
        return;
      }
      if (message.type === "service-event") {
        emit(serviceEventListeners, message.payload);
        return;
      }
      if (message.type === "generate-late") {
        if (lateGenerateListeners.size === 0)
          unclaimedLateGenerate.push(message.payload);
        else
          emit(lateGenerateListeners, message.payload);
        return;
      }
      if (message.type === "directory") {
        if (lastReady) {
          lastReady = { ...lastReady, directory: message.payload.directory };
        }
        emit(directoryListeners, message.payload.directory);
        return;
      }
      if (message.type === "session") {
        if (lastReady) {
          lastReady = { ...lastReady, session: message.payload.session };
        }
        if (!message.payload.session) {
          lastLifecycle = null;
        } else if (lastLifecycle?.sessionId !== message.payload.session.id) {
          lastLifecycle = lifecycleFromSession(message.payload.session);
        }
        emit(sessionListeners, message.payload.session);
        return;
      }
      if (message.type === "session-lifecycle") {
        lastLifecycle = message.payload;
        emit(lifecycleListeners, message.payload);
        return;
      }
      if (message.type === "connection") {
        if (lastReady) {
          lastReady = { ...lastReady, connection: message.payload.connection };
        }
        emit(connectionListeners, message.payload.connection);
        return;
      }
      if (message.type === "settings") {
        if (lastReady) {
          lastReady = { ...lastReady, settings: message.payload.settings };
        }
        emit(settingsListeners, message.payload.settings);
        return;
      }
      if (message.type === "item") {
        if (lastReady) {
          lastReady = { ...lastReady, item: message.payload.item };
        }
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "status-control-event") {
        emit(statusControlListeners, message.payload);
        return;
      }
      if (message.type === "popover-closed") {
        emit(popoverClosedListeners, message.payload);
        return;
      }
      if (message.type === "action") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "action-result",
              id: message.id,
              payload
            });
        };
        const handler = actionHandler;
        if (!handler) {
          answer({ ok: false, error: "This extension does not handle background actions." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then(() => answer({ ok: true }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ ok: false, error: (text || "Action failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      if (message.type === "file-open") {
        const next = message.payload;
        if (lastFile && sameFileEditorDocument(lastFile, next))
          return;
        lastFile = next;
        emit(fileOpenListeners, message.payload);
        return;
      }
      if (message.type === "file-saved") {
        emit(fileSavedListeners, message.payload.version);
        return;
      }
      if (message.type === "file-snapshot") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "file-snapshot-result",
              id: message.id,
              payload
            });
        };
        const fail = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        const handler = fileSnapshotHandler;
        if (!handler) {
          fail("This extension does not edit files.");
          return;
        }
        Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
          if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
            fail(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
            return;
          }
          if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
            fail(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
            return;
          }
          answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
        }, (error) => fail(error instanceof Error ? error.message : String(error)));
        return;
      }
      if (message.type === "resolve") {
        const answer = (payload) => {
          post({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "resolve-result",
            id: message.id,
            payload
          });
        };
        const handler = resolveHandler;
        if (!handler) {
          answer({ error: "This extension does not resolve commands." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then((item) => answer({ item: item ? clampAttachRequest(item) : null }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ error: (text || "Command failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter)
        return;
      clearTimeout(waiter.timer);
      pending.delete(message.id);
      if (message.ok) {
        waiter.resolve(message.payload);
        return;
      }
      waiter.reject(new HostRequestError(message.code, message.error));
    };
    target.addEventListener("message", onMessage);
    post({
      channel: OPENCHAMBER_SDK_CHANNEL,
      v: OPENCHAMBER_SDK_API_VERSION,
      type: "hello"
    });
    const send = (message, timeoutMs = requestTimeoutMs) => {
      if (disposed || target.parent === target) {
        return Promise.reject(new HostRequestError("HOST_UNAVAILABLE", "No host frame. This page is not in an iframe."));
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(message.id);
          reject(new HostRequestError("HOST_TIMEOUT", "Host did not answer in time."));
        }, timeoutMs);
        pending.set(message.id, { resolve, reject, timer });
        post(message);
      });
    };
    const request = (message) => send(message).then(() => void 0);
    const envelope = { channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION };
    const notify = (message) => {
      if (!disposed && target.parent !== target)
        post(message);
    };
    const requestFileSave = () => notify({ ...envelope, type: "file-save" });
    const onSaveShortcut = (event) => {
      if (!isKeyEvent(event) || !isSaveShortcut(event))
        return;
      event.preventDefault();
      requestFileSave();
    };
    const onPopoverEscape = (event) => {
      if (!isKeyEvent(event) || event.key !== "Escape" || lastReady?.surface !== "popover" || !lastReady.popover)
        return;
      event.preventDefault();
      void closePopover(lastReady.popover.id, "escape").catch(() => void 0);
    };
    const reportPopoverActivity = () => {
      const popover = lastReady?.surface === "popover" ? lastReady.popover : void 0;
      if (!popover)
        return;
      const active2 = popoverPointerActive || popoverFocusActive;
      if (popoverActivityReported === active2)
        return;
      popoverActivityReported = active2;
      void setPopoverAnchorActive(popover.id, active2).catch(() => void 0);
    };
    const onPopoverPointerOver = () => {
      if (lastReady?.surface !== "popover" || popoverPointerActive)
        return;
      popoverPointerActive = true;
      reportPopoverActivity();
    };
    const onPopoverPointerOut = (event) => {
      if (lastReady?.surface !== "popover" || event.relatedTarget !== null || !popoverPointerActive)
        return;
      popoverPointerActive = false;
      reportPopoverActivity();
    };
    const onPopoverFocus = () => {
      if (lastReady?.surface !== "popover" || popoverFocusActive)
        return;
      popoverFocusActive = true;
      reportPopoverActivity();
    };
    const onPopoverBlur = () => {
      if (lastReady?.surface !== "popover" || !popoverFocusActive)
        return;
      popoverFocusActive = false;
      reportPopoverActivity();
    };
    const requireIdentity = (value, maximum = 1024) => {
      if (!value.trim() || value.length > maximum)
        throw new HostRequestError("HOST_REJECTED", `Identity must contain 1 to ${maximum} characters.`);
    };
    const readWorkspace = async (query) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const result = await send({ ...envelope, type: "workspace-read", id: nextId(ids), payload: query });
      if (!result || !("kind" in result) || !("state" in result) || result.kind !== query.kind) {
        throw new HostRequestError("HOST_REJECTED", "Host did not return workspace data.");
      }
      return result;
    };
    const subscribeWorkspace = async (query, listener) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const subscriptionId = nextId(ids);
      workspaceListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
      } catch (error) {
        workspaceListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!workspaceListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const subscribeShells = async (scope, listener) => {
      if (scope.kind === "session")
        requireIdentity(scope.sessionId);
      if (scope.kind === "project")
        requireIdentity(scope.projectId);
      const subscriptionId = nextId(ids);
      shellsListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
      } catch (error) {
        shellsListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!shellsListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const storage = async (payload) => {
      if ("key" in payload && (payload.key.length === 0 || payload.key.length > GUEST_STORAGE_KEY_MAX)) {
        throw new HostRequestError("HOST_REJECTED", "Storage key must contain 1 to 128 characters.");
      }
      if (payload.op === "set" && !isJsonValue(payload.value)) {
        throw new HostRequestError("HOST_REJECTED", "Storage values must be JSON.");
      }
      if (payload.op === "set" && new TextEncoder().encode(JSON.stringify(payload.value)).length > GUEST_STORAGE_VALUE_BYTES) {
        throw new HostRequestError("HOST_REJECTED", "Storage value exceeds 64 KiB.");
      }
      if (payload.scope === "device" && lastReady?.features?.deviceStorage !== true) {
        throw new HostRequestError("UNSUPPORTED", "This host does not support device storage.");
      }
      const result = await send({ ...envelope, type: "storage", id: nextId(ids), payload });
      if (!result || !("storage" in result) || result.op !== payload.op)
        throw new HostRequestError("HOST_REJECTED", "Host did not return storage data.");
      return result;
    };
    const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
    const setPopoverAnchorActive = (id, active2) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active: active2 } });
    target.addEventListener("keydown", onPopoverEscape, true);
    target.addEventListener("pointerover", onPopoverPointerOver);
    target.addEventListener("pointermove", onPopoverPointerOver);
    target.addEventListener("pointerout", onPopoverPointerOut);
    target.addEventListener("focus", onPopoverFocus);
    target.addEventListener("blur", onPopoverBlur);
    return {
      onAction: (handler) => {
        actionHandler = handler;
        return () => {
          if (actionHandler === handler)
            actionHandler = null;
        };
      },
      listProjects: async () => {
        const result = await readWorkspace({ kind: "projects" });
        if (result.kind !== "projects")
          throw new HostRequestError("HOST_REJECTED", "Expected projects.");
        return result;
      },
      listWorktrees: async (projectId) => {
        const result = await readWorkspace({ kind: "worktrees", projectId });
        if (result.kind !== "worktrees")
          throw new HostRequestError("HOST_REJECTED", "Expected worktrees.");
        return result;
      },
      listSessions: async (projectId) => {
        const result = await readWorkspace({ kind: "sessions", projectId });
        if (result.kind !== "sessions")
          throw new HostRequestError("HOST_REJECTED", "Expected sessions.");
        return result;
      },
      onProjects: (listener) => subscribeWorkspace({ kind: "projects" }, (snapshot) => {
        if (snapshot.kind === "projects")
          listener(snapshot);
      }),
      onWorktrees: (projectId, listener) => subscribeWorkspace({ kind: "worktrees", projectId }, (snapshot) => {
        if (snapshot.kind === "worktrees")
          listener(snapshot);
      }),
      onSessions: (projectId, listener) => subscribeWorkspace({ kind: "sessions", projectId }, (snapshot) => {
        if (snapshot.kind === "sessions")
          listener(snapshot);
      }),
      onRunningShells: (scope, listener) => subscribeShells(scope, listener),
      readShellOutput: async (shellId, options2) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const cursor = options2?.cursor;
        if (cursor !== void 0 && (!Number.isInteger(cursor) || cursor < 0)) {
          throw new HostRequestError("HOST_REJECTED", "Shell output cursor must be a non-negative integer.");
        }
        const tailBytes = options2?.tailBytes;
        if (tailBytes !== void 0 && (!Number.isInteger(tailBytes) || tailBytes < 1 || tailBytes > GUEST_SHELL_OUTPUT_TAIL_MAX)) {
          throw new HostRequestError("HOST_REJECTED", `Shell output tailBytes must be an integer between 1 and ${GUEST_SHELL_OUTPUT_TAIL_MAX}.`);
        }
        const result = await send({ ...envelope, type: "shell-output", id: nextId(ids), payload: { shellId, cursor, tailBytes } });
        const output = result;
        if (!output || typeof output.output !== "string" || !Number.isFinite(output.cursor)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return shell output.");
        }
        return output;
      },
      stopShell: async (shellId) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const result = await send({ ...envelope, type: "shell-stop", id: nextId(ids), payload: { shellId } });
        if (result?.stopped !== true)
          throw new HostRequestError("HOST_REJECTED", "Host did not stop the shell.");
        return { stopped: true };
      },
      openSession: async (sessionId) => {
        requireIdentity(sessionId);
        await request({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
      },
      storage: {
        get: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "get", key };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          return result.op === "get" && result.found ? result.value : void 0;
        },
        set: async (key, value, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "set", key, value };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        delete: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "delete", key };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        keys: async (options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "keys" };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          if (result.op !== "keys")
            throw new HostRequestError("HOST_REJECTED", "Expected storage keys.");
          return result.keys;
        }
      },
      onReady: (listener) => {
        readyListeners.add(listener);
        if (lastReady)
          listener(lastReady);
        return () => {
          readyListeners.delete(listener);
        };
      },
      onDirectory: (listener) => {
        directoryListeners.add(listener);
        if (lastReady)
          listener(lastReady.directory);
        return () => {
          directoryListeners.delete(listener);
        };
      },
      onSession: (listener) => {
        sessionListeners.add(listener);
        if (lastReady)
          listener(lastReady.session);
        return () => {
          sessionListeners.delete(listener);
        };
      },
      onSessionLifecycle: (listener) => {
        lifecycleListeners.add(listener);
        if (lastLifecycle)
          listener(lastLifecycle);
        return () => {
          lifecycleListeners.delete(listener);
        };
      },
      onConnection: (listener) => {
        connectionListeners.add(listener);
        if (lastReady)
          listener(lastReady.connection);
        return () => {
          connectionListeners.delete(listener);
        };
      },
      onSettings: (listener) => {
        settingsListeners.add(listener);
        if (lastReady)
          listener(lastReady.settings);
        return () => {
          settingsListeners.delete(listener);
        };
      },
      onItem: (listener) => {
        itemListeners.add(listener);
        if (lastReady)
          listener(lastReady.item);
        return () => {
          itemListeners.delete(listener);
        };
      },
      onBlock: (listener) => {
        blockListeners.add(listener);
        if (lastReady?.block)
          listener(lastReady.block);
        return () => {
          blockListeners.delete(listener);
        };
      },
      onServiceEvent: (listener) => {
        serviceEventListeners.add(listener);
        return () => {
          serviceEventListeners.delete(listener);
        };
      },
      onStatusControl: (listener) => {
        statusControlListeners.add(listener);
        return () => {
          statusControlListeners.delete(listener);
        };
      },
      onPopoverClosed: (listener) => {
        popoverClosedListeners.add(listener);
        return () => {
          popoverClosedListeners.delete(listener);
        };
      },
      setStatusControls: (controls) => {
        if (lastReady?.features?.statusControls !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support status controls."));
        }
        if (!isGuestStatusControls(controls)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Status controls must have unique bounded ids and valid selected options."));
        }
        return request({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
      },
      openPopover: (payload) => {
        if (lastReady?.features?.popovers !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
        }
        if (!isGuestPopoverRequest(payload)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
        }
        return request({ ...envelope, type: "popover-open", id: nextId(ids), payload });
      },
      closePopover,
      setPopoverAnchorActive,
      onResolve: (handler) => {
        resolveHandler = handler;
        return () => {
          if (resolveHandler === handler)
            resolveHandler = null;
        };
      },
      toast: (payload) => {
        const message = payload.message.trim();
        if (!message || message.length > GUEST_TOAST_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast message must contain 1 to ${GUEST_TOAST_MAX} characters.`));
        }
        if (payload.copy && payload.copy !== true && (!payload.copy.text.length || payload.copy.text.length > GUEST_CLIPBOARD_TEXT_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast copy text must contain 1 to ${GUEST_CLIPBOARD_TEXT_MAX} characters.`));
        }
        return request({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "toast",
          id: nextId(ids),
          payload: { ...payload, message }
        });
      },
      openUrl: (url) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-url",
        id: nextId(ids),
        payload: { url }
      }),
      openCommit: (sha) => isGuestCommitSha(sha) ? request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-commit",
        id: nextId(ids),
        payload: { sha }
      }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
      answerBlock: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "block-answer",
        id: nextId(ids),
        payload: { text: text.trim().slice(0, GUEST_BLOCK_ANSWER_MAX) }
      }),
      openSurface: (surfaceId) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-surface",
        id: nextId(ids),
        payload: { surfaceId }
      }),
      writeClipboard: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "clipboard-write",
        id: nextId(ids),
        payload: { text }
      }),
      compose: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "compose",
        id: nextId(ids),
        payload
      }),
      attach: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "attach",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      startSession: async (payload) => {
        if (payload.projectId !== void 0)
          requireIdentity(payload.projectId);
        const worktree = payload.worktree;
        if (worktree && worktree !== true) {
          if (worktree.kind === "existing")
            requireIdentity(worktree.directory);
          else {
            if (worktree.name !== void 0)
              requireIdentity(worktree.name, 200);
            if (worktree.baseBranch !== void 0)
              requireIdentity(worktree.baseBranch, 200);
          }
        }
        const result = await send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "start-session",
          id: nextId(ids),
          payload: clampStartSessionRequest(payload)
        }, options.requestTimeoutMs ?? 18e4);
        if (!isStartSessionResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a session.");
        }
        return result;
      },
      prompt: (payload) => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "prompt",
        id: nextId(ids),
        payload: clampPromptRequest(payload)
      }).then((result) => {
        if (!isPromptResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a prompt result.");
        }
        return result;
      }),
      sessionLink: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "session-link",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      close: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "close",
        id: nextId(ids)
      }),
      oauthStart: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-start",
        id: nextId(ids)
      }),
      oauthDisconnect: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-disconnect",
        id: nextId(ids)
      }),
      request: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host request result was empty.");
        }
        return result;
      }),
      serviceRequest: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host service request result was empty.");
        }
        return result;
      }),
      serviceStatus: () => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-status",
        id: nextId(ids)
      }).then((result) => {
        if (!isServiceStatusResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return service status.");
        }
        return result;
      }),
      readFile: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-read",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileReadResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file content.");
        }
        return result;
      }),
      writeFile: (path, content) => {
        if (!isGuestFilePath(path)) {
          return rejectBadFilePath();
        }
        if (content.length > GUEST_FILE_CONTENT_MAX) {
          return Promise.reject(new HostRequestError("FILE_TOO_LARGE", `Content is over ${GUEST_FILE_CONTENT_MAX} characters.`));
        }
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "file-write",
          id: nextId(ids),
          payload: { path, content }
        }).then((result) => {
          if (!isFileWriteResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not confirm the write.");
          }
          return result;
        });
      },
      listDir: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-list",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileListResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return directory entries.");
        }
        return result;
      }),
      stat: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-stat",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileStatResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file status.");
        }
        return result;
      }),
      generate: (input2) => {
        const prompt = input2.prompt.trim();
        const system = input2.system?.trim();
        if (prompt.length === 0 || prompt.length > GUEST_GENERATE_PROMPT_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Prompt must be 1 to ${GUEST_GENERATE_PROMPT_MAX} characters.`));
        }
        if (system !== void 0 && (system.length === 0 || system.length > GUEST_GENERATE_SYSTEM_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `System prompt must be 1 to ${GUEST_GENERATE_SYSTEM_MAX} characters.`));
        }
        const maxOutputTokens = input2.maxOutputTokens === void 0 ? void 0 : Math.min(GUEST_GENERATE_OUTPUT_TOKENS_MAX, Math.max(1, Math.floor(input2.maxOutputTokens)));
        if (maxOutputTokens !== void 0 && !Number.isFinite(maxOutputTokens)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "maxOutputTokens must be a number."));
        }
        const payload = { prompt };
        if (system !== void 0)
          payload.system = system;
        if (maxOutputTokens !== void 0)
          payload.maxOutputTokens = maxOutputTokens;
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "generate",
          id: nextId(ids),
          payload
        }, options.requestTimeoutMs ?? GUEST_GENERATE_TIMEOUT_MS).then((result) => {
          if (!isGenerateResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not return generated text.");
          }
          return result;
        });
      },
      onLateGenerateResult: (listener) => {
        lateGenerateListeners.add(listener);
        for (const result of unclaimedLateGenerate.splice(0))
          emit([listener], result);
        listenForLateGenerate();
        return () => {
          lateGenerateListeners.delete(listener);
        };
      },
      setBadge: (count) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "badge",
        id: nextId(ids),
        payload: { count: clampBadgeCount(count) }
      }),
      setHeight: (height) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "resize",
        id: nextId(ids),
        payload: { height: clampFrameHeight(height) }
      }),
      onFileOpen: (listener) => {
        fileOpenListeners.add(listener);
        if (!saveShortcutInstalled) {
          saveShortcutInstalled = true;
          target.addEventListener("keydown", onSaveShortcut, true);
        }
        if (lastFile)
          listener(lastFile);
        return () => {
          fileOpenListeners.delete(listener);
        };
      },
      onFileSnapshot: (handler) => {
        fileSnapshotHandler = handler;
        return () => {
          if (fileSnapshotHandler === handler)
            fileSnapshotHandler = null;
        };
      },
      onFileSaved: (listener) => {
        fileSavedListeners.add(listener);
        return () => {
          fileSavedListeners.delete(listener);
        };
      },
      reportFileChange: (change) => notify({ ...envelope, type: "file-change", payload: { dirty: change.dirty, edited: change.edited } }),
      requestFileSave,
      reportFileUnsupported: () => notify({ ...envelope, type: "file-unsupported" }),
      dispose: () => {
        for (const subscriptionId of workspaceListeners.keys()) {
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        workspaceListeners.clear();
        for (const subscriptionId of shellsListeners.keys()) {
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        shellsListeners.clear();
        disposed = true;
        resolveHandler = null;
        actionHandler = null;
        fileSnapshotHandler = null;
        fileOpenListeners.clear();
        fileSavedListeners.clear();
        if (saveShortcutInstalled)
          target.removeEventListener("keydown", onSaveShortcut, true);
        target.removeEventListener("message", onMessage);
        target.removeEventListener("keydown", onPopoverEscape, true);
        target.removeEventListener("pointerover", onPopoverPointerOver);
        target.removeEventListener("pointermove", onPopoverPointerOver);
        target.removeEventListener("pointerout", onPopoverPointerOut);
        target.removeEventListener("focus", onPopoverFocus);
        target.removeEventListener("blur", onPopoverBlur);
        for (const waiter of pending.values()) {
          clearTimeout(waiter.timer);
          waiter.reject(new HostRequestError("HOST_UNAVAILABLE", "Host client was disposed."));
        }
        pending.clear();
        readyListeners.clear();
        directoryListeners.clear();
        sessionListeners.clear();
        lifecycleListeners.clear();
        connectionListeners.clear();
        settingsListeners.clear();
        itemListeners.clear();
        blockListeners.clear();
        serviceEventListeners.clear();
        statusControlListeners.clear();
        popoverClosedListeners.clear();
        lateGenerateListeners.clear();
        unclaimedLateGenerate.length = 0;
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/service-providers.js
  var BROWSER_CONTROL_ACTIONS = [
    "browser.open",
    "browser.snapshot",
    "browser.click",
    "browser.type",
    "browser.select",
    "browser.scroll",
    "browser.back",
    "browser.forward",
    "browser.inspect",
    "browser.capture",
    "browser.resize",
    "browser.close"
  ];
  var BROWSER_PROVIDER_IDLE_MS = 10 * 6e4;
  var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
  var SOURCE_CONTROL_PROVIDER_IDLE_MS = 10 * 6e4;
  var NOTIFICATIONS_PROVIDER_IDLE_MS = 10 * 6e4;
  var TRACKER_PROVIDER_IDLE_MS = 10 * 6e4;
  var QUOTA_PROVIDER_IDLE_MS = 10 * 6e4;

  // node_modules/@openchamber/sdk/dist/service-surface.js
  var SURFACE_CONTROLLERS = ["none", "agent", "user"];
  var CONTROLLERS = new Set(SURFACE_CONTROLLERS);

  // node_modules/@openchamber/sdk/dist/ui/theme.js
  var TOKEN_VARS = [
    ["--oc-bg", "background"],
    ["--oc-elevated", "elevated"],
    ["--oc-fg", "foreground"],
    ["--oc-muted", "muted"],
    ["--oc-subtle", "subtle"],
    ["--oc-border", "border"],
    ["--oc-hover", "hover"],
    ["--oc-selection", "selection"],
    ["--oc-focus", "focus"],
    ["--oc-primary", "primary"],
    ["--oc-muted-surface", "mutedSurface"],
    ["--oc-elevated-fg", "elevatedForeground"],
    ["--oc-active", "active"],
    ["--oc-selection-fg", "selectionForeground"],
    ["--oc-primary-fg", "primaryForeground"],
    ["--oc-primary-text", "primaryText"],
    ["--oc-success-text", "successText"],
    ["--oc-warning-text", "warningText"],
    ["--oc-error-text", "errorText"],
    ["--oc-info-text", "infoText"],
    ["--oc-success", "success"],
    ["--oc-warning", "warning"],
    ["--oc-error", "error"],
    ["--oc-info", "info"],
    ["--oc-font", "font"],
    ["--oc-mono", "mono"],
    ["--oc-radius", "radius"],
    ["--surface-background", "background"],
    ["--surface-elevated", "elevated"],
    ["--surface-foreground", "foreground"],
    ["--surface-muted-foreground", "muted"],
    ["--surface-subtle", "subtle"],
    ["--interactive-border", "border"],
    ["--interactive-hover", "hover"],
    ["--interactive-selection", "selection"],
    ["--interactive-focus-ring", "focus"],
    ["--primary", "primary"],
    ["--surface-muted", "mutedSurface"],
    ["--surface-elevated-foreground", "elevatedForeground"],
    ["--interactive-active", "active"],
    ["--interactive-selection-foreground", "selectionForeground"],
    ["--primary-foreground", "primaryForeground"],
    ["--primary-text", "primaryText"],
    ["--success-text", "successText"],
    ["--warning-text", "warningText"],
    ["--error-text", "errorText"],
    ["--info-text", "infoText"],
    ["--status-success", "success"],
    ["--status-warning", "warning"],
    ["--status-error", "error"],
    ["--status-info", "info"],
    ["--font-sans", "font"],
    ["--font-mono", "mono"],
    ["--radius", "radius"]
  ];
  var SYNTAX_TOKEN_VARS = [
    ["--oc-syntax-keyword", "--syntax-keyword", "syntaxKeyword"],
    ["--oc-syntax-string", "--syntax-string", "syntaxString"],
    ["--oc-syntax-number", "--syntax-number", "syntaxNumber"],
    ["--oc-syntax-function", "--syntax-function", "syntaxFunction"],
    ["--oc-syntax-type", "--syntax-type", "syntaxType"],
    ["--oc-syntax-comment", "--syntax-comment", "syntaxComment"],
    ["--oc-syntax-variable", "--syntax-variable", "syntaxVariable"],
    ["--oc-syntax-operator", "--syntax-operator", "syntaxOperator"]
  ];
  var applyHostTheme = (theme, root2) => {
    root2.style.colorScheme = theme.mode;
    for (const [name, key] of TOKEN_VARS) {
      root2.style.setProperty(name, theme.tokens[key]);
    }
    for (const [alias, hostName, key] of SYNTAX_TOKEN_VARS) {
      const value = theme.tokens[key] ?? "";
      root2.style.setProperty(alias, value);
      root2.style.setProperty(hostName, value);
    }
    root2.style.setProperty("font-family", theme.tokens.font);
    root2.style.setProperty("font-size", "0.875rem");
    root2.style.setProperty("line-height", "1.45");
    root2.style.setProperty("color", theme.tokens.foreground);
  };
  var applyHostReady = (ctx, root2) => {
    applyHostTheme(ctx.theme, root2);
    if (root2.dataset) {
      root2.dataset.ocSurface = ctx.surface;
      root2.dataset.ocTheme = ctx.theme.mode;
    }
  };

  // node_modules/@openchamber/sdk/dist/ui/style.js
  var OC_ALIAS = {
    "surface-background": "bg",
    "surface-elevated": "elevated",
    "surface-elevated-foreground": "elevated-fg",
    "surface-foreground": "fg",
    "surface-muted-foreground": "muted",
    "surface-muted": "muted-surface",
    "surface-subtle": "subtle",
    "interactive-border": "border",
    "interactive-hover": "hover",
    "interactive-active": "active",
    "interactive-selection": "selection",
    "interactive-selection-foreground": "selection-fg",
    "interactive-focus-ring": "focus",
    "primary": "primary",
    "primary-foreground": "primary-fg",
    "primary-text": "primary-text",
    "success-text": "success-text",
    "warning-text": "warning-text",
    "error-text": "error-text",
    "info-text": "info-text",
    "status-success": "success",
    "status-warning": "warning",
    "status-error": "error",
    "status-info": "info",
    "font-sans": "font",
    "font-mono": "mono",
    "radius": "radius"
  };
  var v = (name, fallback) => `var(--${name}, var(--oc-${OC_ALIAS[name]}, ${fallback}))`;
  var bg = v("surface-background", "transparent");
  var elevated = v("surface-elevated", "transparent");
  var elevatedFg = v("surface-elevated-foreground", "inherit");
  var fg = v("surface-foreground", "inherit");
  var muted = v("surface-muted-foreground", "gray");
  var secondary = v("surface-muted", "transparent");
  var border = v("interactive-border", "currentColor");
  var hover = v("interactive-hover", "transparent");
  var active = v("interactive-active", "transparent");
  var selection = v("interactive-selection", "transparent");
  var selectionFg = v("interactive-selection-foreground", "inherit");
  var primary = v("primary", "currentColor");
  var primaryText = v("primary-text", "inherit");
  var errorText = v("error-text", "inherit");
  var font = v("font-sans", "inherit");
  var mono = v("font-mono", "monospace");
  var radius = v("radius", "9px");
  var controlRadius = `calc(${radius} - 2px)`;
  var smallRadius = `calc(${radius} - 4px)`;
  var mix = (color, pct, base = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  var focusFill = `background-image: linear-gradient(${hover}, ${hover});`;
  var field = (edge, width = "0.5px") => `box-shadow: inset 0 0 0 ${width} ${edge}, var(--oc-sdk-field-lift);`;
  var raised = "border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);";
  var litButton = "box-shadow: var(--oc-sdk-lit);";
  var darkLift = `inset 0 0.5px 0 0 ${mix(fg, 8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`;
  var THEME_VARS = `
:root {
  --oc-sdk-edge: ${mix(fg, 16)};
  --oc-sdk-field-bg: ${elevated};
  --oc-sdk-raised-bg: ${bg};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${mix(fg, 14)};
  --oc-sdk-field-bg: ${mix(bg, 50, elevated)};
  --oc-sdk-raised-bg: ${elevated};
  --oc-sdk-field-lift: ${darkLift};
  --oc-sdk-raised-lift: ${darkLift};
  --oc-sdk-lit: ${darkLift};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`;
  var tone = (name) => {
    const color = v(`status-${name}`, "currentColor");
    return `
.oc-sdk[data-tone="${name}"], .oc-sdk [data-tone="${name}"] { --oc-sdk-tone: ${color}; --oc-sdk-tone-text: ${v(`${name}-text`, "inherit")}; }`;
  };
  var UI_SIZE_CSS = `
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: 6px; height: 28px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: 4px; height: 24px; padding: 0 8px; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: 8px 10px; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 28px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: 14px; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }
.oc-sdk-progress-value { display: inline-flex; align-items: center; gap: 2px; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { font-weight: 600; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; }
`;
  var GUEST_UI_LOOK_CSS = `${THEME_VARS}
.oc-sdk { color: ${fg}; font-family: ${font}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${focusFill} }
.oc-sdk-mono { font-family: ${mono}; }
.oc-sdk-muted { color: ${muted}; }
${tone("success")}${tone("warning")}${tone("error")}${tone("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${primary}; --oc-sdk-tone-text: ${primaryText}; }

.oc-sdk-btn { border-radius: ${controlRadius}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${smallRadius}; }
.oc-sdk-btn[data-variant="default"] { color: ${primaryText}; background: ${mix(primary, 10, bg)}; border-color: ${mix(primary, 12)}; ${litButton} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${mix(primary, 16, bg)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${mix(primary, 22, bg)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${secondary}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${active}, ${active}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${hover}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${active}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${v("status-error", "red")}; color: ${errorText}; background: ${mix("var(--oc-sdk-tone)", 7, bg)}; border-color: ${mix("var(--oc-sdk-tone)", 12)}; ${litButton} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${mix("var(--oc-sdk-tone)", 9, bg)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${mix("var(--oc-sdk-tone)", 11, bg)}; box-shadow: none; }

.oc-sdk-field-note { color: ${muted}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${errorText}; }
.oc-sdk-input { border-radius: ${controlRadius}; background: var(--oc-sdk-field-bg); color: ${elevatedFg}; ${field("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${muted}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${field(mix(fg, 26), "1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${field(v("status-error", "red"), "1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${mono}; }

.oc-sdk-search-icon { color: ${muted}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${primary}; }
.oc-sdk-search-clear { border-radius: ${smallRadius}; color: ${muted}; }
.oc-sdk-search-clear:hover { background: ${hover}; color: ${fg}; }

.oc-sdk-trigger { border-radius: ${controlRadius}; background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${muted}; }
.oc-sdk-trigger-chevron { color: ${muted}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${elevatedFg}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${elevated}; background-clip: padding-box; color: ${elevatedFg}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${hover}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-option-check { color: ${fg}; }
.oc-sdk-option[data-destructive="true"] { color: ${errorText}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${mix(v("status-error", "red"), 10)}; }
.oc-sdk-option-hint { color: ${muted}; }
.oc-sdk-popup-empty { color: ${muted}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${border}; border-radius: 4px; color: ${fg}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${mix(fg, 60, border)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${border}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${bg}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${primary}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${focusFill} }
.oc-sdk-check-desc { color: ${muted}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${mix(fg, 4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${muted}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${fg}; }
.oc-sdk-tab[aria-selected="true"] { color: ${selectionFg}; background: ${selection}; border-color: ${border}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${elevatedFg}; background: var(--oc-sdk-raised-bg); ${raised} }
.oc-sdk-tab-count { color: ${muted}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${mix(fg, 6)}; color: ${muted}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${mix("var(--oc-sdk-tone)", 15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${hover}; }
.oc-sdk-row[aria-selected="true"] { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-row-lead { font-family: ${mono}; color: ${muted}; }
.oc-sdk-row-sub { color: ${muted}; }
.oc-sdk-row-meta { color: ${muted}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${muted}; }

.oc-sdk-empty-body { color: ${muted}; }

.oc-sdk-spinner { color: ${muted}; }
.oc-sdk-spinner-ring { border-color: ${border}; border-top-color: ${primary}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${mix("var(--oc-sdk-tone)", 10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${muted}; }

.oc-sdk-separator { color: ${muted}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${mix(border, 40)}; }

.oc-sdk-progress-label { color: ${muted}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${mix(fg, 6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${primary}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${v("status-success", "currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${v("success-text", "inherit")}; }

.oc-sdk-text a { color: ${primaryText}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${mix(border, 60)}; }
`;
  var UI_CSS = `
${GUEST_SCROLLBAR_CSS}
${UI_SIZE_CSS}
${GUEST_UI_LOOK_CSS}`;

  // node_modules/@openchamber/sdk/dist/ui/dom.js
  var STYLE_ID = "oc-sdk-ui-style";
  var clearNode = (node) => {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  };
  var ensureStyle = (css) => {
    const existing = document.getElementById(STYLE_ID);
    if (existing instanceof HTMLStyleElement) {
      if (existing.textContent !== css) {
        existing.textContent = css;
      }
      return;
    }
    installGuestScrollbarActivity(document);
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  };
  var el = (tag, className) => {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  };
  var button = (className) => {
    const node = el("button", className);
    node.type = "button";
    return node;
  };
  var setText = (node, text) => {
    const next = text ?? "";
    if (node.textContent !== next) {
      node.textContent = next;
    }
  };
  var setAttr = (node, name, value) => {
    if (value === void 0 || value === null || value === "") {
      node.removeAttribute(name);
    } else if (node.getAttribute(name) !== value) {
      node.setAttribute(name, value);
    }
  };
  var onOutsideClick = (node, handler) => {
    const listener = (event) => {
      if (event.target instanceof Node && node.contains(event.target)) {
        return;
      }
      handler();
    };
    document.addEventListener("pointerdown", listener, true);
    return () => {
      document.removeEventListener("pointerdown", listener, true);
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/button.js
  var ring = () => {
    const spinner = document.createElement("span");
    spinner.className = "oc-sdk-spinner-ring";
    spinner.setAttribute("aria-hidden", "true");
    return spinner;
  };
  var mountButton = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const node = button("oc-sdk oc-sdk-btn");
    const spinner = ring();
    const label = document.createElement("span");
    node.append(label);
    root2.append(node);
    const paint = () => {
      node.dataset.variant = props.variant ?? "default";
      node.dataset.size = props.size ?? "default";
      node.disabled = Boolean(props.disabled) || Boolean(props.loading);
      node.dataset.loading = props.loading ? "true" : "false";
      node.setAttribute("aria-busy", props.loading ? "true" : "false");
      if (props.loading && spinner.parentNode !== node) {
        node.prepend(spinner);
      } else if (!props.loading && spinner.parentNode === node) {
        spinner.remove();
      }
      setText(label, props.label);
    };
    const onClick = () => {
      if (props.disabled || props.loading) {
        return;
      }
      props.onClick();
    };
    node.addEventListener("click", onClick);
    paint();
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        node.removeEventListener("click", onClick);
        node.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/icons.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  var ICON_PATH = {
    search: "M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z",
    chevron: "M12 13.172l4.95-4.95 1.414 1.414L12 16 5.636 9.636 7.05 8.222z",
    check: "M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z",
    close: "M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"
  };
  var icon = (name, size, className) => {
    const node = document.createElementNS(SVG_NS, "svg");
    node.setAttribute("viewBox", "0 0 24 24");
    node.setAttribute("width", String(size));
    node.setAttribute("height", String(size));
    node.setAttribute("aria-hidden", "true");
    node.setAttribute("fill", "currentColor");
    if (className) {
      node.setAttribute("class", className);
    }
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", ICON_PATH[name]);
    node.append(path);
    return node;
  };

  // node_modules/@openchamber/sdk/dist/ui/search.js
  var mountSearchField = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const wrap = el("div", "oc-sdk oc-sdk-search");
    const input2 = el("input", "oc-sdk-input");
    input2.type = "text";
    input2.spellcheck = false;
    input2.autocomplete = "off";
    input2.setAttribute("role", "searchbox");
    const clear2 = button("oc-sdk-search-clear");
    clear2.append(icon("close", 14));
    clear2.tabIndex = -1;
    wrap.append(icon("search", 16, "oc-sdk-search-icon"), input2, clear2);
    root2.append(wrap);
    const paint = () => {
      const placeholder = props.placeholder ?? "Search";
      setAttr(input2, "placeholder", placeholder);
      input2.setAttribute("aria-label", props.label ?? placeholder);
      clear2.setAttribute("aria-label", "Clear search");
      if (input2.value !== props.value) {
        input2.value = props.value;
      }
      wrap.dataset.active = props.value.trim() === "" ? "false" : "true";
    };
    const clearValue = () => {
      if (props.value !== "") {
        props.onChange("");
      }
      input2.focus();
    };
    const onInput = () => {
      props.onChange(input2.value);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape" && input2.value !== "") {
        event.preventDefault();
        clearValue();
      }
    };
    input2.addEventListener("input", onInput);
    input2.addEventListener("keydown", onKeyDown);
    clear2.addEventListener("click", clearValue);
    paint();
    if (props.autofocus) {
      input2.focus();
    }
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        input2.removeEventListener("input", onInput);
        input2.removeEventListener("keydown", onKeyDown);
        clear2.removeEventListener("click", clearValue);
        wrap.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/navigation.js
  var navigationKey = (event, axis = "vertical") => {
    const [next, previous] = axis === "vertical" ? ["ArrowDown", "ArrowUp"] : ["ArrowRight", "ArrowLeft"];
    if (event.key === next || event.ctrlKey && event.key.toLowerCase() === "n")
      return "next";
    if (event.key === previous || event.ctrlKey && event.key.toLowerCase() === "p")
      return "previous";
    if (event.key === "Home")
      return "first";
    if (event.key === "End")
      return "last";
    return null;
  };
  var moveListSelection = (items, currentId, key) => {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) {
      return null;
    }
    const first = enabled[0];
    const last = enabled[enabled.length - 1];
    if (key === "first" || !first || !last) {
      return first?.id ?? null;
    }
    if (key === "last") {
      return last.id;
    }
    const index = enabled.findIndex((item) => item.id === currentId);
    if (index === -1) {
      return key === "next" ? first.id : last.id;
    }
    const target = enabled[Math.min(enabled.length - 1, Math.max(0, index + (key === "next" ? 1 : -1)))];
    return target?.id ?? null;
  };

  // node_modules/@openchamber/sdk/dist/ui/option.js
  var optionId = (uid, id) => `${uid}-${id ?? ""}`;
  var createOption = (uid, role, spec, on) => {
    const node = button("oc-sdk-option");
    node.id = optionId(uid, spec.id);
    node.setAttribute("role", role);
    node.tabIndex = -1;
    node.disabled = Boolean(spec.disabled);
    if (role === "option") {
      node.setAttribute("aria-selected", spec.selected ? "true" : "false");
    }
    node.dataset.destructive = spec.destructive ? "true" : "false";
    const label = el("span", "oc-sdk-option-label");
    label.textContent = spec.label;
    node.append(label);
    if (spec.hint) {
      const hint = el("span", "oc-sdk-option-hint");
      hint.textContent = spec.hint;
      node.append(hint);
    }
    if (role === "option") {
      node.dataset.mark = "check";
      const check = el("span", "oc-sdk-option-check");
      check.append(icon("check", 14));
      node.append(check);
    }
    node.addEventListener("pointerenter", on.hover);
    node.addEventListener("click", on.pick);
    return node;
  };
  var highlightOption = (container, focusOwner, uid, id) => {
    const target = optionId(uid, id);
    for (const child of Array.from(container.children)) {
      if (child instanceof HTMLElement && child.classList.contains("oc-sdk-option")) {
        child.dataset.active = child.id === target ? "true" : "false";
      }
    }
    setAttr(focusOwner, "aria-activedescendant", id ? target : null);
    container.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  };

  // node_modules/@openchamber/sdk/dist/ui/popup.js
  var placePopup = (popup, trigger) => {
    const rect = trigger.getBoundingClientRect();
    popup.style.minWidth = `${Math.round(rect.width)}px`;
    popup.style.left = `${Math.round(rect.left)}px`;
    popup.style.top = `${Math.round(rect.bottom + 4)}px`;
    const height = popup.offsetHeight;
    const roomBelow = window.innerHeight - rect.bottom - 8;
    if (height > roomBelow && rect.top - 8 > roomBelow) {
      popup.style.top = `${Math.max(8, Math.round(rect.top - 4 - height))}px`;
    }
    const overflow = rect.left + popup.offsetWidth - window.innerWidth + 8;
    if (overflow > 0) {
      popup.style.left = `${Math.max(8, Math.round(rect.left - overflow))}px`;
    }
  };
  var openPopup = (host2, trigger, popup, close) => {
    host2.append(popup);
    placePopup(popup, trigger);
    const stopOutside = onOutsideClick(host2, close);
    const onResize = () => {
      close();
    };
    const onScroll = (event) => {
      if (event.target instanceof Node && popup.contains(event.target)) {
        return;
      }
      close();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      stopOutside();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      popup.remove();
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/select.js
  var filterSelectOptions = (options, query) => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return [...options];
    }
    return options.filter((option) => option.label.toLowerCase().includes(needle) || option.id.toLowerCase().includes(needle));
  };
  var selectCount = 0;
  var mountSelect = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const uid = `oc-sdk-select-${selectCount += 1}`;
    const wrap = el("div", "oc-sdk oc-sdk-select");
    const caption = el("span", "oc-sdk-field-label");
    caption.id = `${uid}-label`;
    const trigger = button("oc-sdk-trigger");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-labelledby", caption.id);
    const value = el("span", "oc-sdk-trigger-value");
    trigger.append(value, icon("chevron", 14, "oc-sdk-trigger-chevron"));
    wrap.append(caption, trigger);
    root2.append(wrap);
    let query = "";
    let activeId = null;
    let closePopup = null;
    const popup = el("div", "oc-sdk oc-sdk-popup");
    const searchSlot = el("div", "oc-sdk-popup-search");
    const search = el("input", "oc-sdk-input");
    search.type = "text";
    search.autocomplete = "off";
    searchSlot.append(search);
    const listbox = el("div");
    listbox.setAttribute("role", "listbox");
    listbox.tabIndex = -1;
    popup.append(listbox);
    const visible = () => filterSelectOptions(props.options, props.searchable ? query : "");
    const focusOwner = () => props.searchable ? search : listbox;
    const setActive = (id) => {
      activeId = id;
      highlightOption(listbox, focusOwner(), uid, id);
    };
    const paintOptions = () => {
      clearNode(listbox);
      const options = visible();
      if (options.length === 0) {
        const empty = el("div", "oc-sdk-popup-empty");
        empty.textContent = "No matches";
        listbox.append(empty);
      }
      for (const option of options) {
        listbox.append(createOption(uid, "option", { ...option, selected: option.id === props.value }, {
          hover: () => setActive(option.id),
          pick: () => pick(option.id)
        }));
      }
      setActive(options.some((option) => option.id === activeId) ? activeId : options[0]?.id ?? null);
    };
    const close = () => {
      const dispose = closePopup;
      closePopup = null;
      dispose?.();
      query = "";
      search.value = "";
      trigger.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      if (closePopup || props.disabled) {
        return;
      }
      activeId = props.value;
      search.placeholder = props.searchPlaceholder ?? "Search";
      if (props.searchable)
        popup.prepend(searchSlot);
      else
        searchSlot.remove();
      paintOptions();
      closePopup = openPopup(wrap, trigger, popup, close);
      trigger.setAttribute("aria-expanded", "true");
      focusOwner().focus();
    };
    const pick = (id) => {
      close();
      trigger.focus();
      if (id !== props.value)
        props.onChange(id);
    };
    const onTriggerClick = () => {
      if (closePopup)
        close();
      else
        open();
    };
    const onTriggerKey = (event) => {
      if (!closePopup && navigationKey(event)) {
        event.preventDefault();
        open();
      }
    };
    const onPopupKey = (event) => {
      const step = navigationKey(event);
      if (step) {
        event.preventDefault();
        setActive(moveListSelection(visible(), activeId, step));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeId)
          pick(activeId);
      } else if (event.key === "Escape") {
        event.preventDefault();
        close();
        trigger.focus();
      } else if (props.searchable && event.target !== search && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        search.focus();
      }
    };
    const onSearchInput = () => {
      query = search.value;
      paintOptions();
    };
    const onFocusOut = (event) => {
      if (closePopup && !(event.relatedTarget instanceof Node && wrap.contains(event.relatedTarget)))
        close();
    };
    const paint = () => {
      setText(caption, props.label);
      caption.hidden = !props.label;
      const current = props.options.find((option) => option.id === props.value);
      setText(value, current?.label ?? props.placeholder ?? "Select");
      value.dataset.empty = current ? "false" : "true";
      trigger.disabled = Boolean(props.disabled);
      if (closePopup)
        paintOptions();
    };
    trigger.addEventListener("click", onTriggerClick);
    trigger.addEventListener("keydown", onTriggerKey);
    popup.addEventListener("keydown", onPopupKey);
    search.addEventListener("input", onSearchInput);
    wrap.addEventListener("focusout", onFocusOut);
    paint();
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        close();
        trigger.removeEventListener("click", onTriggerClick);
        trigger.removeEventListener("keydown", onTriggerKey);
        popup.removeEventListener("keydown", onPopupKey);
        search.removeEventListener("input", onSearchInput);
        wrap.removeEventListener("focusout", onFocusOut);
        wrap.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/tabs.js
  var mountTabs = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const track = el("div", "oc-sdk oc-sdk-tabs");
    track.setAttribute("role", "tablist");
    root2.append(track);
    const paint = () => {
      clearNode(track);
      track.dataset.track = props.trackBackground ? "true" : "false";
      for (const item of props.items) {
        const tab = button("oc-sdk-tab");
        tab.setAttribute("role", "tab");
        const active2 = item.id === props.activeId;
        tab.setAttribute("aria-selected", active2 ? "true" : "false");
        tab.tabIndex = active2 ? 0 : -1;
        tab.dataset.id = item.id;
        const label = el("span");
        label.textContent = item.label;
        tab.append(label);
        if (item.count !== void 0) {
          const count = el("span", "oc-sdk-tab-count");
          count.textContent = String(item.count);
          tab.append(count);
        }
        tab.addEventListener("click", () => {
          if (item.id !== props.activeId)
            props.onChange(item.id);
        });
        track.append(tab);
      }
    };
    const onKeyDown = (event) => {
      const step = navigationKey(event, "horizontal");
      if (!step) {
        return;
      }
      const next = moveListSelection(props.items, props.activeId, step);
      if (next && next !== props.activeId) {
        event.preventDefault();
        props.onChange(next);
        const tab = track.querySelector(`[data-id="${CSS.escape(next)}"]`);
        if (tab instanceof HTMLElement)
          tab.focus();
      }
    };
    track.addEventListener("keydown", onKeyDown);
    paint();
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        track.removeEventListener("keydown", onKeyDown);
        track.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/badge.js
  var applyTone = (node, tone2) => {
    setAttr(node, "data-tone", tone2 && tone2 !== "neutral" ? tone2 : null);
  };

  // node_modules/@openchamber/sdk/dist/ui/list.js
  var listCount = 0;
  var mountList = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const uid = `oc-sdk-list-${listCount += 1}`;
    const list = el("div", "oc-sdk oc-sdk-list");
    list.setAttribute("role", "listbox");
    list.tabIndex = 0;
    root2.append(list);
    let activeId = null;
    const rowId = (id) => `${uid}-${id}`;
    const setActive = (id) => {
      activeId = id;
      for (const row of Array.from(list.children)) {
        if (row instanceof HTMLElement) {
          row.dataset.active = row.id === rowId(id ?? "") ? "true" : "false";
        }
      }
      setAttr(list, "aria-activedescendant", id ? rowId(id) : null);
      list.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
    };
    const span = (className, text) => {
      const node = el("span", className);
      node.textContent = text;
      return node;
    };
    const paint = () => {
      clearNode(list);
      setAttr(list, "aria-label", props.ariaLabel);
      if (props.items.length === 0) {
        list.append(span("oc-sdk-list-empty", props.emptyText ?? "Nothing here"));
        setActive(null);
        return;
      }
      for (const item of props.items) {
        const row = button("oc-sdk-row");
        row.id = rowId(item.id);
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", item.id === props.selectedId ? "true" : "false");
        row.disabled = Boolean(item.disabled);
        row.tabIndex = -1;
        if (item.leading)
          row.append(span("oc-sdk-row-lead", item.leading));
        const main = el("span", "oc-sdk-row-main");
        main.append(span("oc-sdk-row-title", item.title));
        if (item.subtitle)
          main.append(span("oc-sdk-row-sub", item.subtitle));
        row.append(main);
        if (item.badge) {
          const badge = span("oc-sdk-badge", item.badge.label);
          applyTone(badge, item.badge.tone);
          row.append(badge);
        }
        if (item.meta)
          row.append(span("oc-sdk-row-meta", item.meta));
        row.addEventListener("click", () => props.onSelect(item.id));
        list.append(row);
      }
      const stillThere = props.items.some((item) => item.id === activeId && !item.disabled);
      setActive(stillThere ? activeId : props.selectedId ?? null);
    };
    const onKeyDown = (event) => {
      const step = navigationKey(event);
      if (step) {
        event.preventDefault();
        setActive(moveListSelection(props.items, activeId, step));
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && activeId) {
        event.preventDefault();
        props.onSelect(activeId);
      }
    };
    list.addEventListener("keydown", onKeyDown);
    paint();
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        list.removeEventListener("keydown", onKeyDown);
        list.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/empty.js
  var mountEmpty = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const shell = el("div", "oc-sdk oc-sdk-empty");
    const title = el("h2", "oc-sdk-empty-title");
    const body = el("p", "oc-sdk-empty-body");
    const slot = el("div", "oc-sdk-empty-action");
    shell.append(title, body, slot);
    root2.append(shell);
    let action = null;
    const paint = () => {
      setText(title, props.title);
      setText(body, props.body);
      body.hidden = !props.body;
      slot.hidden = !props.action;
      if (!props.action) {
        action?.dispose();
        action = null;
        return;
      }
      const next = { label: props.action.label, onClick: props.action.onClick };
      if (action) {
        action.update(next);
      } else {
        action = mountButton(slot, { ...next, variant: "outline", size: "sm" });
      }
    };
    paint();
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        action?.dispose();
        action = null;
        shell.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/banner.js
  var mountBanner = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const node = el("div", "oc-sdk oc-sdk-banner");
    const text = el("div", "oc-sdk-banner-text");
    const title = el("div", "oc-sdk-banner-title");
    const body = el("div", "oc-sdk-banner-body");
    const slot = el("div", "oc-sdk-banner-action");
    text.append(title, body);
    node.append(text, slot);
    root2.append(node);
    let action = null;
    const paint = () => {
      node.dataset.tone = props.tone;
      node.setAttribute("role", props.tone === "error" || props.tone === "warning" ? "alert" : "status");
      setText(title, props.title);
      setText(body, props.body);
      body.hidden = !props.body;
      slot.hidden = !props.action;
      if (!props.action) {
        action?.dispose();
        action = null;
        return;
      }
      const next = { label: props.action.label, onClick: props.action.onClick };
      if (action) {
        action.update(next);
      } else {
        action = mountButton(slot, { ...next, variant: "outline", size: "xs" });
      }
    };
    paint();
    return {
      update: (next) => {
        props = { ...props, ...next };
        paint();
      },
      dispose: () => {
        action?.dispose();
        action = null;
        node.remove();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/ui/menu.js
  var actions = (items) => items.filter((item) => !("separator" in item));
  var menuCount = 0;
  var mountMenu = (root2, initial) => {
    ensureStyle(UI_CSS);
    let props = initial;
    const uid = `oc-sdk-menu-${menuCount += 1}`;
    const wrap = el("div", "oc-sdk oc-sdk-menu");
    root2.append(wrap);
    const popup = el("div", "oc-sdk oc-sdk-popup");
    popup.setAttribute("role", "menu");
    popup.tabIndex = -1;
    let closePopup = null;
    let activeId = null;
    const trigger = mountButton(wrap, {
      label: props.label,
      variant: props.variant,
      size: props.size,
      onClick: () => {
        if (closePopup)
          close();
        else
          open();
      }
    });
    const triggerNode = wrap.querySelector("button");
    triggerNode?.setAttribute("aria-haspopup", "menu");
    const setActive = (id) => {
      activeId = id;
      highlightOption(popup, popup, uid, id);
    };
    const paintItems = () => {
      clearNode(popup);
      for (const item of props.items) {
        if ("separator" in item) {
          const line = el("div", "oc-sdk-separator");
          line.dataset.labeled = "false";
          popup.append(line);
          continue;
        }
        popup.append(createOption(uid, "menuitem", item, {
          hover: () => setActive(item.id),
          pick: () => pick(item.id)
        }));
      }
      setActive(actions(props.items).some((item) => item.id === activeId) ? activeId : null);
    };
    const close = () => {
      const dispose = closePopup;
      closePopup = null;
      dispose?.();
      activeId = null;
      triggerNode?.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      if (closePopup || !triggerNode) {
        return;
      }
      paintItems();
      closePopup = openPopup(wrap, triggerNode, popup, close);
      triggerNode.setAttribute("aria-expanded", "true");
      popup.focus();
    };
    const pick = (id) => {
      close();
      triggerNode?.focus();
      props.onSelect(id);
    };
    const onPopupKey = (event) => {
      const step = navigationKey(event);
      if (step) {
        event.preventDefault();
        setActive(moveListSelection(actions(props.items), activeId, step));
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (activeId)
          pick(activeId);
      } else if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerNode?.focus();
      }
    };
    const onFocusOut = (event) => {
      if (closePopup && !(event.relatedTarget instanceof Node && wrap.contains(event.relatedTarget)))
        close();
    };
    popup.addEventListener("keydown", onPopupKey);
    wrap.addEventListener("focusout", onFocusOut);
    return {
      update: (next) => {
        props = { ...props, ...next };
        trigger.update({ label: props.label, variant: props.variant, size: props.size });
        if (closePopup)
          paintItems();
      },
      dispose: () => {
        close();
        popup.removeEventListener("keydown", onPopupKey);
        wrap.removeEventListener("focusout", onFocusOut);
        trigger.dispose();
        wrap.remove();
      }
    };
  };

  // src/templates/schema.ts
  var SCHEMA_VERSION = 1;
  var COMPOSE_LIMIT = 16e3;
  var STORAGE_VALUE_LIMIT = 65536;
  var CLIPBOARD_LIMIT = 32e3;
  var GENERAL_CATEGORY_ID = "general";
  var DEFAULT_CATEGORIES = [
    { id: "requirements", name: "Requirements & Planning", order: 0, builtIn: true },
    { id: "research", name: "Research & Investigation", order: 1, builtIn: true },
    { id: "implementation", name: "Feature Implementation", order: 2, builtIn: true },
    { id: "bugs", name: "Bug Fixing", order: 3, builtIn: true },
    { id: "refactoring", name: "Refactoring", order: 4, builtIn: true },
    { id: "architecture", name: "Architecture", order: 5, builtIn: true },
    { id: "review", name: "Code Review", order: 6, builtIn: true },
    { id: "testing", name: "Testing & Quality Assurance", order: 7, builtIn: true },
    { id: "performance", name: "Performance Optimization", order: 8, builtIn: true },
    { id: GENERAL_CATEGORY_ID, name: "General", order: 9, builtIn: true }
  ];
  var ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
  var FIELD_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
  var PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;
  function nowIso() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function createId(prefix = "t") {
    const globalCrypto = globalThis.crypto;
    if (globalCrypto?.randomUUID) return `${prefix}-${globalCrypto.randomUUID()}`;
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
  }
  function normalizeTagList(value) {
    const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    const seen = /* @__PURE__ */ new Set();
    const tags = [];
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
  function isCategoryId(value, categories) {
    return categories.some((category) => category.id === value);
  }
  function resolveCategoryId(value, categories) {
    const raw = String(value ?? "").trim();
    if (!raw) return GENERAL_CATEGORY_ID;
    const byId = categories.find((category) => category.id === raw);
    if (byId) return byId.id;
    const byName = categories.find((category) => category.name.toLowerCase() === raw.toLowerCase());
    return byName ? byName.id : GENERAL_CATEGORY_ID;
  }
  function parseField(input2, seen) {
    if (!input2 || typeof input2 !== "object") return null;
    const record = input2;
    const key = String(record.key ?? "").trim();
    const label = String(record.label ?? "").trim();
    if (!FIELD_KEY_PATTERN.test(key) || !label || seen.has(key)) return null;
    seen.add(key);
    const kind = record.kind === "multiline" || record.multiline === true ? "multiline" : "text";
    const field3 = { key, label, required: record.required === true, kind };
    const description = String(record.description ?? "").trim();
    if (description) field3.description = description;
    const placeholder = String(record.placeholder ?? "").trim();
    if (placeholder) field3.placeholder = placeholder;
    const defaultValue = record.defaultValue ?? record.default;
    if (defaultValue !== void 0 && defaultValue !== null) field3.defaultValue = String(defaultValue);
    return field3;
  }
  function normalizeFields(input2) {
    if (!Array.isArray(input2)) return [];
    const seen = /* @__PURE__ */ new Set();
    const fields = [];
    for (const item of input2) {
      const field3 = parseField(item, seen);
      if (field3) fields.push(field3);
    }
    return fields;
  }
  function normalizeTemplate(input2, categories, fallbackOrder = 0) {
    if (!input2 || typeof input2 !== "object") return { ok: false, error: "not an object" };
    const record = input2;
    const name = String(record.name ?? "").trim();
    if (!name) return { ok: false, error: "name is required" };
    if (name.length > 200) return { ok: false, error: "name is longer than 200 characters" };
    const body = typeof record.body === "string" ? record.body : "";
    if (!body.trim()) return { ok: false, error: "prompt body is required" };
    const rawId = String(record.id ?? "").trim();
    const id = ID_PATTERN.test(rawId) ? rawId : createId();
    const categoryId = resolveCategoryId(record.categoryId ?? record.category, categories);
    const createdAt = String(record.createdAt ?? "").trim() || nowIso();
    const updatedAt = String(record.updatedAt ?? "").trim() || createdAt;
    const order = Number.isFinite(record.order) ? Number(record.order) : fallbackOrder;
    const revision = Number.isFinite(record.revision) ? Math.max(1, Number(record.revision)) : 1;
    const lastUsedAt = String(record.lastUsedAt ?? "").trim();
    const template = {
      id,
      name,
      description: String(record.description ?? "").trim(),
      categoryId,
      body,
      fields: normalizeFields(record.fields),
      tags: normalizeTagList(record.tags),
      favorite: record.favorite === true,
      order,
      createdAt,
      updatedAt,
      revision
    };
    if (lastUsedAt) template.lastUsedAt = lastUsedAt;
    return { ok: true, template };
  }
  function indexEntry(template) {
    const entry = {
      id: template.id,
      name: template.name,
      description: template.description,
      categoryId: template.categoryId,
      tags: template.tags,
      favorite: template.favorite,
      order: template.order,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      fieldCount: template.fields.length
    };
    if (template.lastUsedAt) entry.lastUsedAt = template.lastUsedAt;
    return entry;
  }
  function renderTemplate(body, fields, values) {
    let output = body;
    for (const field3 of fields) {
      const value = (values[field3.key] ?? field3.defaultValue ?? "").trim();
      output = output.split(`{{${field3.key}}}`).join(value);
    }
    return output.trim();
  }
  function missingRequiredFields(fields, values) {
    return fields.filter((field3) => field3.required && !(values[field3.key] ?? field3.defaultValue ?? "").trim());
  }
  function listPlaceholders(body) {
    const found = /* @__PURE__ */ new Set();
    for (const match of body.matchAll(PLACEHOLDER_PATTERN)) {
      if (match[1]) found.add(match[1]);
    }
    return [...found];
  }
  function byteLength(value) {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  }
  function exportTemplate(template) {
    const record = {
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
      revision: template.revision
    };
    if (template.lastUsedAt) record.lastUsedAt = template.lastUsedAt;
    return record;
  }

  // src/storage/library.ts
  var META_KEY = "meta";
  var INDEX_PREFIX = "idx:";
  var TEMPLATE_PREFIX = "t:";
  var CHUNK_SIZE = 120;
  var LibraryError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "LibraryError";
    }
  };
  var Library = class {
    adapter;
    now;
    categories = DEFAULT_CATEGORIES.map((category) => ({ ...category }));
    entries = [];
    chunks = 0;
    queue = Promise.resolve();
    constructor(adapter, now = nowIso) {
      this.adapter = adapter;
      this.now = now;
    }
    /** Runs writes one after another so two edits never interleave. */
    enqueue(operation) {
      const next = this.queue.then(operation, operation);
      this.queue = next.then(
        () => void 0,
        () => void 0
      );
      return next;
    }
    async load() {
      const meta = await this.adapter.get(META_KEY);
      if (!this.isMeta(meta)) {
        await this.writeMeta();
        this.entries = [];
        this.chunks = 0;
        return;
      }
      this.categories = meta.categories;
      this.chunks = meta.chunks;
      const chunks = await Promise.all(
        Array.from({ length: meta.chunks }, (_, index) => this.adapter.get(`${INDEX_PREFIX}${index}`))
      );
      const entries = [];
      for (const chunk of chunks) {
        if (!Array.isArray(chunk)) continue;
        for (const item of chunk) {
          if (item && typeof item === "object" && typeof item.id === "string") {
            entries.push(item);
          }
        }
      }
      this.entries = entries.sort(compareEntries);
    }
    isMeta(value) {
      if (!value || typeof value !== "object") return false;
      const meta = value;
      return meta.schemaVersion === SCHEMA_VERSION && Array.isArray(meta.categories) && meta.categories.length > 0 && Number.isInteger(meta.chunks) && meta.chunks >= 0;
    }
    async writeMeta() {
      const meta = {
        schemaVersion: SCHEMA_VERSION,
        categories: this.categories,
        chunks: this.chunks,
        updatedAt: this.now()
      };
      if (byteLength(meta) > STORAGE_VALUE_LIMIT) throw new LibraryError("Category list is too large to store.");
      await this.adapter.set(META_KEY, meta);
    }
    async writeIndex() {
      const entries = [...this.entries].sort(compareEntries);
      const chunkCount = Math.max(1, Math.ceil(entries.length / CHUNK_SIZE));
      for (let index = 0; index < chunkCount; index += 1) {
        const slice = entries.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
        const value = slice;
        if (byteLength(value) > STORAGE_VALUE_LIMIT) {
          throw new LibraryError("Template index is too large to store.");
        }
        await this.adapter.set(`${INDEX_PREFIX}${index}`, value);
      }
      for (let index = chunkCount; index < this.chunks; index += 1) {
        await this.adapter.delete(`${INDEX_PREFIX}${index}`);
      }
      this.entries = entries;
      this.chunks = chunkCount;
      await this.writeMeta();
    }
    async writeTemplate(template) {
      const payload = { ...template };
      if (byteLength(payload) > STORAGE_VALUE_LIMIT) {
        throw new LibraryError(
          `"${template.name}" is too large to store. Shorten the prompt below 60,000 characters.`
        );
      }
      await this.adapter.set(`${TEMPLATE_PREFIX}${template.id}`, payload);
    }
    getCategories() {
      return [...this.categories].sort((a, b) => a.order - b.order);
    }
    getEntries() {
      return [...this.entries];
    }
    getCategoryName(id) {
      return this.categories.find((category) => category.id === id)?.name ?? "General";
    }
    async getTemplate(id) {
      const stored = await this.adapter.get(`${TEMPLATE_PREFIX}${id}`);
      if (stored === void 0 || stored === null) return void 0;
      const result = normalizeTemplate(stored, this.categories, this.nextOrder());
      return result.ok ? result.template : void 0;
    }
    nextOrder() {
      return this.entries.reduce((max, entry) => Math.max(max, entry.order), 0) + 1;
    }
    async create(input2) {
      return this.enqueue(async () => {
        const result = normalizeTemplate({ ...input2, id: createId() }, this.categories, this.nextOrder());
        if (!result.ok) throw new LibraryError(result.error);
        const template = result.template;
        await this.writeTemplate(template);
        this.entries = [...this.entries, indexEntry(template)];
        await this.writeIndex();
        return template;
      });
    }
    async update(id, patch) {
      return this.enqueue(async () => {
        const existing = await this.getTemplate(id);
        if (!existing) throw new LibraryError("Template no longer exists. Reload the library.");
        const merged = { ...existing, ...patch, id, revision: existing.revision + 1, updatedAt: this.now() };
        const result = normalizeTemplate(merged, this.categories, existing.order);
        if (!result.ok) throw new LibraryError(result.error);
        const template = result.template;
        await this.writeTemplate(template);
        this.entries = this.entries.map((entry) => entry.id === id ? indexEntry(template) : entry);
        await this.writeIndex();
        return template;
      });
    }
    async remove(id) {
      return this.enqueue(async () => {
        await this.adapter.delete(`${TEMPLATE_PREFIX}${id}`);
        this.entries = this.entries.filter((entry) => entry.id !== id);
        await this.writeIndex();
      });
    }
    /** Puts a deleted template back with its original id and metadata. */
    async restore(template) {
      return this.enqueue(async () => {
        const result = normalizeTemplate(template, this.categories, this.nextOrder());
        if (!result.ok) throw new LibraryError(result.error);
        const restored = result.template;
        await this.writeTemplate(restored);
        if (!this.entries.some((entry) => entry.id === restored.id)) {
          this.entries = [...this.entries, indexEntry(restored)];
          await this.writeIndex();
        }
      });
    }
    async duplicate(id) {
      const source = await this.getTemplate(id);
      if (!source) throw new LibraryError("Template no longer exists. Reload the library.");
      return this.create({
        ...exportTemplate(source),
        id: createId(),
        name: `${source.name} (copy)`,
        order: this.nextOrder(),
        createdAt: this.now(),
        updatedAt: this.now(),
        revision: 1
      });
    }
    async setFavorite(id, favorite) {
      return this.enqueue(async () => {
        const entry = this.entries.find((item) => item.id === id);
        if (!entry) throw new LibraryError("Template no longer exists.");
        this.entries = this.entries.map((item) => item.id === id ? { ...item, favorite } : item);
        await this.writeIndex();
        const template = await this.getTemplate(id);
        if (template) {
          await this.writeTemplate({ ...template, favorite });
        }
      });
    }
    async touch(id) {
      return this.enqueue(async () => {
        const usedAt = this.now();
        this.entries = this.entries.map((entry) => entry.id === id ? { ...entry, lastUsedAt: usedAt } : entry);
        await this.writeIndex();
        const template = await this.getTemplate(id);
        if (template) await this.writeTemplate({ ...template, lastUsedAt: usedAt });
      });
    }
    /** Moves a template one slot up (-1) or down (+1) in the library order. */
    async reorder(id, direction) {
      return this.enqueue(async () => {
        const sorted = [...this.entries].sort(compareEntries);
        const index = sorted.findIndex((entry) => entry.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= sorted.length) return;
        const current = sorted[index];
        const neighbour = sorted[target];
        if (!current || !neighbour) return;
        const currentOrder = current.order;
        const neighbourOrder = neighbour.order;
        this.entries = this.entries.map((entry) => {
          if (entry.id === current.id) return { ...entry, order: neighbourOrder };
          if (entry.id === neighbour.id) return { ...entry, order: currentOrder };
          return entry;
        });
        await this.writeIndex();
        for (const entryId of [current.id, neighbour.id]) {
          const template = await this.getTemplate(entryId);
          if (!template) continue;
          const order = this.entries.find((entry) => entry.id === entryId)?.order ?? template.order;
          await this.writeTemplate({ ...template, order });
        }
      });
    }
    async addCategory(name) {
      const trimmed = name.trim();
      if (!trimmed) throw new LibraryError("Category name is required.");
      if (trimmed.length > 60) throw new LibraryError("Category name is longer than 60 characters.");
      if (this.categories.some((category2) => category2.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new LibraryError("A category with that name already exists.");
      }
      const category = {
        id: createId("c"),
        name: trimmed,
        order: this.categories.reduce((max, item) => Math.max(max, item.order), 0) + 1,
        builtIn: false
      };
      this.categories = [...this.categories, category];
      await this.enqueue(() => this.writeMeta());
      return category;
    }
    async renameCategory(id, name) {
      const trimmed = name.trim();
      if (!trimmed) throw new LibraryError("Category name is required.");
      if (trimmed.length > 60) throw new LibraryError("Category name is longer than 60 characters.");
      if (this.categories.some((item) => item.id !== id && item.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new LibraryError("A category with that name already exists.");
      }
      if (!this.categories.some((item) => item.id === id)) throw new LibraryError("Category no longer exists.");
      this.categories = this.categories.map((item) => item.id === id ? { ...item, name: trimmed } : item);
      await this.enqueue(() => this.writeMeta());
    }
    /** Templates of a deleted category move to General; none are deleted. */
    async deleteCategory(id) {
      if (id === GENERAL_CATEGORY_ID) throw new LibraryError("General cannot be deleted.");
      if (!this.categories.some((category) => category.id === id)) return 0;
      return this.enqueue(async () => {
        const affected = this.entries.filter((entry) => entry.categoryId === id);
        for (const entry of affected) {
          const template = await this.getTemplate(entry.id);
          if (!template) continue;
          await this.writeTemplate({ ...template, categoryId: GENERAL_CATEGORY_ID, updatedAt: this.now() });
        }
        this.entries = this.entries.map(
          (entry) => entry.categoryId === id ? { ...entry, categoryId: GENERAL_CATEGORY_ID } : entry
        );
        await this.writeIndex();
        this.categories = this.categories.filter((category) => category.id !== id);
        await this.writeMeta();
        return affected.length;
      });
    }
    async importTemplates(incoming, policy, newCategories = []) {
      const outcome = { added: 0, replaced: 0, skipped: 0, rejected: [] };
      return this.enqueue(async () => {
        for (const category of newCategories) {
          if (this.categories.some((item) => item.name.toLowerCase() === category.name.toLowerCase())) continue;
          this.categories = [...this.categories, category];
        }
        if (newCategories.length > 0) await this.writeMeta();
        const entries = [...this.entries];
        const byName = new Map(entries.map((entry) => [duplicateKey(entry.name, entry.categoryId), entry]));
        const byId = new Map(entries.map((entry) => [entry.id, entry]));
        for (const candidate of incoming) {
          try {
            const existing = byId.get(candidate.id) ?? byName.get(duplicateKey(candidate.name, candidate.categoryId));
            if (!existing) {
              const template = { ...candidate, order: nextOrderFrom(entries) };
              await this.writeTemplate(template);
              entries.push(indexEntry(template));
              byId.set(template.id, indexEntry(template));
              byName.set(duplicateKey(template.name, template.categoryId), indexEntry(template));
              outcome.added += 1;
              continue;
            }
            if (policy === "skip") {
              outcome.skipped += 1;
              continue;
            }
            if (policy === "replace") {
              const replaced = {
                ...candidate,
                id: existing.id,
                order: existing.order,
                createdAt: existing.createdAt,
                updatedAt: this.now(),
                revision: 1
              };
              await this.writeTemplate(replaced);
              const nextEntry = indexEntry(replaced);
              entries[entries.findIndex((entry) => entry.id === existing.id)] = nextEntry;
              byId.set(replaced.id, nextEntry);
              byName.set(duplicateKey(replaced.name, replaced.categoryId), nextEntry);
              outcome.replaced += 1;
              continue;
            }
            const copy = {
              ...candidate,
              id: createId(),
              name: uniqueCopyName(candidate.name, entries),
              order: nextOrderFrom(entries),
              createdAt: this.now(),
              updatedAt: this.now(),
              revision: 1
            };
            await this.writeTemplate(copy);
            const copyEntry = indexEntry(copy);
            entries.push(copyEntry);
            byId.set(copy.id, copyEntry);
            byName.set(duplicateKey(copy.name, copy.categoryId), copyEntry);
            outcome.added += 1;
          } catch (error) {
            outcome.rejected.push({
              name: candidate.name,
              reason: error instanceof Error ? error.message : "could not be stored"
            });
          }
        }
        this.entries = entries;
        await this.writeIndex();
        return outcome;
      });
    }
    async exportDocument(ids) {
      const wanted = ids && ids.length > 0 ? new Set(ids) : null;
      const templates = [];
      for (const entry of [...this.entries].sort(compareEntries)) {
        if (wanted && !wanted.has(entry.id)) continue;
        const template = await this.getTemplate(entry.id);
        if (template) templates.push(template);
      }
      return {
        format: "prompt-studio",
        version: SCHEMA_VERSION,
        exportedAt: this.now(),
        categories: this.categories.map(({ id, name }) => ({ id, name })),
        templates: templates.map(exportTemplate)
      };
    }
    /**
     * Validates an imported document and resolves its categories. Categories the
     * library does not have yet are returned so the caller can add them, which
     * keeps an imported library intact instead of dropping everything to General.
     */
    parseDocument(raw) {
      if (!raw || typeof raw !== "object") return { ok: false, error: "Not a JSON object." };
      const document2 = raw;
      if (document2.format !== void 0 && document2.format !== "prompt-studio") {
        return { ok: false, error: "This file is not a Prompt Studio export." };
      }
      if (document2.version !== void 0 && document2.version !== 1) {
        return { ok: false, error: `Unsupported version ${String(document2.version)}. This build reads version 1.` };
      }
      if (!Array.isArray(document2.templates)) return { ok: false, error: "The file has no templates array." };
      if (document2.templates.length === 0) return { ok: false, error: "The file contains no templates." };
      if (document2.templates.length > 2e3) return { ok: false, error: "The file has more than 2,000 templates." };
      const extra = [];
      if (Array.isArray(document2.categories)) {
        const usedNames = new Set(this.categories.map((category) => category.name.toLowerCase()));
        const usedIds = new Set(this.categories.map((category) => category.id));
        for (const item of document2.categories) {
          if (!item || typeof item !== "object") continue;
          const record = item;
          const name = String(record.name ?? "").trim();
          if (!name || name.length > 60) continue;
          if (usedNames.has(name.toLowerCase())) continue;
          const rawId = String(record.id ?? "").trim();
          const id = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(rawId) && !usedIds.has(rawId) ? rawId : createId("c");
          extra.push({ id, name, order: this.categories.length + extra.length, builtIn: false });
          usedNames.add(name.toLowerCase());
          usedIds.add(id);
        }
      }
      const categories = [...this.categories, ...extra];
      const templates = [];
      const errors = [];
      for (const item of document2.templates) {
        const result = normalizeTemplate(item, categories, 0);
        if (result.ok) templates.push(result.template);
        else {
          const name = item && typeof item === "object" && typeof item.name === "string" ? String(item.name) : "unnamed";
          errors.push({ name, reason: result.error });
        }
      }
      return { ok: true, templates, categories: extra, errors };
    }
    hasCategory(id) {
      return isCategoryId(id, this.categories);
    }
  };
  function compareEntries(a, b) {
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name);
  }
  function duplicateKey(name, categoryId) {
    return `${name.trim().toLowerCase()}::${categoryId}`;
  }
  function nextOrderFrom(entries) {
    return entries.reduce((max, entry) => Math.max(max, entry.order), 0) + 1;
  }
  function uniqueCopyName(name, entries) {
    const base = `${name} (copy)`;
    const taken = new Set(entries.map((entry) => entry.name.toLowerCase()));
    if (!taken.has(base.toLowerCase())) return base;
    let index = 2;
    while (taken.has(`${base} ${index}`.toLowerCase())) index += 1;
    return `${base} ${index}`;
  }

  // src/state/store.ts
  var EMPTY_DRAFT = (categoryId) => ({
    id: null,
    isNew: true,
    name: "",
    description: "",
    categoryId,
    tags: "",
    canonicalBody: "",
    fields: [],
    values: {},
    prompt: "",
    manualEdits: false,
    tab: "template",
    dirty: false
  });
  var Store = class {
    host = null;
    library = null;
    listeners = /* @__PURE__ */ new Set();
    state = {
      phase: "loading",
      fatal: null,
      categories: [],
      entries: [],
      query: "",
      tab: "all",
      categoryFilter: null,
      view: "library",
      draft: null,
      saving: false,
      notice: null,
      lastDeleted: null,
      surface: "panel",
      sessionOpen: false,
      editorNonce: 0
    };
    getState() {
      return this.state;
    }
    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    set(patch) {
      this.state = { ...this.state, ...patch };
      for (const listener of this.listeners) listener();
    }
    notify() {
      for (const listener of this.listeners) listener();
    }
    setContext(context) {
      this.set({
        surface: context.surface,
        sessionOpen: context.session !== null
      });
    }
    setSessionOpen(open) {
      if (this.state.sessionOpen === open) return;
      this.set({ sessionOpen: open });
    }
    async copyText(text) {
      if (text.length > CLIPBOARD_LIMIT) {
        this.set({
          notice: {
            tone: "warning",
            title: `That text is ${text.length.toLocaleString()} characters.`,
            body: `Clipboard writes stop at ${CLIPBOARD_LIMIT.toLocaleString()}. Select it in the dialog and copy it.`
          }
        });
        return;
      }
      try {
        await this.requireHost().writeClipboard(text);
        await this.requireHost().toast({ kind: "success", message: "Copied." });
      } catch (error) {
        this.set({
          notice: { tone: "error", title: "Copy failed.", body: error instanceof Error ? error.message : void 0 }
        });
      }
    }
    async init(host2, context) {
      this.host = host2;
      this.setContext(context);
      const adapter = {
        get: (key) => host2.storage.get(key),
        set: (key, value) => host2.storage.set(key, value),
        delete: (key) => host2.storage.delete(key),
        keys: () => host2.storage.keys()
      };
      this.library = new Library(adapter);
      try {
        await this.library.load();
        this.set({
          phase: "ready",
          categories: this.library.getCategories(),
          entries: this.library.getEntries()
        });
      } catch (error) {
        this.set({
          phase: "error",
          fatal: error instanceof Error ? error.message : "Could not read the prompt library."
        });
      }
    }
    dismissNotice() {
      this.set({ notice: null });
    }
    setNotice(notice) {
      this.set({ notice });
    }
    requireLibrary() {
      if (!this.library) throw new LibraryError("The library is still loading.");
      return this.library;
    }
    requireHost() {
      if (!this.host) throw new Error("OpenChamber is not connected.");
      return this.host;
    }
    refreshFromLibrary() {
      if (!this.library) return;
      this.set({ categories: this.library.getCategories(), entries: this.library.getEntries() });
    }
    reportError(error, fallback) {
      const message = error instanceof Error ? error.message : fallback;
      this.set({ notice: { tone: "error", title: fallback, body: message } });
    }
    // ---- filters -------------------------------------------------------------
    setQuery(query) {
      this.set({ query });
    }
    setTab(tab) {
      this.set({ tab });
    }
    setCategoryFilter(id) {
      this.set({ categoryFilter: id });
    }
    /** Entries after search, tab and category filters, in library order. */
    visibleEntries() {
      const { entries, query, tab, categoryFilter } = this.state;
      const needle = query.trim().toLowerCase();
      let list = entries;
      if (tab === "favorites") list = list.filter((entry) => entry.favorite);
      if (tab === "recent") {
        list = list.filter((entry) => entry.lastUsedAt).sort((a, b) => String(b.lastUsedAt).localeCompare(String(a.lastUsedAt))).slice(0, 12);
      }
      if (categoryFilter) list = list.filter((entry) => entry.categoryId === categoryFilter);
      if (needle) {
        list = list.filter((entry) => {
          const haystack = `${entry.name}
${entry.description}
${entry.tags.join(" ")}`.toLowerCase();
          return haystack.includes(needle);
        });
      }
      return list;
    }
    // ---- library view --------------------------------------------------------
    showLibrary() {
      this.set({ view: "library" });
    }
    async newTemplate() {
      const categoryId = this.state.categoryFilter ?? GENERAL_CATEGORY_ID;
      this.set({
        view: "editor",
        draft: EMPTY_DRAFT(categoryId),
        editorNonce: this.state.editorNonce + 1,
        notice: null
      });
    }
    async openTemplate(id) {
      const library = this.requireLibrary();
      try {
        const template = await library.getTemplate(id);
        if (!template) {
          this.set({ notice: { tone: "error", title: "That template no longer exists." } });
          this.refreshFromLibrary();
          return;
        }
        const values = {};
        for (const field3 of template.fields) values[field3.key] = field3.defaultValue ?? "";
        const prompt = template.fields.length ? renderTemplate(template.body, template.fields, values) : template.body;
        this.set({
          view: "editor",
          draft: {
            id: template.id,
            isNew: false,
            name: template.name,
            description: template.description,
            categoryId: template.categoryId,
            tags: template.tags.join(", "),
            canonicalBody: template.body,
            fields: template.fields,
            values,
            prompt,
            manualEdits: false,
            tab: "prompt",
            dirty: false
          },
          editorNonce: this.state.editorNonce + 1,
          notice: null
        });
      } catch (error) {
        this.reportError(error, "Could not open the template.");
      }
    }
    // ---- draft editing -------------------------------------------------------
    patchDraft(patch) {
      if (!this.state.draft) return;
      this.state = {
        ...this.state,
        draft: { ...this.state.draft, ...patch, dirty: true }
      };
      this.notify();
    }
    setDraftMeta(patch) {
      this.patchDraft(patch);
    }
    setEditorTab(tab) {
      if (!this.state.draft) return;
      if (this.state.draft.tab === tab) return;
      this.set({ draft: { ...this.state.draft, tab } });
    }
    setPrompt(text) {
      const draft = this.state.draft;
      if (!draft) return;
      this.set({ draft: { ...draft, prompt: text, manualEdits: true, dirty: true } });
    }
    setCanonicalBody(text) {
      const draft = this.state.draft;
      if (!draft) return;
      const prompt = draft.manualEdits ? draft.prompt : renderTemplate(text, draft.fields, draft.values);
      this.set({ draft: { ...draft, canonicalBody: text, prompt, dirty: true } });
    }
    setFieldValue(key, value) {
      const draft = this.state.draft;
      if (!draft) return;
      const values = { ...draft.values, [key]: value };
      const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, draft.fields, values);
      this.set({ draft: { ...draft, values, prompt, dirty: true } });
    }
    applyFieldValues() {
      const draft = this.state.draft;
      if (!draft) return;
      const prompt = renderTemplate(draft.canonicalBody, draft.fields, draft.values);
      this.set({ draft: { ...draft, prompt, manualEdits: false, dirty: true } });
    }
    addField(field3) {
      const draft = this.state.draft;
      if (!draft) return;
      if (draft.fields.some((item) => item.key === field3.key)) {
        this.set({ notice: { tone: "error", title: `A field named "${field3.key}" already exists.` } });
        return;
      }
      const fields = [...draft.fields, field3];
      const values = { ...draft.values, [field3.key]: field3.defaultValue ?? "" };
      const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, fields, values);
      this.set({
        draft: { ...draft, fields, values, prompt, dirty: true },
        notice: null,
        editorNonce: this.state.editorNonce + 1
      });
    }
    updateField(key, patch) {
      const draft = this.state.draft;
      if (!draft) return;
      const fields = draft.fields.map((field3) => field3.key === key ? { ...field3, ...patch, key } : field3);
      const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, fields, draft.values);
      this.set({
        draft: { ...draft, fields, prompt, dirty: true },
        editorNonce: this.state.editorNonce + 1
      });
    }
    removeField(key) {
      const draft = this.state.draft;
      if (!draft) return;
      const values = { ...draft.values };
      delete values[key];
      const fields = draft.fields.filter((field3) => field3.key !== key);
      const prompt = draft.manualEdits ? draft.prompt : renderTemplate(draft.canonicalBody, fields, values);
      this.set({
        draft: { ...draft, fields, values, prompt, dirty: true },
        editorNonce: this.state.editorNonce + 1
      });
    }
    resetPromptToTemplate() {
      const draft = this.state.draft;
      if (!draft) return;
      const prompt = renderTemplate(draft.canonicalBody, draft.fields, draft.values);
      this.set({ draft: { ...draft, prompt, manualEdits: false } });
    }
    // ---- persistence ---------------------------------------------------------
    async saveDraft() {
      const draft = this.state.draft;
      if (!draft || !this.library) return;
      if (!draft.name.trim()) {
        this.set({ notice: { tone: "error", title: "Give the template a name before saving." }, draft: { ...draft, tab: "template" } });
        return;
      }
      if (!draft.canonicalBody.trim()) {
        this.set({ notice: { tone: "error", title: "The template body is empty." }, draft: { ...draft, tab: "template" } });
        return;
      }
      this.set({ saving: true });
      try {
        const payload = {
          name: draft.name.trim(),
          description: draft.description.trim(),
          categoryId: draft.categoryId,
          tags: draft.tags,
          body: draft.canonicalBody,
          fields: draft.fields
        };
        let saved;
        if (draft.isNew) {
          saved = await this.library.create(payload);
        } else if (draft.id) {
          saved = await this.library.update(draft.id, payload);
        } else {
          throw new LibraryError("The draft has no template id.");
        }
        this.refreshFromLibrary();
        const values = {};
        for (const field3 of saved.fields) values[field3.key] = draft.values[field3.key] ?? field3.defaultValue ?? "";
        const prompt = draft.manualEdits ? draft.prompt : renderTemplate(saved.body, saved.fields, values);
        this.set({
          saving: false,
          editorNonce: this.state.editorNonce + 1,
          draft: {
            ...draft,
            id: saved.id,
            isNew: false,
            canonicalBody: saved.body,
            fields: saved.fields,
            values,
            prompt,
            dirty: false
          },
          notice: { tone: "success", title: draft.isNew ? "Template created." : "Template saved." }
        });
      } catch (error) {
        this.set({ saving: false });
        this.reportError(error, "Could not save the template.");
      }
    }
    // ---- composer ------------------------------------------------------------
    draftText() {
      return (this.state.draft?.prompt ?? "").trim();
    }
    async insert(mode) {
      const text = this.draftText();
      if (!text) {
        this.set({ notice: { tone: "error", title: "The prompt is empty. Nothing to insert." } });
        return;
      }
      if (text.length > COMPOSE_LIMIT) {
        this.set({
          notice: {
            tone: "error",
            title: `The prompt is ${text.length.toLocaleString()} characters.`,
            body: `The composer accepts ${COMPOSE_LIMIT.toLocaleString()}. Shorten it, or use Copy and paste in parts.`
          }
        });
        return;
      }
      if (!this.state.sessionOpen) {
        this.set({
          notice: {
            tone: "warning",
            title: "Open a chat first.",
            body: "The composer belongs to a session. Use Copy to take the prompt with you."
          }
        });
        return;
      }
      try {
        await this.requireHost().compose({ text, mode });
        const host2 = this.requireHost();
        await host2.toast({ kind: "success", message: mode === "replace" ? "Prompt replaced in the composer." : "Prompt appended to the composer." });
        const id = this.state.draft?.id;
        if (id) {
          await this.library?.touch(id);
          this.refreshFromLibrary();
        }
      } catch (error) {
        this.set({
          notice: {
            tone: "error",
            title: "Could not reach the composer.",
            body: error instanceof Error ? error.message : "The host did not accept the text. Use Copy instead."
          }
        });
      }
    }
    /** Returns true when the whole prompt fit in one clipboard write. */
    async copyPrompt() {
      const text = this.draftText();
      if (!text) {
        this.set({ notice: { tone: "error", title: "The prompt is empty." } });
        return false;
      }
      if (text.length > CLIPBOARD_LIMIT) {
        this.set({
          notice: {
            tone: "warning",
            title: `The prompt is ${text.length.toLocaleString()} characters.`,
            body: `Clipboard writes stop at ${CLIPBOARD_LIMIT.toLocaleString()}. Select the text in the editor and copy it.`
          }
        });
        return false;
      }
      try {
        await this.requireHost().writeClipboard(text);
        await this.requireHost().toast({ kind: "success", message: "Prompt copied." });
        return true;
      } catch (error) {
        this.set({
          notice: { tone: "error", title: "Copy failed.", body: error instanceof Error ? error.message : void 0 }
        });
        return false;
      }
    }
    // ---- template management -------------------------------------------------
    async duplicate(id) {
      if (!this.library) return;
      try {
        const copy = await this.library.duplicate(id);
        this.refreshFromLibrary();
        await this.openTemplate(copy.id);
        this.set({ notice: { tone: "success", title: `Duplicated as "${copy.name}".` } });
      } catch (error) {
        this.reportError(error, "Could not duplicate the template.");
      }
    }
    async remove(id) {
      if (!this.library) return;
      try {
        const template = await this.library.getTemplate(id);
        await this.library.remove(id);
        this.refreshFromLibrary();
        this.set({
          view: "library",
          draft: null,
          lastDeleted: template ? { template, name: template.name } : null,
          notice: { tone: "success", title: template ? `Deleted "${template.name}".` : "Template deleted." }
        });
      } catch (error) {
        this.reportError(error, "Could not delete the template.");
      }
    }
    async undoDelete() {
      const last = this.state.lastDeleted;
      if (!last || !this.library) return;
      try {
        await this.library.restore(last.template);
        this.refreshFromLibrary();
        this.set({ lastDeleted: null, notice: { tone: "success", title: `Restored "${last.name}".` } });
      } catch (error) {
        this.reportError(error, "Could not restore the template.");
      }
    }
    async toggleFavorite(id) {
      if (!this.library) return;
      const entry = this.state.entries.find((item) => item.id === id);
      if (!entry) return;
      try {
        await this.library.setFavorite(id, !entry.favorite);
        this.refreshFromLibrary();
        const draft = this.state.draft;
        if (draft?.id === id) this.set({ draft: { ...draft }, editorNonce: this.state.editorNonce + 1 });
      } catch (error) {
        this.reportError(error, "Could not update the favorite.");
      }
    }
    async move(id, direction) {
      if (!this.library) return;
      try {
        await this.library.reorder(id, direction);
        this.refreshFromLibrary();
      } catch (error) {
        this.reportError(error, "Could not reorder the template.");
      }
    }
    // ---- categories ----------------------------------------------------------
    async addCategory(name) {
      if (!this.library) return false;
      try {
        await this.library.addCategory(name);
        this.refreshFromLibrary();
        return true;
      } catch (error) {
        this.reportError(error, "Could not add the category.");
        return false;
      }
    }
    async renameCategory(id, name) {
      if (!this.library) return false;
      try {
        await this.library.renameCategory(id, name);
        this.refreshFromLibrary();
        return true;
      } catch (error) {
        this.reportError(error, "Could not rename the category.");
        return false;
      }
    }
    async deleteCategory(id) {
      if (!this.library) return;
      try {
        const moved = await this.library.deleteCategory(id);
        this.refreshFromLibrary();
        this.set({
          categoryFilter: this.state.categoryFilter === id ? null : this.state.categoryFilter,
          notice: {
            tone: "success",
            title: "Category deleted.",
            body: moved > 0 ? `${moved} template${moved === 1 ? "" : "s"} moved to General.` : void 0
          }
        });
      } catch (error) {
        this.reportError(error, "Could not delete the category.");
      }
    }
    // ---- import / export -----------------------------------------------------
    async buildExport(scope) {
      const library = this.requireLibrary();
      let ids;
      if (scope === "current") {
        const id = this.state.draft?.id;
        ids = id ? [id] : [];
      } else if (scope === "filtered") {
        ids = this.visibleEntries().map((entry) => entry.id);
      }
      const document2 = await library.exportDocument(ids);
      return JSON.stringify(document2, null, 2);
    }
    async buildExportIds(ids) {
      const document2 = await this.requireLibrary().exportDocument(ids);
      return JSON.stringify(document2, null, 2);
    }
    async importText(text, policy) {
      const library = this.requireLibrary();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        this.set({ notice: { tone: "error", title: "That is not valid JSON." } });
        return;
      }
      const document2 = library.parseDocument(parsed);
      if (!document2.ok) {
        this.set({ notice: { tone: "error", title: "Import rejected.", body: document2.error } });
        return;
      }
      try {
        const outcome = await library.importTemplates(document2.templates, policy, document2.categories);
        this.refreshFromLibrary();
        const parts = [
          `${outcome.added} added`,
          `${outcome.replaced} replaced`,
          `${outcome.skipped} skipped`,
          `${outcome.rejected.length + document2.errors.length} rejected`
        ];
        this.set({
          notice: {
            tone: outcome.rejected.length || document2.errors.length ? "warning" : "success",
            title: "Import finished.",
            body: parts.join(" \xB7 ")
          }
        });
      } catch (error) {
        this.reportError(error, "Import failed.");
      }
    }
    /** Adds the bundled starter library, skipping templates that already exist. */
    async importStarter(templates) {
      const library = this.requireLibrary();
      try {
        const outcome = await library.importTemplates(templates, "skip");
        this.refreshFromLibrary();
        this.set({
          notice: {
            tone: "success",
            title: "Starter templates loaded.",
            body: `${outcome.added} added \xB7 ${outcome.skipped} already present`
          }
        });
      } catch (error) {
        this.reportError(error, "Could not load the starter templates.");
      }
    }
    /** Rebuilds the index entry list after an external change. */
    reload() {
      this.refreshFromLibrary();
      this.set({ editorNonce: this.state.editorNonce + 1 });
    }
    /** Exposed for tests and for the editor's placeholder hints. */
    static normalizeFields = normalizeFields;
    static missingRequiredFields = missingRequiredFields;
    static createId = createId;
  };

  // src/templates/starter.ts
  var starterTemplates = [
    {
      "id": "starter-arch",
      "name": "Arch",
      "description": "Explain an existing architecture, its boundaries, and its real risks. Read-only.",
      "categoryId": "architecture",
      "body": "OBJECTIVE\nExplain how an existing system is structured and where its real risks are. Description before judgement.\n\nINPUTS\n- [SYSTEM OR MODULE]\n- [SCOPE: repository, package, service, or feature path]\n- [CONCERN: onboarding, change safety, scaling, debt]\n\nMETHOD\n1. Identify entry points and the main runtime paths. Follow one representative request or job end to end.\n2. Map modules with one responsibility each. Name the actual files or packages.\n3. Record dependency direction and cycles. Note where a lower layer imports a higher one.\n4. Describe data flow and ownership: who writes, who reads, the source of truth, how failure propagates.\n5. Assess coupling and cohesion at the seams: shared state, implicit contracts, duplicated rules.\n6. Compare the code with the stated conventions and list divergences instead of assuming intent.\n7. List technical debt with cost and trigger conditions, and risks with likelihood and impact.\n8. Cite path:line for every structural claim.\n\nOUTPUT\n- Context and scope\n- Module map with responsibilities and files\n- Dependency direction and cycles\n- Data flow for the traced path\n- Conventions observed and violated\n- Coupling and cohesion findings\n- Debt and risks, ranked\n- Recommendations, only where the evidence supports one\n- Unknowns\n\nRULES\n- Separate observed structure from inference. Mark inference.\n- Do not redesign here; note where design work is needed.\n- Avoid a file-by-file inventory. Describe structure, not volume.\n\nDONE WHEN\nA new engineer could locate any major responsibility from the map, and every risk has evidence.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 1,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-bug",
      "name": "Bug",
      "description": "Reproduce, diagnose to root cause, then apply a minimal fix with a regression test.",
      "categoryId": "bugs",
      "body": "OBJECTIVE\nFind the cause of a defect and fix it without masking it.\n\nINPUTS\n- [BUG DESCRIPTION]\n- [EXPECTED BEHAVIOR]\n- [ACTUAL BEHAVIOR]\n- [REPRODUCTION STEPS OR COMMAND]\n- [EVIDENCE: logs, stack trace, failing test, screenshot]\n\nMETHOD\nReproduce:\n1. Reproduce with the smallest command, test, or input. Record the exact steps.\n2. If reproduction is impossible, say what blocks it and what evidence would confirm the defect. Do not guess a fix.\n\nDiagnose:\n3. Read the failing path from the observed symptom back to the source. Cite path:line.\n4. Form one hypothesis at a time. State the evidence for and against it, and falsify it before moving on.\n5. Identify the root cause: the condition that makes the defect possible, not the line where it surfaces.\n6. Check whether other callers share the condition, and whether the defect lives in our code, a dependency, or the data.\n\nFix:\n7. Make the smallest change that removes the cause. Do not add defensive code that hides it, broaden catches, or disable checks.\n8. Add a regression test that fails before the fix and passes after.\n9. Check side effects: other callers, error paths, performance, concurrency, data already written.\n10. If the correct fix is large or crosses a boundary, propose it and stop rather than patching around it.\n\nOUTPUT\n- Reproduction, with the exact command or steps\n- Root cause with evidence (path:line)\n- Why the fix addresses the cause\n- Change summary and files\n- Regression test with before/after result\n- Side effects checked\n- Residual risk or follow-up\n\nDONE WHEN\nThe cause is evidenced, the regression test demonstrates the before/after difference, and the fix contains no unrelated changes.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 2,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-design",
      "name": "Design",
      "description": "Design a feature or architectural change with options and trade-offs. No code.",
      "categoryId": "architecture",
      "body": 'OBJECTIVE\nDesign a change that satisfies the requirements with the least necessary complexity.\n\nINPUTS\n- [REQUIREMENTS OR PROBLEM]\n- [CONSTRAINTS: scale, latency, compatibility, team, deadline]\n- [EXISTING SYSTEM AND PATTERNS]\n\nMETHOD\n1. Restate the requirements and the quality attributes that actually constrain the design. Separate must-have from nice-to-have.\n2. Identify the forces: data volume, read/write ratio, consistency, failure tolerance, deployment model, backward compatibility.\n3. Produce 2-3 options, including "smallest change to the current design". For each: shape, cost, risk, and what it makes harder later.\n4. Compare them in a trade-off table against those forces, not against taste.\n5. Recommend one option and state the condition that would reverse the decision.\n6. Define module responsibilities and boundaries. Assign each responsibility once.\n7. Define contracts at the boundaries: inputs, outputs, errors, invariants, versioning.\n8. Define dependency direction and forbid cycles.\n9. Define failure handling: timeouts, retries, partial failure, idempotency, degradation, and what the user sees.\n10. State scalability limits and the first thing that breaks at 10x.\n11. Plan migration and rollout: compatibility window, backfill, feature flag, rollback.\n12. State what you deliberately will not build, and why.\n\nRULES\n- Justify every new module, abstraction, or dependency by a requirement or a force. Otherwise remove it.\n- Apply SOLID and separation of concerns where they lower the cost of change; do not add layers to satisfy a principle.\n- Prefer the existing architecture. A new pattern needs a reason the old one cannot meet.\n- No code. No file-level task plan.\n\nOUTPUT\n- Requirements and forces\n- Options and trade-off table\n- Recommendation and reversal condition\n- Module responsibilities\n- Contracts\n- Dependency rules\n- Failure handling\n- Limits at 10x\n- Migration and rollback\n- Out of scope\n- Open questions\n\nDONE WHEN\nEvery requirement is addressed by the design, every boundary has a contract, and each added element has a stated justification.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**',
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 3,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-implement",
      "name": "Implement",
      "description": "Implement an approved change with a minimal diff and executed checks.",
      "categoryId": "implementation",
      "body": "OBJECTIVE\nImplement the approved change so it meets its acceptance criteria with a minimal, reviewable diff.\n\nINPUTS\n- [FEATURE OR CHANGE]\n- [REQUIREMENTS, ACCEPTANCE CRITERIA, OR APPROVED PLAN]\n- [AFFECTED MODULE]\n- [CONSTRAINTS]\n\nMETHOD\nBefore editing:\n1. Read the affected code and its nearest tests. Identify conventions to follow: structure, naming, error handling, logging, validation, state management.\n2. Restate the acceptance criteria you will satisfy. List assumptions separately. If a missing requirement would change the design, ask before editing; otherwise proceed and label the assumption.\n3. If the plan conflicts with the code, follow the code's reality and report the deviation.\n\nIMPLEMENTATION RULES\n- Follow the repository's AGENTS.md and local conventions; this template does not restate them.\n- Trace each change to a requirement or acceptance criterion. No speculative features, options, or abstractions.\n- Reuse existing components, helpers, types, and patterns before adding new ones.\n- Keep the diff focused. Do not refactor, rename, or reformat unrelated code; list it as a follow-up.\n- Handle error, loading, empty, and unauthorized states where the flow can reach them.\n- Use strong typing. No `any`, unchecked casts, or non-null assertions without justification.\n- Validate untrusted input at the boundary. Do not log secrets or personal data.\n- Preserve backward compatibility of public APIs, schemas, and config unless the requirement says otherwise.\n- Add or update tests for changed behavior, including the edge cases named in the requirements.\n\nVERIFICATION\nRun the repository's real checks: typecheck, lint, relevant tests, build. Use the project's scripts; do not invent commands. Record exact commands and outcomes.\n\nOUTPUT\n- Summary of the behavior change\n- Files changed, one line each\n- Requirement traceability: criterion to change\n- Tests added or updated, with exact commands and results\n- Deviations from the plan and why\n- Assumptions made\n- Not verified and residual risk\n\nDONE WHEN\nAcceptance criteria are met, checks were executed and reported, and the diff contains nothing unrelated.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 4,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-perf",
      "name": "Perf",
      "description": "Measure, locate, and fix a real performance bottleneck.",
      "categoryId": "performance",
      "body": "OBJECTIVE\nFix a measured performance problem without regressing correctness.\n\nINPUTS\n- [SLOW PATH OR FEATURE]\n- [SYMPTOM AND METRIC: latency, throughput, memory, CPU, query count]\n- [ENVIRONMENT AND DATA SCALE]\n- [TARGET OR SLO]\n\nMETHOD\n1. Establish a baseline with a reproducible measurement: command, dataset, environment, and the number. No number, no optimization.\n2. Profile or trace to find where time or memory is spent. Cite the profile output or query plan.\n3. Name the bottleneck and its share of the total. If the bottleneck is elsewhere, say so and stop.\n4. List 2-3 options with expected gain, cost, and risk. Prefer the smallest change with the largest measured effect.\n5. Implement one change. Keep it separate from unrelated edits.\n6. Re-measure with the identical method and dataset. Report before and after.\n7. Add a guard: benchmark, budget test, query-count assertion, or documented threshold.\n8. Check correctness, error paths, and behavior under load or concurrency.\n\nCONSTRAINTS\n- No speculative micro-optimization, caching, or parallelism without a measurement that justifies it.\n- Do not trade correctness, durability, or readability for an unmeasured gain.\n- Do not benchmark on data that does not resemble production.\n\nOUTPUT\n- Baseline measurement and method\n- Bottleneck with evidence\n- Options considered\n- Change made\n- After measurement, same method\n- Remaining bottleneck\n- Correctness checks\n- Trade-offs and risks\n\nDONE WHEN\nBefore and after numbers come from the same method, the change is justified by the measurement, and correctness checks pass.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 5,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-plan",
      "name": "Plan",
      "description": "Produce an implementation plan before editing. Planning only, no file changes.",
      "categoryId": "requirements",
      "body": "OBJECTIVE\nProduce an implementation plan for an approved requirement set. Planning only.\n\nHARD STOP\nDo not create, edit, delete, move, or format files. Do not run state-changing commands (installs, migrations, generators, git writes). Read-only inspection only. If something cannot be verified without changing state, report it as unknown.\n\nINPUTS\n- [APPROVED REQUIREMENTS OR THE CHANGE TO MAKE]\n- [AFFECTED MODULE OR ENTRY POINT]\n- [CONSTRAINTS: compatibility, deadline, dependencies]\n\nMETHOD\n1. Locate current behavior: entry points, call path, data stores, tests. Cite path:line for each claim.\n2. Map affected modules and the dependency-direction change each one implies.\n3. List dependencies: internal modules, external packages, config, migrations, environment variables.\n4. Propose the smallest coherent change. Extend existing patterns before introducing abstractions.\n5. For each step, name files and symbols, the expected change, and how it is verified.\n6. State architectural impact: boundaries, contracts, data shapes, failure modes.\n7. List risks with likelihood, impact, and mitigation.\n8. Define the test strategy: which level covers which behavior, and which existing tests may break.\n9. Order steps so the repository stays working after each one.\n\nOUTPUT\n1. Current behavior, with evidence\n2. Affected modules and dependencies\n3. Proposed changes, numbered, with file paths\n4. Architectural impact\n5. Risks and mitigations\n6. Test strategy\n7. Step sequence\n8. Out of scope\n9. Unresolved questions\n\nRULES\n- One step = one reviewable change.\n- Follow existing conventions and AGENTS.md; do not restate them.\n- Do not assume an API, schema, or helper exists. Verify it or mark it as an assumption.\n- If two designs are viable, recommend one and name, in one line, what would change the recommendation.\n\nDONE WHEN\nEvery requirement maps to at least one step, every step is verifiable, no step depends on an undecided choice, and nothing has been modified.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 6,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-refactor",
      "name": "Refactor",
      "description": "Improve internal structure while preserving observable behavior.",
      "categoryId": "refactoring",
      "body": "OBJECTIVE\nImprove internal structure while preserving observable behavior exactly.\n\nINPUTS\n- [TARGET AREA]\n- [GOAL: readability, duplication, coupling, naming, testability]\n- [MUST NOT CHANGE: public API, schema, behavior, performance envelope]\n\nMETHOD\n1. State the concrete problem this refactor solves. If it is a preference with no measurable cost, stop and say so.\n2. Capture a baseline: run the relevant tests and record behavior that must not change.\n3. Work in small increments. After each increment, run the checks and keep the repository working.\n4. Change structure only. Do not fix nearby bugs, add features, or reformat unrelated code; report them instead.\n5. Introduce an abstraction only when it removes real duplication or marks a real boundary. A single use is not a pattern.\n6. Preserve public contracts, caller-visible error messages, and ordering guarantees.\n7. Re-run the same baseline checks and compare results.\n\nOUTPUT\n- Objective and problem\n- Baseline: checks run and results\n- Steps taken, each independently reviewable\n- Evidence that behavior is unchanged\n- The new structure in one paragraph\n- Unrelated issues found but not fixed\n- Not verified\n\nDONE WHEN\nThe same checks pass before and after, no external behavior changed, and the diff contains only the refactor.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 7,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-research",
      "name": "Research",
      "description": "Answer specific questions about unfamiliar code with cited evidence.",
      "categoryId": "research",
      "body": "OBJECTIVE\nAnswer specific questions about unfamiliar code so a decision or implementation can proceed.\n\nINPUTS\n- [QUESTION]\n- [AREA: path, symbol, module, or dependency]\n- [DECISION THIS INFORMS]\n\nMETHOD\n1. Start from the named area. Find entry points by searching symbols and call sites, not by reading directories.\n2. Answer each question with evidence: path:line plus a short quote or paraphrase.\n3. Trace the relevant path end to end: input, transformation, storage, output, error path.\n4. Record existing patterns the solution should reuse, including naming, error handling, and test style.\n5. Record constraints that limit the solution: versions, API contracts, feature flags, config.\n6. Label each statement VERIFIED (evidence cited) or INFERRED (reasoning only).\n7. Stop when the questions are answered. Do not summarize the repository.\n\nCONSTRAINTS\n- Read only files relevant to the questions.\n- Do not modify code or produce a full design.\n- Do not repeat file contents. Quote the minimum needed.\n- Prefer symbol search and call-site tracing over whole-file reads.\n\nOUTPUT\n- Answer: one short paragraph per question\n- Evidence: bullets with path:line\n- Data flow: numbered path for the relevant flow\n- Patterns to reuse\n- Constraints discovered\n- Unknowns needing a decision or an owner\n\nDONE WHEN\nEach question has an evidence-backed answer or is explicitly unresolved, and every claim is marked verified or inferred.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 8,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-review",
      "name": "Review",
      "description": "Independent review of a diff with severity-ranked, evidenced findings. Read-only.",
      "categoryId": "review",
      "body": 'OBJECTIVE\nIndependently assess a change for defects and risk. Do not modify code.\n\nINPUTS\n- [DIFF, BRANCH, OR FILE SCOPE]\n- [INTENDED BEHAVIOR, if known]\n- [RISK AREAS: auth, payments, data, concurrency, migrations]\n\nMETHOD\n1. Read the diff, then the surrounding code needed to judge it. Check callers and contracts, not just changed lines.\n2. Verify each finding against the code before reporting it. If it depends on an assumption, label it POSSIBLE and state the condition.\n3. Check categories in this order: correctness, security, race conditions, data integrity and migrations, performance, architectural violations, maintainability, test coverage.\n4. For tests: do they fail when the behavior breaks? Do they cover the stated edge cases? Are they isolated and deterministic?\n5. Check for accidental changes: debug output, secrets, commented code, unrelated edits, dependency drift.\n6. Do not report formatting or naming preferences as defects unless a project convention is violated.\n\nOUTPUT\nVerdict: APPROVE / APPROVE WITH NITS / REQUEST CHANGES\n\nFindings, ordered by severity:\n- Severity: BLOCKER / MAJOR / MINOR / NIT\n- Location: path:line\n- Evidence: what the code actually does\n- Impact: what goes wrong, and when\n- Fix: the smallest correct change\n\nThen: open questions, and what was not reviewed.\n\nRULES\n- No finding without evidence. "Could be slow" is not a finding without a hot path or measurement.\n- Do not restate the diff. If there are no findings, say so plainly.\n\nDONE WHEN\nEvery finding is evidenced and actionable, and the verdict follows from the findings.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**',
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 9,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-spec",
      "name": "Spec",
      "description": "Turn a vague feature request into testable requirements. No design, no code.",
      "categoryId": "requirements",
      "body": `OBJECTIVE
Produce a requirements specification another engineer can plan and test from without asking follow-up questions.

INPUTS
Fill these fields from the task text that follows the template.
- [FEATURE DESCRIPTION]
- [BUSINESS CONTEXT]
- [TARGET USERS]
- [CONSTRAINTS: policy, compatibility, deadline]

METHOD
1. Restate the request in one sentence. If your restatement differs from the intent, stop and ask.
2. Identify actors and their goals. Describe the job to be done, not the proposed solution.
3. Derive functional requirements R1..Rn. Each must be observable and testable. Reject "fast", "robust", "user-friendly" as requirements.
4. Derive non-functional requirements with thresholds where possible: latency, throughput, availability, privacy, accessibility, compatibility.
5. List edge cases and failure paths: empty, boundary, invalid input, permission denied, partial failure, retry, concurrency, existing-data migration.
6. Write acceptance criteria AC1..ACn. Each states an observable outcome and cites the requirement it verifies.
7. Record open questions as BLOCKING or NON-BLOCKING. For non-blocking ones, state the assumption you will proceed with.
8. Keep requirements separate from implementation suggestions. Put suggestions in one short, clearly labelled section or drop them.

CONSTRAINTS
- Do not design, plan files, or write code.
- Do not invent business rules, limits, or integrations. Unknowns become open questions.
- Read code only to confirm a constraint you must state, and cite path:line. No codebase tour.
- Use the domain's language, not UI labels.
- Aim for one page. Cut restatement and adjectives that carry no requirement.

OUTPUT
Problem \xB7 Context and actors \xB7 Functional requirements \xB7 Non-functional requirements \xB7 Edge cases \xB7 Acceptance criteria \xB7 Open questions \xB7 Assumptions

DONE WHEN
Every requirement is testable, every acceptance criterion maps to a requirement ID, no implementation steps appear, and every unknown is an open question or a labelled assumption.

If an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.

**Task input:**`,
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 10,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-tests",
      "name": "Tests",
      "description": "Design the smallest test set that gives real confidence in a change.",
      "categoryId": "testing",
      "body": "OBJECTIVE\nDesign the smallest test set that gives real confidence in the change.\n\nINPUTS\n- [BEHAVIOR OR CHANGE]\n- [RISK AREAS]\n- [TEST STACK: framework, existing suites, fixtures]\n\nMETHOD\n1. Map each requirement or risk to the level that can actually catch it: unit for pure logic and branching, integration for contracts, persistence, HTTP, and config boundaries, end-to-end only for critical paths that cross the system.\n2. For each behavior, list the cases: happy path, boundary values, empty and invalid input, error and timeout paths, permission failure, concurrency or retry where relevant.\n3. Choose fixtures and fakes at the boundary (network, clock, filesystem, database). Do not mock the unit under test or its internal collaborators.\n4. Make tests deterministic: fixed time, seeded randomness, no shared state, no ordering dependence, no real network.\n5. For defects, add a regression test that fails without the fix.\n6. Name tests by behavior and expected outcome, not by method name.\n7. State what you deliberately do not test, and why: cost, flakiness, or covered elsewhere.\n\nOUTPUT\n- Requirement to test-level map\n- Test list: name, level, setup, expected result\n- Fixtures and mocks\n- Commands to run them\n- Gaps with justification\n\nDONE WHEN\nEvery stated requirement and risk has a covering test or a justified gap, and no test depends on execution order.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 11,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    },
    {
      "id": "starter-verify",
      "name": "Verify",
      "description": "Check readiness to ship by running real checks and reporting evidence.",
      "categoryId": "testing",
      "body": "OBJECTIVE\nConfirm the change is ready to ship, or state precisely what blocks it.\n\nINPUTS\n- [CHANGE SCOPE: branch, diff, files]\n- [ACCEPTANCE CRITERIA]\n\nMETHOD\n1. Discover the real commands from package scripts, Makefile, CI config, or docs. Do not invent commands.\n2. Run typecheck, lint, the tests relevant to the change, and the production build. Run the full suite when the change touches shared code.\n3. Map each acceptance criterion to evidence: a test, a manual check, or a code reference. Mark unmet criteria.\n4. Inspect the diff for unintended changes: debug output, secrets, commented code, unrelated files, lockfile or dependency drift, generated artifacts.\n5. Check that checks were not weakened: skipped tests, loosened assertions, disabled lint rules, new ignore entries.\n6. Report exact commands and outcomes. A check that could not run is BLOCKED, not passed.\n\nOUTPUT\nVerdict: READY / NOT READY\n\n| Check | Command | Result | Evidence |\n\nUse PASSED / FAILED / SKIPPED / BLOCKED. For a failure, include the first actionable line of output.\nThen: unmet acceptance criteria, unintended changes, unverified items, residual risk.\n\nRULES\n- Never claim a command succeeded unless you ran it and saw the output.\n- Do not fix issues here; report them. Fixing is a separate step with its own verification.\n\nDONE WHEN\nEvery check has an outcome, every acceptance criterion is marked met or unmet, and nothing is reported as passing without evidence.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
      "fields": [],
      "tags": [
        "engineering",
        "starter"
      ],
      "favorite": false,
      "order": 12,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z",
      "revision": 1
    }
  ];

  // src/ui/dom.ts
  function el2(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function field2(label, control, hint) {
    const wrapper = el2("div");
    const labelNode = el2("label", "ps-label", label);
    wrapper.append(labelNode, control);
    if (hint) wrapper.append(el2("p", "ps-hint", hint));
    return wrapper;
  }
  function textarea(className, placeholder = "") {
    const node = el2("textarea", `ps-textarea ps-mono ${className}`);
    node.placeholder = placeholder;
    node.spellcheck = false;
    return node;
  }
  function input(placeholder = "", mono2 = false) {
    const node = el2("input", `ps-input${mono2 ? " ps-mono" : ""}`);
    node.type = "text";
    node.placeholder = placeholder;
    return node;
  }
  function relativeTime(iso) {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "";
    const diff = Date.now() - then;
    const minutes = Math.floor(diff / 6e4);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return new Date(iso).toLocaleDateString();
  }
  function isTextEntry(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target instanceof HTMLTextAreaElement) return true;
    if (target instanceof HTMLInputElement) return true;
    return target.isContentEditable;
  }

  // src/ui/dialogs.ts
  var openCount = 0;
  function openDialog(options) {
    const overlay = el2("div", "ps-overlay");
    const dialog = el2("div", options.wide ? "ps-dialog" : "ps-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", options.title);
    dialog.style.position = "relative";
    if (options.wide) dialog.style.maxWidth = "680px";
    const heading = el2("h3", void 0, options.title);
    dialog.append(heading, options.body);
    const actions2 = el2("div", "ps-actions");
    dialog.append(actions2);
    overlay.append(dialog);
    const close = () => {
      if (!overlay.parentNode) return;
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      openCount = Math.max(0, openCount - 1);
      options.onClose?.();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    for (const action of options.actions) {
      const holder = el2("span");
      actions2.append(holder);
      mountButton(holder, {
        label: action.label,
        variant: action.variant ?? "secondary",
        size: "sm",
        disabled: action.disabled,
        onClick: () => {
          void Promise.resolve(action.onClick()).then(() => {
            if (!action.keepOpen) close();
          }).catch(() => void 0);
        }
      });
    }
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", onKeyDown);
    document.body.append(overlay);
    openCount += 1;
    const firstInput = overlay.querySelector("input, textarea, button");
    firstInput?.focus();
    return { close };
  }
  function isDialogOpen() {
    return openCount > 0;
  }
  function confirmDialog(title, message, confirmLabel, destructive = false) {
    return new Promise((resolve) => {
      let settled = false;
      const decide = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
        handle.close();
      };
      const body = el2("p", "ps-mini", message);
      body.style.margin = "0";
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
          { label: "Cancel", onClick: () => decide(false) },
          {
            label: confirmLabel,
            variant: destructive ? "destructive" : "default",
            onClick: () => decide(true)
          }
        ]
      });
    });
  }
  function openExportDialog(store2, json, scopeLabel) {
    const body = el2("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "8px";
    const area = textarea("ps-canonical");
    area.value = json;
    area.readOnly = true;
    area.style.height = "40vh";
    area.style.minHeight = "200px";
    const meta = el2("p", "ps-hint", `${scopeLabel} \xB7 ${json.length.toLocaleString()} characters`);
    const hint = el2(
      "p",
      "ps-hint",
      json.length > CLIPBOARD_LIMIT ? `Longer than the ${CLIPBOARD_LIMIT.toLocaleString()}-character clipboard limit. Click the text, press Ctrl/Cmd+A, then Ctrl/Cmd+C.` : "Copy saves this JSON to the clipboard. Keep it as your backup."
    );
    body.append(area, meta, hint);
    const canCopy = json.length <= CLIPBOARD_LIMIT;
    openDialog({
      title: "Export templates",
      body,
      wide: true,
      actions: [
        {
          label: canCopy ? "Copy" : "Select all",
          variant: "default",
          keepOpen: true,
          onClick: async () => {
            if (!canCopy) {
              area.focus();
              area.select();
              return;
            }
            await store2.copyText(json);
          }
        },
        { label: "Close", onClick: () => void 0 }
      ]
    });
  }
  function openImportDialog(store2) {
    const body = el2("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "10px";
    const area = textarea("ps-canonical", "Paste a Prompt Studio JSON export here");
    area.style.height = "28vh";
    area.style.minHeight = "140px";
    const fileRow = el2("div", "ps-row");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.className = "ps-input ps-grow";
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      area.value = await file.text();
      area.dispatchEvent(new Event("input"));
    });
    const policyRow = el2("div", "ps-row");
    const policyLabel = el2("label", "ps-label", "If a template already exists");
    policyLabel.style.margin = "0";
    const policy = document.createElement("select");
    policy.className = "ps-select ps-grow";
    for (const [value, label] of [
      ["skip", "Skip it (recommended)"],
      ["copy", "Import as a copy"],
      ["replace", "Replace the existing template"]
    ]) {
      const option = el2("option", void 0, label);
      option.value = value;
      policy.append(option);
    }
    policyRow.append(policyLabel, policy);
    fileRow.append(fileInput);
    body.append(area, fileRow, policyRow);
    openDialog({
      title: "Import templates",
      body,
      wide: true,
      actions: [
        {
          label: "Import",
          variant: "default",
          onClick: async () => {
            const text = area.value.trim();
            if (!text) {
              area.focus();
              return;
            }
            await store2.importText(text, policy.value);
          }
        },
        { label: "Cancel", onClick: () => void 0 }
      ]
    });
  }
  function openCategoriesDialog(store2) {
    const body = el2("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "10px";
    const list = el2("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "6px";
    const render = (categories) => {
      clear(list);
      for (const category of categories) {
        const row = el2("div", "ps-field-row");
        const nameInput = input();
        nameInput.value = category.name;
        nameInput.className = "ps-input ps-grow";
        const save = el2("span");
        mountButton(save, {
          label: "Rename",
          variant: "secondary",
          size: "xs",
          onClick: async () => {
            const next = nameInput.value.trim();
            if (next === category.name) return;
            if (await store2.renameCategory(category.id, next)) render(store2.getState().categories);
          }
        });
        const remove = el2("span");
        mountButton(remove, {
          label: "Delete",
          variant: "ghost",
          size: "xs",
          onClick: async () => {
            const confirmed = await confirmDialog(
              `Delete "${category.name}"?`,
              "Templates in this category move to General. No template is deleted.",
              "Delete category",
              true
            );
            if (!confirmed) return;
            await store2.deleteCategory(category.id);
            render(store2.getState().categories);
          }
        });
        if (category.id === "general") {
          save.setAttribute("aria-hidden", "true");
          save.style.visibility = "hidden";
        }
        row.append(nameInput, save, remove);
        list.append(row);
      }
    };
    render(store2.getState().categories);
    const addRow = el2("div", "ps-field-row");
    const newName = input("New category name");
    const add = el2("span");
    mountButton(add, {
      label: "Add",
      variant: "default",
      size: "xs",
      onClick: async () => {
        const name = newName.value.trim();
        if (!name) {
          newName.focus();
          return;
        }
        if (await store2.addCategory(name)) {
          newName.value = "";
          render(store2.getState().categories);
        }
      }
    });
    addRow.append(newName, add);
    body.append(list, el2("p", "ps-hint", "Deleting a category never deletes its templates."), addRow);
    openDialog({
      title: "Categories",
      body,
      wide: true,
      actions: [{ label: "Close", onClick: () => void 0 }]
    });
  }
  function openFieldDialog(title, initial, onSubmit) {
    const body = el2("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "10px";
    const labelInput = input("Feature name");
    labelInput.value = initial.label;
    const keyInput = input("feature_name", true);
    keyInput.value = initial.key;
    const descriptionInput = input("What this field means");
    descriptionInput.value = initial.description;
    const placeholderInput = input("Shown inside the empty field");
    placeholderInput.value = initial.placeholder;
    const defaultInput = input("Used when the field is left empty");
    defaultInput.value = initial.defaultValue;
    const kind = document.createElement("select");
    kind.className = "ps-select";
    for (const [value, label] of [
      ["text", "Single line"],
      ["multiline", "Multiple lines"]
    ]) {
      const option = el2("option", void 0, label);
      option.value = value;
      kind.append(option);
    }
    kind.value = initial.kind;
    const requiredWrap = el2("label", "ps-row");
    const required = document.createElement("input");
    required.type = "checkbox";
    required.checked = initial.required;
    requiredWrap.append(required, el2("span", void 0, "Required"));
    const error = el2("p", "ps-hint ps-field-error");
    error.style.display = "none";
    body.append(
      field2("Label", labelInput),
      field2("Key", keyInput, "Used as {{key}} in the template body."),
      field2("Description", descriptionInput),
      field2("Placeholder", placeholderInput),
      field2("Default value", defaultInput),
      field2("Input type", kind),
      requiredWrap,
      error
    );
    const submit = () => {
      const label = labelInput.value.trim();
      const key = keyInput.value.trim();
      if (!label || !key) {
        error.textContent = "Label and key are required.";
        error.style.display = "block";
        return;
      }
      if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(key)) {
        error.textContent = "Key must start with a letter and use letters, digits, or underscores.";
        error.style.display = "block";
        return;
      }
      onSubmit({
        key,
        label,
        description: descriptionInput.value.trim(),
        placeholder: placeholderInput.value.trim(),
        defaultValue: defaultInput.value.trim(),
        required: required.checked,
        kind: kind.value === "multiline" ? "multiline" : "text"
      });
    };
    openDialog({
      title,
      body,
      wide: true,
      actions: [
        { label: "Save field", variant: "default", onClick: submit },
        { label: "Cancel", onClick: () => void 0 }
      ]
    });
    labelInput.addEventListener("input", () => {
      if (keyInput.dataset.touched === "true") return;
      const key = labelInput.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
      keyInput.value = key;
    });
    keyInput.addEventListener("input", () => {
      keyInput.dataset.touched = "true";
    });
  }
  function toTemplateField(value) {
    const field3 = {
      key: value.key,
      label: value.label,
      required: value.required,
      kind: value.kind
    };
    if (value.description) field3.description = value.description;
    if (value.placeholder) field3.placeholder = value.placeholder;
    if (value.defaultValue) field3.defaultValue = value.defaultValue;
    return field3;
  }

  // src/ui/editor.ts
  var EditorView = class {
    root;
    store;
    callbacks;
    draft = null;
    handles = [];
    titleNode = null;
    starHolder = null;
    promptArea = null;
    canonicalArea = null;
    counterNode = null;
    warningSlot = null;
    manualNote = null;
    placeholderSlot = null;
    placeholderKey = "";
    constructor(store2, callbacks) {
      this.store = store2;
      this.callbacks = callbacks;
      this.root = el2("div", "ps-editor");
    }
    destroy() {
      for (const handle of this.handles) handle.dispose();
      this.handles = [];
      clear(this.root);
    }
    mount(draft) {
      this.destroy();
      this.draft = draft;
      this.promptArea = null;
      this.canonicalArea = null;
      const head = el2("div", "ps-head");
      const backHolder = el2("span");
      head.append(backHolder);
      this.handles.push(
        mountButton(backHolder, {
          label: "Back",
          variant: "ghost",
          size: "xs",
          onClick: () => this.callbacks.onBack()
        })
      );
      this.titleNode = el2("div", "ps-head-title", draft.name || (draft.isNew ? "New template" : "Untitled"));
      head.append(this.titleNode);
      this.starHolder = el2("span");
      head.append(this.starHolder);
      if (!draft.isNew && draft.id) {
        const id = draft.id;
        const entry = this.store.getState().entries.find((item) => item.id === id);
        this.handles.push(
          mountButton(this.starHolder, {
            label: entry?.favorite ? "\u2605" : "\u2606",
            variant: "ghost",
            size: "xs",
            onClick: () => void this.store.toggleFavorite(id)
          })
        );
        const menuHolder = el2("span");
        head.append(menuHolder);
        this.handles.push(
          mountMenu(menuHolder, {
            label: "Actions",
            variant: "ghost",
            size: "xs",
            items: [
              { id: "duplicate", label: "Duplicate" },
              { id: "move-up", label: "Move up" },
              { id: "move-down", label: "Move down" },
              { id: "export", label: "Export this template" },
              { separator: true },
              { id: "delete", label: "Delete", destructive: true }
            ],
            onSelect: (action) => {
              if (action === "duplicate") this.callbacks.onDuplicate(id);
              if (action === "move-up") this.callbacks.onMove(id, -1);
              if (action === "move-down") this.callbacks.onMove(id, 1);
              if (action === "export") this.callbacks.onExport(id);
              if (action === "delete") this.callbacks.onDelete(id);
            }
          })
        );
      }
      const tabsHolder = el2("div", "ps-tabs");
      this.handles.push(
        mountTabs(tabsHolder, {
          items: [
            { id: "prompt", label: "Prompt" },
            { id: "template", label: "Template" }
          ],
          activeId: draft.tab,
          onChange: (id) => this.store.setEditorTab(id)
        })
      );
      const body = el2("div", "ps-body");
      const foot = el2("div", "ps-foot");
      this.root.append(head, tabsHolder, body, foot);
      if (draft.tab === "prompt") this.buildPromptTab(body, foot);
      else this.buildTemplateTab(body, foot);
      this.update(draft);
    }
    /** Called on every store notification; never rebuilds the active inputs. */
    update(draft) {
      this.draft = draft;
      if (this.titleNode) this.titleNode.textContent = draft.name || (draft.isNew ? "New template" : "Untitled");
      if (draft.tab === "prompt") {
        if (this.promptArea && this.promptArea.value !== draft.prompt) {
          const start = this.promptArea.selectionStart;
          const end = this.promptArea.selectionEnd;
          this.promptArea.value = draft.prompt;
          try {
            this.promptArea.setSelectionRange(start, end);
          } catch {
          }
        }
        this.paintPromptMeta(draft);
        if (this.manualNote) this.manualNote.hidden = !draft.manualEdits;
      } else {
        this.paintPlaceholders(draft);
      }
    }
    /** Lists placeholders in the body that have no field yet, as you type. */
    paintPlaceholders(draft) {
      if (!this.placeholderSlot) return;
      const missing = listPlaceholders(draft.canonicalBody).filter(
        (key) => !draft.fields.some((templateField) => templateField.key === key)
      );
      const signature = missing.join("|");
      if (signature === this.placeholderKey) return;
      this.placeholderKey = signature;
      clear(this.placeholderSlot);
      if (missing.length === 0) return;
      const hint = el2("div", "ps-block");
      hint.append(el2("p", "ps-hint", `Placeholders without a field: ${missing.map((item) => `{{${item}}}`).join(", ")}`));
      const row = el2("div", "ps-actions-row");
      for (const missingKey of missing) {
        const holder = el2("span");
        row.append(holder);
        this.handles.push(
          mountButton(holder, {
            label: `Add {{${missingKey}}}`,
            variant: "ghost",
            size: "xs",
            onClick: () => {
              this.store.addField(
                toTemplateField({
                  key: missingKey,
                  label: missingKey.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase()),
                  description: "",
                  placeholder: "",
                  required: false,
                  defaultValue: "",
                  kind: "multiline"
                })
              );
            }
          })
        );
      }
      hint.append(row);
      this.placeholderSlot.append(hint);
    }
    paintPromptMeta(draft) {
      if (!this.counterNode) return;
      const length = draft.prompt.trim().length;
      this.counterNode.textContent = `${length.toLocaleString()} / ${COMPOSE_LIMIT.toLocaleString()}`;
      this.counterNode.dataset.state = length > COMPOSE_LIMIT ? "error" : length > COMPOSE_LIMIT * 0.9 ? "warn" : "ok";
      const missing = missingRequiredFields(draft.fields, draft.values);
      if (!this.warningSlot) return;
      clear(this.warningSlot);
      if (missing.length > 0) {
        this.warningSlot.append(
          el2("p", "ps-hint ps-missing", `Required: ${missing.map((item) => item.label).join(", ")}`)
        );
      }
      if (length > COMPOSE_LIMIT) {
        this.warningSlot.append(
          el2("p", "ps-hint ps-missing", "Over the composer limit. Shorten the prompt, or copy and paste in parts.")
        );
      }
    }
    buildPromptTab(body, foot) {
      const draft = this.draft;
      if (!draft) return;
      if (draft.fields.length > 0) {
        const block = el2("div", "ps-block");
        block.append(el2("div", "ps-block-title", "Fields"));
        for (const templateField of draft.fields) {
          const value = draft.values[templateField.key] ?? "";
          const control = templateField.kind === "multiline" ? textarea("", templateField.placeholder ?? "") : input(templateField.placeholder ?? "");
          control.value = value;
          control.addEventListener("input", () => this.store.setFieldValue(templateField.key, control.value));
          const label = `${templateField.label}${templateField.required ? " *" : ""}`;
          const wrapper = field2(label, control, templateField.description);
          block.append(wrapper);
        }
        const note = el2("div", "ps-actions-row");
        note.append(el2("span", "ps-hint", "The prompt was edited by hand, so fields no longer update it."));
        const applyHolder = el2("span");
        note.append(applyHolder);
        this.handles.push(
          mountButton(applyHolder, {
            label: "Apply fields",
            variant: "secondary",
            size: "xs",
            onClick: () => this.store.applyFieldValues()
          })
        );
        note.hidden = !draft.manualEdits;
        this.manualNote = note;
        block.append(note);
        body.append(block);
      } else if (!draft.isNew && draft.id) {
        const row = el2("div", "ps-actions-row");
        const saveHolder = el2("span");
        row.append(saveHolder);
        this.handles.push(
          mountButton(saveHolder, {
            label: "Save prompt as template body",
            variant: "ghost",
            size: "xs",
            onClick: () => {
              this.store.setCanonicalBody(draft.prompt);
              void this.store.saveDraft();
            }
          })
        );
        body.append(row);
      }
      this.promptArea = textarea("ps-prompt", "The prompt that will be inserted");
      this.promptArea.value = draft.prompt;
      this.promptArea.addEventListener("input", () => {
        if (this.promptArea) this.store.setPrompt(this.promptArea.value);
      });
      body.append(
        field2("Prompt", this.promptArea, "This is what gets inserted. Edit it freely; the template stays intact.")
      );
      this.warningSlot = el2("div");
      body.append(this.warningSlot);
      this.counterNode = el2("span", "ps-foot-meta");
      foot.append(this.counterNode);
      const replaceHolder = el2("span");
      const appendHolder = el2("span");
      const copyHolder = el2("span");
      foot.prepend(replaceHolder, appendHolder, copyHolder);
      this.handles.push(
        mountButton(replaceHolder, {
          label: "Replace composer",
          variant: "default",
          size: "sm",
          onClick: () => void this.store.insert("replace")
        }),
        mountButton(appendHolder, {
          label: "Append",
          variant: "secondary",
          size: "sm",
          onClick: () => void this.store.insert("append")
        }),
        mountButton(copyHolder, {
          label: "Copy",
          variant: "ghost",
          size: "sm",
          onClick: () => void this.store.copyPrompt()
        })
      );
    }
    buildTemplateTab(body, foot) {
      const draft = this.draft;
      if (!draft) return;
      const nameInput = input("Template name");
      nameInput.value = draft.name;
      nameInput.addEventListener("input", () => this.store.setDraftMeta({ name: nameInput.value }));
      const descriptionInput = input("What this template is for");
      descriptionInput.value = draft.description;
      descriptionInput.addEventListener("input", () => this.store.setDraftMeta({ description: descriptionInput.value }));
      const category = document.createElement("select");
      category.className = "ps-select";
      for (const item of this.store.getState().categories) {
        const option = el2("option", void 0, item.name);
        option.value = item.id;
        category.append(option);
      }
      category.value = draft.categoryId;
      category.addEventListener("change", () => this.store.setDraftMeta({ categoryId: category.value }));
      const tagsInput = input("engineering, feature");
      tagsInput.value = draft.tags;
      tagsInput.addEventListener("input", () => this.store.setDraftMeta({ tags: tagsInput.value }));
      body.append(
        field2("Name", nameInput),
        field2("Description", descriptionInput),
        field2("Category", category),
        field2("Tags", tagsInput, "Comma separated. Search matches them.")
      );
      const fieldsBlock = el2("div", "ps-block");
      const fieldsHead = el2("div", "ps-actions-row");
      fieldsHead.append(el2("div", "ps-block-title", "Structured fields"));
      const addHolder = el2("span");
      fieldsHead.append(addHolder);
      this.handles.push(
        mountButton(addHolder, {
          label: "Add field",
          variant: "secondary",
          size: "xs",
          onClick: () => {
            openFieldDialog("Add field", emptyField(), (value) => this.store.addField(toTemplateField(value)));
          }
        })
      );
      fieldsBlock.append(fieldsHead);
      if (draft.fields.length === 0) {
        fieldsBlock.append(el2("p", "ps-hint", "No fields. The prompt is a single editable text."));
      }
      for (const templateField of draft.fields) {
        const row = el2("div", "ps-field-row");
        const info = el2("div", "ps-grow");
        info.append(
          el2("div", void 0, `${templateField.label}${templateField.required ? " *" : ""}`),
          el2("div", "ps-mini", `{{${templateField.key}}} \xB7 ${templateField.kind === "multiline" ? "multiline" : "text"}`)
        );
        const editHolder = el2("span");
        const removeHolder = el2("span");
        row.append(info, editHolder, removeHolder);
        this.handles.push(
          mountButton(editHolder, {
            label: "Edit",
            variant: "ghost",
            size: "xs",
            onClick: () => {
              openFieldDialog(
                `Edit "${templateField.label}"`,
                {
                  key: templateField.key,
                  label: templateField.label,
                  description: templateField.description ?? "",
                  placeholder: templateField.placeholder ?? "",
                  required: templateField.required,
                  defaultValue: templateField.defaultValue ?? "",
                  kind: templateField.kind
                },
                (value) => this.store.updateField(templateField.key, toTemplateField(value))
              );
            }
          }),
          mountButton(removeHolder, {
            label: "Remove",
            variant: "ghost",
            size: "xs",
            onClick: () => this.store.removeField(templateField.key)
          })
        );
        fieldsBlock.append(row);
      }
      body.append(fieldsBlock);
      this.placeholderSlot = el2("div");
      this.placeholderKey = "";
      body.append(this.placeholderSlot);
      this.paintPlaceholders(draft);
      this.canonicalArea = textarea("ps-canonical", "The template body. Use {{field_key}} for structured values.");
      this.canonicalArea.value = draft.canonicalBody;
      this.canonicalArea.addEventListener("input", () => {
        if (this.canonicalArea) this.store.setCanonicalBody(this.canonicalArea.value);
      });
      body.append(
        field2("Template body", this.canonicalArea, "Saved as the template. The Prompt tab is what gets inserted.")
      );
      const saveHolder = el2("span");
      foot.append(saveHolder);
      this.handles.push(
        mountButton(saveHolder, {
          label: draft.isNew ? "Create template" : "Save changes",
          variant: "default",
          size: "sm",
          loading: this.store.getState().saving,
          onClick: () => void this.store.saveDraft()
        })
      );
      if (draft.isNew) {
        foot.append(el2("span", "ps-hint", "Saves into your library."));
      }
    }
  };
  function emptyField() {
    return {
      key: "",
      label: "",
      description: "",
      placeholder: "",
      required: false,
      defaultValue: "",
      kind: "multiline"
    };
  }

  // src/ui/app.ts
  var App = class {
    store;
    host;
    editor;
    root;
    libraryPane;
    editorPane;
    listRoot;
    noticeRoot;
    editorEmptyRoot;
    list = null;
    tabs = null;
    categorySelect = null;
    search = null;
    noticeHandle = null;
    editorEmpty = null;
    noticeKey = "";
    editorToken = "";
    noticeTimer = null;
    mounted = false;
    constructor(store2, host2) {
      this.store = store2;
      this.host = host2;
      this.root = document.querySelector("#root");
      this.libraryPane = el2("div", "ps-library");
      this.editorPane = el2("div", "ps-editor-pane");
      this.listRoot = el2("div", "ps-list");
      this.noticeRoot = el2("div", "ps-notice");
      this.editorEmptyRoot = el2("div", "ps-empty");
      this.libraryPane.append(this.listRoot);
      this.editorPane.append(this.editorEmptyRoot);
      this.editor = new EditorView(store2, {
        onBack: () => this.store.showLibrary(),
        onDelete: (id) => void this.requestDelete(id),
        onDuplicate: (id) => void this.store.duplicate(id),
        onExport: (id) => void this.exportIds([id], "This template"),
        onMove: (id, direction) => void this.store.move(id, direction)
      });
    }
    mount(context) {
      if (this.mounted) return;
      this.mounted = true;
      const app2 = el2("div", "ps-app");
      app2.dataset.surface = context.surface;
      const top = el2("div", "ps-top");
      top.append(el2("h1", "ps-title", "Prompt Studio"));
      const searchRow = el2("div", "ps-row");
      const searchHolder = el2("span", "ps-grow");
      const newHolder = el2("span");
      searchRow.append(searchHolder, newHolder);
      const filters = el2("div", "ps-filters");
      const tabsHolder = el2("div");
      const categoryHolder = el2("div");
      filters.append(searchRow, tabsHolder, categoryHolder);
      const main = el2("div", "ps-main");
      main.append(this.libraryPane, this.editorPane);
      app2.append(top, filters, this.noticeRoot, main);
      clear(this.root);
      this.root.append(app2);
      this.search = mountSearchField(searchHolder, {
        value: this.store.getState().query,
        placeholder: "Search templates",
        label: "Search templates",
        onChange: (value) => this.store.setQuery(value)
      });
      mountButton(newHolder, {
        label: "New",
        variant: "default",
        size: "sm",
        onClick: () => void this.store.newTemplate()
      });
      const menuHolder = el2("span");
      top.append(menuHolder);
      mountMenu(menuHolder, {
        label: "Menu",
        variant: "ghost",
        size: "sm",
        items: [
          { id: "starter", label: "Load starter templates" },
          { id: "import", label: "Import templates\u2026" },
          { separator: true },
          { id: "export-all", label: "Export all\u2026" },
          { id: "export-filtered", label: "Export filtered\u2026" },
          { separator: true },
          { id: "categories", label: "Manage categories\u2026" },
          { id: "reload", label: "Reload library" }
        ],
        onSelect: (id) => void this.handleMenu(id)
      });
      this.tabs = mountTabs(tabsHolder, {
        items: [
          { id: "all", label: "All" },
          { id: "favorites", label: "Favorites" },
          { id: "recent", label: "Recent" }
        ],
        activeId: this.store.getState().tab,
        onChange: (id) => this.store.setTab(id)
      });
      this.categorySelect = mountSelect(categoryHolder, {
        value: "",
        options: [{ id: "", label: "All categories" }],
        searchable: true,
        onChange: (id) => this.store.setCategoryFilter(id || null)
      });
      this.list = mountList(this.listRoot, {
        items: [],
        onSelect: (id) => void this.store.openTemplate(id),
        emptyText: "No templates"
      });
      document.addEventListener("keydown", (event) => {
        if (isDialogOpen()) return;
        const modifier = event.metaKey || event.ctrlKey;
        if (modifier && event.key.toLowerCase() === "n") {
          event.preventDefault();
          void this.store.newTemplate();
          return;
        }
        if (!modifier && event.key === "/" && !isTextEntry(event.target)) {
          event.preventDefault();
          this.focusSearch();
          return;
        }
        if (event.key === "Escape" && !isTextEntry(event.target) && this.store.getState().view === "editor") {
          this.store.showLibrary();
        }
      });
      this.store.subscribe(() => this.render());
      this.render();
    }
    focusSearch() {
      const input2 = this.root.querySelector(".ps-filters input");
      if (input2 instanceof HTMLElement) input2.focus();
    }
    async requestDelete(id) {
      const entry = this.store.getState().entries.find((item) => item.id === id);
      const name = entry?.name ?? "this template";
      const confirmed = await confirmDialog(
        `Delete "${name}"?`,
        "You can restore it once from the notice afterwards. Export first to keep a permanent copy.",
        "Delete",
        true
      );
      if (confirmed) await this.store.remove(id);
    }
    async handleMenu(id) {
      if (id === "starter") {
        await this.store.importStarter(starterTemplates);
        return;
      }
      if (id === "import") {
        openImportDialog(this.store);
        return;
      }
      if (id === "categories") {
        openCategoriesDialog(this.store);
        return;
      }
      if (id === "export-all") {
        await this.exportAll("all", "All templates");
        return;
      }
      if (id === "export-filtered") {
        await this.exportAll("filtered", "Filtered templates");
        return;
      }
      if (id === "reload") {
        this.store.reload();
      }
    }
    async exportAll(scope, label) {
      try {
        const json = await this.store.buildExport(scope);
        openExportDialog(this.store, json, label);
      } catch (error) {
        this.store.setNotice({
          tone: "error",
          title: "Could not build the export.",
          body: error instanceof Error ? error.message : void 0
        });
      }
    }
    async exportIds(ids, label) {
      try {
        const json = await this.store.buildExportIds(ids);
        openExportDialog(this.store, json, label);
      } catch (error) {
        this.store.setNotice({
          tone: "error",
          title: "Could not build the export.",
          body: error instanceof Error ? error.message : void 0
        });
      }
    }
    render() {
      if (!this.mounted) return;
      const state = this.store.getState();
      const app2 = this.root.querySelector(".ps-app");
      if (app2) app2.dataset.surface = state.surface;
      const showEditor = state.view === "editor" && state.draft !== null;
      const wide = state.surface === "page";
      this.libraryPane.hidden = !wide && showEditor;
      this.editorPane.hidden = !wide && !showEditor;
      if (state.phase === "loading") {
        this.list?.update({ items: [], emptyText: "Loading library\u2026" });
        return;
      }
      if (state.phase === "error") {
        this.list?.update({ items: [], emptyText: state.fatal ?? "Could not read the library." });
        return;
      }
      const entries = this.store.visibleEntries();
      const categoryName = (id) => state.categories.find((category) => category.id === id)?.name ?? "General";
      const items = entries.map((entry) => ({
        id: entry.id,
        title: `${entry.favorite ? "\u2605 " : ""}${entry.name}`,
        subtitle: [categoryName(entry.categoryId), entry.description].filter(Boolean).join(" \xB7 ").slice(0, 140),
        meta: entry.lastUsedAt ? relativeTime(entry.lastUsedAt) : entry.fieldCount > 0 ? `${entry.fieldCount} fields` : ""
      }));
      const emptyText = state.entries.length === 0 ? "No templates yet. Create one, or load the starter set from the menu." : state.tab === "recent" ? "No recently used templates." : "No templates match.";
      this.list?.update({ items, selectedId: state.draft?.id ?? null, emptyText });
      this.tabs?.update({
        items: [
          { id: "all", label: "All", count: state.entries.length },
          { id: "favorites", label: "Favorites", count: state.entries.filter((entry) => entry.favorite).length },
          { id: "recent", label: "Recent", count: state.entries.filter((entry) => entry.lastUsedAt).length }
        ],
        activeId: state.tab
      });
      this.categorySelect?.update({
        value: state.categoryFilter ?? "",
        options: [
          { id: "", label: "All categories" },
          ...state.categories.map((category) => ({ id: category.id, label: category.name }))
        ]
      });
      this.renderNotice(state.notice, state.lastDeleted !== null);
      if (showEditor && state.draft) {
        this.disposeEmpty();
        if (!this.editor.root.parentNode) this.editorPane.append(this.editor.root);
        const token = `${state.draft.id ?? "new"}:${state.draft.tab}:${state.editorNonce}`;
        if (token !== this.editorToken) {
          this.editorToken = token;
          this.editor.mount(state.draft);
        } else {
          this.editor.update(state.draft);
        }
      } else {
        this.editor.destroy();
        this.editorToken = "";
        this.showEditorEmpty(wide);
      }
    }
    showEditorEmpty(wide) {
      this.disposeEmpty();
      if (!wide) return;
      this.editorEmpty = mountEmpty(this.editorEmptyRoot, {
        title: "Select a template",
        body: "Pick one on the left to customize and insert it.",
        action: { label: "Create template", onClick: () => void this.store.newTemplate() }
      });
    }
    disposeEmpty() {
      this.editorEmpty?.dispose();
      this.editorEmpty = null;
    }
    renderNotice(notice, canUndo) {
      const key = notice ? `${notice.tone}|${notice.title}|${notice.body ?? ""}|${canUndo}` : "";
      if (key === this.noticeKey) return;
      this.noticeKey = key;
      if (!notice) {
        this.noticeHandle?.dispose();
        this.noticeHandle = null;
        clear(this.noticeRoot);
        return;
      }
      clear(this.noticeRoot);
      this.noticeHandle?.dispose();
      const undo = canUndo && notice.tone === "success" && notice.title.startsWith("Deleted") ? { label: "Undo", onClick: () => void this.store.undoDelete() } : void 0;
      this.noticeHandle = mountBanner(this.noticeRoot, {
        tone: notice.tone,
        title: notice.title,
        body: notice.body,
        action: undo
      });
      if (this.noticeTimer !== null) window.clearTimeout(this.noticeTimer);
      if (notice.tone === "success" || notice.tone === "info") {
        this.noticeTimer = window.setTimeout(() => {
          this.noticeTimer = null;
          this.store.dismissNotice();
        }, 8e3);
      }
    }
    /** Kept for callers that need the host (dialogs use the store). */
    getHost() {
      return this.host;
    }
  };

  // src/main.ts
  var root = document.querySelector("#root");
  var host = connectHost();
  var store = new Store();
  var app = new App(store, host);
  var mounted = false;
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
  window.setTimeout(() => {
    if (mounted) return;
    root.textContent = "Open Prompt Studio from OpenChamber \u2192 Settings \u2192 Extensions.";
    root.style.padding = "16px";
  }, 2500);
})();
