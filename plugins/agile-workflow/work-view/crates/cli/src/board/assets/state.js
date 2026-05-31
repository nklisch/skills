import {
  cloneFilters,
  matchesFilters,
  normalizeFilterValue,
  normalizeFilters,
  serializeFilters,
} from "/assets/filters.js";

const STORAGE_KEY = "agile-workflow-board:v1";
const VIEWS = new Set(["kanban", "dependency", "table"]);
const ACCENTS = new Set(["teal", "amber", "violet", "azure", "lime", "candy"]);
const MODES = new Set(["system", "light", "dark"]);

function defaultTheme() {
  return {
    accent: "teal",
    mode: "system",
  };
}

function loadPersisted(storage) {
  if (!storage) {
    return {};
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch (_error) {
    return {};
  }
}

function validateView(view) {
  return VIEWS.has(view) ? view : "kanban";
}

function validateTheme(raw) {
  const theme = defaultTheme();
  if (!raw || typeof raw !== "object") {
    return theme;
  }
  if (ACCENTS.has(raw.accent)) {
    theme.accent = raw.accent;
  }
  if (MODES.has(raw.mode)) {
    theme.mode = raw.mode;
  }
  return theme;
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Substrate feed was not a JSON object");
  }
  if (!Array.isArray(snapshot.items)) {
    throw new Error("Substrate feed did not include an items array");
  }

  const items = snapshot.items.map((item) => (item && typeof item === "object" ? item : {}));
  const diagnostics = snapshot.diagnostics && typeof snapshot.diagnostics === "object"
    ? snapshot.diagnostics
    : {};
  const clientDuplicateIds = duplicateIds(items);

  return {
    ...snapshot,
    items,
    diagnostics: {
      parse_errors: Array.isArray(diagnostics.parse_errors) ? diagnostics.parse_errors : [],
      validation_warnings: Array.isArray(diagnostics.validation_warnings) ? diagnostics.validation_warnings : [],
      duplicate_ids: Array.isArray(diagnostics.duplicate_ids) ? diagnostics.duplicate_ids : [],
      client_duplicate_ids: clientDuplicateIds,
    },
  };
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (typeof item.id !== "string" || item.id === "") {
      continue;
    }
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    }
    seen.add(item.id);
  }
  return Array.from(duplicates).sort();
}

export function createBoardStore({ storage = globalThis.localStorage, fetchJson, root = document } = {}) {
  const persisted = loadPersisted(storage);
  const listeners = new Set();
  const requestJson = fetchJson || ((url) => fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`GET ${url} failed with ${response.status}`);
    }
    return response.json();
  }));

  let state = {
    snapshot: null,
    loading: false,
    error: null,
    view: validateView(persisted.view),
    selectedItemId: null,
    filters: normalizeFilters(persisted.filters),
    theme: validateTheme(persisted.theme),
  };

  function getState() {
    return {
      ...state,
      filters: cloneFilters(state.filters),
      theme: { ...state.theme },
    };
  }

  function notify() {
    const publicState = getState();
    for (const listener of listeners) {
      listener(publicState);
    }
  }

  function persist() {
    if (!storage) {
      return;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({
        view: state.view,
        filters: serializeFilters(state.filters),
        theme: state.theme,
      }));
    } catch (_error) {
      // Storage can be unavailable in private browsing; the board still works.
    }
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function refresh() {
    state = { ...state, loading: true, error: null };
    notify();
    try {
      const snapshot = normalizeSnapshot(await requestJson("/api/substrate"));
      const selectedItemId = state.selectedItemId && snapshot.items.some((item) => item.id === state.selectedItemId)
        ? state.selectedItemId
        : null;
      state = { ...state, snapshot, selectedItemId, loading: false, error: null };
    } catch (error) {
      state = {
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    notify();
  }

  function setView(id) {
    const view = validateView(id);
    if (state.view === view) {
      return;
    }
    state = { ...state, view };
    persist();
    notify();
  }

  function setTheme(partial) {
    const next = validateTheme({ ...state.theme, ...(partial || {}) });
    if (state.theme.accent === next.accent && state.theme.mode === next.mode) {
      return;
    }
    state = { ...state, theme: next };
    persist();
    notify();
  }

  function setFilter(key, value) {
    const filters = cloneFilters(state.filters);
    filters[key] = normalizeFilterValue(key, value);
    state = { ...state, filters };
    persist();
    notify();
  }

  function setSelectedItem(id) {
    const selectedItemId = id && state.snapshot?.items.some((item) => item.id === id)
      ? String(id)
      : null;
    if (state.selectedItemId === selectedItemId) {
      return;
    }
    state = { ...state, selectedItemId };
    notify();
  }

  function matches(item) {
    return matchesFilters(item, state.filters);
  }

  function visibleItems() {
    return state.snapshot ? state.snapshot.items.filter(matches) : [];
  }

  function getItemById(id) {
    if (!state.snapshot) {
      return null;
    }
    return state.snapshot.items.find((item) => item.id === id) || null;
  }

  root?.addEventListener?.("visibilitychange", () => {
    if (root.visibilityState === "visible" && !state.snapshot && !state.loading) {
      void refresh();
    }
  });

  return {
    getState,
    subscribe,
    refresh,
    setView,
    setTheme,
    setFilter,
    setSelectedItem,
    visibleItems,
    matches,
    getItemById,
  };
}
