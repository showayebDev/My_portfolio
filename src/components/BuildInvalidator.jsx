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
    // 1. Initial check on mount
    checkBuildVersion(router);

    // 2. Check whenever user refocuses or switches back to this tab
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        checkBuildVersion(router);
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    // 3. Periodic background check every 3 minutes while the document is active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkBuildVersion(router);
      }
    }, 3 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
