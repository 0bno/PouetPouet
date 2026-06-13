# Spec — Mes PIP

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13
> ⚠️ Le sigle PIP n'a pas été précisé : cette spec suppose "Plans d'Initiatives et Priorités" (OKR-like). À confirmer.

---

## 1. Vision

**Mes PIP** est le module de pilotage des objectifs et initiatives de la suite Pivot. Il permet de définir des plans à plusieurs niveaux (objectif → initiatives → actions), de suivre leur avancement et d'en faire le reporting.

Il s'inspire des frameworks **OKR** (Objectives & Key Results) et **OGSM** (Objective, Goals, Strategies, Measures) sans les imposer — l'utilisateur structure son plan librement.

**Cas d'usage cibles :**
- Suivi des objectifs trimestriels d'une équipe
- Plans d'action post-rétrospective (Scrum)
- Pilotage d'un chantier transverse (ex : migration infra, déploiement outil)
- Plan de développement personnel d'un collaborateur
- Roadmap d'initiatives d'un département

---

## 2. Concepts clés

```
PIP (Plan d'Initiatives et Priorités)
 └── Objectif
      └── Initiative
           └── Action
                └── Jalon (date cible + statut)
```

| Terme | Définition |
|---|---|
| **PIP** | Conteneur de haut niveau pour un cycle de pilotage (ex : "Q3 2026 — Équipe DevOps") |
| **Objectif** | Résultat qualitatif ambitieux à atteindre sur la période |
| **Initiative** | Axe de travail concret contribuant à l'objectif (ex : "Réduire le délai de déploiement") |
| **Action** | Tâche ou livrable assignable avec date cible |
| **Jalon** | Point de contrôle intermédiaire dans une initiative |
| **Avancement** | Pourcentage calculé ou saisi manuellement, agrégé vers le haut |

---

## 3. Fonctionnalités

### 3.1 Plans (PIP)

- Créer un plan avec : titre, description, période (date début/fin), responsable, équipe liée, couleur
- Statuts : `DRAFT` → `ACTIVE` → `REVIEW` → `CLOSED`
- Dupliquer un plan (pour le cycle suivant)
- Archiver
- Créer depuis un template (ex : "Retrospective actions", "OKR trimestriel")
- Lier à un événement MeetOps (ex : réunion de revue du plan)

### 3.2 Objectifs

- Créer N objectifs par plan (recommandé : 3 à 5)
- Champs : titre (court, inspirant), description, poids (priorité relative), couleur
- Avancement global calculé depuis les initiatives liées
- Statut calculé : `ON_TRACK` / `AT_RISK` / `OFF_TRACK` / `DONE`

### 3.3 Initiatives

- Rattachées à un objectif
- Champs : titre, description, responsable, date début, date cible, indicateur clé (KR)
- Indicateur clé (Key Result) :
  - Type : `PERCENT` (0 → 100 %), `NUMBER` (ex : "10 tickets fermés"), `BOOLEAN` (fait / pas fait)
  - Valeur initiale, valeur cible, valeur courante (mise à jour manuelle ou par formule)
- Avancement calculé depuis les actions ou saisi directement
- Jalons intermédiaires

### 3.4 Actions

- Assignée à un ou plusieurs membres
- Date cible + durée estimée (optionnel)
- Statut : `TODO` / `IN_PROGRESS` / `DONE` / `CANCELLED`
- Sous-actions (1 niveau)
- Commentaires
- Lien vers une réunion MeetOps ou un board PouetPouet
- Pièce jointe (via Mes PDF)

### 3.5 Mise à jour et check-in

- **Check-in hebdomadaire** : rappel de mettre à jour l'avancement des initiatives actives
- Saisie rapide de l'avancement depuis le dashboard (glissière ou saisie directe)
- Note de check-in : commentaire libre "où en sommes-nous ?"
- Historique des check-ins par initiative

### 3.6 Vues

| Vue | Description |
|---|---|
| **Vue plan** | Arborescence complète objectifs → initiatives → actions avec avancements |
| **Vue kanban** | Actions en colonnes TODO / IN_PROGRESS / DONE |
| **Vue timeline** | Gantt des initiatives sur la période du plan |
| **Vue focus** | Mes actions assignées uniquement, tous plans confondus |
| **Vue équipe** | Actions par assigné (charge de travail) |

---

## 4. Reporting

### Tableau de bord d'un plan

| Métrique | Description |
|---|---|
| Avancement global | Moyenne pondérée des objectifs |
| Objectifs ON_TRACK / AT_RISK / OFF_TRACK | Répartition instantanée |
| Actions en retard | Nombre d'actions dont la date cible est dépassée |
| Vélocité | Actions complétées sur les 30 derniers jours |
| Check-in rate | % d'initiatives avec un check-in < 7 jours |

