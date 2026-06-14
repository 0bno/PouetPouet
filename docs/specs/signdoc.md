# Spec — SignDoc

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13

---

## 1. Vision

SignDoc est le module de **signature électronique de documents** de la suite Pivot. Il couvre le cycle complet : dépôt du document, définition des champs de signature, invitation des signataires, signature en ligne, certification et archivage.

**Objectif :** remplacer les flux "impression → signature → scan → email" par un workflow 100 % numérique, traçable et légalement opposable (niveau eIDAS simple à avancé selon la configuration).

**Cas d'usage cibles :**
- Signature de contrats, avenants, bons de commande
- Validation de PV (recette, pose, réunion)
- Signature de chartes internes (sécurité, RGPD, télétravail)
- Approbation de documents techniques (spécifications, plans)

---

## 2. Concepts clés

```
Document
 └── Champs de signature (zones positionnées sur les pages)
      └── Signataires (ordre et rôle)
           └── Session de signature (lien unique par signataire)
                └── Certificat / Audit trail
```

| Terme | Définition |
|---|---|
| **Document** | Fichier PDF source importé pour signature |
| **Champ de signature** | Zone positionnée sur une page du PDF (signature, initiales, date, case à cocher, texte libre) |
| **Signataire** | Personne invitée à signer, identifiée par email |
| **Ordre de signature** | Séquentiel (chaque signataire après le précédent) ou parallèle (tous simultanément) |
| **Session** | Lien sécurisé à usage unique envoyé à chaque signataire |
| **Audit trail** | Journal horodaté et signé de toutes les actions sur le document |
| **Document finalisé** | PDF aplati avec signatures incrustées + certificat numérique |

---

## 3. Fonctionnalités

### 3.1 Gestion des documents

- Upload PDF (drag & drop ou sélecteur de fichier)
- Import depuis **Mes PDF** (module intégré)
- Prévisualisation multi-pages dans le navigateur
- Statuts : `DRAFT` → `PENDING` → `COMPLETED` → `EXPIRED` → `CANCELLED`
- Date d'expiration configurable (défaut : 30 jours)
- Archivage automatique après signature ou expiration

### 3.2 Préparation du document

Interface d'édition visuelle (éditeur de champs drag & drop sur le PDF) :

| Type de champ | Description |
|---|---|
| Signature | Zone de signature manuscrite (dessin ou typographie) |
| Initiales | Zone d'initiales page par page |
| Date | Date de signature (auto-remplie ou manuelle) |
| Case à cocher | Validation d'un point (ex : "Lu et approuvé") |
| Texte libre | Saisie d'une valeur par le signataire (ex : poste, numéro) |

- Chaque champ est assigné à un signataire spécifique
- Champ obligatoire / optionnel
- Indication visuelle de quel signataire doit remplir quoi (code couleur)

### 3.3 Signataires

- Ajouter par email (interne Pivot ou externe)
- Importer depuis une liste de diffusion MeetOps
- Rôle par signataire : `SIGNER` (signe) / `APPROVER` (approuve sans signature visible) / `VIEWER` (reçoit la copie finale)
- Ordre de signature : séquentiel ou parallèle
- Message personnalisé joint à l'invitation
- Rappels automatiques (J-3, J-1 avant expiration, configurable)

### 3.4 Processus de signature

**Côté organisateur :**
1. Upload du PDF
2. Positionner les champs sur les pages
3. Assigner chaque champ à un signataire
4. Définir l'ordre et configurer les rappels
5. Envoyer → les invitations partent par email

**Côté signataire (sans compte Pivot requis) :**
1. Reçoit un email avec un lien unique sécurisé (token à usage unique)
2. Lit le document dans le navigateur (viewer intégré)
3. Remplit les champs assignés
4. Signe (dessin tactile/souris, ou typographie de nom)
5. Confirme son identité (OTP email ou SMS selon le niveau requis)
6. Soumission → passe au signataire suivant si séquentiel

**Finalisation :**
- Une fois tous les signataires terminés : génération du PDF final
- Certificat numérique embarqué dans le PDF (hash SHA-256 + horodatage)
- Notification à tous les participants avec la copie finale en PJ

### 3.5 Audit trail

Pour chaque document, journal non modifiable :

```
{
  at: datetime (ISO 8601 + timezone),
  action: "created" | "sent" | "viewed" | "signed" | "rejected" | "expired" | "completed",
  by: { email, ip, userAgent },
  field?: string,   // si action sur un champ spécifique
  hash?: string     // hash du document à cet instant
}
```

- Visible par l'organisateur en temps réel
- Exportable en PDF séparé (opposable juridiquement)
- Conservé 10 ans (rétention configurable)

### 3.6 Refus et litiges

- Un signataire peut **refuser** de signer avec motif obligatoire
- Le refus notifie immédiatement l'organisateur
- L'organisateur peut : annuler le document, corriger et renvoyer, ou archiver le refus
- Aucune signature partielle n'est intégrée au document final en cas de refus

