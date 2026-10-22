import { getImageProps } from "next/image";

/**
 * Unified image configuration shared between Hover Prefetch, /project cards, and /project/[name] hero
 */
export const PROJECT_HERO_IMAGE_CONFIG = {
  width: 640,
  height: 400,
  quality: 90,
};

export const STORAGE_BUILD_KEY = "__portfolio_build_id";
export const STORAGE_ROUTES_KEY = "__portfolio_prefetched_routes";
export const STORAGE_IMAGES_KEY = "__portfolio_cached_images_v2";
const MAX_CACHED_IMAGES = 200;

/**
 * In-memory runtime set on window to prevent duplicate router.prefetch calls within the active tab session.
 */
export const getRuntimeRouteSet = () => {
  if (typeof window === "undefined") return new Set();
  if (!window.__portfolioRuntimeRoutes) {
    window.__portfolioRuntimeRoutes = new Set();
  }
  return window.__portfolioRuntimeRoutes;
};

/**
 * Persistent image cache set backed by localStorage and mirrored in window memory.
 * Prevents redundant re-instantiation of new Image() for images already in the browser's disk cache.
 */
export const getCachedImageSet = () => {
  if (typeof window === "undefined") return new Set();
  if (!window.__portfolioCachedImages) {
    try {
      const raw = localStorage.getItem(STORAGE_IMAGES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      window.__portfolioCachedImages = new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      window.__portfolioCachedImages = new Set();
    }
  }
  return window.__portfolioCachedImages;
};

/**
 * Records an image URL in the cache set and persists to localStorage.
 */
export const markImageCached = (imgSrc) => {
  if (!imgSrc || typeof window === "undefined") return;
  const set = getCachedImageSet();
  if (set.has(imgSrc)) return;

  set.add(imgSrc);

  try {
    const list = Array.from(set);
    const trimmed = list.length > MAX_CACHED_IMAGES ? list.slice(list.length - MAX_CACHED_IMAGES) : list;
    localStorage.setItem(STORAGE_IMAGES_KEY, JSON.stringify(trimmed));
  } catch {
    // Graceful fallback for quota exceeded or restricted environments
  }
};

/**
 * Preloads the exact Next.js-optimized image variant using getImageProps from next/image.
 * Constructs exact srcset and sizes to match Next.js image component, ensuring zero layout shift.
 */
export const preloadHeroImage = (imgSrc, customConfig = {}) => {
  if (!imgSrc || typeof window === "undefined") return;

  const cachedImages = getCachedImageSet();
  if (cachedImages.has(imgSrc)) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Prefetch] ℹ️ Image "${imgSrc}" already cached`);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Prefetch] 🖼️ Preloading hero image: "${imgSrc}"`);
  }

  let targetSrc = imgSrc;

  try {
    const width = customConfig.width || PROJECT_HERO_IMAGE_CONFIG.width;
    const height = customConfig.height || PROJECT_HERO_IMAGE_CONFIG.height;
    const quality = customConfig.quality || PROJECT_HERO_IMAGE_CONFIG.quality;

    const { props: imgProps } = getImageProps({
      src: imgSrc,
      width,
      height,
      quality,
      alt: "Hero preview",
      ...customConfig,
    });

    targetSrc = imgProps.src || imgSrc;

    const img = new Image();
    if (imgProps.sizes) {
      img.sizes = imgProps.sizes;
    }
    if (imgProps.srcSet) {
      img.srcset = imgProps.srcSet;
    }
    img.src = targetSrc;

    const onComplete = () => markImageCached(imgSrc);

    if (typeof img.decode === "function") {
      img.decode().then(onComplete).catch(onComplete);
    } else {
      img.onload = onComplete;
      img.onerror = onComplete;
    }
  } catch {
    // Fallback for non-standard image URLs (e.g. data URLs or special external protocols)
    try {
      const fallbackImg = new Image();
      fallbackImg.src = imgSrc;
      fallbackImg.onload = () => markImageCached(imgSrc);
      fallbackImg.onerror = () => markImageCached(imgSrc);
    } catch {
      markImageCached(imgSrc);
    }
  }

};

/**
 * Prefetches a general Next.js route once per session on hover.
 * Uses Next.js native router.prefetch() to populate the client router cache without duplicate requests or 307 redirects.
 */
