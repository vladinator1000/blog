/// <reference types="astro/client" />

interface KVNamespace {
    get(key: string): Promise<string | null>
    get<T>(key: string, type: "json"): Promise<T | null>
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
    list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>
    delete(key: string): Promise<void>
}

declare namespace App {
    interface Locals {
        runtime: {
            env: {
                ASSETS: { fetch: (request: Request) => Promise<Response> }
                RSVP_KV: KVNamespace
            }
            cf: Record<string, unknown>
            caches: CacheStorage
        }
    }
}
