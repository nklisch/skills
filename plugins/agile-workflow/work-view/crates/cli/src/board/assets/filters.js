export const NULL_SENTINEL = "(none)";

const SET_FILTERS = new Set(["kinds", "stages", "parents", "releases", "tags"]);
const FILTER_KEYS = new Set(["search", ...SET_FILTERS, "autoHideReleased"]);
const PREFERRED_KINDS = ["epic", "feature", "story", "release", "backlog"];
const PREFERRED_STAGES = ["drafting", "implementing", "review", "done", "released"];

export function createDefaultFilters() {
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

export function cloneFilters(filters) {
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

export function serializeFilters(filters) {
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
  if (!Object.prototype.hasOwnProperty.call(raw, "autoHideReleased")) {
    filters.autoHideReleased = true;
  }
  return filters;
}

function valueOrNone(value) {
  return value == null || value === "" ? NULL_SENTINEL : String(value);
}

function searchText(item) {
  return [
    item?.id,
    item?.title,
    item?.kind,
    item?.stage,
    item?.parent,
    item?.release_binding,
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

export function matchesFilters(item, filters) {
  if (!item || typeof item !== "object") {
    return false;
  }
  if (filters.autoHideReleased && (item.tier === "releases" || item.tier === "archive")) {
    return false;
  }
  const needle = filters.search.trim().toLowerCase();
  return filterSetAllows(filters.kinds, valueOrNone(item.kind))
    && filterSetAllows(filters.stages, valueOrNone(item.stage))
    && filterSetAllows(filters.parents, valueOrNone(item.parent))
    && filterSetAllows(filters.releases, valueOrNone(item.release_binding))
    && tagsAllow(filters.tags, item.tags)
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
    values.add(valueOrNone(getter(item)));
  }
  return values;
}

export function deriveFilterOptions(snapshot) {
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
  const tags = new Set();
  for (const item of items) {
    for (const tag of Array.isArray(item?.tags) ? item.tags : []) {
      tags.add(String(tag));
    }
  }
  return {
    kinds: orderedValues(new Set([...PREFERRED_KINDS, ...optionSet(items, (item) => item.kind)]), PREFERRED_KINDS),
    stages: orderedValues(new Set([...PREFERRED_STAGES, ...optionSet(items, (item) => item.stage)]), PREFERRED_STAGES),
    parents: orderedValues(optionSet(items, (item) => item.parent)),
    releases: orderedValues(optionSet(items, (item) => item.release_binding)),
    tags: orderedValues(tags),
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

function filterGroup(title, child) {
  const group = document.createElement("div");
  group.className = "filter-group";
  group.append(textElement("h2", "", title), child);
  return group;
}

function buttonFor(value, pressed, onClick) {
  const button = document.createElement("button");
  button.className = "filter-chip";
  button.type = "button";
  button.textContent = value;
  button.setAttribute("aria-pressed", String(pressed));
  button.addEventListener("click", onClick);
  return button;
}

function syncChipGroup(group, key, values, selected, ctx) {
  group.replaceChildren();
  if (values.length === 0) {
    group.append(textElement("span", "filter-empty", "No values"));
    return;
  }
  for (const value of values) {
    group.append(buttonFor(value, selected.has(value), () => {
      const next = new Set(ctx.getState().filters[key]);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      ctx.setFilter(key, next);
    }));
  }
}

export function renderFilterBar(root, ctx) {
  const search = document.createElement("input");
  search.className = "input";
  search.id = "filter-search";
  search.type = "search";
  search.placeholder = "id, title, body";
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

  const releaseOptions = document.createElement("div");
  releaseOptions.className = "filter-options filter-options--scroll";
  releaseOptions.setAttribute("aria-label", "Release filters");

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
    filterGroup("Parent", parentOptions),
    filterGroup("Release", releaseOptions),
    filterGroup("Tags", tagOptions),
    autoHide,
  );

  function sync(state) {
    if (document.activeElement !== search && search.value !== state.filters.search) {
      search.value = state.filters.search;
    }
    const options = deriveFilterOptions(state.snapshot);
    syncChipGroup(kindOptions, "kinds", options.kinds, state.filters.kinds, ctx);
    syncChipGroup(stageOptions, "stages", options.stages, state.filters.stages, ctx);
    syncChipGroup(parentOptions, "parents", options.parents, state.filters.parents, ctx);
    syncChipGroup(releaseOptions, "releases", options.releases, state.filters.releases, ctx);
    syncChipGroup(tagOptions, "tags", options.tags, state.filters.tags, ctx);
    autoHide.setAttribute("aria-pressed", String(state.filters.autoHideReleased));
  }

  sync(ctx.getState());
  return { sync };
}
