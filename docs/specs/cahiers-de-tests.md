# Spec — Cahiers de tests

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13

---

## 1. Vision

Le module **Cahiers de tests** permet de créer, structurer et exécuter des plans de test, puis d'en suivre les résultats. Il cible les équipes pratiquant du **test manuel structuré** (recette, qualification, homologation) et génère des rapports exportables pour les jalons projet.

**Cas d'usage cibles :**
- Recette fonctionnelle avant livraison d'une version logicielle
- Homologation d'une installation ou d'un équipement
- Qualification d'un processus métier
- Campagnes de non-régression
- Rédaction de fiches de recette (FDR) à valider avec le client

---

## 2. Concepts clés

```
Cahier de tests (Plan de test)
 └── Section (regroupement logique)
      └── Cas de test
           └── Étapes
                └── Résultat attendu / Résultat obtenu

Campagne
 └── Sélection de cas de tests (depuis un ou plusieurs cahiers)
      └── Exécution (par testeur)
           └── Résultat : PASS / FAIL / BLOCKED / SKIPPED + commentaire + PJ
```

| Terme | Définition |
|---|---|
| **Cahier de tests** | Document structuré regroupant des cas de test liés à un périmètre fonctionnel |
| **Cas de test** | Scénario unitaire vérifiant un comportement attendu |
| **Campagne** | Exécution d'une sélection de cas de tests dans un contexte donné (version, environnement) |
| **Exécution** | Résultat d'un cas de test dans une campagne (PASS/FAIL/BLOCKED/SKIPPED) |
| **Couverture** | Ratio cas de tests couverts vs fonctionnalités listées |

---

## 3. Fonctionnalités

### 3.1 Cahiers de tests

- Créer / dupliquer / archiver un cahier
- Champs : titre, description, version cible, périmètre, responsable, statut (`DRAFT` / `ACTIVE` / `ARCHIVED`)
- Sections pour organiser les cas (ex : "Authentification", "Gestion des droits")
- Import depuis CSV (colonnes : section, titre, préconditions, étapes, résultat attendu)
- Export en PDF (format recette présentable au client)
- Lier à une version d'un événement MeetOps ou à un sprint Capacité

### 3.2 Cas de test

Chaque cas de test contient :

