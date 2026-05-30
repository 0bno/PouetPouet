// Single source of truth for the colors offered across the app (cards, shapes,
// labels, teams…). Quick-pick swatches everywhere use BASE_COLORS; anything beyond
// is available through the custom picker, and recent custom colors are remembered.

export const BASE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
  '#111827', // near-black
  '#ffffff', // white
] as const

// Sensible defaults drawn from the shared palette.
export const DEFAULT_CARD_COLOR = '#eab308'   // yellow — new sticky notes
export const DEFAULT_SHAPE_COLOR = '#6366f1'  // indigo — new shapes / drawings
export const DEFAULT_LABEL_COLOR = '#111827'  // near-black — label text

// ── Recently used custom colors (localStorage) ────────────────────────────────
const RECENTS_KEY = 'pp-recent-colors'
const RECENTS_MAX = 8

function isHex(c: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)
}

export function getRecentColors(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((c) => typeof c === 'string' && isHex(c)).slice(0, RECENTS_MAX) : []
  } catch {
    return []
  }
}

// Records a custom color (skips ones already in the base palette). Returns the new list.
export function pushRecentColor(color: string): string[] {
  if (typeof window === 'undefined' || !isHex(color)) return []
  const norm = color.toLowerCase()
  if ((BASE_COLORS as readonly string[]).map((c) => c.toLowerCase()).includes(norm)) return getRecentColors()
  const next = [norm, ...getRecentColors().filter((c) => c.toLowerCase() !== norm)].slice(0, RECENTS_MAX)
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)) } catch {}
  return next
}
