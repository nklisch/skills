//! Browser launching for the local board server.

use std::env;
use std::fs;
use std::io;
use std::process::Command;

use super::BoardOptions;

#[derive(Debug, PartialEq, Eq)]
pub(crate) enum BrowserOpenStatus {
    Skipped,
    Headless,
    Spawned(&'static str),
    Unavailable,
}

pub(crate) fn open_after_bind(url: &str, opts: &BoardOptions) -> BrowserOpenStatus {
    if !should_try_open(opts.no_open, opts.once, graphical_session_available()) {
        if !opts.no_open && !opts.once {
            println!("work-view board: no graphical session detected; open {url}");
            return BrowserOpenStatus::Headless;
        }
        return BrowserOpenStatus::Skipped;
    }

    for opener in ["xdg-open", "open", "wslview"] {
        match Command::new(opener).arg(url).spawn() {
            Ok(_) => {
                println!("work-view board: opened browser with {opener}");
                return BrowserOpenStatus::Spawned(opener);
            }
            Err(e) if e.kind() == io::ErrorKind::NotFound => {}
            Err(_) => {}
        }
    }

    println!("work-view board: could not open a browser automatically; open {url}");
    BrowserOpenStatus::Unavailable
}

fn should_try_open(no_open: bool, once: bool, has_graphical_session: bool) -> bool {
    !no_open && !once && has_graphical_session
}

fn graphical_session_available() -> bool {
    graphical_session_from_env(
        env::var_os("DISPLAY").as_deref(),
        env::var_os("WAYLAND_DISPLAY").as_deref(),
        cfg!(target_os = "macos"),
        running_under_wsl(),
    )
}

fn graphical_session_from_env(
    display: Option<&std::ffi::OsStr>,
    wayland_display: Option<&std::ffi::OsStr>,
    is_macos: bool,
    is_wsl: bool,
) -> bool {
    is_macos || is_wsl || nonempty_env(display) || nonempty_env(wayland_display)
}

fn nonempty_env(value: Option<&std::ffi::OsStr>) -> bool {
    value.is_some_and(|v| !v.is_empty())
}

fn running_under_wsl() -> bool {
    let Ok(release) = fs::read_to_string("/proc/sys/kernel/osrelease") else {
        return false;
    };
    let release = release.to_ascii_lowercase();
    release.contains("microsoft") || release.contains("wsl")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsStr;

    #[test]
    fn skips_when_user_disables_open() {
        assert!(!should_try_open(true, false, true));
    }

    #[test]
    fn skips_during_once_mode() {
        assert!(!should_try_open(false, true, true));
    }

    #[test]
    fn skips_without_graphical_session() {
        assert!(!should_try_open(false, false, false));
    }

    #[test]
    fn tries_when_graphical_session_available() {
        assert!(should_try_open(false, false, true));
    }

    #[test]
    fn detects_display_env() {
        assert!(graphical_session_from_env(
            Some(OsStr::new(":0")),
            None,
            false,
            false
        ));
    }

    #[test]
    fn detects_wayland_env() {
        assert!(graphical_session_from_env(
            None,
            Some(OsStr::new("wayland-0")),
            false,
            false
        ));
    }

    #[test]
    fn treats_macos_as_graphical() {
        assert!(graphical_session_from_env(None, None, true, false));
    }

    #[test]
    fn treats_wsl_as_openable() {
        assert!(graphical_session_from_env(None, None, false, true));
    }

    #[test]
    fn empty_env_values_do_not_count_as_graphical() {
        assert!(!graphical_session_from_env(
            Some(OsStr::new("")),
            Some(OsStr::new("")),
            false,
            false
        ));
    }
}
