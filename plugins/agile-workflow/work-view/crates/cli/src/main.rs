//! work-view CLI entrypoint.
//!
//! Pipeline:
//! ```text
//! parse_args(argv)
//!   -> Help: print HELP to stdout, exit 0
//!   -> UsageError: print to stderr, exit 1
//! find_substrate_root(cwd)
//!   -> None: print to stderr, exit 2
//! Substrate::load(root)
//!   -> Err(Io): print to stderr, exit 3
//! emit parse_errors / validation_warnings / duplicate_ids to stderr
//! items = substrate.query(&opts.filter)
//! items = apply_dependency_view(&sub, items, opts.dependency_view)
//! render(items, opts.output, stdout)
//!   -> Ok: exit 0
//!   -> Err(BrokenPipe): exit 0 (clean — e.g. `work-view | head`)
//!   -> Err(other): print to stderr, exit 3
//! ```
//!
//! Exit codes:
//!   0  success (or `--help`, or BrokenPipe)
//!   1  usage error (bad flags, conflicting flags)
//!   2  no substrate found
//!   3  I/O error (load or render)

mod actionable;
mod args;
mod render;

use std::env;
use std::io::{self, ErrorKind};

use work_view_core::error::LoadError;
use work_view_core::index::{find_substrate_root, Substrate};

use actionable::apply_dependency_view;
use args::{parse_args, ParseOutcome, HELP};
use render::render;

fn run() -> u8 {
    // ── 1. Parse argv ────────────────────────────────────────────────────────
    let argv: Vec<String> = env::args().skip(1).collect();
    let outcome = match parse_args(argv.into_iter()) {
        Ok(o) => o,
        Err(e) => {
            eprintln!("{e}");
            return 1;
        }
    };

    let opts = match outcome {
        ParseOutcome::Help => {
            println!("{HELP}");
            return 0;
        }
        ParseOutcome::Run(o) => o,
    };

    // ── 2. Locate substrate root ─────────────────────────────────────────────
    let cwd = match env::current_dir() {
        Ok(d) => d,
        Err(e) => {
            eprintln!("work-view: cannot determine current directory: {e}");
            return 3;
        }
    };

    let root = match find_substrate_root(&cwd) {
        Some(r) => r,
        None => {
            eprintln!("work-view: no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)");
            return 2;
        }
    };

    // ── 3. Load substrate ────────────────────────────────────────────────────
    let (sub, report) = match Substrate::load(&root) {
        Ok(pair) => pair,
        Err(LoadError::Io(e)) => {
            eprintln!("work-view: I/O error loading substrate: {e}");
            return 3;
        }
    };

    // ── 4. Emit non-fatal diagnostics to stderr (exit unaffected) ────────────
    for pe in &report.parse_errors {
        eprintln!(
            "work-view: parse error in {}: {}",
            pe.path.display(),
            pe.reason
        );
    }
    for vw in &report.validation_warnings {
        eprintln!(
            "work-view: validation warning for item {:?} in {}: {}",
            vw.id.as_deref().unwrap_or("<unknown>"),
            vw.path.display(),
            vw.reason
        );
    }
    for dup in &report.duplicate_ids {
        eprintln!(
            "work-view: duplicate id {:?} at {}: {}",
            dup.id.as_deref().unwrap_or("<unknown>"),
            dup.path.display(),
            dup.reason
        );
    }

    // ── 5. Query + post-filter ───────────────────────────────────────────────
    let items = sub.query(&opts.filter);
    let items = apply_dependency_view(&sub, items, opts.dependency_view);

    // ── 6. Render ────────────────────────────────────────────────────────────
    let stdout = io::stdout();
    let mut out = stdout.lock();

    match render(&items, opts.output, &mut out) {
        Ok(()) => 0,
        Err(e) if e.kind() == ErrorKind::BrokenPipe => 0,
        Err(e) => {
            eprintln!("work-view: render error: {e}");
            3
        }
    }
}

fn main() {
    std::process::exit(run() as i32);
}
