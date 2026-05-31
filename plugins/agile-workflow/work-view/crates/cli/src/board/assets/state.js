const STORAGE_KEY = "agile-workflow-board:v1";
const VIEWS = new Set(["kanban", "dependency", "table"]);
const ACCENTS = new Set(["teal", "amber", "violet", "azure", "lime", "candy"]);
const MODES = new Set(["system", "light", "dark"]);
const FILTER_KEYS = new Set(["search", "kinds", "stages", "parents", "releases", "tags", "autoHideReleased"]);
const SET_FILTERS = new Set(["kinds", "stages", "parents", "releases", "tags"]);
const NULL_SENTINEL = "(none)";

function defaultFilters() {
  return {
    search: "",
    kinds: new Set(),
    stages: new Set(),
    parents: new Set(),
    releases: new Set(),
    tags: new Set(),
    autoHideReleased: true,
  };
}

function defaultTheme() {
  return {
    accent: "teal",
    mode: "system",
  };
}

function cloneFilters(filters) {
  return {
    search: filters.search,
    kinds: new Set(filters.kinds),
    stages: new Set(filters.stages),
    parents: new Set(filters.parents),
    releases: new Set(filters.releases),
    tags: new Set(filters.tags),
    autoHideReleased: filters.autoHideReleased,
  };
}

function serializeFilters(filters) {
  return {
    search: filters.search,
    kinds: Array.from(filters.kinds),
    stages: Array.from(filters.stages),
    parents: Array.from(filters.parents),
    releases: Array.from(filters.releases),
    tags: Array.from(filters.tags),
    autoHideReleased: filters.autoHideReleased,
  };
}

function normalizeSet(value) {
  if (value instanceof Set) {
    return new Set(Array.from(value).map(String).filter(Boolean));
  }
  if (Array.isArray(value)) {
    return new Set(value.map(String).filter(Boolean));
  }
  if (typeof value === "string" && value !== "") {
    return new Set([value]);
  }
  return new Set();
}

function normalizeFilters(raw) {
  const filters = defaultFilters();
  if (!raw || typeof raw !== "object") {
    return filters;
  }
  filters.search = typeof raw.search === "string" ? raw.search : "";
  filters.kinds = normalizeSet(raw.kinds);
  filters.stages = normalizeSet(raw.stages);
  filters.parents = normalizeSet(raw.parents);
  filters.releases = normalizeSet(raw.releases);
  filters.tags = normalizeSet(raw.tags);
  filters.autoHideReleased = raw.autoHideReleased !== false;
  return filters;
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

function itemField(item, key) {
  const value = item?.[key];
  return value == null || value === "" ? NULL_SENTINEL : String(value);
}

function includesText(item, needle) {
  if (!needle) {
    return true;
  }
  const haystack = [
    item?.id,
    item?.kind,
    item?.stage,
    item?.parent,
    item?.release_binding,
    item?.gate_origin,
    item?.rel_path,
    item?.body,
    ...(Array.isArray(item?.tags) ? item.tags : []),
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function filterSetAllows(values, actual) {
  return values.size === 0 || values.has(actual);
}

function tagsAllow(selectedTags, itemTags) {
  if (selectedTags.size === 0) {
    return true;
  }
  const tags = new Set(Array.isArray(itemTags) ? itemTags.map(String) : []);
  for (const tag of selectedTags) {
    if (!tags.has(tag)) {
      return false;
    }
  }
  return true;
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
    if (!FILTER_KEYS.has(key)) {
      throw new Error(`Unknown board filter: ${key}`);
    }
    const filters = cloneFilters(state.filters);
    if (SET_FILTERS.has(key)) {
      filters[key] = normalizeSet(value);
    } else if (key === "search") {
      filters.search = typeof value === "string" ? value : "";
    } else if (key === "autoHideReleased") {
      filters.autoHideReleased = Boolean(value);
    }
    state = { ...state, filters };
    persist();
    notify();
  }

  function matches(item) {
    const filters = state.filters;
    if (!item || typeof item !== "object") {
      return false;
    }
    if (filters.autoHideReleased && (item.tier === "releases" || item.tier === "archive")) {
      return false;
    }
    return filterSetAllows(filters.kinds, itemField(item, "kind"))
      && filterSetAllows(filters.stages, itemField(item, "stage"))
      && filterSetAllows(filters.parents, itemField(item, "parent"))
      && filterSetAllows(filters.releases, itemField(item, "release_binding"))
      && tagsAllow(filters.tags, item.tags)
      && includesText(item, filters.search.trim());
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
    visibleItems,
    matches,
    getItemById,
  };
}
