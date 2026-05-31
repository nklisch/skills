/* board-views flow — shared connective behavior across the 3 peer pages.
 * Vanilla, no build. Mirrors how the real board's shell would own:
 *   - theme (accent + light/dark) persistence
 *   - global filter-state persistence
 *   - the size-detected item-detail overlay
 * State lives in localStorage 'board-views-state' so it survives page navigation
 * between the view-switcher tabs (the hub-and-spoke nav). */
(function () {
  const r = document.documentElement, KEY = 'board-views-state';
  const st = Object.assign(
    { accent: 'teal', mode: 'system', filters: ['tag:tooling'], autohide: true },
    JSON.parse(localStorage.getItem(KEY) || '{}')
  );
  const save = () => localStorage.setItem(KEY, JSON.stringify(st));

  // ---- theme (persists across views) ----
  r.setAttribute('data-accent', st.accent);
  st.mode === 'system' ? r.removeAttribute('data-theme') : r.setAttribute('data-theme', st.mode);
  const acc = document.getElementById('accent');
  if (acc) { acc.value = st.accent; acc.addEventListener('change', () => { st.accent = acc.value; r.setAttribute('data-accent', st.accent); save(); }); }
  document.querySelectorAll('#mode .seg-btn').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode));
    b.addEventListener('click', () => {
      st.mode = b.dataset.mode;
      st.mode === 'system' ? r.removeAttribute('data-theme') : r.setAttribute('data-theme', st.mode);
      document.querySelectorAll('#mode .seg-btn').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      save();
    });
  });

  // ---- global filter set (persists across views) ----
  document.querySelectorAll('.filter-chip[data-f]').forEach(c => {
    c.setAttribute('aria-pressed', String(st.filters.includes(c.dataset.f)));
    c.addEventListener('click', () => {
      const on = !st.filters.includes(c.dataset.f);
      st.filters = on ? [...st.filters, c.dataset.f] : st.filters.filter(x => x !== c.dataset.f);
      c.setAttribute('aria-pressed', String(on)); save();
    });
  });
  const ah = document.getElementById('autohide');
  if (ah) { ah.setAttribute('aria-pressed', String(st.autohide)); ah.addEventListener('click', () => { st.autohide = !st.autohide; ah.setAttribute('aria-pressed', String(st.autohide)); save(); }); }

  // ---- size-detected item-detail overlay (openable from any view) ----
  function detect(len) { if (innerWidth < 760) return 'modal'; if (len < 320) return 'narrow'; if (len < 1200) return 'wide'; return 'modal'; }
  function fm(stage, deps) { return `<dl class="fm"><dt>stage</dt><dd>${stage}</dd><dt>depends_on</dt><dd>${deps}</dd></dl>`; }
  window.closeItem = function () {
    const o = document.getElementById('ov'), s = document.getElementById('scrim');
    if (o) { o.classList.add(o.classList.contains('item-modal') ? 'u-card-exit' : 'u-drawer-out'); o.addEventListener('animationend', () => { o.remove(); document.getElementById('scrim')?.remove(); }, { once: true }); }
    else if (s) s.remove();
  };
  function open(el) {
    const { id, kind, stage, deps, body } = el.dataset; closeItem();
    const pres = detect((body || '').length);
    const s = document.createElement('div'); s.id = 'scrim'; s.onclick = closeItem;
    if (pres === 'modal') s.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;';
    document.body.appendChild(s);
    const head = `<span class="chip chip--${kind}">${kind}</span><span class="ic-id" style="font:600 13px/1.2 var(--font-mono)">${id}</span><button class="btn btn-ghost btn--sm" onclick="closeItem()" style="margin-left:auto">esc ✕ <span style="opacity:.6">(${pres})</span></button>`;
    let o;
    if (pres === 'modal') {
      o = document.createElement('div'); o.id = 'ov'; o.className = 'item-modal u-view-enter u-theme-anim'; o.onclick = e => e.stopPropagation();
      o.innerHTML = `<div class="m-head">${head}</div><div class="m-scroll md">${fm(stage, deps)}<div class="reading"><p>${body}</p></div></div>`;
      s.appendChild(o);
    } else {
      o = document.createElement('div'); o.id = 'ov'; o.onclick = e => e.stopPropagation();
      o.className = 'detail-drawer u-drawer-in u-theme-anim ' + (pres === 'wide' ? 'dw-wide' : 'dw-narrow');
      o.innerHTML = `<div class="dd-head">${head}</div><div class="dd-md md">${fm(stage, deps)}<div class="reading"><p>${body}</p></div></div>`;
      document.body.appendChild(o);
    }
  }
  document.addEventListener('click', e => { const el = e.target.closest('[data-id]'); if (el) open(el); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeItem(); });
})();
