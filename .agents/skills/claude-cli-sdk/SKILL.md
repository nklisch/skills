---
name: claude-cli-sdk
description: >
  @nklisch/claude-cli-sdk reference. Auto-loads when working with this SDK —
  spawns Claude CLI as a subprocess using Pro/Max billing (no API key needed).
  Trigger on imports from '@nklisch/claude-cli-sdk', or when user asks to use
  the SDK.
user-invocable: false
---

# @nklisch/claude-cli-sdk Reference

> Wraps the `claude` CLI binary as an async generator. Uses Pro/Max subscription billing — no `ANTHROPIC_API_KEY` required.
> Install: add `@nklisch/claude-cli-sdk` from `https://gitea.daveandnate.games`

## Imports

```typescript
import {
  query, collectResult, tool, zodToOutputFormat, parseStructuredOutput,
  createConversation,
  toolPattern, buildSettings, buildSkill, buildPlugin, writePlugin, writePluginToTemp,
} from '@nklisch/claude-cli-sdk';

import type {
  Options, Query, StreamEvent,
  SystemInitEvent, AssistantTextEvent, ToolUseEvent, ToolResultEvent, ResultEvent,
  ConversationOptions, Conversation, Turn, TurnResult,
  HookMatcher, HookHandler, HookEvent, SettingsConfig,
  SkillConfig, PluginConfig, GeneratedFile, GeneratedPlugin,
  McpServerConfig, PermissionMode, AgentDefinition, JsonSchemaOutputFormat,
} from '@nklisch/claude-cli-sdk';

import { CLIError, CLITimeoutError, CLINotFoundError, StructuredOutputError } from '@nklisch/claude-cli-sdk';
```

## Core API — `query()`

### `query(prompt, options?): Query`

Returns a `Query` — an `AsyncGenerator<StreamEvent>` with extra properties.

```typescript
const q = query('Explain async iterators', { maxTurns: 1 });

// Iterate events
for await (const event of q) {
  if (event.type === 'assistant') process.stdout.write(event.text);
}

// Promises available without consuming the generator
const sessionId = await q.sessionId;  // resolves on first system/init event
const result = await q.result;        // resolves when generation completes
```

### `collectResult(query): Promise<ResultEvent>`

Drains a query and returns the final result.

```typescript
const result = await collectResult(query('Say hello', { maxTurns: 1 }));
console.log(result.result);    // text response
console.log(result.costUsd);   // cost
console.log(result.numTurns);  // turns used
```

## Options

`Options` uses discriminated unions — invalid combinations are **TypeScript compile errors**.

```typescript
type Options = OptionsBase & SessionOptions & PermissionOptions & SystemPromptOptions;
```

```typescript
interface OptionsBase {
  // Model
  model?: 'haiku' | 'sonnet' | 'opus';
  effort?: 'low' | 'medium' | 'high';
  fallbackModel?: 'haiku' | 'sonnet' | 'opus';

  // Tools
  allowedTools?: string[];      // e.g. ['Bash', 'Read'] — use toolPattern helpers
  disallowedTools?: string[];

  // Structured output
  jsonSchema?: JsonSchemaOutputFormat;  // use zodToOutputFormat() to build

  // Limits (both must be > 0)
  maxTurns?: number;
  maxBudgetUsd?: number;

  // MCP
  mcpServers?: Record<string, McpServerConfig>;

  // Sub-agents
  agents?: Record<string, AgentDefinition>;  // keyed by agent name
  agent?: string;

  // Extension loading
  pluginDirs?: string[];        // maps to --plugin-dir (one per entry)
  settings?: string;            // file path OR inline JSON string → --settings
  disableSlashCommands?: boolean;
  strictMcpConfig?: boolean;    // ignore non-SDK MCP sources

  // Context
  additionalDirectories?: string[];
  workDir?: string;

  // Misc
  betas?: string[];
  settingSources?: string[];
  includePartialMessages?: boolean;

  // Runtime
  timeout?: number;             // default 300_000ms
  abortController?: AbortController;
  env?: Record<string, string>;
}

// Session (mutually exclusive — pick one or neither)
type SessionOptions =
  | { resume: string;  continue?: never;  forkSession?: boolean }
  | { resume?: never;  continue: true;    forkSession?: boolean }
  | { resume?: never;  continue?: never;  forkSession?: never  };

// Permission (mutually exclusive)
type PermissionOptions =
  | { permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'dontAsk' | 'plan' | 'auto';
      dangerouslySkipPermissions?: never }
  | { permissionMode?: never; dangerouslySkipPermissions: true }
  | { permissionMode?: never; dangerouslySkipPermissions?: never };

// System prompt (mutually exclusive)
type SystemPromptOptions =
  | { systemPrompt: string;  appendSystemPrompt?: never }
  | { systemPrompt?: never;  appendSystemPrompt: string }
  | { systemPrompt?: never;  appendSystemPrompt?: never };
```

