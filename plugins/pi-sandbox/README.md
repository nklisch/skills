# Pi Sandbox

## Security boundary / non-goals

This plugin makes the common shell and file-tool path safer; it is not a complete trust boundary for a Pi session.

What it hardens:

- The built-in `bash` command path runs through the first-party Linux `bwrap` backend when the sandbox initializes.
- The `read`, `write`, and `edit` tools enforce the configured file policy in-process, so file-tool protections remain active even when bash is fail-closed.
- `network.mode=block` air-gaps sandboxed bash with a network namespace. `network.mode=open` leaves host networking intact for sandboxed bash while still applying the file policy.

Non-goals and known gaps:

- Pi extensions and installed Pi packages are trusted code. They run with the user's normal permissions and are not sandboxed by this plugin.
- `background` and `monitor` currently spawn outside the overridden bash tool until the background-tasks integration lands. Track that gap in `.work/backlog/idea-background-tasks-sandbox-integration.md`.
- `agent_send`, web/search tools, subagents, and provider/model requests are not OS-sandboxed command surfaces. They may perform network or provider egress according to their own implementations and any in-process tool policy configured by Pi.
- `network.mode=open` is not an egress boundary. It intentionally gives sandboxed bash the host's normal network access.
- `network.mode=filter` is recognized as a deferred strict mode and fails closed rather than silently degrading to open networking. Track the TCP proxy/filter work in `.work/backlog/idea-pi-sandbox-filter-tcp-proxy.md`.

Use this plugin as defense-in-depth for shell commands and file access, not as a promise that arbitrary extensions, tools, agents, or provider calls are confined by an operating-system sandbox.
