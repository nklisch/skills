const SET_FILTERS = new Set(["kinds", "stages", "parents", "tags", "epics"]);
const FILTER_KEYS = new Set(["search", ...SET_FILTERS, "autoHideReleased"]);
const PREFERRED_KINDS = ["epic", "feature", "story", "release", "backlog"];
const PREFERRED_STAGES = ["drafting", "implementing", "review", "done", "released"];
const EXPAND_THRESHOLD = 12;
const expandedGroups = new Set();

export function createDefaultFilters() {
  return {
    search: "",
    kinds: new Set(),
    stages: new Set(),
    parents: new Set(),
    tags: new Set(),
    epics: new Set(),
    autoHideReleased: true,
  };
}

export function cloneFilters(filters) {
  return {
    search: filters.search,
    kinds: new Set(filters.kinds),
    stages: new Set(filters.stages),
    parents: new Set(filters.parents),
    tags: new Set(filters.tags),
    epics: new Set(filters.epics),
    autoHideReleased: filters.autoHideReleased,
  };
}

export function serializeFilters(filters) {
  return {
    search: filters.search,
    kinds: Array.from(filters.kinds),
    stages: Array.from(filters.stages),
    parents: Array.from(filters.parents),
    tags: Array.from(filters.tags),
    epics: Array.from(filters.epics),
    autoHideReleased: filters.autoHideReleased,
  };
}

export function normalizeSet(value) {
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

export function normalizeFilterValue(key, value) {
  if (!FILTER_KEYS.has(key)) {
    throw new Error(`Unknown board filter: ${key}`);
  }
  if (SET_FILTERS.has(key)) {
    return normalizeSet(value);
  }
  if (key === "search") {
    return typeof value === "string" ? value : "";
  }
  return Boolean(value);
}

export function normalizeFilters(raw) {
  const filters = createDefaultFilters();
  if (!raw || typeof raw !== "object") {
    return filters;
  }
  for (const key of FILTER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      filters[key] = normalizeFilterValue(key, raw[key]);
    }
  }
  return filters;
}

function filterValue(value) {
  return value == null || value === "" ? "" : String(value);
}

