//! research-view CLI entrypoint.
//!
//! Pipeline:
//! ```text
//! parse_args(argv)
//!   -> Help: print HELP to stdout, exit 0
//!   -> Version: print `research-view <semver>` to stdout, exit 0
//!   -> UsageError: print to stderr, exit 1
//! find_substrate_root(cwd)
//!   -> None: print to stderr, exit 2
//! Substrate::load(root)
//!   -> Err(Io): print to stderr, exit 3
//! emit parse_errors to stderr (exit unaffected)
//! artifacts = substrate.query(&opts.filter)
//! render(artifacts, opts.output, stdout)
//!   -> Ok: exit 0
//!   -> Err(BrokenPipe): exit 0 (clean — e.g. `research-view | head`)
//!   -> Err(other): print to stderr, exit 3
//! ```
//!
//! Exit codes:
//!   0  success (or `--help`, or BrokenPipe)
//!   1  usage error (bad flags, unknown flags, missing values)
//!   2  no substrate found (no `.research/CONVENTIONS.md` in CWD or ancestor)
//!   3  I/O error (load or render)

mod args;
mod render;

use std::env;
use std::io::{self, ErrorKind};

use research_view_core::error::LoadError;
use research_view_core::index::{find_substrate_root, Substrate};

use args::{parse_args, ParseOutcome, HELP, RESEARCH_VIEW_VERSION};
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
        ParseOutcome::Version => {
            println!("research-view {RESEARCH_VIEW_VERSION}");
            return 0;
        }
        ParseOutcome::Run(o) => o,
    };

    // ── 2. Locate substrate root ─────────────────────────────────────────────
    let cwd = match env::current_dir() {
        Ok(d) => d,
        Err(e) => {
            eprintln!("research-view: cannot determine current directory: {e}");
            return 3;
        }
    };

    let root = match find_substrate_root(&cwd) {
        Some(r) => r,
        None => {
            eprintln!(
                "research-view: no substrate found (no .research/CONVENTIONS.md in CWD or ancestor)"
            );
            return 2;
        }
    };

    // ── 3. Load substrate ────────────────────────────────────────────────────
    let (sub, report) = match Substrate::load(&root) {
        Ok(pair) => pair,
        Err(LoadError::Io(e)) => {
            eprintln!("research-view: I/O error loading substrate: {e}");
            return 3;
        }
    };

    // ── 4. Emit non-fatal parse errors to stderr (exit unaffected) ───────────
    for pe in &report.parse_errors {
        eprintln!(
            "research-view: parse error in {}: {}",
            pe.path.display(),
            pe.reason
        );
    }

    // ── 5. Query ─────────────────────────────────────────────────────────────
    let artifacts = sub.query(&opts.filter);

    // ── 6. Render ────────────────────────────────────────────────────────────
    let stdout = io::stdout();
    let mut out = stdout.lock();

    match render(&artifacts, opts.output, &mut out) {
        Ok(()) => 0,
        Err(e) if e.kind() == ErrorKind::BrokenPipe => 0,
        Err(e) => {
            eprintln!("research-view: render error: {e}");
            3
        }
    }
}

fn main() {
    std::process::exit(run() as i32);
}
