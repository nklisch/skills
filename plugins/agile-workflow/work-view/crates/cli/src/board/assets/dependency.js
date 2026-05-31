const EXTERNAL_PREFIX = "external:";
const KIND_CLASSES = new Set(["epic", "feature", "story", "release", "backlog"]);

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function dependencyIds(item) {
  return arrayOfStrings(item?.depends_on);
}

function unmetIds(item) {
  return new Set(arrayOfStrings(item?.unmet_deps));
}

function externalId(id) {
  return `${EXTERNAL_PREFIX}${id}`;
}

function itemLabel(node) {
  if (!node) {
    return "(missing)";
  }
  return node.external ? node.id.slice(EXTERNAL_PREFIX.length) : node.id;
}

function kindClass(kind) {
  return KIND_CLASSES.has(kind) ? kind : "backlog";
}

export function buildDependencyModel(items) {
  const nodes = new Map();
  const edges = [];
  for (const item of items) {
    if (item?.id) {
      nodes.set(String(item.id), { id: String(item.id), item, external: false });
    }
  }
  for (const item of items) {
    if (!item?.id) {
      continue;
    }
    const to = String(item.id);
    const unmet = unmetIds(item);
    for (const dep of dependencyIds(item)) {
      const visibleDep = nodes.has(dep);
      const from = visibleDep ? dep : externalId(dep);
      if (!visibleDep && !nodes.has(from)) {
        nodes.set(from, { id: from, item: null, external: true });
      }
      edges.push({
        from,
        to,
        external: !visibleDep,
        unmet: unmet.has(dep),
      });
    }
  }
  return layerGraph({ nodes, edges });
}

function layerGraph(model) {
  const indegree = new Map();
  const outgoing = new Map();
  const depth = new Map();
  for (const id of model.nodes.keys()) {
    indegree.set(id, 0);
    outgoing.set(id, []);
    depth.set(id, 0);
  }
  for (const edge of model.edges) {
    indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
    outgoing.get(edge.from)?.push(edge);
  }

  const queue = Array.from(indegree.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort((a, b) => itemLabel(model.nodes.get(a)).localeCompare(itemLabel(model.nodes.get(b))));
  const processed = new Set();
  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index];
    processed.add(id);
    for (const edge of outgoing.get(id) || []) {
      depth.set(edge.to, Math.max(depth.get(edge.to) || 0, (depth.get(id) || 0) + 1));
      const nextCount = (indegree.get(edge.to) || 0) - 1;
      indegree.set(edge.to, nextCount);
      if (nextCount === 0) {
        queue.push(edge.to);
      }
    }
  }

  const cycleIds = Array.from(model.nodes.keys()).filter((id) => !processed.has(id));
  if (cycleIds.length > 0) {
    const fallbackDepth = Math.max(0, ...Array.from(depth.values())) + 1;
    for (const id of cycleIds) {
      depth.set(id, fallbackDepth);
    }
  }

  const layers = new Map();
  for (const [id, node] of model.nodes) {
    const layer = depth.get(id) || 0;
    if (!layers.has(layer)) {
      layers.set(layer, []);
    }
    layers.get(layer).push(node);
  }
  for (const nodes of layers.values()) {
    nodes.sort((a, b) => itemLabel(a).localeCompare(itemLabel(b)));
  }

  return {
    ...model,
    depth,
    layers: Array.from(layers.entries()).sort(([a], [b]) => a - b),
    cycleIds,
  };
}

function edgesFor(model, nodeId, direction) {
  return model.edges.filter((edge) => direction === "in" ? edge.to === nodeId : edge.from === nodeId);
}

function renderEdgeLine(label, ids, className) {
  const line = document.createElement("div");
  line.className = "edge";
  line.append(textElement("span", className, label), textElement("span", "", ids.length === 0 ? "none" : ids.join(", ")));
  return line;
}

function renderNode(node, model, ctx) {
  const nodeElement = node.external ? document.createElement("div") : document.createElement("button");
  nodeElement.className = "dep-node";
  if (node.external) {
    nodeElement.classList.add("dep-node--external");
  }
  if (node.item?.blocked) {
    nodeElement.classList.add("is-blocked");
  }
  if (!node.external) {
    nodeElement.type = "button";
    nodeElement.addEventListener("click", () => ctx.openDetail(node.id));
  }

  const head = document.createElement("div");
  head.className = "dn-head";
  const kind = node.external ? "external" : String(node.item?.kind || "item");
  head.append(
    textElement("span", `chip chip--${kindClass(kind)}`, kind),
    textElement("span", "ic-id", itemLabel(node)),
  );
  if (node.item?.blocked) {
    head.append(textElement("span", "badge badge--blocked", "blocked"));
  } else if (node.item?.ready) {
    head.append(textElement("span", "badge badge--ready", "ready"));
  }

  const incoming = edgesFor(model, node.id, "in");
  const outgoing = edgesFor(model, node.id, "out");
  const edges = document.createElement("div");
  edges.className = "edges";
  edges.append(
    renderEdgeLine("depends on", incoming.map((edge) => itemLabel(model.nodes.get(edge.from))), "up"),
    renderEdgeLine("unblocks", outgoing.map((edge) => itemLabel(model.nodes.get(edge.to))), "down"),
  );

  nodeElement.append(head, edges);
  return nodeElement;
}

function renderCycleWarning(model) {
  if (model.cycleIds.length === 0) {
    return null;
  }
  const warning = document.createElement("div");
  warning.className = "alert alert--warning";
  warning.append(
    textElement("span", "ico", "?"),
    textElement("span", "body", `Cycle detected: ${model.cycleIds.map((id) => itemLabel(model.nodes.get(id))).join(", ")}`),
  );
  return warning;
}

function renderLayer(layer, nodes, model, ctx) {
  const section = document.createElement("section");
  section.className = "dependency-layer";
  section.append(textElement("h2", "", `Layer ${layer}`));
  const stack = document.createElement("div");
  stack.className = "dependency-layer__nodes";
  for (const node of nodes) {
    stack.append(renderNode(node, model, ctx));
  }
  section.append(stack);
  return section;
}

export const dependencyView = {
  id: "dependency",
  label: "Dependency",
  mount(root, ctx) {
    const items = ctx.visibleItems();
    const model = buildDependencyModel(items);

    const view = document.createElement("div");
    view.className = "dependency-view";
    const header = document.createElement("header");
    header.className = "dependency-view__header";
    header.append(
      textElement("h1", "", "Dependency"),
      textElement("p", "view-digest", `${model.nodes.size} nodes and ${model.edges.length} dependency edges in the filtered set.`),
    );
    view.append(header);

    const warning = renderCycleWarning(model);
    if (warning) {
      view.append(warning);
    }

    const layers = document.createElement("div");
    layers.className = "dependency-layers";
    for (const [layer, nodes] of model.layers) {
      layers.append(renderLayer(layer, nodes, model, ctx));
    }
    view.append(layers);
    root.replaceChildren(view);
  },
};
