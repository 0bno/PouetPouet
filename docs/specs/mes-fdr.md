# Spec — Mes FDR (Fiches de Recette)

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13
> ⚠️ FDR interprété comme "Fiches de Recette" — en lien naturel avec les Cahiers de tests. À confirmer.

---

## 1. Vision

**Mes FDR** est le module de gestion des **fiches de recette** de la suite Pivot. Une fiche de recette est le document officiel qui atteste qu'une livraison (logicielle, matérielle ou de service) a été vérifiée et acceptée par les parties prenantes.

Là où les **Cahiers de tests** couvrent la préparation et l'exécution des tests, les **FDR** couvrent la **validation formelle** : la fiche qui dit "c'est bon, on signe". Les deux modules sont complémentaires et liés.

**Cas d'usage cibles :**
- Recette d'une version logicielle par le client ou le MOA
- Validation d'une installation terrain avant mise en production
- Acceptation formelle d'un lot de travaux (ESN, prestataire → client)
- Clôture d'un sprint avec validation des stories

---

## 2. Concepts clés

```
Fiche de Recette (FDR)
 ├── En-tête (contexte, version, environnement)
 ├── Périmètre (ce qui est testé)
 ├── Résultats de test (import depuis Cahiers de tests ou saisie manuelle)
 ├── Réserves (anomalies acceptées avec condition)
 ├── Décision (Accepté / Accepté avec réserves / Refusé)
 └── Signatures (MOA + MOE ou Client + Prestataire)
```

| Terme | Définition |
|---|---|
| **FDR** | Document de recette : synthèse des tests + décision d'acceptation |
| **Réserve** | Anomalie constatée mais jugée non bloquante pour la recette, avec plan de correction |
| **MOA** | Maîtrise d'Ouvrage — commande et valide |
| **MOE** | Maîtrise d'Œuvre — réalise et présente |
| **Décision de recette** | ACCEPTÉ / ACCEPTÉ AVEC RÉSERVES / REFUSÉ |

---

## 3. Fonctionnalités

### 3.1 Création d'une FDR

**En-tête :**

| Champ | Type |
|---|---|
| Titre | string |
| Référence | string (ex : FDR-2026-042) |
| Projet / Application | string |
| Version / Livraison | string |
| Environnement de recette | string |
| Date de recette | date |
| MOA / Client | string ou User Pivot |
| MOE / Prestataire | string ou User Pivot |
| Responsable recette | User Pivot |
| Statut | `DRAFT` / `IN_REVIEW` / `SIGNED` / `ARCHIVED` |

**Périmètre :**
- Description libre (markdown) du périmètre fonctionnel et technique couvert
- Liste des fonctionnalités / user stories incluses dans la livraison
- Ce qui est **exclu** de cette recette (hors périmètre, prévu pour une prochaine livraison)

### 3.2 Résultats de test

**Import automatique depuis un Cahier de tests :**
- Sélectionner une campagne de test existante → les résultats s'importent automatiquement
- Synthèse : total cas, PASS %, FAIL %, BLOCKED %, SKIPPED %
- Détail par section avec statut de chaque cas

**Saisie manuelle (sans Cahier de tests) :**
- Tableau de synthèse éditable : fonctionnalité, résultat (OK / NOK / NTC), commentaire
- Upload d'un rapport de test externe (PDF vers Mes PDF)

### 3.3 Réserves

Une réserve documente une anomalie acceptée malgré son existence :

| Champ | Description |
|---|---|
| Intitulé | Description courte de l'anomalie |
| Description | Détail et impact |
| Criticité | `MINEURE` / `MAJEURE` |
| Référence bug | Lien ticket (GitHub, Jira, interne) |
| Plan de correction | Date de correction prévue + responsable |
| Statut | `OUVERTE` / `EN_COURS` / `LEVÉE` |

- Nombre illimité de réserves par FDR
- Suivi du levée des réserves après signature (mise à jour des statuts)
- Alerte si une réserve `MAJEURE` reste `OUVERTE` après la date de correction

### 3.4 Décision de recette

**Délibération :**
- L'organisateur propose une décision avec justification
- Les signataires peuvent contester avant signature

**Décisions possibles :**
- `ACCEPTÉ` : livraison conforme, aucune réserve bloquante
- `ACCEPTÉ AVEC RÉSERVES` : livraison acceptée sous conditions listées (réserves documentées)
- `REFUSÉ` : livraison non conforme, retour en correction — motif obligatoire

### 3.5 Signature et finalisation

- Envoi de la FDR en signature via **SignDoc** (MOA + MOE signent le document)
- La FDR signée est archivée dans **Mes PDF**
- Une notification est envoyée à toutes les parties après signature
- La FDR signée est non modifiable (immuabilité garantie)