function searchText(item) {
  return [
    item?.id,
    item?.kind,
    item?.stage,
    item?.parent,
    item?.gate_origin,
    item?.rel_path,
    item?.body,
    ...(Array.isArray(item?.tags) ? item.tags : []),
  ].filter(Boolean).join(" ").toLowerCase();
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

function itemsByIdFrom(snapshot) {
  const items = Array.isArray(snapshot) ? snapshot : Array.isArray(snapshot?.items) ? snapshot.items : [];
  return new Map(items.filter((item) => item?.id).map((item) => [String(item.id), item]));
}

export function epicIdForItem(item, itemsById = new Map()) {
  if (!item?.id) {
    return "";
  }
  let current = item;
  const seen = new Set();
  while (current?.id && !seen.has(String(current.id))) {
    const currentId = String(current.id);
    seen.add(currentId);
    if (current.kind === "epic") {
      return currentId;
    }
    const parentId = filterValue(current.parent);
    if (!parentId) {
      return "";
    }
    current = itemsById.get(parentId);
  }
  return "";
}

function epicsAllow(selectedEpics, item, snapshot) {
  if (selectedEpics.size === 0) {
    return true;
  }
  return selectedEpics.has(epicIdForItem(item, itemsByIdFrom(snapshot)));
}

export function matchesFilters(item, filters, snapshot = null) {
  if (!item || typeof item !== "object") {
    return false;
  }
  if (filters.autoHideReleased && (item.tier === "releases" || item.tier === "archive")) {
    return false;
  }
  const needle = filters.search.trim().toLowerCase();
  return filterSetAllows(filters.kinds, filterValue(item.kind))
    && filterSetAllows(filters.stages, filterValue(item.stage))
    && filterSetAllows(filters.parents, filterValue(item.parent))
    && tagsAllow(filters.tags, item.tags)
    && epicsAllow(filters.epics, item, snapshot)
    && (needle === "" || searchText(item).includes(needle));
}

function orderedValues(values, preferred = []) {
  const unique = new Set(values);
  const ordered = [];
  for (const value of preferred) {
    if (unique.delete(value)) {
      ordered.push(value);
    }
  }
  return ordered.concat(Array.from(unique).sort((a, b) => a.localeCompare(b)));
}

function optionSet(items, getter) {
  const values = new Set();
  for (const item of items) {
    const value = filterValue(getter(item));
    if (value !== "") {
      values.add(value);
    }
  }
  return values;
}

export function deriveFilterOptions(snapshot) {
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
  const tags = new Set();
  const epics = new Set();
  const itemsById = itemsByIdFrom(items);
  for (const item of items) {
    for (const tag of Array.isArray(item?.tags) ? item.tags : []) {
      tags.add(String(tag));
    }
    const epicId = epicIdForItem(item, itemsById);
    if (epicId) {
      epics.add(epicId);
    }
  }
  return {
    kinds: orderedValues(
      new Set([...PREFERRED_KINDS, ...optionSet(items, (item) => item.kind)]),
      PREFERRED_KINDS,
    ),
    stages: orderedValues(
      new Set([...PREFERRED_STAGES, ...optionSet(items, (item) => item.stage)]),
      PREFERRED_STAGES,
    ),
    parents: orderedValues(optionSet(items, (item) => item.parent)),
    tags: orderedValues(tags),
    epics: orderedValues(epics),
  };
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function filterGroup(title, child, options = {}) {
  const group = document.createElement("div");
  group.className = "filter-group";
  const header = document.createElement("div");
  header.className = "filter-group__header";
  header.append(textElement("h2", "", title));
  if (options.expandKey) {
    const button = document.createElement("button");
    button.className = "filter-expand-toggle";
    button.type = "button";
    button.dataset.expandKey = options.expandKey;
    button.setAttribute("data-expand-key", options.expandKey);
    button.addEventListener("click", () => {
      if (expandedGroups.has(options.expandKey)) {
        expandedGroups.delete(options.expandKey);
      } else {
        expandedGroups.add(options.expandKey);
      }
      syncExpandableGroup(child, button, options.expandKey, Number(button.dataset.optionCount || "0"));
    });
    header.append(button);
  }
  group.append(header, child);
  return group;
}

function syncExpandableGroup(optionsElement, button, key, count) {
  if (!button) {
    return;
  }
  button.dataset.optionCount = String(count);
  const expandable = count > EXPAND_THRESHOLD;
  const expanded = expandable && expandedGroups.has(key);
  button.hidden = !expandable;
  button.textContent = expanded ? "Less" : `All ${count}`;
  button.setAttribute("aria-expanded", String(expanded));
  optionsElement.dataset.expanded = String(expanded);
  optionsElement.classList.remove("filter-options--expanded", "filter-options--compact");
  optionsElement.classList.add(expanded ? "filter-options--expanded" : "filter-options--compact");
}

function buttonFor(value, onClick) {
  const button = document.createElement("button");
  button.className = "filter-chip";
  button.type = "button";
  button.textContent = value;
  button.dataset.filterValue = value;
  button.addEventListener("click", onClick);
  return button;
}

function syncChipGroup(group, key, values, selected, ctx) {
  const signature = values.join("\u0000");
  group.dataset.filterKey = key;
  if (group.dataset.values !== signature) {
    group.dataset.values = signature;
    if (values.length === 0) {
      group.replaceChildren(textElement("span", "filter-empty", "No values"));
    } else {
      const buttons = values.map((value) => buttonFor(value, () => {
        const next = new Set(ctx.getState().filters[key]);
        if (next.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        ctx.setFilter(key, next);
      }));
      group.replaceChildren(...buttons);
    }
  }
  for (const button of group.querySelectorAll(".filter-chip")) {
    button.setAttribute("aria-pressed", String(selected.has(button.dataset.filterValue)));
  }
}

export function renderFilterBar(root, ctx) {
  const search = document.createElement("input");
  search.className = "input";
  search.id = "filter-search";
  search.type = "search";
  search.placeholder = "id, body, metadata";
  search.addEventListener("input", (event) => {
    ctx.setFilter("search", event.target.value);
  });

  const searchWrap = document.createElement("span");
  searchWrap.className = "input-search";
  searchWrap.append(search);

  const kindOptions = document.createElement("div");
  kindOptions.className = "filter-options";
  kindOptions.setAttribute("aria-label", "Kind filters");

  const stageOptions = document.createElement("div");
  stageOptions.className = "filter-options";
  stageOptions.setAttribute("aria-label", "Stage filters");

  const parentOptions = document.createElement("div");
  parentOptions.className = "filter-options filter-options--scroll";
  parentOptions.setAttribute("aria-label", "Parent filters");

  const epicOptions = document.createElement("div");
  epicOptions.className = "filter-options filter-options--scroll";
  epicOptions.setAttribute("aria-label", "Epic filters");

  const tagOptions = document.createElement("div");
  tagOptions.className = "filter-options filter-options--scroll";
  tagOptions.setAttribute("aria-label", "Tag filters");

  const autoHide = document.createElement("button");
  autoHide.className = "toggle";
  autoHide.type = "button";
  autoHide.id = "auto-hide-released";
  autoHide.append(
    textElement("span", "track", ""),
    document.createTextNode("hide released/archived"),
  );
  autoHide.querySelector(".track")?.setAttribute("aria-hidden", "true");
  autoHide.addEventListener("click", () => {
    ctx.setFilter("autoHideReleased", !ctx.getState().filters.autoHideReleased);
  });

  root.replaceChildren(
    filterGroup("Search", searchWrap),
    filterGroup("Kind", kindOptions),
    filterGroup("Stage", stageOptions),
    filterGroup("Epic", epicOptions, { expandKey: "epics" }),
    filterGroup("Parent", parentOptions),
    filterGroup("Tags", tagOptions, { expandKey: "tags" }),
    autoHide,
  );
  const epicExpand = root.querySelector("[data-expand-key='epics']");
  const tagExpand = root.querySelector("[data-expand-key='tags']");

  let previousSnapshot = null;
  let previousOptions = deriveFilterOptions(null);

  function optionsFor(snapshot) {
    if (snapshot !== previousSnapshot) {
      previousSnapshot = snapshot;
      previousOptions = deriveFilterOptions(snapshot);
    }
    return previousOptions;
  }

  function sync(state) {
    if (document.activeElement !== search && search.value !== state.filters.search) {
      search.value = state.filters.search;
    }
    const options = optionsFor(state.snapshot);
    syncChipGroup(kindOptions, "kinds", options.kinds, state.filters.kinds, ctx);
    syncChipGroup(stageOptions, "stages", options.stages, state.filters.stages, ctx);
    syncChipGroup(epicOptions, "epics", options.epics, state.filters.epics, ctx);
    syncChipGroup(parentOptions, "parents", options.parents, state.filters.parents, ctx);
    syncChipGroup(tagOptions, "tags", options.tags, state.filters.tags, ctx);
    syncExpandableGroup(epicOptions, epicExpand, "epics", options.epics.length);
    syncExpandableGroup(tagOptions, tagExpand, "tags", options.tags.length);
    autoHide.setAttribute("aria-pressed", String(state.filters.autoHideReleased));
  }

  sync(ctx.getState());
  return { sync };
}
