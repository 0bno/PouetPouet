// Source of truth for the in-app release notes shown in the notifications panel.
// Add a new entry at the TOP for each release; `date` (ISO) drives the "new" indicator,
// which compares the latest entry's date against the user's `patchNotesSeenAt`.

export interface PatchNote {
  version: string
  date: string // ISO date (YYYY-MM-DD)
  title: string
  highlights: string[]
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '1.4.0',
    date: '2026-05-31',
    title: 'Centre de notifications',
    highlights: [
      'Nouvelle cloche de notifications dans la barre de navigation',
      "Suivi de l'activité de votre compte : boards partagés, changements de rôle, accès retiré",
      'Notes de version consultables à tout moment',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-30',
    title: 'Liaisons enrichies',
    highlights: [
      'Tracé au choix par liaison : droit, courbe ou orthogonal',
      'Flèches dans les deux sens, couleur, épaisseur, pointillés et libellé',
      "4 points d'ancrage fixes (nord/sud/est/ouest) et mini-barre contextuelle",
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-29',
    title: 'Édition des objets',
    highlights: [
      'Redimensionnement par poignées sur les 8 directions',
      'Système de couleurs unifié : palette pastel + sélecteur personnalisé',
      'Nouvelles formes hexagone et étoile, verrouillage des objets',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-28',
    title: 'Navigation du board',
    highlights: [
      'Zoom amélioré, pincement trackpad et zoom sur la sélection',
      "Outil main, déplacement avec la barre d'espace et centrage automatique",
      'Export PDF du board depuis la fenêtre de partage',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-27',
    title: 'Comptes & sécurité',
    highlights: [
      "Vérification de l'adresse email à l'inscription",
      'Suppression de compte depuis le profil',
      'Pages légales : mentions légales, confidentialité, CGU',
    ],
  },
]

// Most recent release date — used server-side to decide whether a user has unseen notes.
export const LATEST_PATCH_DATE = PATCH_NOTES[0]?.date ?? null
