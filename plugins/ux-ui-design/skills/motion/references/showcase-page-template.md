# motion.html showcase template

The interactive showcase reviewers play with to feel every motion before signoff. Unlike
palette and components (which are static visual references), motion can only be reviewed
by *being triggered*. Every motion in this page is clickable / hoverable / draggable so
a reviewer can feel it.

## Page structure

```
.mockups/design-system/motion.html
├── header (project name + attitude + last-generated date)
├── top nav with anchor links (curves / durations / springs / principles / hold-beat / stepped / reduced-motion)
├── controls (global play-speed override, reduced-motion toggle)
├── #curves section
│   └── 5 demos: each named curve animating a 100×100 square sliding 300px on click
├── #durations section
│   └── 3 demos: instant / quick / ambient, each labeled "input-gating" or "ambient"
├── #springs section (if included)
│   └── 3 demos: draggable cards that snap with each spring preset
├── #principles section
│   └── 4-5 toy demos: squash, anticipation, follow-through, secondary-glow
├── #hold-beat section (if included)
│   └── A 3-step modal sequence; toggle the hold-beat on/off to feel the difference
├── #stepped section (if included)
│   └── A hand-drawn SVG illustration: smooth vs stepped, side by side
└── #reduced-motion section
    └── Toggle that simulates prefers-reduced-motion: reduce and confirms usability
```

