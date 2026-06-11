import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'

// Hub stats — agrège les compteurs cross-modules pour le tableau de bord /hub.
// Toutes les données sont filtrées par l'utilisateur connecté (ses ressources uniquement).

export const hubRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stats', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string }

    const [boards, teams, scrumRooms, dailySessions, capacityEvents, wheelEvents] = await Promise.all([
      prisma.board.count({ where: { ownerId: userId } }),
      prisma.team.count({ where: { ownerId: userId } }),
      prisma.scrumRoom.count({ where: { ownerId: userId } }),
      prisma.dailySession.count({ where: { ownerId: userId } }),
      prisma.capacityEvent.count({ where: { ownerId: userId } }),
      prisma.wheelEvent.count({ where: { ownerId: userId } }),
    ])

    return { boards, teams, scrumRooms, dailySessions, capacityEvents, wheelEvents }
  })
}
