// Feature flags — catalogue typé partagé API/web + types d'évaluation.
//
// Le CODE définit quels flags existent et leur défaut (FLAG_DEFINITIONS) ;
// la BASE ne stocke que les surcharges runtime (enabled / rolloutPercent / whitelist),
// par environnement. Un flag sans ligne en base ⇒ enabled = defaultEnabled, rollout = 100.

export interface FlagDefinition {
  key: string
  label: string
  description: string
  defaultEnabled: boolean
}

export const FLAG_DEFINITIONS: FlagDefinition[] = [
  // Gating des modules du Hub — clé = `module.<id>` (cf. PIVOT_MODULES).
  { key: 'module.daily', label: 'Module Daily', description: 'Affiche le module Daily dans le Hub.', defaultEnabled: true },
  { key: 'module.scrum', label: 'Module Scrum Poker', description: 'Affiche le module Scrum Poker dans le Hub.', defaultEnabled: true },
  { key: 'module.wheel', label: 'Module La Roue', description: 'Affiche le module La Roue dans le Hub.', defaultEnabled: true },
  { key: 'module.capacity', label: 'Module Capacité', description: 'Affiche le module Capacité dans le Hub.', defaultEnabled: true },
  { key: 'module.meetops', label: 'Module MeetOps', description: 'Affiche le module MeetOps dans le Hub.', defaultEnabled: true },
  // Fonctionnalités board — gating in-code via useFlag().
  { key: 'board.tables', label: 'Tableaux sur les boards', description: "Active l'outil Tableau dans l'éditeur de board.", defaultEnabled: true },
  { key: 'board.align-guides', label: "Guides d'alignement", description: "Active les guides d'alignement intelligents sur les boards.", defaultEnabled: true },
]

export const FLAG_KEYS: string[] = FLAG_DEFINITIONS.map((f) => f.key)

// Résultat d'évaluation envoyé au client : clé → actif pour cet utilisateur.
export type EvaluatedFlags = Record<string, boolean>

// Objet complet pour l'admin : catalogue fusionné avec l'état runtime de l'environnement courant.
export interface AdminFlag {
  key: string
  label: string
  description: string
  defaultEnabled: boolean
  environment: string
  enabled: boolean
  rolloutPercent: number
  whitelist: string[]
}