### Rapport de fin de cycle

- Synthèse par objectif : atteint / partiellement atteint / non atteint
- Détail des initiatives : avancement final, causes de retard
- Comparaison avec le cycle précédent (si plan dupliqué)
- Export PDF (via Mes PDF)

---

## 5. Intégrations

| Module | Intégration |
|---|---|
| **MeetOps** | Lier un PIP à une série de réunions de suivi (revue hebdo, bilan de cycle) |
| **Capacité** | Importer les sprints Capacité comme jalons d'un plan |
| **PouetPouet** | Créer des boards d'actions depuis un PIP |
| **Mes PDF** | Exporter les rapports de cycle |
| **Notifications Pivot** | Rappels check-in, alertes AT_RISK |

---

## 6. Droits

| Action | Propriétaire | Contributeur | Observateur |
|---|---|---|---|
| Créer / modifier le plan et les objectifs | ✅ | ❌ | ❌ |
| Créer / modifier des initiatives | ✅ | ✅ | ❌ |
| Créer / modifier des actions | ✅ | ✅ | ❌ |
| Mettre à jour l'avancement | ✅ | ✅ | ❌ |
| Lire et exporter | ✅ | ✅ | ✅ |
| Supprimer | ✅ | ❌ | ❌ |

---

## 7. Modèle de données (Prisma — ébauche)

```prisma
model Pip {
  id          String   @id @default(cuid())
  ownerId     String
  title       String
  description String?
  startDate   DateTime?
  endDate     DateTime?
  status      PipStatus @default(DRAFT)
  color       String    @default("#6366f1")
  objectives  PipObjective[]
  shares      PipShare[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model PipObjective {
  id          String   @id @default(cuid())
  pipId       String
  pip         Pip      @relation(fields: [pipId], references: [id], onDelete: Cascade)
  title       String
  description String?
  weight      Int      @default(1)
  color       String?
  initiatives PipInitiative[]
  order       Int      @default(0)
}

model PipInitiative {
  id           String   @id @default(cuid())
  objectiveId  String
  objective    PipObjective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  ownerId      String?
  startDate    DateTime?
  dueDate      DateTime?
  krType       KrType   @default(PERCENT)
  krInitial    Float    @default(0)
  krTarget     Float    @default(100)
  krCurrent    Float    @default(0)
  actions      PipAction[]
  checkIns     PipCheckIn[]
  order        Int      @default(0)
}

model PipAction {
  id           String   @id @default(cuid())
  initiativeId String
  initiative   PipInitiative @relation(fields: [initiativeId], references: [id], onDelete: Cascade)
  title        String
  assigneeIds  String[]
  dueDate      DateTime?
  status       ActionStatus @default(TODO)
  parentId     String?
  parent       PipAction? @relation("SubActions", fields: [parentId], references: [id])
  children     PipAction[] @relation("SubActions")
  order        Int      @default(0)
}

model PipCheckIn {
  id           String   @id @default(cuid())
  initiativeId String
  initiative   PipInitiative @relation(fields: [initiativeId], references: [id], onDelete: Cascade)
  authorId     String
  progress     Float    // valeur krCurrent à ce moment
  note         String?
  createdAt    DateTime @default(now())
}

enum PipStatus    { DRAFT ACTIVE REVIEW CLOSED }
enum KrType       { PERCENT NUMBER BOOLEAN }
enum ActionStatus { TODO IN_PROGRESS DONE CANCELLED }
```

---

## 8. Questions ouvertes

- [ ] **Confirmation du sigle PIP** : Plans d'Initiatives et Priorités ? Plan Individuel de Progression ? Autre ?
- [ ] **Framework imposé ?** : OKR pur (objectif + KRs sans "initiative") ou structure plus libre ?
- [ ] **Avancement calculé vs saisi** : automatiquement depuis les actions DONE ou saisie manuelle au check-in ?
- [ ] **Visibilité inter-équipes** : un PIP est-il visible par toute l'organisation ou cloisonné par équipe ?
- [ ] **Lien avec le module Capacité** : les sprints Capacité alimentent-ils automatiquement les jalons ?

---

## 9. Périmètre v1

**Dans le scope v1 :**
- Plans + objectifs + initiatives + actions
- Vue arborescente + vue kanban
- Check-in hebdomadaire manuel
- Dashboard par plan
- Export PDF

**Reporté v2 :**
- Vue Gantt/timeline
- Comparaison inter-cycles
- Alertes AT_RISK automatiques
- Intégration Capacité
