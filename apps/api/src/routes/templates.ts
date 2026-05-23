import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const templateCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  enabledActivities: z.array(z.string()).nullable().optional(),
  // Either snapshot directly, or save from existing board
  fromBoardId: z.string().optional(),
})

const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  enabledActivities: z.array(z.string()).nullable().optional(),
})

export const templateRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate)

  // List user templates
  app.get('/', async (request) => {
    const { id } = request.user as { id: string }
    const templates = await prisma.boardTemplate.findMany({
      where: { ownerId: id },
      orderBy: { updatedAt: 'desc' },
    })
    return templates
  })

  // Create template (from scratch or from a board snapshot)
  app.post('/', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const body = templateCreateSchema.parse(request.body)

    let cards: any[] = []
    let frames: any[] = []
    let connections: any[] = []
    let fields: any[] = []
    let inheritedDesc: string | null | undefined = body.description
    let inheritedCover: string | null | undefined = body.coverImage
    let inheritedMax: number | null | undefined = body.maxParticipants
    let inheritedActivities: any = body.enabledActivities

    if (body.fromBoardId) {
      const board = await prisma.board.findUnique({ where: { id: body.fromBoardId } })
      if (!board) return reply.status(404).send({ error: 'Board introuvable' })
      if (board.ownerId !== userId) return reply.status(403).send({ error: 'Accès refusé' })
      const [bCards, bFrames, bConns, bFields] = await Promise.all([
        prisma.card.findMany({ where: { boardId: board.id } }),
        prisma.frame.findMany({ where: { boardId: board.id } }),
        prisma.cardConnection.findMany({ where: { boardId: board.id } }),
        prisma.boardField.findMany({ where: { boardId: board.id }, orderBy: { order: 'asc' } }),
      ])
      cards = bCards
      frames = bFrames
      connections = bConns
      fields = bFields
      if (inheritedDesc === undefined) inheritedDesc = board.description
      if (inheritedCover === undefined) inheritedCover = board.coverImage
      if (inheritedMax === undefined) inheritedMax = board.maxParticipants
      if (inheritedActivities === undefined) inheritedActivities = board.enabledActivities
    }

    const template = await prisma.boardTemplate.create({
      data: {
        name: body.name,
        description: inheritedDesc ?? null,
        coverImage: inheritedCover ?? null,
        maxParticipants: inheritedMax ?? null,
        enabledActivities: (inheritedActivities ?? undefined) as never,
        ownerId: userId,
        cards: cards as never,
        frames: frames as never,
        connections: connections as never,
        fields: fields as never,
      },
    })
    return reply.status(201).send(template)
  })

  // Update template metadata
  app.patch('/:id', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = templateUpdateSchema.parse(request.body)
    const tpl = await prisma.boardTemplate.findUnique({ where: { id } })
    if (!tpl) return reply.status(404).send({ error: 'Template introuvable' })
    if (tpl.ownerId !== userId) return reply.status(403).send({ error: 'Accès refusé' })
    const updated = await prisma.boardTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.maxParticipants !== undefined && { maxParticipants: body.maxParticipants }),
        ...(body.enabledActivities !== undefined && { enabledActivities: (body.enabledActivities ?? undefined) as never }),
      },
    })
    return reply.send(updated)
  })

  // Delete template
  app.delete('/:id', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }
    const tpl = await prisma.boardTemplate.findUnique({ where: { id } })
    if (!tpl) return reply.status(404).send({ error: 'Template introuvable' })
    if (tpl.ownerId !== userId) return reply.status(403).send({ error: 'Accès refusé' })
    await prisma.boardTemplate.delete({ where: { id } })
    return reply.status(204).send()
  })
}
