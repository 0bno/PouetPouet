'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BoardTemplate, CreateTemplateInput, UpdateTemplateInput } from '@/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ACTIVITY_OPTIONS } from '@/components/dashboard/create-board-modal'

interface Props {
  templates: BoardTemplate[]
  onCreate: (input: CreateTemplateInput) => Promise<BoardTemplate>
  onUpdate: (id: string, input: UpdateTemplateInput) => Promise<BoardTemplate>
  onDelete: (id: string) => Promise<void>
  onEditContent: (id: string) => Promise<string>
  ownedBoards: { id: string; name: string }[]
}

export function TemplatesSection({ templates, onCreate, onUpdate, onDelete, onEditContent, ownedBoards }: Props) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce template ?')) return
    setDeletingId(id)
    try { await onDelete(id) } finally { setDeletingId(null) }
  }

  async function handleEditContent(id: string) {
    setOpeningId(id)
    try {
      const boardId = await onEditContent(id)
      router.push(`/boards/${boardId}`)
    } catch (err) {
      alert((err as Error).message)
      setOpeningId(null)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Mes templates
          {templates.length > 0 && <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">({templates.length})</span>}
        </h2>
        <button
          onClick={() => setShowNew(true)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau template
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">
          Aucun template. Créez-en un depuis un board existant pour le réutiliser plus tard.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                {tpl.coverImage ? (
                  <img src={tpl.coverImage} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{tpl.name}</h3>
                  {tpl.description && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{tpl.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(tpl.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditContent(tpl.id)}
                    disabled={openingId === tpl.id}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Modifier le contenu"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(tpl.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Modifier les infos"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    disabled={deletingId === tpl.id}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewTemplateModal
          onClose={() => setShowNew(false)}
          onCreate={onCreate}
          ownedBoards={ownedBoards}
        />
      )}

      {editingId && (
        <EditTemplateModal
          template={templates.find((t) => t.id === editingId)!}
          onClose={() => setEditingId(null)}
          onUpdate={onUpdate}
        />
      )}
    </section>
  )
}

function NewTemplateModal({
  onClose,
  onCreate,
  ownedBoards,
}: {
  onClose: () => void
  onCreate: (input: CreateTemplateInput) => Promise<BoardTemplate>
  ownedBoards: { id: string; name: string }[]
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fromBoardId, setFromBoardId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis'); return }
    setIsLoading(true)
    setError(null)
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
        fromBoardId: fromBoardId || undefined,
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Nouveau template</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Rétrospective sprint" />
          <Input label="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quelques mots…" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">À partir d'un board (optionnel)</label>
            <select
              value={fromBoardId}
              onChange={(e) => setFromBoardId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Template vierge</option>
              {ownedBoards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Si renseigné, les cartes, cadres et champs du board seront copiés dans le template.</p>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">Créer</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTemplateModal({
  template,
  onClose,
  onUpdate,
}: {
  template: BoardTemplate
  onClose: () => void
  onUpdate: (id: string, input: UpdateTemplateInput) => Promise<BoardTemplate>
}) {
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [coverImage, setCoverImage] = useState(template.coverImage ?? '')
  const [maxParticipants, setMaxParticipants] = useState(template.maxParticipants?.toString() ?? '')
  const [enabledActivities, setEnabledActivities] = useState<string[]>(
    template.enabledActivities ?? ACTIVITY_OPTIONS.map((a) => a.key)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleActivity(key: string) {
    setEnabledActivities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis'); return }
    setIsLoading(true)
    setError(null)
    try {
      const max = maxParticipants.trim()
      await onUpdate(template.id, {
        name: name.trim(),
        description: description.trim() || null,
        coverImage: coverImage.trim() || null,
        maxParticipants: max ? Number(max) : null,
        enabledActivities,
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Modifier le template</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quelques mots…" />
            <Input label="Image de couverture (URL)" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://…" />
            <Input
              label="Nombre max de participants"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="ex : 10"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activités disponibles</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((opt) => {
                  const active = enabledActivities.includes(opt.key)
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleActivity(opt.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        active
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40'
                          : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="ghost" type="button" onClick={onClose} className="flex-1">Annuler</Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">Enregistrer</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
