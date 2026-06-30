'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useParcourTemplates } from '@/hooks/useParcours'
import { useFlagGuard } from '@/hooks/useFlagGuard'
import { StepBuilder } from '@/components/parcours/StepBuilder'
import type { StepDef } from '@pouetpouet/shared'

const CATEGORIES = ['cyber', 'archi', 'onboarding', 'qualite', 'rh', 'it', 'autre']

export default function NewTemplatePage() {
  useFlagGuard('module.parcours')
  const router = useRouter()
  const { createTemplate } = useParcourTemplates()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [steps, setSteps] = useState<StepDef[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return }
    if (steps.length === 0) { setError('Ajoutez au moins une étape.'); return }
    if (steps.some((s) => !s.title.trim())) { setError('Chaque étape doit avoir un titre.'); return }

    setSaving(true)
    setError('')
    try {
      const t = await createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        steps,
      })
      router.push(`/parcours/templates/${t.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href="/parcours/templates" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-1 inline-block">
          ← Templates
        </Link>
        <h1 className="text-3xl font-bold dark:text-white">Nouveau template</h1>
      </div>

      <div className="flex flex-col gap-5 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Informations</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nom <span className="text-red-500">*</span></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Parcours cyber entrant"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description du parcours…"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">Sans catégorie</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tags (séparés par des virgules)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="audit, sécurité…"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Étapes <span className="text-gray-400 font-normal normal-case ml-1">({steps.length})</span>
        </h2>
        <StepBuilder steps={steps} onChange={setSteps} />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="flex gap-3">
        <Link href="/parcours/templates" className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Annuler
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? 'Création…' : 'Créer le template'}
        </button>
      </div>
    </div>
  )
}
