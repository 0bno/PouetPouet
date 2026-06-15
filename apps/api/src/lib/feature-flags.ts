import { prisma } from './prisma.js'
import { redis } from './redis.js'
import { FLAG_DEFINITIONS, type EvaluatedFlags, type AdminFlag } from '@pouetpouet/shared'

// État runtime d'un flag (catalogue fusionné avec la surcharge DB).
export interface FlagOverride {
  enabled: boolean
  rolloutPercent: number
  whitelist: string[]
}
export type FlagState = Record<string, FlagOverride>

export function currentEnv(): string {
  return process.env.NODE_ENV ?? 'development'
}

// ── Admin allowlist (env) ─────────────────────────────────────────────────────
const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails.includes(email.toLowerCase())
}

// ── Hash déterministe (FNV-1a) → 0..99 : même (user, flag) ⇒ même bucket ───────
export function hashPercent(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) % 100
}

// ── Évaluation d'un flag pour un utilisateur (fonction pure, testable) ─────────
export function evaluateOverride(o: FlagOverride, userId: string | null, key: string): boolean {
  if (!o.enabled) return false
  if (userId && o.whitelist.includes(userId)) return true
  if (o.rolloutPercent >= 100) return true
  if (o.rolloutPercent <= 0) return false
  if (!userId) return false // anonyme : pas de bucket stable → exclu du rollout partiel
  return hashPercent(`${userId}:${key}`) < o.rolloutPercent
}

// ── Cache : Redis si dispo, sinon Map mémoire (dev) ───────────────────────────
const TTL_MS = 30_000
const REDIS_TTL_S = 30
const memCache = new Map<string, { state: FlagState; expires: number }>()

function defaults(): FlagState {
  const s: FlagState = {}
  for (const d of FLAG_DEFINITIONS) s[d.key] = { enabled: d.defaultEnabled, rolloutPercent: 100, whitelist: [] }
  return s
}

async function loadFromDb(env: string): Promise<FlagState> {
  const state = defaults()
  const rows = await prisma.featureFlag.findMany({ where: { environment: env } })
  for (const r of rows) {
    if (!(r.key in state)) continue // clé hors catalogue → ignorée
    state[r.key] = { enabled: r.enabled, rolloutPercent: r.rolloutPercent, whitelist: r.whitelist }
  }
  return state
}

export async function getFlagState(env = currentEnv()): Promise<FlagState> {
  if (redis.status === 'ready') {
    try {
      const cached = await redis.get(`flags:${env}`)
      if (cached) return JSON.parse(cached) as FlagState
      const state = await loadFromDb(env)
      await redis.set(`flags:${env}`, JSON.stringify(state), 'EX', REDIS_TTL_S)
      return state
    } catch {
      return loadFromDb(env) // erreur Redis → lecture DB directe
    }
  }
  const hit = memCache.get(env)
  if (hit && hit.expires > Date.now()) return hit.state
  const state = await loadFromDb(env)
  memCache.set(env, { state, expires: Date.now() + TTL_MS })
  return state
}

export async function invalidateCache(env = currentEnv()): Promise<void> {
  memCache.delete(env)
  if (redis.status === 'ready') {
    try { await redis.del(`flags:${env}`) } catch { /* best-effort */ }
  }
}

export async function evaluateFlags(userId: string | null, env = currentEnv()): Promise<EvaluatedFlags> {
  const state = await getFlagState(env)
  const out: EvaluatedFlags = {}
  for (const key of Object.keys(state)) out[key] = evaluateOverride(state[key], userId, key)
  return out
}

export async function listAdminFlags(env = currentEnv()): Promise<AdminFlag[]> {
  const state = await getFlagState(env)
  return FLAG_DEFINITIONS.map((d) => ({
    key: d.key,
    label: d.label,
    description: d.description,
    defaultEnabled: d.defaultEnabled,
    environment: env,
    enabled: state[d.key].enabled,
    rolloutPercent: state[d.key].rolloutPercent,
    whitelist: state[d.key].whitelist,
  }))
}

export async function setFlag(
  key: string,
  env: string,
  patch: { enabled?: boolean; rolloutPercent?: number; whitelist?: string[] },
): Promise<void> {
  const def = FLAG_DEFINITIONS.find((d) => d.key === key)
  await prisma.featureFlag.upsert({
    where: { key_environment: { key, environment: env } },
    create: {
      key,
      environment: env,
      enabled: patch.enabled ?? def?.defaultEnabled ?? false,
      rolloutPercent: patch.rolloutPercent ?? 100,
      whitelist: patch.whitelist ?? [],
    },
    update: {
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(patch.rolloutPercent !== undefined ? { rolloutPercent: patch.rolloutPercent } : {}),
      ...(patch.whitelist !== undefined ? { whitelist: patch.whitelist } : {}),
    },
  })
  await invalidateCache(env)
}
