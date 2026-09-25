"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AutoUpdater({ currentBuildId }) {
  const router = useRouter();
  const activeBuildId = useRef(currentBuildId);

  useEffect(() => {
    activeBuildId.current = currentBuildId;
  }, [currentBuildId]);

  useEffect(() => {
    if (!currentBuildId) return;

    let isChecking = false;

    const checkForUpdates = async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.buildId && data.buildId !== activeBuildId.current) {
            console.log(`[AutoUpdater] New update detected (${data.buildId}). Updating cache & UI...`);
            activeBuildId.current = data.buildId;
            // Background refresh to update server components and client cache
            router.refresh();
          }
        }
      } catch (err) {
        // Offline or network error - ignore silently
      } finally {
        isChecking = false;
      }
    };

    // 1. Check 3 seconds after initial page load (when browser is idle)
    const initialTimer = setTimeout(checkForUpdates, 3000);

    // 2. Check whenever user focuses back on the tab
    window.addEventListener("focus", checkForUpdates);

    // 3. Periodic background check every 3 minutes
    const intervalTimer = setInterval(checkForUpdates, 3 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener("focus", checkForUpdates);
    };
  }, [currentBuildId, router]);

  return null;
}
