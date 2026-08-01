import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("production main bundle resolves the generated preload artifact", async () => {
  const appDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const mainBundlePath = path.join(appDirectory, "out", "main", "index.js");
  const mainBundle = await readFile(mainBundlePath, "utf8");
  const preloadRelativePath = "../preload/index.js";

  assert.match(mainBundle, /\.\.\/preload\/index\.js/);
  await access(path.resolve(path.dirname(mainBundlePath), preloadRelativePath));
});
