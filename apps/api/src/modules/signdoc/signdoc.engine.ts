// Abstraction du moteur de signature — point d'extension pour brancher un
// prestataire qualifié (QTSP → QES eIDAS) plus tard sans refondre le module.
// PR1 ne pose que l'interface ; l'implémentation auto-hébergée (sceau serveur
// PAdES + horodatage RFC 3161) sera remplie en PR3.

export interface SealResult {
  sealedBytes: Buffer
  /** Niveau PAdES atteint : 'T' = horodatage TSA externe, 'B' = horloge serveur seule. */
  sealLevel: 'B' | 'T'
}

export interface SignatureEngine {
  /** Scelle le PDF final (signatures visuelles déjà apposées). Implémenté en PR3. */
  seal(pdfBytes: Buffer): Promise<SealResult>
}

// Implémentation auto-hébergée (le corps du sceau arrive en PR3).
export const selfHostedEngine: SignatureEngine = {
  async seal() {
    throw new Error('SelfHostedEngine.seal() sera implémenté en PR3 (sceau PAdES + RFC 3161)')
  },
}
