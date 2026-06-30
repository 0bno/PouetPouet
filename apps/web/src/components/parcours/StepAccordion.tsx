'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle, Circle, SkipForward, ChevronDown, ChevronRight,
  RotateCcw, CheckCheck, Pencil, Clock, AlertCircle, ExternalLink,
} from 'lucide-react'
import type { StepDef, ParcourStepInstanceDetail, StepStatus, ParcourDocClass } from '@pouetpouet/shared'
import { StepRenderer } from './StepRenderer'

const STEP_TYPE_LABEL: Record<string, string> = {
  info: 'Info', form: 'Formulaire', document: 'Document',
  approval: 'Validation', email: 'Email', module: 'Module',
}

interface Props {
  steps: StepDef[]
  stepInstances: ParcourStepInstanceDetail[]
  currentStep: number
  instanceStatus: string
  canEdit: boolean
  onComplete: (idx: number, body: { action: 'complete' | 'reject'; data?: Record<string, unknown>; comment?: string }) => Promise<void>
  onForceComplete: (idx: number, data?: Record<string, unknown>, comment?: string) => void
  onReset: (idx: number) => void
  onUpdateData: (idx: number, data: Record<string, unknown>) => void
  getUploadUrl: (filename: string, mimeType: string) => Promise<{ uploadUrl: string; key: string }>
  registerDocument: (doc: {
    storageKey: string; filename: string; mimeType: string
    sizeBytes: number; classification?: ParcourDocClass; stepIndex?: number
  }) => Promise<void>
}

function StepIcon({ status, isOverdue }: { status: StepStatus; isOverdue: boolean }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
  if (status === 'REJECTED')  return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
  if (status === 'SKIPPED')   return <SkipForward className="w-4 h-4 text-gray-400 flex-shrink-0" />
  if (isOverdue)              return <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
  return <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
}

