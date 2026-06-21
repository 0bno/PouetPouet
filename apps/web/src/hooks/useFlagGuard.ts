'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlagsStore } from '@/store/flags'

export function useFlagGuard(key: string) {
  const router = useRouter()
  const { flags, loaded } = useFlagsStore()

  useEffect(() => {
    if (!loaded) return
    if (flags[key] === false) {
      router.replace('/hub')
    }
  }, [loaded, flags, key, router])
}
