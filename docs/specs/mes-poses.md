# Spec — Mes poses

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13
> ⚠️ Spec rédigée avec des hypothèses sur le métier (pose IT/télécom). À valider et affiner.

---

## 1. Vision

**Mes poses** est le module de gestion des **interventions terrain** de la suite Pivot. Il couvre la création des ordres de pose, leur suivi, la génération des **Procès-Verbaux de pose (PV)** et l'attribution de **labels** (certifications, validations) aux installations réalisées.

**Cas d'usage cibles :**
- Technicien terrain réalisant une installation réseau / serveur / équipement
- Chef de projet suivant un déploiement multi-sites
- Responsable qualité validant et labellisant les poses
- Client recevant le PV signé de son installation

---

## 2. Concepts clés

```
Projet de pose (batch)
 └── Fiche de pose (ordre d'intervention)
      ├── Informations du site
      ├── Équipements installés
      ├── Photos / documents
      ├── PV de pose (rapport finalisé)
      └── Labels attribués
```

| Terme | Définition |
|---|---|
| **Projet de pose** | Regroupement de fiches liées à un même chantier ou client |
| **Fiche de pose** | Ordre d'intervention : site, équipement, technicien, planning |
| **PV de pose** | Procès-Verbal généré après intervention : compte rendu officiel signable |
| **Label** | Certification ou validation apposée sur une pose (ex : "Conforme", "ISO-XXXX", "Homologué") |
| **Intervention** | Séance de travail terrain liée à une fiche |

---

## 3. Fonctionnalités

### 3.1 Projets de pose

- Créer / archiver un projet : titre, client, description, date début/fin, responsable
- Statut : `DRAFT` → `IN_PROGRESS` → `COMPLETED` → `ARCHIVED`
- Regrouper les fiches par site ou par lot
- Tableau de bord : avancement des fiches, taux de PV signés, labels attribués

### 3.2 Fiches de pose

Chaque fiche couvre une intervention sur un site :

| Champ | Type | Notes |
|---|---|---|
| Référence | string | Auto-générée ou manuelle (ex : POSE-2026-0042) |
| Site | string | Adresse physique + coordonnées GPS optionnelles |
| Client | string | Nom / référence client |
| Type d'intervention | enum | INSTALLATION / MAINTENANCE / REMPLACEMENT / AUDIT |
| Équipements | liste | Référence, désignation, N° de série |
| Technicien assigné | User Pivot | |
| Date planifiée | datetime | |
| Priorité | enum | LOW / MEDIUM / HIGH / URGENT |
| Statut | enum | PLANNED / IN_PROGRESS / DONE / CANCELLED |
| Notes pre-intervention | markdown | Contexte, contraintes, accès |

### 3.3 Déroulement d'une intervention

