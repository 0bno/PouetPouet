import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import type { Server, Socket } from 'socket.io'
import type { ModuleManifest } from '@pouetpouet/shared'
import { POUETPOUET_MODULE, SCRUM_MODULE, DAILY_MODULE, WHEEL_MODULE } from '@pouetpouet/shared'

import { boardRoutes } from '../routes/boards.js'
import { templateRoutes } from '../routes/templates.js'
import { scrumRoutes } from '../routes/scrum.js'
import { dailyRoutes } from '../routes/daily.js'
import { wheelRoutes } from '../routes/wheel.js'
import { boardSocketHandlers } from '../sockets/board.js'
import { voteSocketHandlers } from '../sockets/vote.js'
import { scrumSocketHandlers } from '../sockets/scrum.js'
import { dailySocketHandlers } from '../sockets/daily.js'

// FORGE F0 — registre des modules côté API.
// Le socle (index.ts) monte routes et handlers socket en itérant ce registre :
// activer/désactiver un module = l'ajouter/retirer ici. Les routes du socle
// (auth, notifications, sessions live) restent montées explicitement.
// La restructuration physique en packages/module-* viendra ensuite ; ce
// registre fixe déjà la frontière logique de chaque module.

export interface ApiModule {
  manifest: ModuleManifest
  routes: { plugin: FastifyPluginAsync; prefix: string }[]
  socketHandlers: ((io: Server, socket: Socket) => void)[]
}

export const API_MODULES: ApiModule[] = [
  {
    manifest: POUETPOUET_MODULE,
    routes: [
      { plugin: boardRoutes, prefix: '/api/boards' },
      { plugin: templateRoutes, prefix: '/api/templates' },
    ],
    socketHandlers: [boardSocketHandlers, voteSocketHandlers],
  },
  {
    manifest: SCRUM_MODULE,
    routes: [{ plugin: scrumRoutes, prefix: '/api/scrum' }],
    socketHandlers: [scrumSocketHandlers],
  },
  {
    manifest: DAILY_MODULE,
    routes: [{ plugin: dailyRoutes, prefix: '/api/daily' }],
    socketHandlers: [dailySocketHandlers],
  },
  {
    manifest: WHEEL_MODULE,
    routes: [{ plugin: wheelRoutes, prefix: '/api/wheel' }],
    socketHandlers: [],
  },
]

export function registerModuleRoutes(app: FastifyInstance) {
  for (const mod of API_MODULES) {
    for (const { plugin, prefix } of mod.routes) {
      app.register(plugin, { prefix })
    }
  }
}
