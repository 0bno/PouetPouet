'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'
import type { EvaluatedFlags } from '@pouetpouet/shared'

interface FlagsState {
  flags: EvaluatedFlags
  loaded: boolean
  loadFlags: () => Promise<void>
}

export const useFlagsStore = create<FlagsState>((set) => ({
  flags: {},
  loaded: false,
  loadFlags: async () => {
    try {
      const flags = await api.get<EvaluatedFlags>('/api/flags')
      set({ flags, loaded: true })
    } catch {
      // Fail-open : on garde {} ⇒ useFlag renvoie true par défaut (ne jamais masquer
      // une fonctionnalité à cause d'une erreur réseau).
      set({ loaded: true })
    }
  },
}))

// Gating. Défaut `true` (fail-open) tant que les flags ne sont pas chargés ou si la
// clé est absente du catalogue — un flag désactivé côté serveur renvoie bien `false`.
export function useFlag(key: string): boolean {
  return useFlagsStore((s) => s.flags[key] ?? true)
}

export function useFlags(): EvaluatedFlags {
  return useFlagsStore((s) => s.flags)
}
