// Global Set on window so prefetch cache persists across all route transitions within the session
const getPrefetchedSet = () => {
  if (typeof window === "undefined") return new Set();
  if (!window.__portfolioPrefetchedSet) {
    window.__portfolioPrefetchedSet = new Set();
  }
  return window.__portfolioPrefetchedSet;
};

export const prefetchProject = (router, name, imgSrc) => {
  if (!name) return;
  const set = getPrefetchedSet();

  // If already prefetched on any page (/ or /project), skip completely
  if (set.has(name)) return;
  set.add(name);

  // 1. Next.js Client-side Router Prefetch
  if (router && typeof router.prefetch === "function") {
    try {
      router.prefetch(`/project/${name}`);
    } catch (e) {}
  }

  if (typeof window !== "undefined") {
    // 2. Fetch HTML page in background
    try {
      fetch(`/project/${name}`, { priority: "low" }).catch(() => {});
    } catch (e) {}

    // 3. Preload project hero image once
    if (imgSrc) {
      try {
        const img = new window.Image();
        img.src = imgSrc;
      } catch (e) {}
    }
  }
};
