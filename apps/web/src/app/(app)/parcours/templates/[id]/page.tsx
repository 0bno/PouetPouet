'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Play, Pencil, Save, X } from 'lucide-react'
import { useParcourTemplate } from '@/hooks/useParcours'
import { useFlagGuard } from '@/hooks/useFlagGuard'
import { StepBuilder } from '@/components/parcours/StepBuilder'
import { StartInstanceModal } from '@/components/parcours/StartInstanceModal'
import type { StepDef } from '@pouetpouet/shared'

const STEP_TYPE_LABEL: Record<string, string> = {
  info: 'Info', form: 'Formulaire', document: 'Document', approval: 'Validation', email: 'Email',
}

export default function TemplateDetailPage() {
  useFlagGuard('module.parcours')
  const { id } = useParams<{ id: string }>()
  const { template, isLoading, accessDenied, updateTemplate } = useParcourTemplate(id)

  const [editing, setEditing] = useState(false)
  const [draftSteps, setDraftSteps] = useState<StepDef[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)

  function startEdit() {
    if (!template) return
    setDraftName(template.name)
    setDraftDesc(template.description ?? '')
    setDraftSteps(template.steps)
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      await updateTemplate({ name: draftName, description: draftDesc, steps: draftSteps })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (accessDenied || !template) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-gray-500 dark:text-gray-400">Template introuvable ou accès refusé.</p>
      <Link href="/parcours/templates" className="text-cyan-500 hover:underline text-sm">← Retour aux templates</Link>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href="/parcours/templates" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-1 inline-block">
          ← Templates
        </Link>
        {editing ? (
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="text-3xl font-bold bg-transparent focus:outline-none border-b-2 border-cyan-500 dark:text-white w-full"
          />
        ) : (
          <h1 className="text-3xl font-bold dark:text-white">{template.name}</h1>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStarting(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          Démarrer
        </button>
        {template.role !== 'VIEWER' && !editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </button>
        )}
        {editing && (
          <>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </>
        )}
      </div>

      <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-3">
        {editing ? (
          <textarea
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            rows={2}
            placeholder="Description…"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        ) : template.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
        ) : null}

        <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
          {template.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{template.category}</span>}
          {template.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{tag}</span>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-4">
        <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Étapes ({editing ? draftSteps.length : template.steps.length})
        </h2>

        {editing ? (
          <StepBuilder steps={draftSteps} onChange={setDraftSteps} />
        ) : (
          <div className="flex flex-col gap-2">
            {template.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-xs text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                <span className="flex-1 text-sm dark:text-white">{step.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {STEP_TYPE_LABEL[step.type]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {starting && (
        <StartInstanceModal
          template={template}
          onClose={() => setStarting(false)}
        />
      )}
    </div>
  )
}
