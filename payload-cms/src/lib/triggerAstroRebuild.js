import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

let isRebuilding = false;
let queuedRebuild = false;

/**
 * Triggers an Astro SSG rebuild either via remote webhook (Cloudflare Pages, Vercel, Netlify)
 * or by executing a local background build of the astro directory.
 * Includes debouncing and queueing so rapid edits don't trigger overlapping builds.
 */
export async function triggerAstroRebuild(reason = 'content updated') {
  const webhookUrl = process.env.ASTRO_REBUILD_WEBHOOK_URL;

  // 1. If remote deploy hook URL is defined, send POST to trigger remote CI/CD
  if (webhookUrl) {
    try {
      console.log(`[Payload Webhook] 🚀 Triggering remote Astro rebuild (${reason})...`);
      const res = await fetch(webhookUrl, { method: 'POST' });
      console.log(`[Payload Webhook] ✅ Remote rebuild response: HTTP ${res.status}`);
      return;
    } catch (err) {
      console.warn('[Payload Webhook] ⚠️ Remote webhook call failed:', err?.message || err);
    }
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
