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
const FILTERS_JS: &[u8] = include_bytes!("assets/filters.js");
const MARKDOWN_JS: &[u8] = include_bytes!("assets/markdown.js");
const CARD_JS: &[u8] = include_bytes!("assets/card.js");
const DETAIL_JS: &[u8] = include_bytes!("assets/detail.js");
const VIEWS_JS: &[u8] = include_bytes!("assets/views.js");
const KANBAN_JS: &[u8] = include_bytes!("assets/kanban.js");
const DEPENDENCY_JS: &[u8] = include_bytes!("assets/dependency.js");
const TABLE_JS: &[u8] = include_bytes!("assets/table.js");

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
        "/assets/filters.js" => Some(Asset {
            bytes: FILTERS_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/markdown.js" => Some(Asset {
            bytes: MARKDOWN_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/card.js" => Some(Asset {
            bytes: CARD_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/detail.js" => Some(Asset {
            bytes: DETAIL_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/views.js" => Some(Asset {
            bytes: VIEWS_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/kanban.js" => Some(Asset {
            bytes: KANBAN_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/dependency.js" => Some(Asset {
            bytes: DEPENDENCY_JS,
            content_type: "text/javascript; charset=utf-8",
        }),
        "/assets/table.js" => Some(Asset {
            bytes: TABLE_JS,
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
        for path in [
            "/assets/board.js",
            "/assets/state.js",
            "/assets/filters.js",
            "/assets/markdown.js",
            "/assets/card.js",
            "/assets/detail.js",
            "/assets/views.js",
            "/assets/kanban.js",
            "/assets/dependency.js",
            "/assets/table.js",
        ] {
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