| Champ | Type | Notes |
|---|---|---|
| Identifiant | string | Auto-généré (ex : CT-001) ou manuel |
| Titre | string | Court et descriptif |
| Description | markdown | Contexte fonctionnel |
| Préconditions | markdown | État requis avant exécution |
| Étapes | liste ordonnée | Chaque étape = action + résultat attendu |
| Priorité | enum | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` |
| Type | enum | `FUNCTIONAL` / `REGRESSION` / `PERFORMANCE` / `SECURITY` / `UX` |
| Tags | string[] | Recherche transversale |
| Pièces jointes | fichiers | Captures d'écran, données de test |
| Automatisable | boolean | Indicateur pour équipes avec CI |

### 3.3 Campagnes de test

- Créer une campagne : titre, version testée, environnement (recette / prod / staging), dates, testeurs assignés
- Sélectionner les cas à inclure : tous, par section, par tags, ou manuellement
- Assigner les cas à des testeurs
- Suivi en temps réel : compteur PASS / FAIL / BLOCKED / SKIPPED / PENDING

**Exécution d'un cas :**
1. Le testeur ouvre le cas et voit les étapes
2. Pour chaque étape : saisit le résultat obtenu
3. Statut global : PASS / FAIL / BLOCKED / SKIPPED
4. Commentaire libre + pièces jointes (captures d'écran)
5. En cas de FAIL : possibilité de créer un ticket de bug (lien externe GitHub/Jira ou note interne)

### 3.4 Matrice de traçabilité

- Lier chaque cas de test à une ou plusieurs exigences (texte libre ou ID externe)
- Vue matrice : lignes = exigences, colonnes = cas de tests, cellule = lien / couvert / non couvert
- Export CSV/PDF de la matrice

### 3.5 Historique et comparaison

- Historique des exécutions par cas de test (toutes campagnes confondues)
- Comparer deux campagnes : quels cas ont régressé ou progressé
- Tendance de stabilité par cas (taux de succès historique)

---

## 4. Reporting

### Par campagne

| Métrique | Description |
|---|---|
| Taux de succès | % PASS / total exécutés |
| Taux de blocage | % BLOCKED |
| Cas non exécutés | % SKIPPED + PENDING |
| Bugs ouverts | nombre de tickets liés à des FAIL |
| Durée de campagne | date début → date fin effective |
| Productivité testeur | cas exécutés par testeur |

### Rapport de recette (export PDF)

Génère un document structuré :
- En-tête : projet, version, environnement, dates, testeurs
- Synthèse exécutive (tableau bord)
- Détail par section : cas de test, résultats, captures d'écran des FAIL
- Annexe : liste des bugs ouverts
- Signature (intégration SignDoc pour validation formelle)

---

## 5. Intégrations

| Module / Système | Intégration |
|---|---|
| **SignDoc** | Envoyer le rapport de recette PDF en signature |
| **Mes PDF** | Stocker les rapports générés |
| **MeetOps** | Lier une campagne à une réunion de go/no-go |
| **GitHub Issues** | Créer un issue depuis un cas FAIL |
| **Jira (v2)** | Lier les cas à des tickets Jira |
| **Capacité** | Lier un cahier à un sprint Capacité |

---

## 6. Droits

| Action | Propriétaire | Rédacteur | Testeur | Lecteur |
|---|---|---|---|---|
| Créer / modifier un cahier | ✅ | ✅ | ❌ | ❌ |
| Créer / modifier des cas | ✅ | ✅ | ❌ | ❌ |
| Créer une campagne | ✅ | ✅ | ❌ | ❌ |
| Exécuter des cas de test | ✅ | ✅ | ✅ | ❌ |
| Lire les résultats | ✅ | ✅ | ✅ | ✅ |
| Exporter les rapports | ✅ | ✅ | ✅ | ✅ |
| Supprimer | ✅ | ❌ | ❌ | ❌ |

---

## 7. Modèle de données (Prisma — ébauche)

```prisma
model TestBook {
  id          String   @id @default(cuid())
  ownerId     String
  title       String
  description String?
  version     String?
  status      TestBookStatus @default(DRAFT)
  sections    TestSection[]
  campaigns   TestCampaign[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TestSection {
  id       String   @id @default(cuid())
  bookId   String
  book     TestBook @relation(fields: [bookId], references: [id], onDelete: Cascade)
  title    String
  order    Int
  cases    TestCase[]
}

model TestCase {
  id             String   @id @default(cuid())
  sectionId      String
  section        TestSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  ref            String   // CT-001
  title          String
  description    String?
  preconditions  String?
  steps          Json     // [{ action: string, expected: string }]
  priority       TestPriority @default(MEDIUM)
  type           TestType @default(FUNCTIONAL)
  tags           String[]
  autoTestable   Boolean  @default(false)
  requirements   String[] // IDs ou textes libres d'exigences liées
  executions     TestExecution[]
  createdAt      DateTime @default(now())
}

model TestCampaign {
  id          String   @id @default(cuid())
  bookId      String
  book        TestBook @relation(fields: [bookId], references: [id])
  title       String
  environment String?
  targetVersion String?
  startDate   DateTime?
  endDate     DateTime?
  executions  TestExecution[]
  createdAt   DateTime @default(now())
}

model TestExecution {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    TestCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  caseId      String
  case        TestCase @relation(fields: [caseId], references: [id])
  assigneeId  String?
  status      TestStatus @default(PENDING)
  stepResults Json?    // [{ action, expected, obtained, status }]
  comment     String?
  bugRef      String?  // lien GitHub issue ou note
  executedAt  DateTime?
}

enum TestBookStatus { DRAFT ACTIVE ARCHIVED }
enum TestPriority   { CRITICAL HIGH MEDIUM LOW }
enum TestType       { FUNCTIONAL REGRESSION PERFORMANCE SECURITY UX }
enum TestStatus     { PENDING PASS FAIL BLOCKED SKIPPED }
```

---

## 8. Questions ouvertes

- [ ] **Numérotation des cas** : automatique globale (CT-001, CT-002…) ou par section (AUTH-01, PERM-01) ?
- [ ] **Cas de test partagés** : possible de réutiliser un cas d'un autre cahier (bibliothèque commune) ?
- [ ] **Gestion des pièces jointes** : stockées dans Mes PDF ou directement attachées aux exécutions ?
- [ ] **Lien GitHub** : OAuth GitHub pour créer les issues ou lien manuel ?
- [ ] **Non-régression automatique** : intégration future avec Playwright/Vitest pour importer les résultats de tests automatisés ?

---

## 9. Périmètre v1

**Dans le scope v1 :**
- Cahiers + sections + cas de test
- Campagnes d'exécution avec assignation testeurs
- Résultats PASS/FAIL/BLOCKED/SKIPPED + commentaires
- Export PDF rapport de recette
- Import CSV
- Droits par cahier

**Reporté v2 :**
- Matrice de traçabilité
- Comparaison de campagnes
- Intégration GitHub Issues / Jira
- Intégration SignDoc pour signature du rapport
- Import résultats tests automatisés