### 3.6 Suivi des réserves post-recette

Après signature, le module continue à tracker les réserves ouvertes :
- Tableau de bord "Réserves actives" : toutes FDR confondues
- Alertes à la date de correction
- "Lever" une réserve : commentaire + preuve (lien commit, capture, PV de test) → notifie le MOA

---

## 4. Templates de FDR

- Créer des modèles de FDR (pour des livrables récurrents : sprint, release, déploiement)
- Champs pré-remplis : sections périmètre type, critères d'acceptation standard
- Template système fourni : "Recette de sprint Scrum", "Recette de release", "Recette d'installation"

---

## 5. Reporting

| Rapport | Description |
|---|---|
| FDR par statut | En cours / Signées / Archivées |
| Taux d'acceptation | % ACCEPTÉ vs REFUSÉ sur une période |
| Réserves actives | Toutes FDR confondues, triées par criticité |
| Délai de recette | Temps entre création et signature |
| Historique des refus | Motifs et fréquence par projet |

---

## 6. Intégrations

| Module | Intégration |
|---|---|
| **Cahiers de tests** | Import automatique des résultats d'une campagne |
| **SignDoc** | Signature formelle de la FDR par MOA et MOE |
| **Mes PDF** | Archivage de la FDR signée |
| **MeetOps** | Lier une FDR à une réunion de présentation des résultats |
| **Mes poses** | Générer une FDR depuis un PV de pose (validation d'installation) |
| **Notifications Pivot** | Rappels réserves à corriger, signature reçue |

---

## 7. Droits

| Action | Propriétaire (MOE) | Validateur (MOA) | Lecteur |
|---|---|---|---|
| Créer / modifier la FDR | ✅ | ❌ | ❌ |
| Ajouter des réserves | ✅ | ✅ | ❌ |
| Lever des réserves | ✅ | ✅ | ❌ |
| Proposer la décision | ✅ | ❌ | ❌ |
| Signer | ✅ | ✅ | ❌ |
| Lire et exporter | ✅ | ✅ | ✅ |
| Supprimer (avant signature) | ✅ | ❌ | ❌ |

---

## 8. Modèle de données (Prisma — ébauche)

```prisma
model Fdr {
  id            String   @id @default(cuid())
  ownerId       String
  ref           String
  title         String
  project       String?
  version       String?
  environment   String?
  receiptDate   DateTime?
  moa           String?
  moe           String?
  status        FdrStatus @default(DRAFT)
  decision      FdrDecision?
  decisionNote  String?
  scope         String?  // markdown
  outOfScope    String?  // markdown
  testSummary   Json?    // synthèse importée ou saisie manuelle
  campaignId    String?  // lien vers TestCampaign si import
  reserves      FdrReserve[]
  signDocId     String?
  pdfKey        String?
  shares        FdrShare[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model FdrReserve {
  id           String   @id @default(cuid())
  fdrId        String
  fdr          Fdr      @relation(fields: [fdrId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  criticality  ReserveCriticality
  bugRef       String?
  fixPlan      String?
  fixDue       DateTime?
  fixOwnerId   String?
  status       ReserveStatus @default(OPEN)
  closedAt     DateTime?
  closedNote   String?
  createdAt    DateTime @default(now())
}

enum FdrStatus         { DRAFT IN_REVIEW SIGNED ARCHIVED }
enum FdrDecision       { ACCEPTED ACCEPTED_WITH_RESERVES REFUSED }
enum ReserveCriticality { MINEURE MAJEURE }
enum ReserveStatus     { OPEN IN_PROGRESS LIFTED }
```

---

## 9. Questions ouvertes

- [ ] **Confirmation du sigle FDR** : Fiches de Recette, Feuilles de Route, ou autre ?
- [ ] **MOA / MOE** : ce sont forcément des User Pivot ou peuvent-ils être des externes (email seulement) ?
- [ ] **Lien Mes poses** : une FDR peut-elle être générée depuis un PV de pose pour valider une installation ?
- [ ] **Numérotation** : FDR-YYYY-NNN auto-incrémentale par projet ou globale ?
- [ ] **Modèle de FDR qualité** : respect d'une norme spécifique (ISO, interne) à intégrer dans le template ?

---

## 10. Périmètre v1

**Dans le scope v1 :**
- Création FDR avec tous les champs
- Import résultats depuis Cahiers de tests
- Réserves + suivi de levée
- Décision de recette
- Signature via SignDoc
- Archivage dans Mes PDF
- Templates de base

**Reporté v2 :**
- Reporting multi-projets
- Suivi réserves post-recette cross-FDR
- Génération depuis PV de pose
- Norme qualité configurable
