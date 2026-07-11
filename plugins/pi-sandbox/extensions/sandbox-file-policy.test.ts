import { afterEach, describe, expect, test } from "bun:test";
import { link, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeReadOperations, makeWriteOperations, type SandboxPolicy } from "./sandbox-file-policy";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pi-sandbox-file-policy-test-"));
	tempDirs.push(dir);
	return dir;
}

afterEach(async () => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) await rm(dir, { recursive: true, force: true });
	}
});

function policyFor(cwd: string, deniedFile: string): SandboxPolicy {
	return {
		cwd,
		denyRead: [deniedFile],
		denyWrite: [deniedFile],
		allowWrite: ["."],
		pinnedGitDirs: [],
		networkMode: "open",
	};
}

interface LeafFlipper {
	stop(): Promise<void>;
}

async function startLeafFlipper(target: string, deniedFile: string, cwd: string): Promise<LeafFlipper> {
	const ready = join(cwd, "flipper.ready");
	const stop = join(cwd, "flipper.stop");
	const script = String.raw`
set -eu
target=$1
denied=$2
ready=$3
stop=$4
stage="${target}.stage.$$"
cleanup() { rm -f "$stage"; }
trap cleanup EXIT
printf 'SAFE' > "$stage"
mv -f "$stage" "$target"
: > "$ready"
while [ ! -e "$stop" ]; do
  printf 'SAFE' > "$stage"
  mv -f "$stage" "$target"
  ln -s "$denied" "$stage"
  mv -f "$stage" "$target"
done
`;
	const process = Bun.spawn(["bash", "-c", script, "pi-sandbox-leaf-flipper", target, deniedFile, ready, stop], {
		cwd,
		stdout: "ignore",
		stderr: "pipe",
	});

	const deadline = Date.now() + 2_000;
	while (!(await Bun.file(ready).exists())) {
		if (process.exitCode !== null) {
			throw new Error(`leaf flipper exited before startup: ${await process.stderr.text()}`);
		}
		if (Date.now() >= deadline) {
			process.kill();
			throw new Error("leaf flipper did not become ready");
		}
		await Bun.sleep(1);
	}

	return {
		async stop() {
			await writeFile(stop, "stop");
			const exitCode = await process.exited;
			if (exitCode !== 0) throw new Error(`leaf flipper failed (${exitCode}): ${await process.stderr.text()}`);
		},
	};
}

describe("fd-based in-process file policy", () => {
	test("concurrent leaf symlink swaps cannot disclose a denied credential", async () => {
		const cwd = await makeTempDir();
		const deniedFile = join(cwd, "credential");
		const target = join(cwd, "candidate");
		await writeFile(deniedFile, "SECRET");
		const operations = makeReadOperations(cwd, policyFor(cwd, deniedFile));
		const flipper = await startLeafFlipper(target, deniedFile, cwd);
		let safeReads = 0;
		let rejectedReads = 0;
		let disclosed = false;
		try {
			for (let attempt = 0; attempt < 10_000; attempt += 1) {
				let value: string;
				try {
					value = (await operations.readFile(target)).toString("utf8");
				} catch {
					rejectedReads += 1;
					continue;
				}
				if (value === "SECRET") disclosed = true;
				else expect(value).toBe("SAFE");
				safeReads += 1;
			}
		} finally {
			await flipper.stop();
		}

		expect(safeReads).toBeGreaterThan(0);
		expect(rejectedReads).toBeGreaterThan(0);
		expect(disclosed).toBe(false);
	});

	test("concurrent leaf symlink swaps cannot modify a denied credential", async () => {
		const cwd = await makeTempDir();
		const deniedFile = join(cwd, "credential");
		const target = join(cwd, "candidate");
		await writeFile(deniedFile, "SECRET");
		const operations = makeWriteOperations(cwd, policyFor(cwd, deniedFile));
		const flipper = await startLeafFlipper(target, deniedFile, cwd);
		let safeWrites = 0;
		let rejectedWrites = 0;
		try {
			for (let attempt = 0; attempt < 10_000; attempt += 1) {
				try {
					await operations.writeFile(target, "MODEL_WRITE");
					safeWrites += 1;
				} catch {
					rejectedWrites += 1;
				}
			}
		} finally {
			await flipper.stop();
		}

		expect(safeWrites).toBeGreaterThan(0);
		expect(rejectedWrites).toBeGreaterThan(0);
		expect(await readFile(deniedFile, "utf8")).toBe("SECRET");
	});

	test("a hardlink created after read-policy installation cannot disclose a denied credential", async () => {
		const cwd = await makeTempDir();
		const deniedFile = join(cwd, "credential");
		const alias = join(cwd, "post-start-alias");
		await writeFile(deniedFile, "SECRET");
		const operations = makeReadOperations(cwd, policyFor(cwd, deniedFile));

		await link(deniedFile, alias);

		await expect(operations.readFile(alias)).rejects.toThrow(/hardlink guard/);
	});

	test("a hardlink created after write-policy installation cannot modify a denied credential", async () => {
		const cwd = await makeTempDir();
		const deniedFile = join(cwd, "credential");
		const alias = join(cwd, "post-start-alias");
		await writeFile(deniedFile, "SECRET");
		const operations = makeWriteOperations(cwd, policyFor(cwd, deniedFile));

		await link(deniedFile, alias);

		await expect(operations.writeFile(alias, "MODEL_WRITE")).rejects.toThrow(/hardlink guard/);
		expect(await readFile(deniedFile, "utf8")).toBe("SECRET");
	});
});