Le technicien, sur le terrain (mobile) :
1. Ouvre la fiche (mode offline supporté)
2. Démarre l'intervention (horodatage automatique)
3. Remplit les champs : actions réalisées, équipements posés/retirés, anomalies
4. Prend des photos (galerie ou caméra directe)
5. Saisit les mesures ou tests effectués (champs configurables par type d'intervention)
6. Termine l'intervention → génère le brouillon du PV

### 3.4 PV de pose

Le PV est un document officiel généré depuis la fiche après intervention :

**Contenu automatique :**
- En-tête : projet, client, site, technicien, date/heure d'intervention
- Liste des équipements posés (ref, N° série, emplacement)
- Actions réalisées (depuis la saisie terrain)
- Photos (intégrées dans le document)
- Résultats des tests / mesures
- Anomalies constatées et actions correctives

**Workflow de validation :**
1. Technicien génère le brouillon
2. Responsable de projet valide (ou renvoie en correction)
3. PV finalisé → envoyé en signature via **SignDoc** (technicien + client)
4. PV signé archivé dans **Mes PDF**

**Format :** PDF généré côté serveur (template configurable par type d'intervention)

### 3.5 Labels

Un label est une certification ou validation apposée sur une fiche de pose :

| Champ | Type |
|---|---|
| Nom | string (ex : "Conforme GTIE", "Homologué DSI", "ISO 9001") |
| Catégorie | string (ex : "Sécurité", "Qualité", "Technique") |
| Attribué par | User Pivot |
| Date d'attribution | datetime |
| Date d'expiration | datetime (optionnel) |
| Commentaire | string |
| Badge visuel | couleur + icône |

- Bibliothèque de labels prédéfinis par l'organisation (admin)
- Historique des labels par fiche
- Alertes si un label arrive à expiration
- Filtrer les fiches par label

### 3.6 Mode terrain (mobile)

- Interface responsive optimisée téléphone/tablette
- Fonctionnement **offline** : les données sont synchronisées quand la connexion revient
- Capture photo directe depuis la caméra
- Signature client sur écran tactile (intégrée dans le PV)
- Géolocalisation automatique du site à l'arrivée

---

## 4. Reporting

| Rapport | Description |
|---|---|
| Avancement projet | Fiches par statut, % terminées, retards |
| Performance technicien | Nombre de poses, délai moyen, taux PV signés |
| Labels actifs / expirés | Par site, par équipement, par catégorie |
| Anomalies récurrentes | Agrégat des anomalies constatées |
| Tableau de bord client | Vue partageable de l'avancement d'un projet (lecture seule) |

---

## 5. Intégrations

| Module | Intégration |
|---|---|
| **SignDoc** | Signature du PV par le technicien et le client |
| **Mes PDF** | Archivage des PV signés, plans de pose |
| **MeetOps** | Réunion de lancement ou de bilan de chantier |
| **Notifications Pivot** | Alertes affectation, PV à valider, label expirant |

---

## 6. Droits

| Action | Admin projet | Technicien | Validateur | Client (externe) |
|---|---|---|---|---|
| Créer / modifier des fiches | ✅ | ❌ | ❌ | ❌ |
| Voir ses fiches assignées | ✅ | ✅ | ✅ | ❌ |
| Réaliser l'intervention | ✅ | ✅ | ❌ | ❌ |
| Générer le PV | ✅ | ✅ | ❌ | ❌ |
| Valider le PV | ✅ | ❌ | ✅ | ❌ |
| Signer le PV (SignDoc) | ✅ | ✅ | ❌ | ✅ |
| Attribuer des labels | ✅ | ❌ | ✅ | ❌ |
| Voir le tableau client | ✅ | ❌ | ✅ | ✅ (lecture) |

---

## 7. Modèle de données (Prisma — ébauche)

```prisma
model PoseProject {
  id          String   @id @default(cuid())
  ownerId     String
  title       String
  client      String?
  description String?
  startDate   DateTime?
  endDate     DateTime?
  status      PoseProjectStatus @default(DRAFT)
  fiches      PoseFiche[]
  labels      PoseLabel[]       // labels disponibles dans ce projet
  shares      PoseShare[]
  createdAt   DateTime @default(now())
}

model PoseFiche {
  id              String   @id @default(cuid())
  projectId       String
  project         PoseProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  ref             String
  site            String
  client          String?
  gpsLat          Float?
  gpsLng          Float?
  type            PoseType @default(INSTALLATION)
  technicianId    String?
  plannedAt       DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  status          PoseFicheStatus @default(PLANNED)
  priority        PosePriority @default(MEDIUM)
  notes           String?
  equipments      PoseEquipment[]
  interventions   PoseIntervention[]
  pvId            String?
  pv              PosePV?
  appliedLabels   PoseAppliedLabel[]
  createdAt       DateTime @default(now())
}

model PoseEquipment {
  id       String   @id @default(cuid())
  ficheId  String
  fiche    PoseFiche @relation(fields: [ficheId], references: [id], onDelete: Cascade)
  ref      String
  label    String
  serial   String?
  action   String   // "POSÉ" | "RETIRÉ" | "VÉRIFIÉ"
}

model PoseIntervention {
  id         String   @id @default(cuid())
  ficheId    String
  fiche      PoseFiche @relation(fields: [ficheId], references: [id], onDelete: Cascade)
  startedAt  DateTime
  endedAt    DateTime?
  actions    String?
  anomalies  String?
  measures   Json?    // champs dynamiques selon type d'intervention
  photos     String[] // clés GCS
}

model PosePV {
  id         String   @id @default(cuid())
  ficheId    String   @unique
  fiche      PoseFiche @relation(fields: [ficheId], references: [id])
  status     PosePVStatus @default(DRAFT)
  pdfKey     String?  // clé GCS du PDF généré
  signDocId  String?  // ID SignDoc si envoyé en signature
  validatedBy String?
  validatedAt DateTime?
  createdAt  DateTime @default(now())
}

model PoseLabel {
  id          String   @id @default(cuid())
  projectId   String
  project     PoseProject @relation(fields: [projectId], references: [id])
  name        String
  category    String?
  color       String   @default("#6366f1")
  applied     PoseAppliedLabel[]
}

model PoseAppliedLabel {
  id          String   @id @default(cuid())
  ficheId     String
  fiche       PoseFiche @relation(fields: [ficheId], references: [id])
  labelId     String
  label       PoseLabel @relation(fields: [labelId], references: [id])
  appliedBy   String
  appliedAt   DateTime @default(now())
  expiresAt   DateTime?
  comment     String?
}

enum PoseProjectStatus { DRAFT IN_PROGRESS COMPLETED ARCHIVED }
enum PoseType          { INSTALLATION MAINTENANCE REPLACEMENT AUDIT }
enum PoseFicheStatus   { PLANNED IN_PROGRESS DONE CANCELLED }
enum PosePriority      { LOW MEDIUM HIGH URGENT }
enum PosePVStatus      { DRAFT VALIDATED SIGNED }
```

---

## 8. Questions ouvertes

- [ ] **Domaine métier exact** : IT/télécom, BTP, autre ? (impacts sur les champs du PV et les types d'équipement)
- [ ] **Template PV** : unique ou configurable par type d'intervention ? Outil de template (HTML/PDF côté serveur) ?
- [ ] **Mode offline** : Service Worker + IndexedDB côté web, ou app mobile native dédiée ?
- [ ] **Signature client sur tablette** : intégrée dans SignDoc ou signature manuscrite indépendante ?
- [ ] **Labels : portée** : labels globaux à l'organisation ou par projet seulement ?
- [ ] **Intégration ERP / GMAO** : synchronisation avec un système de gestion d'équipements existant ?

---

## 9. Périmètre v1

**Dans le scope v1 :**
- Projets + fiches de pose + interventions
- Génération PDF du PV (template fixe)
- Labels simples
- Envoi PV via SignDoc
- Reporting basique

**Reporté v2 :**
- Mode offline terrain
- Capture photo native
- Template PV configurable
- Tableau de bord client externe
- Intégration GMAO/ERP
