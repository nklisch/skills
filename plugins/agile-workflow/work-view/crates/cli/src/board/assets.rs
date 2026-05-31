//! Embedded static assets for `work-view board`.

pub(crate) struct Asset {
    pub bytes: &'static [u8],
    pub content_type: &'static str,
}

const INDEX_HTML: &[u8] = include_bytes!("assets/index.html");
const TOKENS_CSS: &[u8] = include_bytes!("assets/tokens.css");
const COMPONENTS_CSS: &[u8] = include_bytes!("assets/components.css");
const MOTION_CSS: &[u8] = include_bytes!("assets/motion.css");
const BOARD_CSS: &[u8] = include_bytes!("assets/board.css");
const BOARD_JS: &[u8] = include_bytes!("assets/board.js");
const STATE_JS: &[u8] = include_bytes!("assets/state.js");

pub(crate) fn asset_for_path(path: &str) -> Option<Asset> {
    match path {
        "/" | "/index.html" => Some(Asset {
            bytes: INDEX_HTML,
            content_type: "text/html; charset=utf-8",
        }),
        "/assets/tokens.css" => Some(Asset {
            bytes: TOKENS_CSS,
            content_type: "text/css; charset=utf-8",
        }),
        "/assets/components.css" => Some(Asset {
            bytes: COMPONENTS_CSS,
            content_type: "text/css; charset=utf-8",
        }),
        "/assets/motion.css" => Some(Asset {
            bytes: MOTION_CSS,
            content_type: "text/css; charset=utf-8",
        }),
        "/assets/board.css" => Some(Asset {
            bytes: BOARD_CSS,
            content_type: "text/css; charset=utf-8",
        }),
        "/assets/board.js" => Some(Asset {
            bytes: BOARD_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/state.js" => Some(Asset {
            bytes: STATE_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn root_and_index_return_html() {
        for path in ["/", "/index.html"] {
            let asset = asset_for_path(path).expect("expected index asset");
            assert_eq!(asset.content_type, "text/html; charset=utf-8");
            assert!(asset.bytes.starts_with(b"<!doctype html>"));
        }
    }

    #[test]
    fn css_and_js_return_expected_types() {
        for path in [
            "/assets/tokens.css",
            "/assets/components.css",
            "/assets/motion.css",
            "/assets/board.css",
        ] {
            let css = asset_for_path(path).expect("expected CSS asset");
            assert_eq!(css.content_type, "text/css; charset=utf-8");
            assert!(!css.bytes.is_empty());
        }
        for path in ["/assets/board.js", "/assets/state.js"] {
            let js = asset_for_path(path).expect("expected JS asset");
            assert_eq!(js.content_type, "text/javascript; charset=utf-8");
            assert!(!js.bytes.is_empty());
        }
    }

    #[test]
    fn shipped_css_has_no_remote_dependencies() {
        for path in [
            "/assets/tokens.css",
            "/assets/components.css",
            "/assets/motion.css",
            "/assets/board.css",
        ] {
            let css = asset_for_path(path).expect("expected CSS asset");
            let body = std::str::from_utf8(css.bytes).expect("CSS should be UTF-8");
            assert!(
                !body.contains("@import url"),
                "{path} must not import remote CSS"
            );
            assert!(
                !body.contains("fonts.googleapis"),
                "{path} must not reference Google Fonts"
            );
            assert!(
                !body.contains("https://"),
                "{path} must not reference remote HTTPS assets"
            );
        }
    }

    #[test]
    fn missing_asset_returns_none() {
        assert!(asset_for_path("/assets/missing.js").is_none());
    }
}
