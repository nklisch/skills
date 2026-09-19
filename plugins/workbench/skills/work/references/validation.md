# Project Validation Policy

Use the installed Workbench entry point after structural ledger changes:

```bash
python3 <workbench-plugin-root>/scripts/validate-workbench.py <project-root>
```

For ordinary work, run that command and act on its result; no further reading is
needed unless configuring or diagnosing the project's validator. The rest of this
reference is for validator authors.

By default it runs bundled structural checks. A project can replace that policy
with an optional argument list in `.work/CONVENTIONS.md` frontmatter:

```yaml
validator_command: [python3, scripts/validate-work.py]
```

A block list works too. Use the interpreter or executable available in the project;
Workbench imposes no language or filename. Keep the script in the project's normal
script directory rather than introducing another `.work/` artifact directory.
The conventions body may explain the policy's checks and intentional differences.
Adopt or change this command only with project authority; never install a weaker
policy merely to silence an inconvenient failure.

## Command contract

- The entry point runs the configured argument list **instead of** bundled checks,
  with the project root as the working directory. No root argument is appended;
  add `.` to the list if the script needs it.
- Arguments are literal: no shell expansion, variable substitution, or implicit
  shell. Quote paths containing spaces as individual list entries. Use an explicit
  shell invocation if that is the project's chosen command.
- Standard input, output, and error are inherited. Exit zero means pass; nonzero
  means failure. Signal termination becomes the usual `128 + signal` exit code.
- Malformed or unlaunchable commands report an error and exit 2. They do not
  silently fall back to a different validation policy. Remove the field to restore
  the default; an empty list is not a disable switch.
- `WORKBENCH_VALIDATOR` contains the absolute path of the running entry script so
  a wrapper can invoke bundled checks without finding the installed plugin again.

This is executable project policy, like a test command, not passive metadata.
Reading conventions does not execute it. A custom
success means the project policy passed, not that bundled checks ran. It replaces
ledger validation only, not required behavioral tests, review, research linting,
or knowledge-index maintenance.

## Reuse bundled checks

Use `--builtin` to ignore the configured override explicitly:

```bash
python3 <workbench-plugin-root>/scripts/validate-workbench.py --builtin <project-root>
```

A Python wrapper can call the same bundled checks and then add its own:

```python
import os
import subprocess
import sys

result = subprocess.run(
    [sys.executable, os.environ["WORKBENCH_VALIDATOR"], "--builtin", "."],
    check=False,
)
if result.returncode:
    sys.exit(result.returncode if result.returncode > 0 else 128 - result.returncode)
# Run project-specific checks here and return nonzero on failure.
```

Always include `--builtin` when calling back into the entry point; otherwise it
would select the wrapper again. A true replacement script omits that call and
implements the project's chosen checks itself. Do not run bundled checks as an
additional acceptance gate unless project policy requires them. A failing
replacement remains a verification failure; report its actual diagnostics rather
than calling `--builtin` to obtain a substitute green result.
