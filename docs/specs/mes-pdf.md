# Spec — Mes PDF

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13

---

## 1. Vision

**Mes PDF** est le module de gestion documentaire de la suite Pivot, centré sur les fichiers PDF. Il sert de **bibliothèque partagée** pour stocker, organiser, annoter et partager des documents, et agit comme **hub de stockage** pour les autres modules (SignDoc, MeetOps, Mes poses, Cahiers de tests).

**Cas d'usage cibles :**
- Centraliser les documents de référence d'un projet (spécifications, plans, contrats)
- Partager des rapports entre équipes
- Préparer des documents à envoyer en signature (SignDoc)
- Joindre des PV à des réunions (MeetOps)

---

## 2. Concepts clés

```
Collection (dossier logique)
 └── Document PDF
      ├── Métadonnées (tags, description, version)
      ├── Annotations (commentaires positionnés sur les pages)
      ├── Versions (historique des révisions)
      └── Partages (accès en lecture ou écriture)
```

---

## 3. Fonctionnalités

### 3.1 Bibliothèque

- Upload PDF (drag & drop, multi-fichiers)
- Collections (dossiers) : créer, renommer, déplacer, supprimer
- Collections imbriquées (arborescence 3 niveaux max)
- Trier par : date d'ajout, nom, taille, dernière modification
- Filtrer par : tags, auteur, collection, plage de dates
- Vue liste ou grille (miniature de la première page)
- Recherche full-text dans les noms et descriptions (full-text dans le contenu PDF via OCR en v2)
- Quota de stockage par utilisateur (configurable par l'administrateur)

### 3.2 Visualiseur PDF

- Rendu in-browser (pas de plugin requis)
- Navigation par pages, miniatures latérales
- Zoom (molette, pinch sur mobile)
- Mode plein écran
- Recherche dans le texte du PDF (si le PDF est sélectionnable)
- Téléchargement

### 3.3 Annotations

- Surlignage de texte avec couleur au choix
- Commentaire positionné (bulle cliquable sur la page)
- Dessin libre (stylo)
- Tampon (APPROUVÉ / À RÉVISER / BROUILLON)
- Les annotations sont stockées séparément du PDF source (non destructif)
- Export PDF avec annotations aplaties

### 3.4 Versioning

- Chaque upload d'un nouveau fichier sur un document existant crée une version
- Historique des versions avec auteur, date, taille
- Comparer deux versions (liste des métadonnées modifiées, diff visuel non-inclus en v1)
- Restaurer une version antérieure
- Télécharger une version spécifique
- Version courante toujours mise en avant

### 3.5 Partage

- **Partage interne** : inviter des membres Pivot (lecture ou lecture+annotation)
- **Partage par lien** : lien public (lecture seule, expirable, optionnellement protégé par mot de passe)
- **Partage vers un module** : attacher le document à une réunion MeetOps, à un cahier de tests, à une fiche de pose
- Révoquer un partage à tout moment

### 3.6 Tags et métadonnées

- Tags libres (multi-valeurs)
- Description longue (markdown)
- Champs personnalisés par collection (ex : "Numéro de contrat", "Référence client") — définis par l'administrateur de l'espace
- Extraction automatique des métadonnées PDF (auteur, date de création, nombre de pages)

---

## 4. Intégrations

| Module | Intégration |
|---|---|
| **SignDoc** | Sélectionner un PDF depuis Mes PDF comme document à signer ; stocker le document signé dans Mes PDF |
| **MeetOps** | Joindre un PDF à l'ordre du jour ou au CR d'une réunion |
| **Mes poses** | Attacher les plans de pose ou photos en PDF |
| **Cahiers de tests** | Joindre les spécifications à un plan de test |
| **PouetPouet** | Exporter un board en PDF vers Mes PDF |

---

## 5. Droits

| Action | Propriétaire | Éditeur | Lecteur |
|---|---|---|---|
| Upload de documents | ✅ | ✅ | ❌ |
| Créer des collections | ✅ | ✅ | ❌ |
| Annoter | ✅ | ✅ | ❌ |
| Voir les documents | ✅ | ✅ | ✅ |
| Télécharger | ✅ | ✅ | ✅ |
| Gérer les partages | ✅ | ❌ | ❌ |
| Supprimer des documents | ✅ | ❌ (le leur seulement) | ❌ |
| Gérer les champs personnalisés | ✅ | ❌ | ❌ |

---

## 6. Modèle de données (Prisma — ébauche)

```prisma
model PdfCollection {
  id          String   @id @default(cuid())
  ownerId     String
  parentId    String?
  parent      PdfCollection? @relation("CollectionTree", fields: [parentId], references: [id])
  children    PdfCollection[] @relation("CollectionTree")
  name        String
  documents   PdfDocument[]
  shares      PdfShare[]
  createdAt   DateTime @default(now())
}

model PdfDocument {
  id           String   @id @default(cuid())
  ownerId      String
  collectionId String?
  collection   PdfCollection? @relation(fields: [collectionId], references: [id])
  name         String
  description  String?
  tags         String[]
  pageCount    Int?
  currentVersionId String?
  versions     PdfVersion[]
  annotations  PdfAnnotation[]
  shares       PdfShare[]
  customFields Json     @default("{}")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model PdfVersion {
  id         String   @id @default(cuid())
  documentId String
  document   PdfDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  fileKey    String   // clé de stockage GCS/S3
  sizeBytes  Int
  uploadedBy String
  createdAt  DateTime @default(now())
}

model PdfAnnotation {
  id         String   @id @default(cuid())
  documentId String
  document   PdfDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  authorId   String
  type       PdfAnnotationType
  page       Int
  x          Float?
  y          Float?
  width      Float?
  height     Float?
  color      String?
  content    String?  // texte du commentaire ou data dessin
  createdAt  DateTime @default(now())
}

model PdfShare {
  id           String   @id @default(cuid())
  documentId   String?
  collectionId String?
  userId       String?  // null = lien public
  token        String?  @unique
  role         PdfShareRole @default(VIEWER)
  expiresAt    DateTime?
  password     String?  // hash bcrypt si protégé
  createdAt    DateTime @default(now())
}

enum PdfAnnotationType { HIGHLIGHT COMMENT DRAWING STAMP }
enum PdfShareRole      { VIEWER ANNOTATOR }
```

---

## 7. Questions ouvertes

- [ ] **Stockage** : GCP Cloud Storage avec bucket dédié ? Quota initial par utilisateur (ex : 5 Go) ?
- [ ] **OCR** : recherche full-text dans le contenu PDF (Google Cloud Vision / Tesseract) — v1 ou v2 ?
- [ ] **Taille max d'un fichier** : 50 Mo ? 200 Mo ? (impact Cloud Run memory)
- [ ] **Formats acceptés** : PDF uniquement ou aussi DOCX/XLSX (convertis en PDF à l'upload) ?
- [ ] **Corbeille** : suppression soft avec rétention 30 jours ?

---

## 8. Périmètre v1

**Dans le scope v1 :**
- Upload, collections, tags, recherche par nom/description
- Visualiseur PDF in-browser
- Annotations (commentaires + surlignage)
- Versioning
- Partage interne + lien public
- Intégration SignDoc

**Reporté v2 :**
- OCR / recherche dans le contenu
- Champs personnalisés par collection
- Comparaison visuelle de versions
- Formats DOCX/XLSX
