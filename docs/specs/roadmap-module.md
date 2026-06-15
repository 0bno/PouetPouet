# Spec — Roadmap (module)

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13

---

## 1. Vision

Le module **Roadmap** est l'outil de planification stratégique visuelle de la suite Pivot. Il permet de construire et partager une roadmap produit ou projet sous forme de **timeline interactive**, avec des épics, jalons, dépendances et statuts.

Il se distingue du fichier `ROADMAP.md` (statique, destiné aux développeurs) par son aspect **interactif, partageable et vivant** — c'est l'outil pour présenter le plan à des parties prenantes non techniques.

**Cas d'usage cibles :**
- Roadmap produit partagée avec les équipes et la direction
- Planning de programme / PI Planning (grandes initiatives sur plusieurs trimestres)
- Vue multi-projets pour un responsable de portefeuille
- Présentation client des grandes échéances à venir
- Suivi d'un plan de transformation ou de migration

---

## 2. Concepts clés

```
Roadmap
 ├── Horizon (période : trimestre, semestre, année)
 │
 └── Ligne (swim lane)
      └── Élément (Epic / Initiative / Milestone / Release)
           ├── Dates début/fin → barre sur la timeline
           ├── Statut
           └── Dépendances (vers d'autres éléments)
```

| Terme | Définition |
|---|---|
| **Roadmap** | Conteneur avec son horizon temporel et ses lignes |
| **Ligne (swim lane)** | Axe horizontal regroupant des éléments (ex : "Frontend", "Infrastructure", "Équipe A") |
| **Élément** | Barre sur la timeline : Epic, Initiative, Milestone, Release |
| **Horizon** | Fenêtre temporelle affichée (3 mois, 6 mois, 1 an, 2 ans) |
| **Dépendance** | Lien entre deux éléments (FINIT_AVANT / COMMENCE_APRÈS) |
| **Jalon** | Point dans le temps (pas de durée) — ex : "Go-live", "Date limite légale" |

---

## 3. Fonctionnalités

### 3.1 Gestion des roadmaps

- Créer / dupliquer / archiver une roadmap
- Champs : titre, description, période de début, horizon (3 / 6 / 12 / 24 mois)
- Mode d'affichage : **trimestres** (par défaut) / mois / semaines
- Partager avec des collaborateurs internes ou via lien public (lecture seule)
- Export : image PNG/SVG, PDF, ou embed HTML (pour wiki/confluence)

### 3.2 Lignes (swim lanes)

- Créer des lignes librement nommées (ex : "Backend", "Mobile", "Q3 Priorités", "Équipe X")
- Réordonner par drag & drop
- Masquer / afficher des lignes
- Couleur par ligne
- Regrouper des lignes (groupe pliant)

### 3.3 Éléments

**Types d'éléments :**

| Type | Description | Visuel |
|---|---|---|
| `EPIC` | Grande initiative pluritrimestrielle | Barre large avec dégradé |
| `INITIATIVE` | Axe de travail sur 1-2 mois | Barre standard |
| `MILESTONE` | Point de contrôle (date fixe) | Losange |
| `RELEASE` | Version livrée | Drapeau + étiquette version |

**Champs d'un élément :**

| Champ | Type |
|---|---|
| Titre | string |
| Description | markdown |
| Type | enum ci-dessus |
| Date début | date |
| Date fin | date (non applicable pour MILESTONE) |
| Statut | `PLANNED` / `IN_PROGRESS` / `DONE` / `AT_RISK` / `CANCELLED` |
| Couleur | couleur ou héritage de la ligne |
| Avancement | 0-100 % (affiché comme remplissage de la barre) |
| Tags | string[] |
| Responsable | User Pivot |
| Lien externe | URL (GitHub, Jira, Notion…) |
| Lien PIP | référence vers une initiative Mes PIP |

**Interactions sur la timeline :**
- Drag & drop pour déplacer un élément (décale les dates)
- Glisser les bords pour redimensionner (ajuste dates début/fin)
- Clic → panneau latéral de détail et d'édition
- Double-clic → édition inline du titre

### 3.4 Dépendances

- Relier deux éléments avec une flèche (FINIT_AVANT / COMMENCE_APRÈS)
- Détection automatique des conflits : si l'élément A est déplacé après l'élément B dont il est prérequis, alerte
- Visualisation des dépendances en surbrillance au hover
- Possibilité de masquer les flèches de dépendances

### 3.5 Jalons globaux

- Jalons transverses à toutes les lignes (ex : "Clôture fiscale", "Embargo de code")
- Affichés sous forme de ligne verticale pointillée sur tout le calendrier
- Gérés séparément des éléments de ligne

### 3.6 Filtres et modes d'affichage

- Filtrer par : statut, type, responsable, tags
- Mode focus : n'afficher qu'une ligne ou qu'un groupe
- Mode présentation : plein écran, masque les contrôles d'édition
- Vue "Now" : centrage automatique sur la date du jour
- Indicateur "Aujourd'hui" (ligne verticale rouge)

---

