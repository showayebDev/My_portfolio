#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [target, action = "dev", ...restArgs] = process.argv.slice(2);

if (!target) {
  console.error("Usage: node scripts/run.mjs <cms|astro|all> <dev|build|start|install> [extra args...]");
  process.exit(1);
}

const isBun = typeof Bun !== "undefined" || !!process.versions.bun;
const pm = isBun ? "bun" : "npm";

function getCwd(pkg) {
  return path.resolve(process.cwd(), pkg);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });

    child.on("error", reject);
  });
}

async function runForPkg(pkg, act) {
  const dir = getCwd(pkg);
  let cmd;
  let args;

  if (act === "install") {
    cmd = pm;
    args = isBun ? ["install", ...restArgs] : ["install", ...restArgs];
  } else {
    cmd = pm;
    args = isBun ? ["run", act, ...restArgs] : ["run", act, ...restArgs];
  }

  await runCommand(cmd, args, dir);
}

async function main() {
  try {
    if (target === "cms") {
      await runForPkg("payload-cms", action);
    } else if (target === "astro") {
      await runForPkg("astro", action);
    } else if (target === "all") {
      if (action === "build") {
        await runForPkg("payload-cms", "build");
        await runForPkg("astro", "build");
      } else if (action === "install") {
        await runForPkg("payload-cms", "install");
        await runForPkg("astro", "install");
      } else {
        console.error(`Action '${action}' is not supported for 'all'`);
        process.exit(1);
      }
    } else {
      console.error(`Unknown target: ${target}`);
      process.exit(1);
    }
  } catch (err) {
    process.exit(1);
  }
}

main();