function CompletedDataSummary({ step, data }: { step: StepDef; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) {
    if (step.type === 'info') return <p className="text-xs text-gray-400 italic">Lu et confirmé</p>
    if (step.type === 'document') return <p className="text-xs text-gray-400 italic">Document uploadé</p>
    return null
  }

  if (step.type === 'module' && data.url) {
    return (
      <a
        href={data.url as string}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        {(data.title as string) ?? 'Voir la ressource'}
      </a>
    )
  }

  if (step.type === 'form' && step.fields) {
    return (
      <div className="flex flex-col gap-1.5">
        {step.fields.map((field) => {
          const val = data[field.id]
          if (val === undefined || val === null || val === '') return null
          return (
            <div key={field.id} className="flex gap-2 text-xs">
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 min-w-[80px]">{field.label}</span>
              <span className="dark:text-gray-300 text-gray-700">{String(val)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return null
}

export function StepAccordion({
  steps, stepInstances, currentStep, instanceStatus, canEdit,
  onComplete, onForceComplete, onReset, onUpdateData,
  getUploadUrl, registerDocument,
}: Props) {
  const now = new Date()
  // Steps expanded par défaut : l'étape courante et les étapes REJECTED
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    steps.forEach((_, idx) => {
      const si = stepInstances.find((s) => s.stepIndex === idx)
      if (idx === currentStep || si?.status === 'REJECTED') init[idx] = true
    })
    return init
  })
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editData, setEditData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  function toggle(idx: number) {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  async function handleForceComplete(idx: number) {
    if (!confirm(`Valider manuellement l'étape ${idx + 1} ?`)) return
    await onForceComplete(idx)
  }

  async function handleReset(idx: number) {
    if (!confirm(`Réinitialiser l'étape ${idx + 1} ? Son statut repassera à "En attente".`)) return
    await onReset(idx)
  }

  async function handleSaveEdit(idx: number) {
    setSaving(true)
    try {
      await onUpdateData(idx, editData)
      setEditingIdx(null)
    } finally {
      setSaving(false)
    }
  }

  const isActive = instanceStatus === 'IN_PROGRESS'

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, idx) => {
        const si = stepInstances.find((s) => s.stepIndex === idx)
        const status: StepStatus = si?.status ?? 'PENDING'
        const isCurrent = idx === currentStep && status === 'PENDING' && isActive
        const isFuturePending = status === 'PENDING' && !isCurrent
        const isOverdue = status === 'PENDING' && !!si?.dueAt && new Date(si.dueAt) < now
        const isOpen = !!expanded[idx]
        const isEditing = editingIdx === idx

        const borderCls = isCurrent
          ? 'border-cyan-200 dark:border-cyan-800 bg-white dark:bg-gray-900'
          : status === 'REJECTED'
          ? 'border-red-200 dark:border-red-900 bg-white dark:bg-gray-900'
          : isOverdue
          ? 'border-orange-200 dark:border-orange-900 bg-white dark:bg-gray-900'
          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'

        return (
          <div key={idx} className={`rounded-2xl border transition-all ${borderCls}`}>
            {/* Header row */}
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <StepIcon status={status} isOverdue={isOverdue} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${
                    isCurrent ? 'text-cyan-700 dark:text-cyan-300' :
                    status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                    isOverdue ? 'text-orange-700 dark:text-orange-400' :
                    status === 'COMPLETED' ? 'text-gray-500 dark:text-gray-400' :
                    'dark:text-white'
                  }`}>
                    {idx + 1}. {step.title}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex-shrink-0">
                    {STEP_TYPE_LABEL[step.type] ?? step.type}
                  </span>
                  {isCurrent && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                      En cours
                    </span>
                  )}
                </div>
                {si?.dueAt && status === 'PENDING' && (
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-orange-500' : 'text-gray-400'}`}>
                    <Clock className="w-3 h-3" />
                    {isOverdue ? 'En retard · ' : ''}
                    {new Date(si.dueAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>

            {/* Body */}
            {isOpen && (
              <div className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">

                {/* Étape courante PENDING : StepRenderer complet */}
                {isCurrent && (
                  <StepRenderer
                    step={step}
                    stepIndex={idx}
                    stepData={si?.data}
                    onComplete={(action, data, comment) => onComplete(idx, { action, data, comment })}
                    getUploadUrl={getUploadUrl}
                    registerDocument={registerDocument}
                  />
                )}

                {/* Étape future PENDING : validation manuelle */}
                {isFuturePending && canEdit && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">Étape à venir.</p>
                    <button
                      onClick={() => handleForceComplete(idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 text-xs font-medium hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Valider manuellement
                    </button>
                  </div>
                )}

                {/* Étape COMPLETED : données + actions */}
                {status === 'COMPLETED' && (
                  <div className="flex flex-col gap-3">
                    {isEditing && step.type === 'form' && step.fields ? (
                      <div className="flex flex-col gap-3">
                        {step.fields.map((field) => (
                          <div key={field.id}>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              value={(editData[field.id] as string) ?? (si?.data?.[field.id] as string) ?? ''}
                              onChange={(e) => setEditData((p) => ({ ...p, [field.id]: e.target.value }))}
                              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(idx)}
                            disabled={saving}
                            className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                          >
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                          </button>
                          <button
                            onClick={() => setEditingIdx(null)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CompletedDataSummary step={step} data={si?.data ?? null} />
                    )}

                    {canEdit && !isEditing && (
                      <div className="flex items-center gap-2 pt-1">
                        {step.type === 'form' && step.fields && (
                          <button
                            onClick={() => { setEditingIdx(idx); setEditData({}) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Modifier
                          </button>
                        )}
                        <button
                          onClick={() => handleReset(idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Réinitialiser
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Étape REJECTED ou SKIPPED */}
                {(status === 'REJECTED' || status === 'SKIPPED') && (
                  <div className="flex items-center gap-3">
                    <p className={`text-sm flex-1 ${status === 'REJECTED' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                      {status === 'REJECTED' ? 'Étape rejetée.' : 'Étape ignorée.'}
                    </p>
                    {canEdit && (
                      <button
                        onClick={() => handleReset(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Réinitialiser
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
