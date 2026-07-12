import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const repoRoot = join(pkgRoot, "../..");
const vendorRoot = join(repoRoot, "vendor/faststream");
const webBuildDir = join(vendorRoot, "built/web");
const outDir = join(pkgRoot, "dist/faststream-web");

function run(
  command: string,
  args: string[],
  cwd: string,
): void {
  console.log(`$ ${command} ${args.join(" ")} (cwd=${cwd})`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit ${result.status ?? "null"}`,
    );
  }
}

function main(): void {
  if (!existsSync(vendorRoot)) {
    throw new Error(`Missing vendored FastStream at ${vendorRoot}`);
  }

  if (!existsSync(join(vendorRoot, "node_modules"))) {
    run("npm", ["install"], vendorRoot);
  }

  // Web-only target (see vendor/faststream/build.mjs --web). Avoids packaging
  // browser-extension zips and writing into chrome/manifest.json.
  run("node", ["build.mjs", "--web"], vendorRoot);

  const playerIndex = join(webBuildDir, "player/index.html");
  if (!existsSync(playerIndex)) {
    throw new Error(
      `Web build missing player page at ${playerIndex}. Expected built/web/player/index.html`,
    );
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(dirname(outDir), { recursive: true });
  // Copy entire built/web so relative assets (e.g. ../icon128.png) resolve.
  cpSync(webBuildDir, outDir, { recursive: true });

  console.log(`Copied ${webBuildDir} -> ${outDir}`);
  console.log(`Player page: ${join(outDir, "player/index.html")}`);
}

main();
