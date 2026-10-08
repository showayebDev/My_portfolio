import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getRuntimeRouteSet,
  getCachedImageSet,
  markImageCached,
  preloadHeroImage,
  prefetchRoute,
  prefetchProject,
  flushPrefetchCache,
  checkBuildVersion,
  STORAGE_BUILD_KEY,
  STORAGE_ROUTES_KEY,
  STORAGE_IMAGES_KEY,
  PROJECT_HERO_IMAGE_CONFIG,
} from "./prefetch";

describe("prefetch runtime & cache invalidation", () => {
  let mockLocalStorage = {};
  let mockSessionStorage = {};
  let eventListeners = {};

  beforeEach(() => {
    mockLocalStorage = {};
    mockSessionStorage = {};
    eventListeners = {};

    const storageMock = (store) => ({
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const k in store) delete store[k];
      }),
    });

    globalThis.localStorage = storageMock(mockLocalStorage);
    globalThis.sessionStorage = storageMock(mockSessionStorage);

    globalThis.window = {
      localStorage: globalThis.localStorage,
      sessionStorage: globalThis.sessionStorage,
      addEventListener: vi.fn((event, cb) => {
        eventListeners[event] = cb;
      }),
      removeEventListener: vi.fn((event) => {
        delete eventListeners[event];
      }),
      dispatchEvent: vi.fn((event) => {
        if (eventListeners[event.type]) {
          eventListeners[event.type](event);
        }
        return true;
      }),
    };

    globalThis.document = {
      visibilityState: "visible",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    globalThis.CustomEvent = class CustomEvent {
      constructor(type, eventInitDict) {
        this.type = type;
        this.detail = eventInitDict?.detail;
      }
    };
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
    delete globalThis.CustomEvent;
    vi.restoreAllMocks();
  });

  describe("In-Memory & LocalStorage Deduplication", () => {
    it("should initialize and reuse the runtime route set on window", () => {
      const set1 = getRuntimeRouteSet();
      expect(set1).toBeInstanceOf(Set);
      expect(window.__portfolioRuntimeRoutes).toBe(set1);

      set1.add("/test-route");
      const set2 = getRuntimeRouteSet();
      expect(set2.has("/test-route")).toBe(true);
      expect(set2).toBe(set1);
    });

    it("should initialize cached image set from localStorage", () => {
      mockLocalStorage[STORAGE_IMAGES_KEY] = JSON.stringify(["/img1.png", "/img2.png"]);

      const imageSet = getCachedImageSet();
      expect(imageSet.has("/img1.png")).toBe(true);
      expect(imageSet.has("/img2.png")).toBe(true);
      expect(imageSet.has("/img3.png")).toBe(false);
    });

    it("should mark images as cached in memory and localStorage", () => {
      markImageCached("/hero.png");

      const imageSet = getCachedImageSet();
      expect(imageSet.has("/hero.png")).toBe(true);

      const stored = JSON.parse(mockLocalStorage[STORAGE_IMAGES_KEY] || "[]");
      expect(stored).toContain("/hero.png");
    });
  });

  describe("Zero-Latency Route Prefetching", () => {
    it("should prefetch route once and deduplicate subsequent calls in the active session", () => {
      const mockRouter = {
        prefetch: vi.fn(),
      };

      prefetchRoute(mockRouter, "/project/test-slug");
      prefetchRoute(mockRouter, "/project/test-slug");
      prefetchRoute(mockRouter, "/project/test-slug");

      expect(mockRouter.prefetch).toHaveBeenCalledTimes(1);
      expect(mockRouter.prefetch).toHaveBeenCalledWith("/project/test-slug");
    });

    it("should safely handle null router or missing prefetch method", () => {
      expect(() => prefetchRoute(null, "/")).not.toThrow();
      expect(() => prefetchRoute({}, "/")).not.toThrow();
    });
  });

  describe("Exact Next.js Image Preloading", () => {
    it("should create Image with exact properties and skip if already cached", () => {
      let createdImage = null;
      class MockImage {
        constructor() {
          this.sizes = "";
          this.srcset = "";
          this.src = "";
          this.decode = vi.fn().mockResolvedValue(undefined);
          createdImage = this;
        }
      }
      globalThis.Image = MockImage;

      preloadHeroImage("/project-hero.png");

      expect(createdImage).not.toBeNull();
      expect(createdImage.src).toContain("/project-hero.png");

      // Verify second hover does not re-instantiate Image
      createdImage = null;
      markImageCached("/project-hero.png");
      preloadHeroImage("/project-hero.png");
      expect(createdImage).toBeNull();

      delete globalThis.Image;
    });

    it("should prefetch project route and hero image in prefetchProject", () => {
      const mockRouter = {
        prefetch: vi.fn(),
      };

      let createdImage = null;
      class MockImage {
        constructor() {
          this.sizes = "";
          this.srcset = "";
          this.src = "";
          this.decode = vi.fn().mockResolvedValue(undefined);
          createdImage = this;
        }
      }
      globalThis.Image = MockImage;

      prefetchProject(mockRouter, "my-app", "/app-hero.png");

      expect(mockRouter.prefetch).toHaveBeenCalledWith("/project/my-app");
      expect(createdImage).not.toBeNull();

      delete globalThis.Image;
    });

    it("should respect skipImagePreload option", () => {
      const mockRouter = {
        prefetch: vi.fn(),
      };

      let createdImage = null;
      class MockImage {
        constructor() {
          createdImage = this;
        }
      }
      globalThis.Image = MockImage;

      prefetchProject(mockRouter, "my-app", "/app-hero.png", { skipImagePreload: true });

      expect(mockRouter.prefetch).toHaveBeenCalledWith("/project/my-app");
      expect(createdImage).toBeNull();

      delete globalThis.Image;
    });
  });

  describe("Cache Invalidation & Build Detection", () => {
    it("should flush in-memory and stored caches on flushPrefetchCache", () => {
      const routes = getRuntimeRouteSet();
      routes.add("/project/a");
      routes.add("/project/b");
      markImageCached("/img.png");

      flushPrefetchCache();

      expect(getRuntimeRouteSet().size).toBe(0);
      expect(mockLocalStorage[STORAGE_IMAGES_KEY]).toBeUndefined();
    });

    it("should store initial buildId on first visit without refreshing", async () => {
      const mockRouter = { refresh: vi.fn() };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buildId: "build-101", timestamp: 1234567 }),
      });

      const result = await checkBuildVersion(mockRouter);

      expect(result.updated).toBe(false);
      expect(result.buildId).toBe("build-101");
      expect(mockLocalStorage[STORAGE_BUILD_KEY]).toBe("build-101");
      expect(mockRouter.refresh).not.toHaveBeenCalled();

      delete globalThis.fetch;
    });

    it("should detect new buildId, flush caches, update localStorage and call router.refresh()", async () => {
      mockLocalStorage[STORAGE_BUILD_KEY] = "build-100";
      getRuntimeRouteSet().add("/project/old");

      const mockRouter = { refresh: vi.fn() };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buildId: "build-200", timestamp: 999999 }),
      });

      const result = await checkBuildVersion(mockRouter);

      expect(result.updated).toBe(true);
      expect(result.buildId).toBe("build-200");
      expect(mockLocalStorage[STORAGE_BUILD_KEY]).toBe("build-200");
      expect(getRuntimeRouteSet().size).toBe(0);
      expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);

      delete globalThis.fetch;
    });

    it("should do nothing when buildId is identical", async () => {
      mockLocalStorage[STORAGE_BUILD_KEY] = "build-100";
      const mockRouter = { refresh: vi.fn() };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buildId: "build-100", timestamp: 999999 }),
      });

      const result = await checkBuildVersion(mockRouter);

      expect(result.updated).toBe(false);
      expect(mockRouter.refresh).not.toHaveBeenCalled();

      delete globalThis.fetch;
    });
  });
});
