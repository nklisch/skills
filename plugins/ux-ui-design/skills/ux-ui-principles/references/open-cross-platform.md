# Cross-platform file opening

The mockup generators all need to open `.html` files in the user's default
browser after writing them. There's no portable shell command — pick by OS.

## The detection recipe

```bash
open_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "missing: $path" >&2
    return 1
  fi

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$path" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "$path"
  elif command -v start >/dev/null 2>&1; then
    start "" "$path"
  else
    # Fallback: print clickable file URL
    local abs
    abs="$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
    echo "file://$abs"
  fi
}
```

## Per-platform notes

**Linux** — `xdg-open` is the freedesktop standard. Backgrounded with `&` so
it doesn't block the terminal (browsers print noise on stderr at launch).
Discard stderr to keep the terminal clean.

**macOS** — `open` is native. Runs synchronously but returns immediately; it
just hands the URL to LaunchServices.

**Windows** — In Git Bash / MSYS / WSL, `start` is the closest equivalent. The
empty string is the window title (required when the path is quoted).

**Fallback** — Always print the `file://` URL. Most modern terminals
(Kitty, iTerm2, Windows Terminal, VS Code's integrated terminal) make `file://`
URLs clickable on `Ctrl+Click` or `Cmd+Click`.

## Opening multiple files

For the `screens` skill (4 options), open the `index.html` (which embeds all
four in iframes) — not all four individually. That avoids spawning four
browser tabs and keeps the user's review in one viewport.

For `flows` (multi-page sequence), open the flow's `index.html` — same
reasoning.

For `palette`, open `palette.html` and `typography.html` if both were
generated.

## Don't block on errors

Opening is a convenience. If `xdg-open` returns non-zero, or the file
manager prompt asks for a program, the user can still read the printed
`file://` path. Never fail the skill because the open failed.