**Runtime guards** (throw at call time):
- `maxTurns` must be `> 0`
- `maxBudgetUsd` must be `> 0`
- Overlapping `allowedTools`/`disallowedTools` entries emit a `logger.warn`

## Stream Events

```typescript
type StreamEvent =
  | SystemInitEvent    // type: 'system', subtype: 'init'
  | AssistantTextEvent // type: 'assistant'
  | ToolUseEvent       // type: 'tool_use'
  | ToolResultEvent    // type: 'tool_result'
  | ResultEvent        // type: 'result'

interface SystemInitEvent {
  type: 'system'; subtype: 'init';
  sessionId: string; model?: string; tools?: string[]; cwd?: string;
}

interface AssistantTextEvent {
  type: 'assistant';
  text: string;    // full text block
  delta?: string;  // same as text (streaming compat)
}

interface ToolUseEvent {
  type: 'tool_use';
  toolName: string; toolId: string; toolInput: unknown;
}

interface ToolResultEvent {
  type: 'tool_result';
  toolId?: string; content?: string; isError?: boolean;
}

interface ResultEvent {
  type: 'result';
  subtype: 'success' | 'error_max_turns' | 'error_during_generation' | 'error_interrupted';
  sessionId: string;
  result?: string;            // final text
  structuredOutput?: unknown; // when jsonSchema is set
  durationMs?: number; numTurns?: number; costUsd?: number;
  usage?: TokenUsage;
  error?: string; isError?: boolean;
}
```

## Conversation API — `createConversation()`

Persistent two-way session backed by a single CLI process (`--input-format stream-json`). No `--resume` overhead between turns.

```typescript
// Basic usage — await using for auto-close
await using conv = createConversation({ dangerouslySkipPermissions: true, maxTurns: 5 });

// sendAndCollect — simplest, no streaming
const r1 = await conv.sendAndCollect('My name is Alice');
const r2 = await conv.sendAndCollect('What is my name?');
console.log(r2.result); // → "Your name is Alice"

// send — streaming events
const turn = conv.send('Explain closures');
for await (const event of turn) {
  if (event.type === 'assistant') process.stdout.write(event.text);
}
const result: TurnResult = await turn.result;

// Properties
const sid = await conv.sessionId;  // resolves after first turn
console.log(conv.isOpen);          // true while process is alive

// Manual close (or use await using)
await conv.close();
conv.abort(); // kill mid-turn
```

### `ConversationOptions`

Same as `Options` but **without** session control (`resume`, `continue`, `forkSession`) — the conversation manages its own session. Has all extension loading fields.

```typescript
interface ConversationOptions {
  model?: ModelAlias; effort?: 'low' | 'medium' | 'high';
  allowedTools?: string[]; disallowedTools?: string[];
  permissionMode?: PermissionMode; dangerouslySkipPermissions?: boolean;
  systemPrompt?: string; appendSystemPrompt?: string;
  jsonSchema?: JsonSchemaOutputFormat;
  maxTurns?: number; maxBudgetUsd?: number;
  mcpServers?: Record<string, McpServerConfig>;
  agents?: Record<string, AgentDefinition>; agent?: string;
  additionalDirectories?: string[]; workDir?: string;
  pluginDirs?: string[]; settings?: string; settingSources?: string[];
  disableSlashCommands?: boolean; strictMcpConfig?: boolean;
  betas?: string[]; includePartialMessages?: boolean;
  timeout?: number; abortController?: AbortController; env?: Record<string, string>;
}
```

