const root = document.documentElement;
const accentPicker = document.getElementById("theme-accent");
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const viewTabs = Array.from(document.querySelectorAll("[data-view]"));
const statusText = document.querySelector("#status-region .status-text");

const setMode = (mode) => {
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = mode;
  }
  for (const button of modeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }
};

const setView = (view) => {
  for (const tab of viewTabs) {
    tab.setAttribute("aria-selected", String(tab.dataset.view === view));
  }
};

accentPicker?.addEventListener("change", (event) => {
  root.dataset.accent = event.target.value;
});

for (const button of modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode || "system"));
}

for (const tab of viewTabs) {
  tab.addEventListener("click", () => setView(tab.dataset.view || "kanban"));
}

document.getElementById("refresh-button")?.addEventListener("click", () => {
  if (statusText) {
    statusText.textContent = "Refresh wiring lands with the snapshot store";
  }
});

setMode("system");
setView("kanban");
