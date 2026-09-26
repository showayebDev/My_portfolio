import { getImageProps } from "next/image";

// Unified image configuration shared between Hover Prefetch, /project cards, and /project/[name] hero
export const PROJECT_HERO_IMAGE_CONFIG = {
  width: 640,
  height: 400,
  quality: 90,
};

const STORAGE_BUILD_KEY = "__portfolio_build_id";
const STORAGE_ROUTES_KEY = "__portfolio_prefetched_routes";
const STORAGE_IMAGES_KEY = "__portfolio_cached_images_v2";

// In-memory runtime set (prevents repeated router.prefetch calls within the active tab)
const getRuntimeRouteSet = () => {
  if (typeof window === "undefined") return new Set();
  if (!window.__portfolioRuntimeRoutes) {
    window.__portfolioRuntimeRoutes = new Set();
  }
  return window.__portfolioRuntimeRoutes;
};

// Persistent image cache set in localStorage (keyed by versioned imgSrc e.g. /project/foo.png?v=a1b2c3d4)
const getCachedImageSet = () => {
  if (typeof window === "undefined") return new Set();
  if (!window.__portfolioCachedImages) {
    try {
      const raw = localStorage.getItem(STORAGE_IMAGES_KEY);
      window.__portfolioCachedImages = new Set(raw ? JSON.parse(raw) : []);
    } catch {
      window.__portfolioCachedImages = new Set();
    }
  }
  return window.__portfolioCachedImages;
};

const markImageCached = (imgSrc) => {
  if (!imgSrc || typeof window === "undefined") return;
  const set = getCachedImageSet();
  if (set.has(imgSrc)) return;
  set.add(imgSrc);
  try {
    localStorage.setItem(STORAGE_IMAGES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

/**
 * Synchronizes client cache tracking with the active server buildId.
 * When a new build is deployed, clears route prefetch state so updated RSC payloads are fetched.
 */
export const syncCacheWithBuildId = (buildId) => {
  if (!buildId || typeof window === "undefined") return false;
  try {
    const previousBuildId = localStorage.getItem(STORAGE_BUILD_KEY);
    if (previousBuildId !== buildId) {
      localStorage.setItem(STORAGE_BUILD_KEY, buildId);
      localStorage.removeItem(STORAGE_ROUTES_KEY);
      sessionStorage.removeItem("__portfolio_prefetched");
      if (window.__portfolioRuntimeRoutes) {
        window.__portfolioRuntimeRoutes.clear();
      }
      return previousBuildId !== null; // true if updated from an older build
    }
  } catch {}
  return false;
};

/**
 * Prefetches a general Next.js route (e.g., "/" or "/project") once per session on hover.
 */
export const prefetchRoute = (router, href) => {
  if (!href || typeof window === "undefined") return;
  const runtimeRoutes = getRuntimeRouteSet();
  if (runtimeRoutes.has(href)) return;
  runtimeRoutes.add(href);

  if (router && typeof router.prefetch === "function") {
    try {
      router.prefetch(href);
    } catch {}
  }
};

/**
 * Prefetches a project's RSC route data and its exact Next.js optimized hero image once on hover.
 * - Subsequent hovers in the same session do 0 work.
 * - Across refreshes/restarts, unchanged routes & images load in 0ms from browser (disk cache).
 */
export const prefetchProject = (router, name, imgSrc, options = {}) => {
  if (!name || typeof window === "undefined") return;

  const routePath = `/project/${name}`;
  const runtimeRoutes = getRuntimeRouteSet();

  // 1. Prefetch Next.js RSC Route Data once per runtime session
  // (Browser satisfies this from immutable disk cache if already fetched for this build)
  if (!runtimeRoutes.has(routePath)) {
    runtimeRoutes.add(routePath);
    if (router && typeof router.prefetch === "function") {
      try {
        router.prefetch(routePath);
      } catch {}
    }
  }

  // 2. Preload the exact Next.js optimized hero image (unless already rendered on the page or cached on disk)
  if (imgSrc && !options.skipImagePreload) {
    const cachedImages = getCachedImageSet();
    if (!cachedImages.has(imgSrc)) {
      markImageCached(imgSrc);
      try {
        const { props } = getImageProps({
          src: imgSrc,
          alt: name,
          width: PROJECT_HERO_IMAGE_CONFIG.width,
          height: PROJECT_HERO_IMAGE_CONFIG.height,
          quality: PROJECT_HERO_IMAGE_CONFIG.quality,
        });
        const img = new window.Image();
        img.decoding = "async";
        if (props.sizes) img.sizes = props.sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        if (props.src) img.src = props.src;
      } catch {}
    }
  } else if (imgSrc && options.skipImagePreload) {
    // Image is already rendered on the current page (/project), mark as cached in disk
    markImageCached(imgSrc);
  }
};
