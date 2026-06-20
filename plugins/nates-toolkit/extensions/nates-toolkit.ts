/**
 * nates-toolkit — pi-native utilities.
 *
 * Currently registers:
 *   - /exit : gracefully shut pi down (alias for the built-in /quit, for
 *             muscle-memory parity with shells and other tools).
 *
 * This is nates-toolkit's first pi extension surface; it has no dependencies
 * (it only calls ctx.shutdown()) and uses a locally-typed PiApi slice (mirrors
 * the agile-workflow / background-tasks house style) so it stays unit-testable
 * with a fake pi under bare `bun test`.
 */

type CommandContext = {
  /** Gracefully shut pi down and exit. Provided by pi on the command context. */
  shutdown?: () => void;
};

type PiApi = {
  registerCommand?: (
    name: string,
    options: {
      description?: string;
      handler: (args: string | undefined, ctx: CommandContext) => Promise<void>;
    },
  ) => void;
};

export default function natesToolkitExtension(pi: PiApi): void {
  pi.registerCommand?.("exit", {
    description: "Exit pi (graceful shutdown)",
    handler: async (_args, ctx) => {
      // ctx.shutdown() is documented as "Gracefully shutdown pi and exit" and
      // is available in all extension contexts. It runs session_shutdown
      // handlers (e.g. background-tasks cancels its jobs) before exiting.
      ctx.shutdown?.();
    },
  });
}
