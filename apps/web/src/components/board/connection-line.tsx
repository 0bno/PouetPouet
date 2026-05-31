'use client'

import type { Connection } from '@/hooks/useBoard'

type Rect = { posX: number; posY: number; width: number; height: number }
type Pt = { x: number; y: number }

const DEFAULT_COLOR = '#9ca3af'

function center(r: Rect): Pt {
  return { x: r.posX + r.width / 2, y: r.posY + r.height / 2 }
}

// Point on a rectangle's border along the ray from its center toward `t`.
function anchor(r: Rect, t: Pt): Pt {
  const c = center(r)
  const dx = t.x - c.x, dy = t.y - c.y
  if (dx === 0 && dy === 0) return c
  const hw = r.width / 2, hh = r.height / 2
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh)
  return { x: c.x + dx * scale, y: c.y + dy * scale }
}

function norm(dx: number, dy: number): Pt {
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

// Builds the path string plus the unit tangents at each end (pointing outward to the
// arrow tip) and a midpoint for the label.
function buildPath(shape: string, a: Pt, b: Pt) {
  if (shape === 'straight') {
    return { d: `M${a.x},${a.y} L${b.x},${b.y}`, tStart: norm(a.x - b.x, a.y - b.y), tEnd: norm(b.x - a.x, b.y - a.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  }
  if (shape === 'orthogonal') {
    const horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
    const corner1: Pt = horiz ? { x: (a.x + b.x) / 2, y: a.y } : { x: a.x, y: (a.y + b.y) / 2 }
    const corner2: Pt = horiz ? { x: (a.x + b.x) / 2, y: b.y } : { x: b.x, y: (a.y + b.y) / 2 }
    return {
      d: `M${a.x},${a.y} L${corner1.x},${corner1.y} L${corner2.x},${corner2.y} L${b.x},${b.y}`,
      tStart: norm(corner1.x - a.x, corner1.y - a.y),
      tEnd: norm(b.x - corner2.x, b.y - corner2.y),
      mid: { x: (corner1.x + corner2.x) / 2, y: (corner1.y + corner2.y) / 2 },
    }
  }
  // curved (default): leave each anchor along the dominant axis for a smooth bezier
  const dx = b.x - a.x, dy = b.y - a.y
  const horiz = Math.abs(dx) >= Math.abs(dy)
  const k = 0.5
  const c1: Pt = horiz ? { x: a.x + dx * k, y: a.y } : { x: a.x, y: a.y + dy * k }
  const c2: Pt = horiz ? { x: b.x - dx * k, y: b.y } : { x: b.x, y: b.y - dy * k }
  return {
    d: `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`,
    tStart: norm(a.x - c1.x, a.y - c1.y),
    tEnd: norm(b.x - c2.x, b.y - c2.y),
    mid: { x: (a.x + b.x) / 2 + (horiz ? 0 : 0), y: (a.y + b.y) / 2 },
  }
}

function arrowHead(p: Pt, t: Pt, size: number, color: string, key: string) {
  const ang = Math.atan2(t.y, t.x)
  const a1 = { x: p.x - size * Math.cos(ang - 0.45), y: p.y - size * Math.sin(ang - 0.45) }
  const a2 = { x: p.x - size * Math.cos(ang + 0.45), y: p.y - size * Math.sin(ang + 0.45) }
  return <polygon key={key} points={`${p.x},${p.y} ${a1.x},${a1.y} ${a2.x},${a2.y}`} fill={color} />
}

export function ConnectionLine({ conn, from, to, selected, interactive, onSelect }: {
  conn: Connection
  from: Rect
  to: Rect
  selected?: boolean
  interactive?: boolean
  onSelect?: (id: string) => void
}) {
  const a = anchor(from, center(to))
  const b = anchor(to, center(from))
  const { d, tStart, tEnd, mid } = buildPath(conn.shape, a, b)
  const color = conn.color || DEFAULT_COLOR
  const w = conn.width || 2
  const headSize = 7 + w * 1.5

  return (
    <g>
      {/* Selection halo */}
      {selected && (
        <path d={d} fill="none" stroke="#6366f1" strokeOpacity={0.25} strokeWidth={w + 8} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      )}
      {/* Wide invisible hit-area */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(16, w + 12)}
        style={{ pointerEvents: interactive ? 'stroke' : 'none', cursor: interactive ? 'pointer' : 'default' }}
        onMouseDown={(e) => { if (interactive) { e.stopPropagation(); onSelect?.(conn.id) } }}
      />
      {/* Visible line */}
      <path
        d={d}
        fill="none"
        stroke={selected ? '#6366f1' : color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={conn.dashed ? `${Math.max(6, w * 3)} ${Math.max(4, w * 2)}` : undefined}
        style={{ pointerEvents: 'none' }}
      />
      {/* Arrow heads */}
      {(conn.arrow === 'end' || conn.arrow === 'both') && arrowHead(b, tEnd, headSize, selected ? '#6366f1' : color, 'end')}
      {(conn.arrow === 'both') && arrowHead(a, tStart, headSize, selected ? '#6366f1' : color, 'start')}

      {/* Label */}
      {conn.label && (
        <g style={{ pointerEvents: interactive ? 'all' : 'none', cursor: interactive ? 'pointer' : 'default' }} onMouseDown={(e) => { if (interactive) { e.stopPropagation(); onSelect?.(conn.id) } }}>
          <rect
            x={mid.x - conn.label.length * 3.6 - 6}
            y={mid.y - 10}
            width={conn.label.length * 7.2 + 12}
            height={20}
            rx={6}
            fill="white"
            stroke={selected ? '#6366f1' : '#e5e7eb'}
          />
          <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={12} fill="#374151" style={{ userSelect: 'none' }}>
            {conn.label}
          </text>
        </g>
      )}
    </g>
  )
}
