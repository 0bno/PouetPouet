'use client'

import { useState } from 'react'

// A link between two cards: visible line, wide invisible hit-area, and a delete
// affordance that appears on hover (when onDelete is provided).
export function ConnectionLine({ id, x1, y1, x2, y2, onDelete }: {
  id: string; x1: number; y1: number; x2: number; y2: number; onDelete?: (id: string) => void
}) {
  const [hover, setHover] = useState(false)
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* Wide invisible hit-area */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} style={{ pointerEvents: onDelete ? 'stroke' : 'none', cursor: onDelete ? 'pointer' : 'default' }} />
      {/* Visible line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={hover && onDelete ? '#6366f1' : '#9ca3af'}
        strokeWidth={hover && onDelete ? 2.5 : 2}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
      {hover && onDelete && (
        <g style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onDelete(id) }}>
          <circle cx={mx} cy={my} r={10} fill="white" stroke="#ef4444" strokeWidth={1.5} />
          <path
            d={`M${mx - 3.5},${my - 3.5} L${mx + 3.5},${my + 3.5} M${mx + 3.5},${my - 3.5} L${mx - 3.5},${my + 3.5}`}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  )
}
