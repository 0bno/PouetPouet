'use client'

import { useEffect, useRef, useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { BASE_COLORS, getRecentColors, pushRecentColor } from '@/lib/colors'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  columns?: number
}

// Inline color picker: shared base swatches + recently used customs + a full-spectrum
// picker revealed on demand. Stops mousedown so it can live inside draggable surfaces.
export function ColorPicker({ value, onChange, columns = 7 }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [recents, setRecents] = useState<string[]>([])
  const norm = (value ?? '').toLowerCase()

  useEffect(() => { setRecents(getRecentColors()) }, [])

  function commitRecent() {
    setRecents(pushRecentColor(value))
  }

  return (
    <div className="flex flex-col gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {BASE_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onChange(c)}
            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
              norm === c.toLowerCase() ? 'ring-2 ring-offset-1 ring-gray-700' : 'ring-1 ring-black/10 shadow-sm'
            }`}
            style={{ background: c }}
          />
        ))}
        <button
          title="Couleur personnalisée"
          onClick={() => setShowCustom((v) => !v)}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
            showCustom ? 'ring-2 ring-gray-700' : 'ring-1 ring-black/10 shadow-sm'
          }`}
          style={{ background: 'conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
        </button>
      </div>

      {recents.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-gray-400 mr-0.5">Récentes</span>
          {recents.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => onChange(c)}
              className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${
                norm === c.toLowerCase() ? 'ring-2 ring-gray-700' : 'ring-1 ring-black/10 shadow-sm'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      )}

      {showCustom && (
        <div className="pp-colorful flex flex-col gap-2 pt-0.5">
          <HexColorPicker color={value} onChange={onChange} onMouseUp={commitRecent} onTouchEnd={commitRecent} />
          <HexColorInput
            color={value}
            onChange={onChange}
            onBlur={commitRecent}
            prefixed
            className="w-24 rounded-md border border-gray-200 px-2 py-1 text-xs uppercase text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      )}
    </div>
  )
}

interface ColorPopoverProps {
  value: string
  onChange: (color: string) => void
  title?: string
  align?: 'left' | 'right'
}

// A single current-color swatch that opens the ColorPicker in a popover — for tight
// rows (e.g. the selection bar) where the full inline picker doesn't fit.
export function ColorPopover({ value, onChange, title = 'Couleur', align = 'right' }: ColorPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        title={title}
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full ring-1 ring-black/15 shadow-sm hover:scale-110 transition-transform"
        style={{ background: value }}
      />
      {open && (
        <div className={`absolute z-[60] mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white rounded-xl shadow-xl border border-gray-200 p-2.5`}>
          <ColorPicker value={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
