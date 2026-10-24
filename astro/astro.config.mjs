// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { ensureFaviconDownloaded } from "./src/lib/media.js";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "");
const site = (
  env.PUBLIC_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  "https://showayeb.dev"
).replace(/\/$/, "");

if (!process.env.PUBLIC_SITE_URL) {
  process.env.PUBLIC_SITE_URL = site;
}
if (!process.env.PAYLOAD_URL && env.PAYLOAD_URL) {
  process.env.PAYLOAD_URL = env.PAYLOAD_URL;
}

function localMediaIntegration() {
  return {
    name: "local-media-optimizer",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const distDir = fileURLToPath(dir);
        const publicDir = path.resolve(distDir, "../public");

        // 1. Ensure favicon is downloaded and present in dist root
        await ensureFaviconDownloaded();

        // 2. Ensure all files from public/ are synced to dist/
        const copyDirRecursive = (src, dest) => {
          if (!fs.existsSync(src)) return;
          fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              copyDirRecursive(srcPath, destPath);
            } else if (!fs.existsSync(destPath)) {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };
        copyDirRecursive(publicDir, distDir);

        // Guarantee favicon in dist root
        const publicFavicon = path.join(publicDir, "favicon.ico");
        const distFavicon = path.join(distDir, "favicon.ico");
        if (fs.existsSync(publicFavicon) && !fs.existsSync(distFavicon)) {
          fs.copyFileSync(publicFavicon, distFavicon);
        }

        // 3. Scan all HTML files in dist/ and rewrite any remote R2 / external media links to local paths
        const scanAndRewriteHtml = (dirPath) => {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              scanAndRewriteHtml(fullPath);
            } else if (entry.isFile() && entry.name.endsWith(".html")) {
              let html = fs.readFileSync(fullPath, "utf-8");
              let changed = false;

              // Pattern 1: pub-*.r2.dev/(projects|icons|media)/...
              const r2Regex = /https:\/\/[a-zA-Z0-9-]+\.r2\.dev\/(projects|icons|media)\/([^\s"'<>?#]+)/g;
              if (r2Regex.test(html)) {
                html = html.replace(r2Regex, "/$1/$2");
                changed = true;
              }

              // Pattern 2: /my-portfolio/(projects|icons|media)/...
              const payloadRegex = /https?:\/\/[^\s"'<>]+\/my-portfolio\/(projects|icons|media)\/([^\s"'<>?#]+)/g;
              if (payloadRegex.test(html)) {
                html = html.replace(payloadRegex, "/$1/$2");
                changed = true;
              }

              if (changed) {
                fs.writeFileSync(fullPath, html, "utf-8");
              }
            }
          }
        };

        scanAndRewriteHtml(distDir);
        console.log("[Local Media Integration] ✓ Verified all image links and favicon.ico in dist root");
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site,
  output: "static",
  integrations: [localMediaIntegration()],
  vite: {
    plugins: [tailwindcss()],
  },
});
