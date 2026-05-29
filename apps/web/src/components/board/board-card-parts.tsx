'use client'

// Connect handles placed INSIDE the card edges. Outer is 24x24 (hit area), inner is 12x12 (visible dot).
// data-connect-handle lets the card-level mousedown check and bail out as a safety net.
export function ConnectHandles({ cardId, onStart }: { cardId: string; onStart?: (cardId: string, e: React.MouseEvent) => void }) {
  if (!onStart) return null
  const positions: Array<React.CSSProperties> = [
    { top: -2, left: '50%', transform: 'translateX(-50%)' },
    { top: '50%', right: -2, transform: 'translateY(-50%)' },
    { bottom: -2, left: '50%', transform: 'translateX(-50%)' },
    { top: '50%', left: -2, transform: 'translateY(-50%)' },
  ]
  return (
    <>
      {positions.map((style, i) => (
        <div
          key={i}
          data-connect-handle="true"
          className="absolute w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ ...style, zIndex: 40, cursor: 'crosshair' }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
            onStart(cardId, e)
          }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          title="Tirer pour relier à une autre carte"
        >
          <div className="w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow-md hover:scale-150 hover:bg-indigo-100 transition-all pointer-events-none" />
        </div>
      ))}
    </>
  )
}

// Per-card overlay shown in link-cards toolbar mode. Catches clicks directly so
// there's no need for elementFromPoint and no risk of the click hitting the wrong target.
export function LinkCardsOverlay({ cardId, isSource, onClick }: { cardId: string; isSource?: boolean; onClick: (cardId: string, additive: boolean) => void }) {
  return (
    <div
      className="absolute inset-0 rounded-xl"
      style={{
        zIndex: 50,
        cursor: 'crosshair',
        background: isSource ? 'rgba(99,102,241,0.15)' : 'transparent',
        boxShadow: isSource ? 'inset 0 0 0 3px #6366f1' : undefined,
      }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(cardId, e.ctrlKey || e.metaKey) }}
    />
  )
}

// Small toggle button used in the label formatting toolbar.
export function FmtBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-5 h-5 rounded flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}