## Outer shape

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Motion system — {project name}</title>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="motion.css">
  <style>
    /* Showcase chrome only (not part of the design system) */
    body { margin: 0; font: 14px/1.5 var(--font-sans, system-ui, sans-serif);
           background: var(--color-bg-primary, #fff);
           color: var(--color-text-primary, #111); }
    header { padding: 32px; border-bottom: 1px solid var(--color-border, #e0e0e0); }
    nav.toc { display: flex; gap: 16px; padding: 12px 32px;
              background: var(--color-bg-secondary, #f6f8fa);
              position: sticky; top: 0; z-index: 10; }
    nav.toc a { color: var(--color-text-link, #0969da); text-decoration: none; font-size: 13px; }
    section { padding: 32px; border-bottom: 1px solid var(--color-border, #e0e0e0); }
    h2 { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
    .demo-grid { display: grid; gap: 24px;
                 grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .demo { padding: 20px; border: 1px solid var(--color-border, #e0e0e0);
            border-radius: var(--radius-md, 8px); background: var(--color-bg-primary, #fff); }
    .demo h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
    .demo .attitude { font-size: 11px; padding: 2px 6px; border-radius: 4px;
                       background: var(--color-bg-tertiary, #eaeef2);
                       color: var(--color-text-secondary, #656d76);
                       display: inline-block; margin-bottom: 12px; }
    .demo .stage { background: var(--color-bg-tertiary, #eaeef2);
                    border-radius: var(--radius-sm, 4px);
                    height: 80px; position: relative; overflow: hidden; margin-bottom: 8px; }
    .demo .target { position: absolute; left: 12px; top: 50%;
                     width: 32px; height: 32px; margin-top: -16px;
                     background: var(--color-accent, #1f6feb);
                     border-radius: var(--radius-sm, 4px); }
    .demo button.play { padding: 4px 12px; font-size: 12px;
                         background: var(--color-bg-secondary, #f6f8fa);
                         border: 1px solid var(--color-border, #e0e0e0);
                         border-radius: var(--radius-sm, 4px); cursor: pointer; }
    .demo code { display: block; margin-top: 8px; font-size: 11px;
                  font-family: var(--font-mono, monospace);
                  color: var(--color-text-secondary, #656d76); }
    .label-gate { color: var(--color-warning, #bf8700); font-weight: 600; }
    .label-ambient { color: var(--color-success, #1a7f37); font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <h1>Motion system — {project name}</h1>
    <p>Attitude: <strong>{primary}</strong> + {secondary} · Generated {date}</p>
  </header>
  <nav class="toc">
    <a href="#curves">Curves</a>
    <a href="#durations">Durations</a>
    <a href="#springs">Springs</a>
    <a href="#principles">Principles</a>
    <a href="#hold-beat">Hold beat</a>
    <a href="#stepped">Stepped</a>
    <a href="#reduced-motion">Reduced motion</a>
  </nav>

  <!-- per-section content follows -->
</body>
</html>
```

## Curves section

Each curve demos a 100×100 square sliding 300px to the right. Click "play" to trigger;
square snaps back automatically after 1.5s so the demo can be repeated.

```html
<section id="curves">
  <h2>Easing curves</h2>
  <p>Each curve carries an attitude. Click play; the square slides 300px to the right.</p>
  <div class="demo-grid">
    <div class="demo">
      <h3>--motion-emphasized</h3>
      <span class="attitude">Expressive / Cinematic</span>
      <div class="stage"><div class="target" data-curve="emphasized"></div></div>
      <button class="play" data-target="emphasized">Play</button>
      <code>cubic-bezier(0.2, 0, 0, 1) · {duration}ms</code>
    </div>
    <!-- repeat per curve -->
  </div>
</section>

<script>
  document.querySelectorAll('.play').forEach(btn => {
    btn.addEventListener('click', e => {
      const target = document.querySelector(`.target[data-curve="${e.target.dataset.target}"]`);
      const stage = target.parentElement;
      const stageWidth = stage.offsetWidth;
      const targetWidth = target.offsetWidth;
      const distance = stageWidth - targetWidth - 24;  // 24 = 2 * 12px margin
      const curveVar = `var(--motion-${e.target.dataset.target})`;
      target.style.transition = `transform var(--dur-quick) ${curveVar}`;
      target.style.transform = `translateX(${distance}px)`;
      setTimeout(() => {
        target.style.transform = '';
      }, 1500);
    });
  });
</script>
```

## Durations section

Same square animation but the *curve is fixed* (`--motion-standard`) and the duration
varies. Each demo prominently labels itself as **input-gating** (`--dur-instant`,
`--dur-quick`) or **ambient** (`--dur-ambient`). The label is the review prompt: does
each motion's class match its usage?

```html
<section id="durations">
  <h2>Durations (Doherty-coupled)</h2>
  <p>The rule: motion that gates input fits in instant or quick (≤300ms total).
     Only ambient motion uses --dur-ambient.</p>
  <div class="demo-grid">
    <div class="demo">
      <h3>--dur-instant <span class="label-gate">input-gating</span></h3>
      <div class="stage"><div class="target" data-dur="instant"></div></div>
      <button class="play" data-dur-target="instant">Play</button>
      <code>80ms — feels direct</code>
    </div>
    <div class="demo">
      <h3>--dur-quick <span class="label-gate">input-gating</span></h3>
      <div class="stage"><div class="target" data-dur="quick"></div></div>
      <button class="play" data-dur-target="quick">Play</button>
      <code>240ms — workhorse; sub-300ms ceiling</code>
    </div>
    <div class="demo">
      <h3>--dur-ambient <span class="label-ambient">ambient ONLY</span></h3>
      <div class="stage"><div class="target" data-dur="ambient"></div></div>
      <button class="play" data-dur-target="ambient">Play</button>
      <code>600ms — does NOT gate input</code>
    </div>
  </div>
</section>
```

## Springs section (if included)

A draggable card that snaps back. Each preset gets its own card; user flings each to
feel the response.

```html
<section id="springs">
  <h2>Springs (gesture-driven)</h2>
  <p>Drag a card and release. Each spring's character — snap, settle, wobble — comes
     from its stiffness/damping/mass tuple.</p>
  <div class="demo-grid">
    <div class="demo">
      <h3>--spring-stiff</h3>
      <div class="stage spring-stage">
        <div class="target draggable" data-spring="stiff"
             style="cursor: grab;">⋮⋮</div>
      </div>
      <code>stiffness 300, damping 30, mass 1 · snap-back, decisive</code>
    </div>
    <!-- repeat per spring -->
  </div>
</section>

<script>
  /* Spring approximation in JS — uses requestAnimationFrame with
     Hooke's-law update each frame. Demo-grade, not production. */
  function springSimulate(target, opts) {
    const { stiffness, damping, mass } = opts;
    let velocity = 0;
    let position = parseFloat(target.dataset.x || 0);
    const rest = 0;
    function frame() {
      const force = -stiffness * (position - rest);
      const friction = -damping * velocity;
      const accel = (force + friction) / mass;
      velocity += accel / 60;
      position += velocity / 60;
      target.style.transform = `translateX(${position}px)`;
      target.dataset.x = position;
      if (Math.abs(position) > 0.5 || Math.abs(velocity) > 0.5) {
        requestAnimationFrame(frame);
      } else {
        target.style.transform = '';
        target.dataset.x = 0;
      }
    }
    requestAnimationFrame(frame);
  }
  /* Drag handlers attach to each .draggable; on release, springSimulate
     is called with the spring's params */
</script>
```

## Principles section

Toy demos for each locked Disney principle. Each is small, focused on demonstrating that
one principle.

```html
<section id="principles">
  <h2>Disney principles</h2>
  <div class="demo-grid">
    <div class="demo">
      <h3>--squash-on-press</h3>
      <span class="attitude">Squash &amp; stretch</span>
      <button class="motion-press-feedback" style="padding: 16px 32px;
              background: var(--color-accent); color: white; border: 0;
              border-radius: 8px;">Press me</button>
      <code>scale(0.96) on :active, springs back</code>
    </div>
    <div class="demo">
      <h3>--anticipation-flick</h3>
      <span class="attitude">Anticipation</span>
      <button class="play" data-target="anticipation"
              style="padding: 8px 16px;">Open modal</button>
      <div class="stage modal-stage">
        <div class="target modal-content" data-curve="anticipation"
             style="width: 80%; height: 60%; left: 10%; top: 20%;
                    opacity: 0; background: var(--color-accent);">
          Modal
        </div>
      </div>
      <code>scale(0.97) → scale(1) → translateY(0); anticipation begins inverted</code>
    </div>
    <!-- repeat per locked principle -->
  </div>
</section>
```

## Hold-beat section (if included)

A 3-step modal sequence with a toggle. With hold-beat on, the modal enters, holds for
250ms, then the focus ring appears. With hold-beat off, the focus ring runs parallel.
Reviewers feel the difference.

```html
<section id="hold-beat">
  <h2>Hold beat (Ma)</h2>
  <p>The designed pause between segments of a complex transition. Toggle to feel why
     the pause matters.</p>
  <label><input type="checkbox" id="hold-beat-toggle" checked> Hold beat ON</label>
  <button class="play" data-target="hold-beat-demo">Open modal with focus</button>
  <div class="stage" style="height: 240px;">
    <div class="target modal-with-focus" id="hb-modal">
      <div class="focus-ring" id="hb-focus"></div>
      Modal content
    </div>
  </div>
  <code>--hold-beat 250ms — modal enter, hold, focus arrives</code>
</section>

<script>
  document.querySelector('[data-target="hold-beat-demo"]').addEventListener('click', () => {
    const modal = document.getElementById('hb-modal');
    const focus = document.getElementById('hb-focus');
    const hold = document.getElementById('hold-beat-toggle').checked;

    modal.classList.add('motion-modal-enter');
    if (hold) {
      setTimeout(() => focus.classList.add('arrived'), 240 + 250);  // dur-quick + hold-beat
    } else {
      focus.classList.add('arrived');
    }

    setTimeout(() => {
      modal.classList.remove('motion-modal-enter');
      focus.classList.remove('arrived');
    }, 2500);
  });
</script>
```

## Stepped section (if included)

Side-by-side: same SVG illustration animating smoothly vs stepped. Reviewers see the
hand-keyed quality the stepped channel adds.

```html
<section id="stepped">
  <h2>Stepped channel</h2>
  <p>Hand-keyed motion for illustrations that want Aardman/Laika texture.</p>
  <div class="demo-grid">
    <div class="demo">
      <h3>Smooth (60fps)</h3>
      <svg viewBox="0 0 100 100" class="hand-drawn smooth">
        <!-- the project's hand-drawn SVG -->
      </svg>
      <code>animation: bounce 600ms var(--motion-standard) infinite</code>
    </div>
    <div class="demo">
      <h3>Stepped (12fps)</h3>
      <svg viewBox="0 0 100 100" class="hand-drawn stepped">
        <!-- same SVG -->
      </svg>
      <code>animation: bounce 600ms var(--stepped-12fps) infinite</code>
    </div>
  </div>
</section>
```

## Reduced-motion section

A toggle that simulates `prefers-reduced-motion: reduce` by adding a class to `<body>`
that swaps the relevant tokens. Reviewers replay every demo with reduced motion on to
confirm the page is still usable.

```html
<section id="reduced-motion">
  <h2>Reduced motion preview</h2>
  <p>~35% of users benefit from reduced motion at some point (vestibular sensitivity,
     attention disorders, motion sickness). The fallback isn't optional polish.</p>
  <label>
    <input type="checkbox" id="rm-toggle">
    Simulate prefers-reduced-motion: reduce
  </label>
  <p>Toggle on and replay any motion above. Decorative loops stop. Input-gating
     transitions compress to --dur-instant. Overshoot curves linearize.</p>
</section>

<style>
  body.simulated-reduced-motion {
    --dur-ambient: 0ms;
    --dur-quick: var(--dur-instant);
    --motion-emphasized: linear;
    --motion-expressive: linear;
  }
  body.simulated-reduced-motion .motion-breathe { animation: none; opacity: 1; }
  body.simulated-reduced-motion .motion-press-feedback:active { transform: none; }
</style>
<script>
  document.getElementById('rm-toggle').addEventListener('change', e => {
    document.body.classList.toggle('simulated-reduced-motion', e.target.checked);
  });
</script>
```

## Showcase rules

- **Every motion is playable.** Static "here's the curve" doesn't earn its keep — motion
  has to be felt. If a section has no interactive demo, redesign the section.
- **Tokens are visible.** Each demo prints the actual cubic-bezier coefficients /
  duration / spring params in a `<code>` block. Reviewers see what they're approving.
- **Labels are loud.** Input-gating vs ambient is the most-violated rule; the showcase
  makes the class obvious per-demo.
- **Reduced-motion is its own section, not a footnote.** It's the accessibility gate.
- **No external dependencies.** All JS is inline; no Lottie/Framer/React. The showcase
  is the same tech rule as every other mock (single-file HTML, vanilla CSS/JS).
- **Open in browser, not in IDE.** The showcase is meaningful only when the motion runs
  in real time. Skill always opens it via `xdg-open` / `open` / `start`.
