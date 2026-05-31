//! Embedded static assets for `work-view board`.

pub(crate) struct Asset {
    pub bytes: &'static [u8],
    pub content_type: &'static str,
}

const INDEX_HTML: &[u8] = include_bytes!("assets/index.html");
const BOARD_CSS: &[u8] = include_bytes!("assets/board.css");
const BOARD_JS: &[u8] = include_bytes!("assets/board.js");

pub(crate) fn asset_for_path(path: &str) -> Option<Asset> {
    match path {
        "/" | "/index.html" => Some(Asset {
            bytes: INDEX_HTML,
            content_type: "text/html; charset=utf-8",
        }),
        "/assets/board.css" => Some(Asset {
            bytes: BOARD_CSS,
            content_type: "text/css; charset=utf-8",
        }),
        "/assets/board.js" => Some(Asset {
            bytes: BOARD_JS,
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
        let css = asset_for_path("/assets/board.css").expect("expected CSS asset");
        assert_eq!(css.content_type, "text/css; charset=utf-8");
        let js = asset_for_path("/assets/board.js").expect("expected JS asset");
        assert_eq!(js.content_type, "text/javascript; charset=utf-8");
    }

    #[test]
    fn missing_asset_returns_none() {
        assert!(asset_for_path("/assets/missing.js").is_none());
    }
}
