'use client'

import type { Activity } from '@/hooks/useSession'

interface Props {
  activity: Activity
  responses: unknown[]
  participantCount: number
  // Absent (vue participant) : pas de bouton de fermeture
  onClose?: () => void
  // Rapport d'une activité clôturée : libellés adaptés, bouton "Fermer le rapport"
  reportMode?: boolean
  // Libellé personnalisé pour le bouton de fermeture
  closeLabel?: string
}

export function ActivityResults({ activity, responses, participantCount, onClose, reportMode, closeLabel }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{reportMode ? 'Résultats' : 'Activité en cours'}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{activity.title}</p>
        </div>
        <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 font-medium">
          {reportMode ? `${responses.length} réponse${responses.length !== 1 ? 's' : ''}` : `${responses.length}/${participantCount}`}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {activity.type === 'POLL' && <PollResults activity={activity} responses={responses} />}
        {activity.type === 'QUIZ' && <PollResults activity={activity} responses={responses} showCorrect />}
        {activity.type === 'WORDCLOUD' && <WordcloudResults responses={responses} />}
        {activity.type === 'BRAINSTORM' && <BrainstormResults responses={responses} />}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {closeLabel ?? (reportMode ? 'Fermer le rapport' : 'Terminer l\'activité')}
        </button>
      )}
    </div>
  )
}

function PollResults({ activity, responses, showCorrect = false }: { activity: Activity; responses: unknown[]; showCorrect?: boolean }) {
  const options = activity.config.options as string[]
  const correctAnswer = activity.config.correctAnswer as number | undefined
  const total = responses.length

  if (total === 0) {
    return <p className="text-xs text-gray-400 text-center py-3">En attente de réponses…</p>
  }

  const counts = options.map((_, i) =>
    responses.filter((r) => (r as { value: number }).value === i).length
  )

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt, i) => {
        const count = counts[i]
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const isCorrect = showCorrect && correctAnswer === i

        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-gray-700'}`}>
                {isCorrect && '✅ '}{opt}
              </span>
              <span className="text-gray-400">{count} ({pct}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-green-500' : 'bg-primary-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// #113 — clé de regroupement des mots « proches » : insensible à la casse, aux accents
// et à la ponctuation. Sert uniquement à fusionner ; l'affichage garde la forme saisie.
function wordKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '') // retire les accents (café → cafe)
    .replace(/[^\p{L}\p{N}]+/gu, '')                   // ne garde que lettres/chiffres
}

function WordcloudResults({ responses }: { responses: unknown[] }) {
  // Regroupe par clé normalisée ; mémorise les formes saisies pour afficher la plus fréquente.
  const groups = new Map<string, { count: number; forms: Map<string, number> }>()
  responses.forEach((r) => {
    const raw = ((r as { value: string }).value ?? '').trim()
    const key = wordKey(raw)
    if (!key) return
    const g = groups.get(key) ?? { count: 0, forms: new Map<string, number>() }
    g.count += 1
    g.forms.set(raw, (g.forms.get(raw) ?? 0) + 1)
    groups.set(key, g)
  })

  // Fusionne les pluriels simples : « idées » → « idée » quand la forme singulière existe.
  for (const key of [...groups.keys()]) {
    const singular = key.length > 3 && /s$/.test(key) ? key.slice(0, -1) : null
    if (singular && groups.has(singular)) {
      const plural = groups.get(key)!
      const base = groups.get(singular)!
      base.count += plural.count
      for (const [form, n] of plural.forms) base.forms.set(form, (base.forms.get(form) ?? 0) + n)
      groups.delete(key)
    }
  }

  const items = [...groups.values()]
    .map((g) => ({
      // Forme affichée : la plus saisie (à égalité, la première rencontrée).
      label: [...g.forms.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: g.count,
    }))
    .sort((a, b) => b.count - a.count)

  const max = Math.max(...items.map((i) => i.count), 1)

  if (items.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">En attente de contributions…</p>
  }

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {items.map(({ label, count }) => {
        const size = Math.round(12 + (count / max) * 20)
        const opacity = 0.5 + (count / max) * 0.5
        return (
          <span
            key={label}
            className="font-semibold text-primary-600 transition-all"
            style={{ fontSize: size, opacity }}
            title={count > 1 ? `${count} contributions` : '1 contribution'}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}

function BrainstormResults({ responses }: { responses: unknown[] }) {
  if (responses.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">En attente d'idées…</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {responses.map((r, i) => (
        <div key={i} className="rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2 text-sm text-gray-700">
          💡 {(r as { value: string }).value}
        </div>
      ))}
    </div>
  )
}
