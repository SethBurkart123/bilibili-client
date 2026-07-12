import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const repoRoot = join(appRoot, "../..");
const playerPkg = join(repoRoot, "packages/player");
const playerDistRoot = join(playerPkg, "dist/faststream-web");
const playerDistIndex = join(playerDistRoot, "player/index.html");
const destDir = join(appRoot, "src/renderer/public/player");

function runBuildPlayer(): void {
  console.log("Player dist missing — running packages/player build-player…");
  const result = spawnSync("bun", ["run", "build-player"], {
    cwd: playerPkg,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`build-player failed with exit ${result.status ?? "null"}`);
  }
}

function main(): void {
  if (!existsSync(playerDistIndex)) {
    runBuildPlayer();
  } else {
    console.log(`Reusing existing player dist at ${playerDistRoot}`);
  }

  if (!existsSync(playerDistIndex)) {
    throw new Error(`Expected player page at ${playerDistIndex} after build`);
  }

  rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });
  cpSync(join(playerDistRoot, "player"), destDir, { recursive: true });

  console.log(`Synced ${join(playerDistRoot, "player")} -> ${destDir}`);
  console.log(`Player page: ${join(destDir, "index.html")}`);
}

main();