export const prefetchRoute = (router, href) => {
  if (!href || typeof window === "undefined") return;
  const runtimeRoutes = getRuntimeRouteSet();
  if (runtimeRoutes.has(href)) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Prefetch] ℹ️ Route "${href}" already cached in session`);
    }
    return;
  }

  runtimeRoutes.add(href);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Prefetch] ⚡ Prefetching route: "${href}"`);
  }

  // 1. Request full route prefetch in Next.js router
  if (router && typeof router.prefetch === "function") {
    try {
      router.prefetch(href, { kind: 'full' });
    } catch {
      try {
        router.prefetch(href);
      } catch {}
    }
  }

  // 2. Fetch full RSC payload containing complete page data, HTML and Markdown content
  try {
    fetch(href, {
      headers: {
        RSC: '1',
      },
    }).catch(() => {});
  } catch {}
};

/**
 * Prefetches a project's Next.js route data and hero image on hover.
 * Ensures that clicking the card transitions to the project page instantly with all data pre-cached.
 */
export const prefetchProject = (router, name, imgSrc, options = {}) => {
  if (typeof window === "undefined") return;

  // 1. Prefetch the Next.js App Router route data for instant zero-delay navigation
  if (name && router && typeof router.prefetch === "function") {
    const routePath = `/project/${name}`;
    prefetchRoute(router, routePath);
  }

  // 2. Preload the project's hero image for instant rendering without layout shift
  if (imgSrc && !options?.skipImagePreload) {
    preloadHeroImage(imgSrc, options?.imageConfig);
  }
};

/**
 * Flushes the in-memory route prefetch cache and clears stale route entries.
 */
export const flushPrefetchCache = () => {
  if (typeof window === "undefined") return;

  if (window.__portfolioRuntimeRoutes) {
    window.__portfolioRuntimeRoutes.clear();
  }

  try {
    localStorage.removeItem(STORAGE_ROUTES_KEY);
    sessionStorage.removeItem(STORAGE_ROUTES_KEY);
  } catch {}

  // Also clear image cache if deep flush requested
  if (window.__portfolioCachedImages) {
    window.__portfolioCachedImages.clear();
  }
  try {
    localStorage.removeItem(STORAGE_IMAGES_KEY);
  } catch {}

  console.log("[Prefetch] 🧹 Prefetch cache flushed completely");
};

// Expose on window for easy developer inspection in DevTools console
if (typeof window !== "undefined") {
  window.flushPrefetchCache = flushPrefetchCache;
}

/**
 * Automatically checks /version.json in the background.
 * When a new deployment buildId is detected:
 * - Flushes stale prefetch cache
 * - Updates localStorage build ID
 * - Calls router.refresh() to reload fresh RSC payloads without hard page reload
 */
export const checkBuildVersion = async (router) => {
  if (typeof window === "undefined") return { updated: false };

  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) return { updated: false };

    const data = await res.json();
    const newBuildId = data?.buildId;
    if (!newBuildId) return { updated: false };

    const storedBuildId = localStorage.getItem(STORAGE_BUILD_KEY);

    // Initial session setup
    if (!storedBuildId) {
      localStorage.setItem(STORAGE_BUILD_KEY, newBuildId);
      return { updated: false, buildId: newBuildId };
    }

    // New deployment detected
    if (storedBuildId !== newBuildId) {
      console.log(
        `[Auto-Update] New build detected: ${newBuildId} (was ${storedBuildId}). Invalidating prefetch cache & refreshing router.`
      );

      flushPrefetchCache();
      localStorage.setItem(STORAGE_BUILD_KEY, newBuildId);

      if (router && typeof router.refresh === "function") {
        try {
          router.refresh();
        } catch {}
      }

      try {
        window.dispatchEvent(
          new CustomEvent("portfolio:build-invalidated", {
            detail: {
              oldBuildId: storedBuildId,
              newBuildId,
              timestamp: data.timestamp,
            },
          })
        );
      } catch {}

      return { updated: true, buildId: newBuildId, previousBuildId: storedBuildId };
    }

    return { updated: false, buildId: newBuildId };
  } catch {
    // Network or parse error, silently ignore
    return { updated: false };
  }
};
