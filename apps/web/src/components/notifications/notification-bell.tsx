'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { connectSocket } from '@/lib/socket'
import {
  useNotificationsStore,
  type ActivityNotification,
  type NotificationType,
} from '@/store/notifications'

// Relative French time, coarse-grained — enough for a notifications feed.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const TYPE_ICON: Record<NotificationType, { color: string; path: string }> = {
  BOARD_SHARED: { color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950', path: 'M13 7l5 5m0 0l-5 5m5-5H6' },
  ROLE_CHANGED: { color: 'text-amber-500 bg-amber-50 dark:bg-amber-950', path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ACCESS_REVOKED: { color: 'text-rose-500 bg-rose-50 dark:bg-rose-950', path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  BOARD_DELETED: { color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
}

function ActivityRow({
  n,
  onActivate,
  onRemove,
}: {
  n: ActivityNotification
  onActivate: (n: ActivityNotification) => void
  onRemove: (id: string) => void
}) {
  const icon = TYPE_ICON[n.type] ?? TYPE_ICON.BOARD_SHARED
  return (
    <div
      onClick={() => onActivate(n)}
      className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
        n.readAt === null ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
      } hover:bg-gray-50 dark:hover:bg-gray-800/60`}
    >
      {n.readAt === null && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${icon.color}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">{n.title}</p>
        {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(n.id) }}
        title="Supprimer"
        className="shrink-0 self-start opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function NotificationBell() {
  const router = useRouter()
  const {
    activity, patchNotes, patchNotesSeenAt, hasUnreadPatchNotes, loaded,
    fetch, receive, markRead, markAllRead, remove, markPatchNotesSeen,
  } = useNotificationsStore()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'activity' | 'patch'>('activity')
  // Frozen "seen" timestamp so the "Nouveau" badges stay visible while the user reads,
  // even though opening the tab immediately persists the acknowledgement.
  const [patchSnapshot, setPatchSnapshot] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const unreadActivity = activity.filter((n) => n.readAt === null).length
  const showDot = unreadActivity > 0 || hasUnreadPatchNotes

  // Initial load + live socket updates.
  useEffect(() => {
    if (!loaded) void fetch()
    const socket = connectSocket()
    const onNew = (n: ActivityNotification) => receive(n)
    socket.on('notification:new', onNew)
    return () => { socket.off('notification:new', onNew) }
  }, [loaded, fetch, receive])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  function toggle() {
    setOpen((v) => {
      const next = !v
      if (next && !loaded) void fetch()
      return next
    })
  }

  function openPatchTab() {
    setTab('patch')
    setPatchSnapshot(patchNotesSeenAt)
    void markPatchNotesSeen()
  }

  function activate(n: ActivityNotification) {
    if (n.readAt === null) void markRead(n.id)
    if (n.link) { setOpen(false); router.push(n.link) }
  }

  function isPatchNew(date: string): boolean {
    return patchSnapshot === null || new Date(date) > new Date(patchSnapshot)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        title="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {showDot && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadActivity > 0 ? (unreadActivity > 9 ? '9+' : unreadActivity) : ''}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Tabs */}
          <div className="flex items-center border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setTab('activity')}
              className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'activity' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Activité
              {unreadActivity > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold align-middle">{unreadActivity}</span>}
              {tab === 'activity' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
            </button>
            <button
              onClick={openPatchTab}
              className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'patch' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Nouveautés
              {hasUnreadPatchNotes && tab !== 'patch' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-rose-500 align-middle" />}
              {tab === 'patch' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
            </button>
          </div>

          {/* Activity tab */}
          {tab === 'activity' && (
            <>
              {unreadActivity > 0 && (
                <div className="flex justify-end px-4 py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                  <button onClick={() => void markAllRead()} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    Tout marquer comme lu
                  </button>
                </div>
              )}
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50">
                {activity.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  activity.map((n) => (
                    <ActivityRow key={n.id} n={n} onActivate={activate} onRemove={(id) => void remove(id)} />
                  ))
                )}
              </div>
            </>
          )}

          {/* Patch notes tab */}
          {tab === 'patch' && (
            <div className="max-h-[60vh] overflow-y-auto px-4 py-3 space-y-4">
              {patchNotes.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Aucune note de version.</p>
              ) : (
                patchNotes.map((pn) => (
                  <div key={pn.version}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">v{pn.version}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{pn.title}</span>
                      {isPatchNew(pn.date) && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400 rounded px-1.5 py-0.5">Nouveau</span>
                      )}
                      <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                        {new Date(pn.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {pn.highlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
