// PouetPouet Board format (.ppb)
// ZIP archive:
//   manifest.json  — metadata
//   board.json     — cards, connections, frames, fields (IMAGE cards reference media/)
//   media/<id>.ext — decoded image files

import type { Card, Connection, Frame, BoardField } from '@/hooks/useBoard'

export const PPB_MIME = 'application/x-pouetpouet-board'
export const PPB_EXT = '.ppb'

interface Manifest {
  format: 'pouetpouet-board'
  version: '1.0'
  name: string
  exportedAt: string
  cardCount: number
  connectionCount: number
  frameCount: number
  mediaCount: number
}

function base64ToBytes(dataUrl: string): { bytes: Uint8Array; ext: string } {
  const [header, b64] = dataUrl.split(',')
  const ext = header.includes('image/png') ? 'png' : header.includes('image/gif') ? 'gif' : header.includes('image/webp') ? 'webp' : 'jpg'
  const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))
  return { bytes, ext }
}

export async function exportBoardPpb(
  boardName: string,
  cards: Card[],
  connections: Connection[],
  frames: Frame[],
  fields: BoardField[],
) {
  const { zipSync, strToU8 } = await import('fflate')

  const files: Record<string, Uint8Array> = {}
  let mediaCount = 0

  const exportCards = cards.map((c) => {
    if (c.type === 'IMAGE' && c.content.startsWith('data:')) {
      const { bytes, ext } = base64ToBytes(c.content)
      const mediaName = `media/${c.id}.${ext}`
      files[mediaName] = bytes
      mediaCount++
      return { id: c.id, type: c.type, content: mediaName, color: c.color, posX: c.posX, posY: c.posY, width: c.width, height: c.height, locked: c.locked, groupId: c.groupId }
    }
    return { id: c.id, type: c.type, content: c.content, color: c.color, posX: c.posX, posY: c.posY, width: c.width, height: c.height, locked: c.locked, groupId: c.groupId }
  })

  const manifest: Manifest = {
    format: 'pouetpouet-board',
    version: '1.0',
    name: boardName,
    exportedAt: new Date().toISOString(),
    cardCount: cards.length,
    connectionCount: connections.length,
    frameCount: frames.length,
    mediaCount,
  }

  files['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))
  files['board.json'] = strToU8(JSON.stringify({
    cards: exportCards,
    connections: connections.map(({ id, fromId, toId, shape, color, arrow, dashed, width, label }) => ({ id, fromId, toId, shape, color, arrow, dashed, width, label })),
    frames: frames.map(({ id, title, posX, posY, width, height, color }) => ({ id, title, posX, posY, width, height, color })),
    fields: fields.map(({ id, name, emoji, type, options, order }) => ({ id, name, emoji, type, options, order })),
  }, null, 2))

  const zipped = zipSync(files)
  const blob = new Blob([zipped], { type: PPB_MIME })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(boardName || 'board').replace(/[^\w-]+/g, '_')}${PPB_EXT}`
  a.click()
  URL.revokeObjectURL(url)
}
