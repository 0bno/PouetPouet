'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface ShareUser {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface ShareEntry {
  id: string
  role: 'VIEWER' | 'EDITOR'
  user: ShareUser
}

interface ShareInfo {
  shares: ShareEntry[]
  shareToken: string | null
  shareLinkRole: 'VIEWER' | 'EDITOR'
}

interface Props {
  boardId: string
  onClose: () => void
  onExportPdf: () => void
  exporting: boolean
}

export function ShareModal({ boardId, onClose, onExportPdf, exporting }: Props) {
  const [info, setInfo] = useState<ShareInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const shareUrl = info?.shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/boards/join/${info.shareToken}`
    : null

  useEffect(() => {
    api.get<ShareInfo>(`/api/boards/${boardId}/shares`)
      .then(setInfo)
      .finally(() => setIsLoading(false))
  }, [boardId])

  async function handleGenerateLink() {
    setLinkLoading(true)
    try {
      const res = await api.post<{ shareToken: string; shareLinkRole: 'VIEWER' | 'EDITOR' }>(
        `/api/boards/${boardId}/shares/link`,
        { role: info?.shareLinkRole ?? 'VIEWER' }
      )
      setInfo((prev) => prev ? { ...prev, shareToken: res.shareToken, shareLinkRole: res.shareLinkRole } : prev)
    } finally {
      setLinkLoading(false)
    }
  }

  async function handleDisableLink() {
    setLinkLoading(true)
    try {
      await api.delete(`/api/boards/${boardId}/shares/link`)
      setInfo((prev) => prev ? { ...prev, shareToken: null } : prev)
    } finally {
      setLinkLoading(false)
    }
  }

  async function handleLinkRoleChange(role: 'VIEWER' | 'EDITOR') {
    setInfo((prev) => prev ? { ...prev, shareLinkRole: role } : prev)
    if (info?.shareToken) {
      await api.patch(`/api/boards/${boardId}/shares/link`, { role })
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviting(true)
    try {
      const share = await api.post<ShareEntry>(`/api/boards/${boardId}/shares/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      setInfo((prev) => prev ? { ...prev, shares: [...prev.shares, share] } : prev)
      setInviteEmail('')
    } catch (err) {
      setInviteError((err as Error).message)
    } finally {
      setInviting(false)
    }
  }

  async function handleChangeRole(shareId: string, role: 'VIEWER' | 'EDITOR') {
    const share = await api.patch<ShareEntry>(`/api/boards/${boardId}/shares/${shareId}`, { role })
    setInfo((prev) => prev ? { ...prev, shares: prev.shares.map((s) => s.id === shareId ? share : s) } : prev)
  }

  async function handleRevoke(shareId: string) {
    await api.delete(`/api/boards/${boardId}/shares/${shareId}`)
    setInfo((prev) => prev ? { ...prev, shares: prev.shares.filter((s) => s.id !== shareId) } : prev)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Partager le board</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Export PDF */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Exporter en PDF</span>
            <p className="text-xs text-gray-400 mt-0.5">Tout le board ajusté sur une page</p>
          </div>
          <button
            onClick={onExportPdf}
            disabled={exporting}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {exporting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 7H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {exporting ? 'Export…' : 'PDF'}
          </button>
        </div>

        <hr className="border-gray-100" />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Share link */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Lien de partage</span>
                <div className="flex items-center gap-2">
                  <select
                    value={info?.shareLinkRole ?? 'VIEWER'}
                    onChange={(e) => handleLinkRoleChange(e.target.value as 'VIEWER' | 'EDITOR')}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="VIEWER">Lecture</option>
                    <option value="EDITOR">Édition</option>
                  </select>
                  {info?.shareToken ? (
                    <button
                      onClick={handleDisableLink}
                      disabled={linkLoading}
                      className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                    >
                      Désactiver
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateLink}
                      disabled={linkLoading}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                    >
                      Activer
                    </button>
                  )}
                </div>
              </div>

              {shareUrl ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="flex-1 text-xs text-gray-500 truncate font-mono">{shareUrl}</span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Le lien est désactivé. Activez-le pour permettre à n'importe qui de rejoindre.</p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Invite by email */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Inviter par email</span>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null) }}
                  placeholder="email@exemple.com"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'VIEWER' | 'EDITOR')}
                  className="text-sm border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="VIEWER">Lecture</option>
                  <option value="EDITOR">Édition</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {inviting ? '…' : 'Inviter'}
                </button>
              </form>
              {inviteError && (
                <p className="text-xs text-red-500">{inviteError}</p>
              )}
            </div>

            {/* Current shares */}
            {info && info.shares.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 mb-1">Accès partagés</span>
                  {info.shares.map((share) => (
                    <div key={share.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        {share.user.avatar ? (
                          <img src={share.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-indigo-600">
                            {share.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{share.user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{share.user.email}</p>
                      </div>
                      <select
                        value={share.role}
                        onChange={(e) => handleChangeRole(share.id, e.target.value as 'VIEWER' | 'EDITOR')}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="VIEWER">Lecture</option>
                        <option value="EDITOR">Édition</option>
                      </select>
                      <button
                        onClick={() => handleRevoke(share.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
