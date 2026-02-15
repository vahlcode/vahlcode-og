import type { CacheOptions } from './types'

interface CacheEntry<V> {
    value: V
    expiresAt: number
}

/**
 * A simple in-memory LRU (Least Recently Used) cache.
 *
 * Used internally to cache fetched fonts and images to avoid
 * redundant network requests on repeated renders.
 *
 * @example
 * ```ts
 * const cache = new LRUCache<string, ArrayBuffer>({ maxSize: 20, ttl: 60_000 })
 * cache.set('inter-700', fontData)
 * cache.get('inter-700') // ArrayBuffer
 * ```
 */
export class LRUCache<K, V> {
    private readonly cache = new Map<K, CacheEntry<V>>()
    private readonly maxSize: number
    private readonly ttl: number

    constructor(options: CacheOptions = {}) {
        this.maxSize = options.maxSize ?? 50
        this.ttl = options.ttl ?? Infinity
    }

    /**
     * Retrieve a value from the cache.
     * Returns `undefined` if the key is not found or has expired.
     * Accessing a key promotes it to most-recently-used.
     */
    get(key: K): V | undefined {
        const entry = this.cache.get(key)
        if (!entry) return undefined

        // Check TTL expiry
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key)
            return undefined
        }

        // Promote to most-recently-used by re-inserting
        this.cache.delete(key)
        this.cache.set(key, entry)
        return entry.value
    }

    /**
     * Store a value in the cache. Evicts the least-recently-used
     * entry if the cache is at capacity.
     */
    set(key: K, value: V): void {
        // If key already exists, delete it first so it goes to the end
        if (this.cache.has(key)) {
            this.cache.delete(key)
        }

        // Evict LRU entry if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey)
            }
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttl,
        })
    }

    /**
     * Check whether a non-expired entry exists for the given key.
     */
    has(key: K): boolean {
        const entry = this.cache.get(key)
        if (!entry) return false
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key)
            return false
        }
        return true
    }

    /**
     * Remove a specific entry from the cache.
     * @returns `true` if the entry existed and was removed.
     */
    delete(key: K): boolean {
        return this.cache.delete(key)
    }

    /**
     * Remove all entries from the cache.
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * The number of (possibly expired) entries currently in the cache.
     */
    get size(): number {
        return this.cache.size
    }
}
