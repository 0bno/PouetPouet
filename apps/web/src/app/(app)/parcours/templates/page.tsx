'use client'

import Link from 'next/link'
import { Plus, GitBranch, Trash2, Play, Star, Copy } from 'lucide-react'
import { useParcourTemplates } from '@/hooks/useParcours'
import { useFlagGuard } from '@/hooks/useFlagGuard'
import { useState } from 'react'
import { StartInstanceModal } from '@/components/parcours/StartInstanceModal'
import type { ParcourTemplateSummary } from '@pouetpouet/shared'

const CATEGORY_COLORS: Record<string, string> = {
  cyber:      'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  archi:      'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  onboarding: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  custom:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function ParcourTemplatesPage() {
  useFlagGuard('module.parcours')
  const { templates, starredIds, isLoading, deleteTemplate, duplicateTemplate, toggleStar } = useParcourTemplates()
  const [starting, setStarting] = useState<ParcourTemplateSummary | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <Link href="/parcours" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-1 inline-block">
            ← Parcours
          </Link>
          <h1 className="text-3xl font-bold dark:text-white">Templates</h1>
        </div>
        <Link
          href="/parcours/templates/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau template
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <GitBranch className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Aucun template. Créez-en un pour commencer.</p>
          <Link href="/parcours/templates/new" className="text-cyan-500 hover:underline text-sm">Créer un template →</Link>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
          {templates.map((t) => (
            <div key={t.id} className="flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/parcours/templates/${t.id}`} className="font-semibold text-sm dark:text-white hover:text-cyan-500 transition-colors line-clamp-1">
                    {t.name}
                  </Link>
                  {t.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                </div>
                {t.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.custom}`}>
                    {t.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{t.stepCount} étape{t.stepCount > 1 ? 's' : ''}</span>
                <button
                  onClick={(e) => { e.preventDefault(); toggleStar(t.id) }}
                  className={`flex items-center gap-1 transition-colors ${starredIds.has(t.id) ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                >
                  <Star className={`w-3.5 h-3.5 ${starredIds.has(t.id) ? 'fill-yellow-400' : ''}`} />
                  {t.starCount > 0 && <span>{t.starCount}</span>}
                </button>
                {t.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="truncate">{t.tags.slice(0, 3).join(', ')}</span>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStarting(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Démarrer
                </button>
                <Link
                  href={`/parcours/templates/${t.id}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white transition-colors"
                >
                  Voir
                </Link>
                <button
                  onClick={async () => { setDuplicating(t.id); await duplicateTemplate(t.id).finally(() => setDuplicating(null)) }}
                  disabled={duplicating === t.id}
                  title="Dupliquer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 disabled:opacity-40 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {t.role === 'OWNER' && (
                  <button
                    onClick={() => { if (confirm('Supprimer ce template ?')) deleteTemplate(t.id) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {starting && (
        <StartInstanceModal template={starting} onClose={() => setStarting(null)} />
      )}
    </div>
  )
}