### `TurnResult`

```typescript
interface TurnResult {
  result?: string;          // final text
  structuredOutput?: unknown;
  sessionId: string;
  costUsd?: number; durationMs?: number; numTurns?: number;
  resultEvent: ResultEvent; // full raw event
}
```

## Extension Helpers

### `toolPattern` — Build tool permission patterns

```typescript
toolPattern.bash()              // → 'Bash'
toolPattern.bash('git *')       // → 'Bash(git *)'
toolPattern.read('src/**/*.ts') // → 'Read(src/**/*.ts)'
toolPattern.edit('/docs/**')    // → 'Edit(/docs/**)'
toolPattern.webFetch('api.example.com')  // → 'WebFetch(domain:api.example.com)'
toolPattern.mcp('github')                // → 'mcp__github'
toolPattern.mcp('github', 'list_repos') // → 'mcp__github__list_repos'
toolPattern.agent('Explore')    // → 'Agent(Explore)'
toolPattern.skill('commit')     // → 'Skill(commit)'

// Use in allowedTools / disallowedTools:
query('...', {
  allowedTools: [toolPattern.bash('git *'), toolPattern.read(), 'Glob'],
});
```

### `buildSettings()` — Typed settings JSON

```typescript
const settings = buildSettings({
  permissions: {
    allow: [toolPattern.bash('git *'), 'Read'],
    deny: ['Write'],
    defaultMode: 'acceptEdits',
  },
  hooks: {
    PreToolUse: [{
      matcher: 'Bash',
      hooks: [{ type: 'command', command: './lint.sh' }],
    }],
  },
  env: { NODE_ENV: 'production' },
  sandbox: { enabled: true },
});

// Pass to query or conversation:
query('...', { settings });
createConversation({ settings });
```

### `buildSkill()` — Generate SKILL.md

```typescript
const skill = buildSkill({
  name: 'code-review',
  description: 'Reviews code for quality issues',
  instructions: 'Review $ARGUMENTS for bugs and style issues.',
  allowedTools: ['Read', 'Grep', 'Glob'],
  argumentHint: '[file-or-dir]',
});
// skill.path → 'SKILL.md'
// skill.content → frontmatter + instructions markdown
```

### `buildPlugin()` / `writePluginToTemp()` — Plugin scaffold

```typescript
const plugin = buildPlugin({
  name: 'my-linter',
  description: 'Auto-lint on file edits',
  skills: {
    lint: {
      description: 'Run linter on files',
      instructions: 'Run eslint on $ARGUMENTS',
      allowedTools: [toolPattern.bash('eslint *')],
    },
  },
  hooks: {
    PostToolUse: [{
      matcher: 'Edit',
      hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/lint.sh' }],
    }],
  },
});

// Write to temp dir and pass to conversation:
const dir = await writePluginToTemp(plugin);
await using conv = createConversation({ pluginDirs: [dir] });

// Or write to a known path:
await writePlugin(plugin, '/path/to/plugins/my-linter');
```

## Structured Output

```typescript
import { z } from 'zod';
import { zodToOutputFormat, parseStructuredOutput, collectResult, query } from '@nklisch/claude-cli-sdk';

const schema = z.object({ name: z.string(), score: z.number() });
const jsonSchema = zodToOutputFormat(schema, 'Result');  // name optional, default 'Output'

const result = await collectResult(
  query('Extract name and score from: "Alice scored 95"', { maxTurns: 1, jsonSchema })
);

const parsed = parseStructuredOutput(schema, result);
// parsed.name, parsed.score — fully typed
```

## Abort / Cancellation

```typescript
// Via q.abort()
const q = query('Count to 1000', { maxTurns: 10 });
for await (const event of q) {
  if (shouldStop) { q.abort(); break; }
}

// Via AbortController
const ac = new AbortController();
const q = query('...', { abortController: ac });
setTimeout(() => ac.abort(), 5000);
for await (const _ of q) {}

// Via using (Symbol.asyncDispose)
{
  await using q = query('...', { maxTurns: 20 });
  await q.next(); // take one event, then dispose aborts automatically
}
```

