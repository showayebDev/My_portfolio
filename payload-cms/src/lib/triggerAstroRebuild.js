import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

let isRebuilding = false;
let queuedRebuild = false;

let webhookTimeout = null;

/**
 * Triggers an Astro SSG rebuild either via remote webhook (Cloudflare Workers/Pages, Vercel, Netlify)
 * or by executing a local background build of the astro directory.
 * Includes debouncing and queueing so rapid edits don't trigger overlapping builds.
 */
export async function triggerAstroRebuild(reason = 'content updated') {
  const webhookUrl =
    process.env.CLOUDFLARE_DEPLOY_HOOK_URL ||
    process.env.ASTRO_REBUILD_WEBHOOK_URL;

  // 1. If remote deploy hook URL is defined, send POST to trigger remote CI/CD
  if (webhookUrl) {
    if (webhookTimeout) clearTimeout(webhookTimeout);
    webhookTimeout = setTimeout(async () => {
      try {
        console.log(`[Payload Webhook] 🚀 Triggering Cloudflare deploy hook (${reason})...`);
        const res = await fetch(webhookUrl, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log(`[Payload Webhook] ✅ Cloudflare rebuild triggered successfully! HTTP ${res.status}:`, data);
        } else {
          console.warn(`[Payload Webhook] ⚠️ Cloudflare deploy hook HTTP ${res.status}:`, data);
        }
      } catch (err) {
        console.warn('[Payload Webhook] ⚠️ Cloudflare deploy hook call failed:', err?.message || err);
      }
    }, 1500);
    return;
  }

  // 2. Otherwise execute local Astro build
  if (isRebuilding) {
    queuedRebuild = true;
    return;
  }

  isRebuilding = true;
  console.log(`[Payload Hook] 🏗️ Rebuilding Astro SSG (${reason})...`);

  const astroSibling = path.resolve(process.cwd(), '../astro');
  const astroDir = fs.existsSync(astroSibling) ? astroSibling : path.resolve(process.cwd(), 'astro');

  exec(`npm run build --prefix "${astroDir}"`, (error, _stdout, _stderr) => {
    isRebuilding = false;
    if (error) {
      console.error('[Payload Hook] ❌ Astro build error:', error.message);
    } else {
      console.log('[Payload Hook] ✨ Astro SSG static site rebuilt successfully!');
    }

    if (queuedRebuild) {
      queuedRebuild = false;
      setTimeout(() => triggerAstroRebuild('queued updates'), 500);
    }
  });
}

export default triggerAstroRebuild;
