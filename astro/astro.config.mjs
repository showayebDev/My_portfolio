// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { ensureFaviconDownloaded } from "./src/lib/media.js";

import cloudflare from "@astrojs/cloudflare";

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
if (!process.env.PAYLOAD_SECRET && env.PAYLOAD_SECRET) {
  process.env.PAYLOAD_SECRET = env.PAYLOAD_SECRET;
}

function localMediaIntegration() {
  return {
    name: "local-media-optimizer",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const buildDir = fileURLToPath(dir);
        const projectRoot = fileURLToPath(new URL(".", import.meta.url));
        const publicDir = path.resolve(projectRoot, "public");

        // 1. Ensure favicon is downloaded into public/
        await ensureFaviconDownloaded();

        // 2. Identify all distribution target folders (e.g. dist/ and dist/client/)
        const targetDirs = new Set([buildDir]);
        if (fs.existsSync(path.join(buildDir, "client"))) {
          targetDirs.add(path.join(buildDir, "client"));
        }
        if (buildDir.endsWith("/client") || buildDir.endsWith("\\client")) {
          targetDirs.add(path.dirname(buildDir));
        }

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

        const scanAndRewriteHtml = (dirPath) => {
          if (!fs.existsSync(dirPath)) return;
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

        for (const target of targetDirs) {
          copyDirRecursive(publicDir, target);

          const publicFavicon = path.join(publicDir, "favicon.ico");
          const distFavicon = path.join(target, "favicon.ico");
          if (fs.existsSync(publicFavicon) && !fs.existsSync(distFavicon)) {
            try {
              fs.copyFileSync(publicFavicon, distFavicon);
            } catch (_) {}
          }

          const headersFile = path.join(target, "_headers");
          const secHeaders = [
            "/*",
            "  X-Frame-Options: DENY",
            "  X-Content-Type-Options: nosniff",
            "  Referrer-Policy: strict-origin-when-cross-origin",
            "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
            "  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
          ].join("\n");

          if (fs.existsSync(headersFile)) {
            const current = fs.readFileSync(headersFile, "utf-8");
            if (!current.includes("X-Frame-Options")) {
              fs.writeFileSync(headersFile, `${secHeaders}\n\n${current}`, "utf-8");
            }
          } else {
            fs.writeFileSync(headersFile, `${secHeaders}\n`, "utf-8");
          }

          scanAndRewriteHtml(target);
        }

        console.log("[Local Media Integration] ✓ Synced public media, injected security headers, and verified favicon.ico in distribution targets");
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

  adapter: cloudflare({
    prerenderEnvironment: "node",
  })
});