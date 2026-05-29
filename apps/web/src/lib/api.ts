const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// Carries the HTTP status and the server's business `code` (e.g. EMAIL_NOT_VERIFIED)
// so callers can branch on the exact failure instead of only the message.
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

// Fired when the server rejects the JWT (expired/invalid) — distinct from business 401s.
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const hasBody = options?.body != null
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }))
    if (res.status === 401 && typeof err.code === 'string' && err.code.startsWith('FST_JWT')) {
      onUnauthorized?.()
    }
    throw new ApiError(err.error ?? 'Erreur inconnue', res.status, typeof err.code === 'string' ? err.code : undefined)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