---

## 4. Niveaux de signature (eIDAS)

| Niveau | Identification | Usage recommandé |
|---|---|---|
| **Simple (SES)** | Email uniquement | Chartes internes, validations informelles |
| **Avancé (AdES)** | Email + OTP SMS | Contrats, PV, documents à valeur probante |
| **Qualifié (QES)** | Certificat qualifié tiers (ex : DocuSign, Universign via API) | Actes légaux (hors scope v1) |

Le niveau est configurable par document au moment de l'envoi.

---

## 5. Intégrations

| Module / Système | Nature de l'intégration |
|---|---|
| **Mes PDF** | Sélectionner un document existant comme source ; stocker le signé |
| **MeetOps** | Joindre un document SignDoc à un CR de réunion |
| **PouetPouet** | Importer un board en PDF puis envoyer en signature |
| **Email SMTP** | Envoi des invitations et copies finales |
| **SMS (optionnel)** | OTP pour niveau avancé (Twilio ou OVH SMS) |

---

## 6. Droits

| Action | Organisateur | Signataire | Viewer |
|---|---|---|---|
| Créer / préparer un document | ✅ | ❌ | ❌ |
| Envoyer les invitations | ✅ | ❌ | ❌ |
| Signer | ✅ (si champ assigné) | ✅ | ❌ |
| Voir l'audit trail | ✅ | ❌ | ❌ |
| Recevoir la copie finale | ✅ | ✅ | ✅ |
| Annuler le document | ✅ | ❌ | ❌ |
| Télécharger le PDF final | ✅ | ✅ | ✅ |

---

## 7. Modèle de données (Prisma — ébauche)

```prisma
model SignDocument {
  id          String   @id @default(cuid())
  ownerId     String
  name        String
  fileKey     String   // clé de stockage (S3/GCS) du PDF source
  finalKey    String?  // clé du PDF finalisé
  status      SignStatus @default(DRAFT)
  level       SignLevel @default(SIMPLE)
  expiresAt   DateTime?
  signatories SignSignatory[]
  fields      SignField[]
  auditLog    SignAuditEntry[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SignSignatory {
  id         String   @id @default(cuid())
  documentId String
  document   SignDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  email      String
  name       String?
  role       SignRole @default(SIGNER)
  order      Int      @default(0)
  token      String   @unique @default(cuid())
  status     SignatoryStatus @default(PENDING)
  signedAt   DateTime?
  ip         String?
}

model SignField {
  id           String   @id @default(cuid())
  documentId   String
  signatoryId  String?
  type         SignFieldType
  page         Int
  x            Float    // % de la largeur de la page
  y            Float    // % de la hauteur de la page
  width        Float
  height       Float
  required     Boolean  @default(true)
  value        String?  // rempli après signature
}

model SignAuditEntry {
  id         String   @id @default(cuid())
  documentId String
  document   SignDocument @relation(fields: [documentId], references: [id])
  at         DateTime @default(now())
  action     String
  email      String?
  ip         String?
  userAgent  String?
  hash       String?
}

enum SignStatus       { DRAFT PENDING COMPLETED EXPIRED CANCELLED }
enum SignLevel        { SIMPLE ADVANCED }
enum SignRole         { SIGNER APPROVER VIEWER }
enum SignatoryStatus  { PENDING VIEWED SIGNED REJECTED }
enum SignFieldType    { SIGNATURE INITIALS DATE CHECKBOX TEXT }
```

---

## 8. Bus d'événements Pivot

| Événement | Déclencheur |
|---|---|
| `signdoc.document.sent` | Invitations envoyées |
| `signdoc.document.signed` | Tous les signataires ont signé |
| `signdoc.document.rejected` | Un signataire a refusé |
| `signdoc.document.expired` | Délai expiré sans signature complète |

---

## 9. Questions ouvertes

- [ ] **Stockage des PDFs** : GCP Cloud Storage (bucket dédié avec CMEK) ou filesystem ? — impact sécurité et coût
- [ ] **Niveau avancé (OTP SMS)** : Twilio ou OVH SMS ? Budget par envoi ?
- [ ] **Rétention** : 10 ans par défaut ou configurable par organisation ?
- [ ] **Signature dessinée vs typographiée** : les deux dès la v1 ou seulement typographie ?
- [ ] **Signature qualifiée** : partenariat Universign / YouSign prévu ou hors scope ?
- [ ] **Gabarits de document** : templates de PDF avec champs pré-positionnés (ex : bon de commande standard) ?

---

## 10. Périmètre v1

**Dans le scope v1 :**
- Upload PDF + positionnement de champs
- Signataires multiples (séquentiel + parallèle)
- Niveau simple (OTP email)
- Audit trail exportable
- Notifications email
- Intégration Mes PDF

**Reporté v2 :**
- OTP SMS (niveau avancé)
- Templates de documents
- Signature qualifiée via tiers
- Intégration MeetOps
