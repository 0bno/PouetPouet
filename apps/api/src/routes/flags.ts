import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { audit } from '../lib/audit.js'
import { FLAG_KEYS } from '@pouetpouet/shared'
import { currentEnv, evaluateFlags, isAdminEmail, listAdminFlags, setFlag } from '../lib/feature-flags.js'

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
  whitelist: z.array(z.string().min(1)).max(1000).optional(),
})

export const flagRoutes: FastifyPluginAsync = async (app) => {
  // Évaluation des flags pour l'utilisateur courant — consommée par le gating web.
  app.get('/flags', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.user as { id: string }
    return evaluateFlags(id, currentEnv())
  })

  // ── Admin (allowlist ADMIN_EMAILS) ────────────────────────────────────────────
  async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.user as { email?: string }
    if (!isAdminEmail(email)) {
      return reply.status(403).send({ error: 'Accès réservé aux administrateurs.' })
    }
  }

  app.get('/admin/flags', { preHandler: [app.authenticate, requireAdmin] }, async () => {
    return listAdminFlags(currentEnv())
  })

  app.patch('/admin/flags/:key', { preHandler: [app.authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.user as { id: string }
    const { key } = request.params as { key: string }
    if (!FLAG_KEYS.includes(key)) return reply.status(404).send({ error: 'Flag inconnu.' })
    const patch = patchSchema.parse(request.body)
    await setFlag(key, currentEnv(), patch)
    audit(id, 'feature.flag.updated', request, key)
    return reply.send({ ok: true })
  })
}
