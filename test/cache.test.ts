import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LRUCache } from '../src/cache'

describe('LRUCache', () => {
    let cache: LRUCache<string, number>

    beforeEach(() => {
        cache = new LRUCache<string, number>({ maxSize: 3 })
    })

    describe('get / set', () => {
        it('stores and retrieves a value', () => {
            cache.set('a', 1)
            expect(cache.get('a')).toBe(1)
        })

        it('returns undefined for missing keys', () => {
            expect(cache.get('nonexistent')).toBeUndefined()
        })

        it('overwrites existing keys', () => {
            cache.set('a', 1)
            cache.set('a', 2)
            expect(cache.get('a')).toBe(2)
            expect(cache.size).toBe(1)
        })
    })

    describe('LRU eviction', () => {
        it('evicts the least recently used entry when at capacity', () => {
            cache.set('a', 1)
            cache.set('b', 2)
            cache.set('c', 3)
            // Cache is full: [a, b, c]. Adding 'd' should evict 'a'.
            cache.set('d', 4)

            expect(cache.get('a')).toBeUndefined()
            expect(cache.get('b')).toBe(2)
            expect(cache.get('c')).toBe(3)
            expect(cache.get('d')).toBe(4)
            expect(cache.size).toBe(3)
        })

        it('promotes accessed entries to most-recently-used', () => {
            cache.set('a', 1)
            cache.set('b', 2)
            cache.set('c', 3)

            // Access 'a' to promote it
            cache.get('a')

            // Adding 'd' should evict 'b' (now the LRU), not 'a'
            cache.set('d', 4)

            expect(cache.get('a')).toBe(1) // still present
            expect(cache.get('b')).toBeUndefined() // evicted
            expect(cache.get('c')).toBe(3)
            expect(cache.get('d')).toBe(4)
        })
    })

    describe('TTL expiry', () => {
        it('returns undefined for expired entries', () => {
            vi.useFakeTimers()
            const ttlCache = new LRUCache<string, number>({ maxSize: 10, ttl: 1000 })

            ttlCache.set('key', 42)
            expect(ttlCache.get('key')).toBe(42)

            // Advance time past TTL
            vi.advanceTimersByTime(1001)
            expect(ttlCache.get('key')).toBeUndefined()

            vi.useRealTimers()
        })

        it('has() returns false for expired entries', () => {
            vi.useFakeTimers()
            const ttlCache = new LRUCache<string, number>({ maxSize: 10, ttl: 500 })

            ttlCache.set('key', 1)
            expect(ttlCache.has('key')).toBe(true)

            vi.advanceTimersByTime(501)
            expect(ttlCache.has('key')).toBe(false)

            vi.useRealTimers()
        })
    })

    describe('has', () => {
        it('returns true for existing keys', () => {
            cache.set('a', 1)
            expect(cache.has('a')).toBe(true)
        })

        it('returns false for missing keys', () => {
            expect(cache.has('a')).toBe(false)
        })
    })

    describe('delete', () => {
        it('removes an entry', () => {
            cache.set('a', 1)
            expect(cache.delete('a')).toBe(true)
            expect(cache.get('a')).toBeUndefined()
            expect(cache.size).toBe(0)
        })

        it('returns false when deleting non-existent key', () => {
            expect(cache.delete('a')).toBe(false)
        })
    })

    describe('clear', () => {
        it('removes all entries', () => {
            cache.set('a', 1)
            cache.set('b', 2)
            cache.clear()
            expect(cache.size).toBe(0)
            expect(cache.get('a')).toBeUndefined()
            expect(cache.get('b')).toBeUndefined()
        })
    })

    describe('size', () => {
        it('tracks the number of entries', () => {
            expect(cache.size).toBe(0)
            cache.set('a', 1)
            expect(cache.size).toBe(1)
            cache.set('b', 2)
            expect(cache.size).toBe(2)
            cache.delete('a')
            expect(cache.size).toBe(1)
        })
    })

    describe('defaults', () => {
        it('uses default maxSize of 50', () => {
            const defaultCache = new LRUCache<number, number>()
            for (let i = 0; i < 50; i++) {
                defaultCache.set(i, i)
            }
            expect(defaultCache.size).toBe(50)
            // 51st entry should evict the first
            defaultCache.set(50, 50)
            expect(defaultCache.size).toBe(50)
            expect(defaultCache.get(0)).toBeUndefined()
        })
    })
})