## 4. Collaboration

- Modifications en temps réel (Socket.io) si plusieurs utilisateurs sur la même roadmap
- Commentaires sur un élément (fil de discussion)
- Historique des modifications (qui a déplacé / modifié quoi)
- Notifications : un élément assigné à moi a été modifié, une dépendance est en conflit

---

## 5. Intégrations

| Module / Système | Intégration |
|---|---|
| **Mes PIP** | Afficher une initiative PIP comme élément de roadmap (lecture bidirectionnelle) |
| **Capacité** | Importer les sprints et releases comme éléments RELEASE |
| **MeetOps** | Lier un élément à une réunion de revue |
| **Mes PDF** | Exporter la roadmap en PDF |
| **GitHub Milestones (v2)** | Synchroniser les milestones GitHub comme éléments MILESTONE |
| **Jira Epics (v2)** | Importer les épics Jira |

---

## 6. Droits

| Action | Propriétaire | Éditeur | Lecteur |
|---|---|---|---|
| Créer / modifier la roadmap | ✅ | ✅ | ❌ |
| Créer / déplacer des éléments | ✅ | ✅ | ❌ |
| Commenter | ✅ | ✅ | ✅ |
| Lire et exporter | ✅ | ✅ | ✅ |
| Gérer les partages | ✅ | ❌ | ❌ |
| Supprimer | ✅ | ❌ | ❌ |

---

## 7. Modèle de données (Prisma — ébauche)

```prisma
model RoadmapBoard {
  id          String   @id @default(cuid())
  ownerId     String
  title       String
  description String?
  startDate   DateTime
  horizon     Int      @default(12) // mois
  lanes       RoadmapLane[]
  milestones  RoadmapGlobalMilestone[]
  shares      RoadmapShare[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RoadmapLane {
  id        String   @id @default(cuid())
  boardId   String
  board     RoadmapBoard @relation(fields: [boardId], references: [id], onDelete: Cascade)
  title     String
  color     String?
  order     Int
  groupId   String?  // pour les swim lanes groupées
  items     RoadmapItem[]
}

model RoadmapItem {
  id           String   @id @default(cuid())
  laneId       String
  lane         RoadmapLane @relation(fields: [laneId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  type         RoadmapItemType @default(INITIATIVE)
  startDate    DateTime?
  endDate      DateTime?
  status       RoadmapStatus @default(PLANNED)
  progress     Int      @default(0)
  color        String?
  tags         String[]
  ownerId      String?
  externalUrl  String?
  pipId        String?  // lien PipInitiative
  comments     RoadmapComment[]
  fromDeps     RoadmapDependency[] @relation("DepFrom")
  toDeps       RoadmapDependency[] @relation("DepTo")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model RoadmapDependency {
  id     String      @id @default(cuid())
  fromId String
  from   RoadmapItem @relation("DepFrom", fields: [fromId], references: [id], onDelete: Cascade)
  toId   String
  to     RoadmapItem @relation("DepTo", fields: [toId], references: [id], onDelete: Cascade)
  type   DepType     @default(FINISHES_BEFORE)
}

model RoadmapGlobalMilestone {
  id      String   @id @default(cuid())
  boardId String
  board   RoadmapBoard @relation(fields: [boardId], references: [id], onDelete: Cascade)
  title   String
  date    DateTime
  color   String?
}

model RoadmapComment {
  id       String   @id @default(cuid())
  itemId   String
  item     RoadmapItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  authorId String
  content  String
  createdAt DateTime @default(now())
}

enum RoadmapItemType { EPIC INITIATIVE MILESTONE RELEASE }
enum RoadmapStatus   { PLANNED IN_PROGRESS DONE AT_RISK CANCELLED }
enum DepType         { FINISHES_BEFORE STARTS_AFTER }
```

---

## 8. Questions ouvertes

- [ ] **Rendu timeline** : librairie JS (DHTMLX Gantt, Frappe Gantt, custom Canvas) ? Impact perf sur 500+ éléments.
- [ ] **Collaboration temps réel** : priorité v1 ou reporté ? (complexité Socket.io ≈ board PouetPouet)
- [ ] **Granularité temporelle** : semaine / mois / trimestre — les trois en v1 ou juste mois + trimestre ?
- [ ] **Lien PIP bidirectionnel** : mise à jour de l'avancement PIP reflétée sur la barre de roadmap ?
- [ ] **Embed HTML** : pour wiki/confluence — priorité v1 ou v2 ?

---

## 9. Périmètre v1

**Dans le scope v1 :**
- Roadmap + lignes + éléments (4 types)
- Timeline mois / trimestre
- Drag & drop basique (déplacement + redimensionnement)
- Statuts et avancement
- Dépendances (sans gestion de conflit automatique)
- Jalons globaux
- Partage lecture seule par lien
- Export PNG/PDF

**Reporté v2 :**
- Collaboration temps réel
- Gestion des conflits de dépendances
- Filtres avancés
- Intégration GitHub / Jira
- Mode présentation
- Embed HTML
