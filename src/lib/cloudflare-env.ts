import { env } from "cloudflare:workers"

interface CloudflareEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  RSVP_KV: KVNamespace
}

export function getEnv(): CloudflareEnv {
  return env as unknown as CloudflareEnv
}
