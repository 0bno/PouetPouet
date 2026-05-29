'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

// True once the persisted auth store has finished rehydrating from localStorage.
// Gates the auth guards so they don't redirect on the brief window where the
// token isn't yet restored (the cause of being bounced to /login on F5).
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])
  return hydrated
}
