import NodeCache from 'node-cache';

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 900; // 15 minutes

interface CacheEntry<T> {
  data: T;
  storedAt: number;
}

export class AppCache {
  private cache: NodeCache;
  private pendingRequests: Map<string, Promise<any>>;

  constructor(ttlSeconds: number = DEFAULT_TTL_SECONDS) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: 120,
      useClones: false
    });
    this.pendingRequests = new Map();
  }

  /**
   * Rounds latitude/longitude to 3 decimal places (~110 meters)
   * for atmospheric grid consistency and privacy protection.
   */
  public static roundCoord(coord: number): number {
    return Math.round(coord * 1000) / 1000;
  }

  public get<T>(key: string): { data: T; ageSeconds: number } | null {
    const entry = this.cache.get<CacheEntry<T>>(key);
    if (!entry) return null;

    const ageSeconds = Math.floor((Date.now() - entry.storedAt) / 1000);
    return {
      data: entry.data,
      ageSeconds
    };
  }

  public set<T>(key: string, data: T, ttlSeconds?: number): void {
    const entry: CacheEntry<T> = {
      data,
      storedAt: Date.now()
    };
    if (ttlSeconds !== undefined) {
      this.cache.set(key, entry, ttlSeconds);
    } else {
      this.cache.set(key, entry);
    }
  }

  /**
   * Deduplicates concurrent in-flight requests for the exact same resource.
   */
  public async fetchWithDeduplication<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<{ data: T; isCached: boolean; ageSeconds: number }> {
    // 1. Check existing cache
    const cached = this.get<T>(key);
    if (cached) {
      return {
        data: cached.data,
        isCached: true,
        ageSeconds: cached.ageSeconds
      };
    }

    // 2. Check if identical request is currently in-flight
    if (this.pendingRequests.has(key)) {
      const data = await this.pendingRequests.get(key)!;
      return {
        data,
        isCached: true,
        ageSeconds: 0
      };
    }

    // 3. Initiate new fetch and register in pending map
    const fetchPromise = (async () => {
      try {
        const result = await fetchFn();
        this.set(key, result, ttlSeconds);
        return result;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, fetchPromise);
    const data = await fetchPromise;

    return {
      data,
      isCached: false,
      ageSeconds: 0
    };
  }

  public flush(): void {
    this.cache.flushAll();
    this.pendingRequests.clear();
  }
}

export const appCache = new AppCache();
