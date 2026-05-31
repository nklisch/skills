//! Board subcommand parsing and dispatch.
//!
//! Unit 1 wires the `work-view board` / `work-view serve` entry point and keeps
//! the server itself as an explicit placeholder for later host stories.

use std::env;

use work_view_core::index::find_substrate_root;

use crate::args::UsageError;

pub(crate) const BOARD_HELP: &str = "\
work-view board - serve the agile-workflow substrate board

Usage: work-view board [OPTIONS]
       work-view serve [OPTIONS]

Options:
  --port <n>           Port to bind on localhost (default: 8181)
  --no-open            Do not open a browser after starting
  --print              Alias for --no-open
  --once               Serve one request, then exit (internal test mode)
  --help, -h           Show this help and exit\
";

#[derive(Debug, PartialEq)]
pub(crate) struct BoardOptions {
    pub port: u16,
    pub no_open: bool,
    pub once: bool,
}

impl Default for BoardOptions {
    fn default() -> Self {
        Self {
            port: 8181,
            no_open: false,
            once: false,
        }
    }
}

#[derive(Debug, PartialEq)]
pub(crate) enum BoardParseOutcome {
    Help,
    Run(BoardOptions),
}

fn next_value<I: Iterator<Item = String>>(
    flag: &str,
    iter: &mut std::iter::Peekable<I>,
) -> Result<String, UsageError> {
    match iter.peek() {
        None => Err(UsageError(format!("missing value for {flag}"))),
        Some(next) if next.starts_with('-') => Err(UsageError(format!("missing value for {flag}"))),
        Some(_) => Ok(iter.next().expect("peeked Some")),
    }
}

pub(crate) fn parse_board_args<I: Iterator<Item = String>>(
    args: I,
) -> Result<BoardParseOutcome, UsageError> {
    let mut opts = BoardOptions::default();
    let mut iter = args.peekable();
    let mut flags_done = false;

    while let Some(arg) = iter.next() {
        if flags_done {
            return Err(UsageError(format!("unexpected argument: {arg}")));
        }

        match arg.as_str() {
            "--" => {
                flags_done = true;
            }
            "--help" | "-h" => {
                return Ok(BoardParseOutcome::Help);
            }
            "--port" => {
                let value = next_value("--port", &mut iter)?;
                opts.port = value
                    .parse::<u16>()
                    .map_err(|_| UsageError(format!("invalid value for --port: {value}")))?;
            }
            "--no-open" | "--print" => {
                opts.no_open = true;
            }
            "--once" => {
                opts.once = true;
            }
            flag if flag.starts_with('-') => {
                return Err(UsageError(format!("unknown board flag: {flag}")));
            }
            positional => {
                return Err(UsageError(format!("unexpected argument: {positional}")));
            }
        }
    }

    Ok(BoardParseOutcome::Run(opts))
}

pub(crate) fn run_board(opts: BoardOptions) -> u8 {
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

    eprintln!(
        "work-view board: server not implemented yet (substrate: {}, requested port: {}, no-open: {}, once: {})",
        root.display(),
        opts.port,
        opts.no_open,
        opts.once
    );
    1
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(args: &[&str]) -> Result<BoardParseOutcome, UsageError> {
        parse_board_args(args.iter().map(|s| s.to_string()))
    }

    fn run(args: &[&str]) -> BoardOptions {
        match parse(args).expect("expected Ok") {
            BoardParseOutcome::Run(opts) => opts,
            BoardParseOutcome::Help => panic!("expected Run, got Help"),
        }
    }

    fn err(args: &[&str]) -> String {
        match parse(args).expect_err("expected UsageError") {
            UsageError(msg) => msg,
        }
    }

    #[test]
    fn no_args_produces_default_options() {
        assert_eq!(run(&[]), BoardOptions::default());
    }

    #[test]
    fn port_flag_sets_port() {
        let opts = run(&["--port", "9000"]);
        assert_eq!(opts.port, 9000);
    }

    #[test]
    fn no_open_flag_disables_browser_open() {
        let opts = run(&["--no-open"]);
        assert!(opts.no_open);
    }

    #[test]
    fn print_is_no_open_alias() {
        let opts = run(&["--print"]);
        assert!(opts.no_open);
    }

    #[test]
    fn once_flag_sets_once() {
        let opts = run(&["--once"]);
        assert!(opts.once);
    }

    #[test]
    fn help_long_returns_help_outcome() {
        assert!(matches!(
            parse(&["--help"]).unwrap(),
            BoardParseOutcome::Help
        ));
    }

    #[test]
    fn help_short_returns_help_outcome() {
        assert!(matches!(parse(&["-h"]).unwrap(), BoardParseOutcome::Help));
    }

    #[test]
    fn combined_flags_parse() {
        let opts = run(&["--port", "9090", "--print", "--once"]);
        assert_eq!(
            opts,
            BoardOptions {
                port: 9090,
                no_open: true,
                once: true,
            }
        );
    }

    #[test]
    fn missing_port_value_is_usage_error() {
        let msg = err(&["--port"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--port"), "got: {msg}");
    }

    #[test]
    fn port_followed_by_flag_is_missing_value() {
        let msg = err(&["--port", "--no-open"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--port"), "got: {msg}");
    }

    #[test]
    fn invalid_port_is_usage_error() {
        let msg = err(&["--port", "not-a-port"]);
        assert!(msg.contains("invalid value"), "got: {msg}");
        assert!(msg.contains("--port"), "got: {msg}");
    }

    #[test]
    fn unknown_flag_is_usage_error() {
        let msg = err(&["--frobulate"]);
        assert!(msg.contains("unknown board flag"), "got: {msg}");
        assert!(msg.contains("--frobulate"), "got: {msg}");
    }

    #[test]
    fn positional_arg_is_usage_error() {
        let msg = err(&["extra"]);
        assert!(msg.contains("unexpected argument"), "got: {msg}");
    }

    #[test]
    fn positional_after_dash_dash_is_usage_error() {
        let msg = err(&["--", "extra"]);
        assert!(msg.contains("unexpected argument"), "got: {msg}");
    }
}
