"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkBuildVersion } from "@/lib/prefetch";

/**
 * Background monitor that polls /version.json on mount, window focus, and periodic interval.
 * Automatically flushes stale route prefetch caches and refreshes RSC payloads on new deployments.
 */
export default function BuildInvalidator() {
  const router = useRouter();

  useEffect(() => {
    let lastChecked = 0;
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

    const runCheck = (force = false) => {
      const now = Date.now();
      if (!force && now - lastChecked < COOLDOWN_MS) return;
      lastChecked = now;
      checkBuildVersion(router);
    };

    // 1. Initial check on mount
    runCheck(true);

    // 2. Check when user switches back to this tab (throttled by cooldown)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runCheck(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Periodic background check every 5 minutes while active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        runCheck(false);
      }
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
