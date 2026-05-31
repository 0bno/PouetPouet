import type { Server } from 'socket.io'
import { boardSocketHandlers } from './board.js'
import { sessionSocketHandlers } from './session.js'
import { scrumSocketHandlers } from './scrum.js'
import { dailySocketHandlers } from './daily.js'
import { voteSocketHandlers } from './vote.js'

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    // Per-user room so account notifications can be pushed live, board-independent.
    const userId = socket.data.userId as string | undefined
    if (userId) socket.join(`user:${userId}`)
    boardSocketHandlers(io, socket)
    sessionSocketHandlers(io, socket)
    scrumSocketHandlers(io, socket)
    dailySocketHandlers(io, socket)
    voteSocketHandlers(io, socket)
  })
}
