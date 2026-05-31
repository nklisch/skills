(function () {
  const text = (id, value) => {
    const node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  };

  const diagnosticCount = (diagnostics) => {
    if (!diagnostics || typeof diagnostics !== "object") {
      return 0;
    }
    return ["parse_errors", "validation_warnings", "duplicate_ids"].reduce(
      (total, key) => total + (Array.isArray(diagnostics[key]) ? diagnostics[key].length : 0),
      0,
    );
  };

  const tierCounts = (items) => {
    return items.reduce((counts, item) => {
      const tier = item && item.tier ? item.tier : "unknown";
      counts[tier] = (counts[tier] || 0) + 1;
      return counts;
    }, {});
  };

  const renderTierCounts = (counts) => {
    const list = document.getElementById("tier-counts");
    if (!list) {
      return;
    }
    list.replaceChildren();
    for (const tier of Object.keys(counts).sort()) {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const value = document.createElement("dd");
      term.textContent = tier;
      value.textContent = String(counts[tier]);
      row.append(term, value);
      list.append(row);
    }
  };

  const render = (snapshot) => {
    const items = Array.isArray(snapshot.items) ? snapshot.items : [];
    const diagnostics = diagnosticCount(snapshot.diagnostics);
    text("project-name", snapshot.project || "Board");
    text("item-count", String(items.length));
    text("ready-count", String(items.filter((item) => item.ready).length));
    text("blocked-count", String(items.filter((item) => item.blocked).length));
    text("diagnostic-count", String(diagnostics));
    text(
      "status-text",
      `${items.length} items loaded from ${snapshot.root_rel || "."} with ${diagnostics} diagnostics.`,
    );
    renderTierCounts(tierCounts(items));
  };

  const renderError = (error) => {
    const status = document.getElementById("status-text");
    if (status) {
      status.dataset.state = "error";
      status.textContent = `Could not load substrate: ${error.message}`;
    }
  };

  fetch("/api/substrate", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(render)
    .catch(renderError);
})();
