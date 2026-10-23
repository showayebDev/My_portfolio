import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

// 1. Try environment variables from Render / Git CI
let buildId = (
  process.env.RENDER_GIT_COMMIT ||
  process.env.COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  ""
).trim();

// 2. Try to get git commit hash if not available in env
if (!buildId) {
  try {
    buildId = execSync("git rev-parse HEAD", {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    // Git command failed or not a git repository
  }
}

// 2. Fallback to unique build timestamp if git is unavailable
if (!buildId) {
  buildId = `build_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const timestamp = Date.now();

const versionData = {
  buildId,
  timestamp,
};

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionFilePath = path.join(publicDir, "version.json");
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + "\n", "utf-8");

console.log(`[generate-version] Wrote public/version.json: buildId=${buildId}, timestamp=${timestamp}`);
