'use client'

// Banner shown while editing a template draft; changes must be saved explicitly.
export function TemplateDraftBanner({ saving, onSave, onDiscard }: { saving: boolean; onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 shrink-0">
      <div className="flex items-center gap-2 text-amber-800 text-sm font-medium min-w-0">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span className="truncate">Mode édition de template — les modifications doivent être enregistrées explicitement.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onDiscard}
          disabled={saving}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {saving ? '…' : 'Enregistrer le template'}
        </button>
      </div>
    </div>
  )
}
