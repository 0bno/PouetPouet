'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FORGE_MODULES } from '@pouetpouet/shared'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

interface HubStats {
  boards: number
  teams: number
  scrumRooms: number
  dailySessions: number
  capacityEvents: number
  wheelEvents: number
}

// FORGE F3.2 — compteurs cross-modules : chaque stat est possédée par un module
// différent, mais le hub les agrège en une vue unifiée (démonstration du graphe).
const STAT_CONFIG: { key: keyof HubStats; label: string; icon: string }[] = [
  { key: 'boards', label: 'Boards', icon: '🧀' },
  { key: 'teams', label: 'Équipes', icon: '👥' },
  { key: 'scrumRooms', label: 'Salles Scrum', icon: '🃏' },
  { key: 'dailySessions', label: 'Dailys', icon: '☀️' },
  { key: 'capacityEvents', label: 'Sprints', icon: '📊' },
  { key: 'wheelEvents', label: 'Tirages', icon: '🎡' },
]

export default function HubPage() {
  const { user, toggleModuleFavorite } = useAuthStore()
  const [stats, setStats] = useState<HubStats | null>(null)

  useEffect(() => {
    api.get<HubStats>('/api/hub/stats').then(setStats).catch(() => {})
  }, [])

  const favorites = new Set(user?.favoriteModules ?? [])

  // Favorites appear first, then rest in manifest order
  const sortedModules = [...FORGE_MODULES].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 0 : 1
    const bFav = favorites.has(b.id) ? 0 : 1
    return aFav - bFav
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bonjour{user ? ` ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vos outils collaboratifs, au même endroit.
        </p>
      </div>

      {/* Cross-module stats */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {STAT_CONFIG.map(({ key, label, icon }) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center"
            >
              <div className="text-xl">{icon}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {stats[key]}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedModules.map((mod) => {
          const isFav = favorites.has(mod.id)
          return (
            <div
              key={mod.id}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-start gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {/* Lien principal étiré sur toute la tuile (pas de <a> imbriqués) */}
              <Link href={mod.nav[0].href} className="absolute inset-0 rounded-2xl" aria-label={mod.name} />
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${mod.color}1a` }}
              >
                {mod.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {mod.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{mod.description}</p>
                {mod.nav.length > 1 && (
                  <div className="relative flex flex-wrap gap-2 mt-2.5">
                    {mod.nav.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {/* Favorite star — relative positioning keeps it inside the card but above the Link overlay */}
              {user && (
                <button
                  className={`relative z-10 shrink-0 p-1 rounded-lg transition-colors ${
                    isFav
                      ? 'text-amber-400 hover:text-amber-500'
                      : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 dark:hover:text-amber-400'
                  }`}
                  onClick={(e) => { e.preventDefault(); toggleModuleFavorite(mod.id) }}
                  aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
