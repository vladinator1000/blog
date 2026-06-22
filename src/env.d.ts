/// <reference types="astro/client" />

declare module "prismjs" {
    const Prism: {
        languages: Record<string, unknown>
        highlight: (code: string, grammar: unknown, lang: string) => string
        util: { clone: (obj: unknown) => unknown }
    }
    export default Prism
}

declare module "prismjs/components/prism-*.js"

declare global {
    // eslint-disable-next-line no-var
    var Prism: {
        languages: Record<string, unknown>
        highlight: (code: string, grammar: unknown, lang: string) => string
        util: { clone: (obj: unknown) => unknown }
    }
}

interface KVNamespace {
    get(key: string): Promise<string | null>
    get<T>(key: string, type: "json"): Promise<T | null>
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
    list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>
    delete(key: string): Promise<void>
}

declare module "cloudflare:workers" {
    interface Env {
        ASSETS: { fetch: (request: Request) => Promise<Response> }
        RSVP_KV: KVNamespace
    }
    export const env: Env
}