## MCP Servers

```typescript
const q = query('Find recent news', {
  mcpServers: {
    browser: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    },
    myApi: {
      type: 'http',
      url: 'https://my-mcp-server.example.com',
      headers: { Authorization: 'Bearer token' },
    },
  },
  maxTurns: 5,
});
```

## Errors

```typescript
try {
  await collectResult(query('...'));
} catch (err) {
  if (err instanceof CLINotFoundError) {
    // `claude` binary not found in PATH
  } else if (err instanceof CLITimeoutError) {
    console.log(err.timeoutMs);
  } else if (err instanceof CLIError) {
    console.log(err.exitCode, err.stderr);
  } else if (err instanceof StructuredOutputError) {
    console.log(err.issues, err.rawOutput);
  }
}
```

## Common Patterns

**Stream text as it arrives:**
```typescript
for await (const event of query('Write a haiku', { maxTurns: 1 })) {
  if (event.type === 'assistant') process.stdout.write(event.text);
}
```

**Resume a session:**
```typescript
const first = await collectResult(query('My name is Alice', { maxTurns: 1 }));
const second = await collectResult(query('What is my name?', { resume: first.sessionId, maxTurns: 1 }));
```

**Multi-turn conversation (preferred over resume):**
```typescript
await using conv = createConversation({ maxTurns: 3, dangerouslySkipPermissions: true });
await conv.sendAndCollect('My name is Alice');
const r = await conv.sendAndCollect('What is my name?');
console.log(r.result); // → "Your name is Alice"
```

**Inject hooks into a conversation:**
```typescript
const settings = buildSettings({
  hooks: {
    PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: './pre-check.sh' }] }],
  },
});
await using conv = createConversation({ settings, dangerouslySkipPermissions: true });
```

**Parallel queries:**
```typescript
const [r1, r2] = await Promise.all([
  collectResult(query('Say ONE', { maxTurns: 1 })),
  collectResult(query('Say TWO', { maxTurns: 1 })),
]);
```

**Watch for tool calls:**
```typescript
for await (const event of query('List files in /tmp', { maxTurns: 3 })) {
  if (event.type === 'tool_use') console.log('Tool called:', event.toolName, event.toolInput);
  if (event.type === 'tool_result') console.log('Result:', event.content);
}
```

## Gotchas

**`CLAUDECODE` env var must be unset** when spawning from within a Claude Code session, or the CLI refuses to start with "nested sessions" error. The SDK does not handle this automatically:
```typescript
delete process.env['CLAUDECODE'];
```

**`--verbose` is always passed** — required by CLI 2.1.71+ for `stream-json` output. No `verbose` option in `Options`; it's always enabled internally.

**`sessionId` and `result` promises require the generator to be consumed.** They resolve from events emitted by the generator — if you only `await q.result` without iterating, it will hang. Always drain in parallel:
```typescript
const drain = (async () => { for await (const _ of q) {} })();
const result = await q.result;
await drain;
```
`collectResult` handles this internally — safe to `await` alone.

**`allowedTools: []` disables all tools** — Claude responds in text only.

**`maxTurns` and `maxBudgetUsd` must be > 0** — `buildCliArgs` throws immediately for `≤ 0` values.

**`jsonSchema` requires `maxTurns > 1`** — Claude needs an agentic turn to produce structured output; passing `maxTurns: 1` with `jsonSchema` throws at call time. Use `maxTurns: 3` or higher.

**Invalid `Options` combos are compile errors** — e.g. `{ resume: 'x', continue: true }`, `{ permissionMode: 'plan', dangerouslySkipPermissions: true }`, `{ systemPrompt: 'a', appendSystemPrompt: 'b' }`, `{ forkSession: true }` (without resume/continue).

**`agents` is keyed by name** — `Record<string, AgentDefinition>`, not an array.

**`outputFormat` and `settingsFile` are removed** — use `jsonSchema` and `settings` respectively.
