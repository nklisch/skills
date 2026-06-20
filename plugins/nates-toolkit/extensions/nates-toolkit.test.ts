import { describe, expect, test } from "bun:test";
import natesToolkitExtension from "./nates-toolkit";

type CommandCtx = { shutdown?: () => void };
type CommandOptions = {
  description?: string;
  handler: (args: string | undefined, ctx: CommandCtx) => Promise<void>;
};

function load() {
  const commands = new Map<string, CommandOptions>();
  const pi = {
    registerCommand: (name: string, options: CommandOptions) => {
      commands.set(name, options);
    },
  };
  natesToolkitExtension(pi);
  return commands;
}

describe("/exit command", () => {
  test("registers an 'exit' command with a clear description", () => {
    const commands = load();
    expect(commands.has("exit")).toBe(true);
    expect(commands.get("exit")!.description ?? "").toMatch(/exit|shutdown|quit|close/i);
  });

  test("handler calls ctx.shutdown() exactly once", async () => {
    const commands = load();
    let shutdownCalls = 0;
    await commands.get("exit")!.handler(undefined, {
      shutdown: () => {
        shutdownCalls++;
      },
    });
    expect(shutdownCalls).toBe(1);
  });

  test("handler is safe when ctx.shutdown is unavailable (older pi)", async () => {
    const commands = load();
    // No shutdown on ctx — handler must not throw.
    await expect(commands.get("exit")!.handler(undefined, {})).resolves.toBeUndefined();
  });
});
