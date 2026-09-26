"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncCacheWithBuildId } from "@/lib/prefetch";

export default function AutoUpdater({ currentBuildId }) {
  const router = useRouter();
  const activeBuildId = useRef(currentBuildId);

  useEffect(() => {
    activeBuildId.current = currentBuildId;
    if (currentBuildId) {
      syncCacheWithBuildId(currentBuildId);
    }
  }, [currentBuildId]);

  useEffect(() => {
    if (!currentBuildId) return;

    let isChecking = false;

    const checkForUpdates = async () => {
      if (isChecking || (typeof document !== "undefined" && document.visibilityState === "hidden")) {
        return;
      }
      isChecking = true;

      try {
        const res = await fetch("/version.json", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.buildId && data.buildId !== activeBuildId.current) {
            console.log(`[AutoUpdater] New build detected (${data.buildId}). Refreshing cache & UI...`);
            activeBuildId.current = data.buildId;
            syncCacheWithBuildId(data.buildId);
            // Background refresh to update server components and client router cache
            router.refresh();
          }
        }
      } catch {
        // Offline or network error - ignore silently and keep serving cached content
      } finally {
        isChecking = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    // 1. Check 3 seconds after initial page load (when browser is idle)
    const initialTimer = setTimeout(checkForUpdates, 3000);

    // 2. Check whenever user focuses or switches back to the tab
    window.addEventListener("focus", checkForUpdates);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Periodic background check every 3 minutes while tab is active
    const intervalTimer = setInterval(checkForUpdates, 3 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener("focus", checkForUpdates);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentBuildId, router]);

  return null;
}
