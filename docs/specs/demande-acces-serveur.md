# Spec — Demande d'accès serveur

> Version : 0.1 — Statut : Brouillon — Dernière mise à jour : 2026-06-13

---

## 1. Vision

**Demande d'accès serveur** est le module de gestion des **habilitations techniques** de la suite Pivot. Il couvre le cycle complet d'une demande d'accès à un serveur ou système : formulaire de demande → validation hiérarchique → provisionnement → suivi et révocation.

Il remplace les échanges email/ticket informels par un workflow structuré, traçable et auditable, conforme aux exigences RGPD et sécurité (principe du moindre privilège, révision périodique des accès).

**Cas d'usage cibles :**
- Développeur demandant un accès SSH à un serveur de recette
- Administrateur accordant ou refusant des accès en base de données
- Responsable sécurité pilotant les revues d'accès trimestrielles
- Audit des accès actifs sur un parc de serveurs
- Provisionnement temporaire pour une intervention ponctuelle

---

## 2. Concepts clés

```
Catalogue de ressources (serveurs / systèmes)
 └── Demande d'accès
      ├── Workflow d'approbation
      │    └── Approbateurs (N niveaux)
      ├── Accès provisionné (statut + dates)
      └── Révocation / expiration
```

| Terme | Définition |
|---|---|
| **Ressource** | Serveur, base de données, application ou environnement déclaré dans le catalogue |
| **Demande** | Formulaire rempli par un utilisateur pour obtenir un accès à une ressource |
| **Accès** | Droit accordé après approbation (niveau, durée, périmètre) |
| **Workflow** | Chaîne d'approbation associée à une ressource ou catégorie de ressource |
| **Provisionnement** | Action technique d'ouverture de l'accès (manuelle ou automatisée) |
| **Révocation** | Fermeture de l'accès (expiration, révocation manuelle, départ utilisateur) |

---

## 3. Fonctionnalités

### 3.1 Catalogue de ressources

Administré par les équipes IT :

| Champ | Type | Notes |
|---|---|---|
| Nom | string | Ex : "Serveur de recette REC-01" |
| Type | enum | `SERVER` / `DATABASE` / `APPLICATION` / `ENVIRONMENT` / `NETWORK` |
| Environnement | enum | `PRODUCTION` / `STAGING` / `RECETTE` / `DEV` / `AUTRE` |
| Description | markdown | Contexte, usage, criticité |
| Niveaux d'accès disponibles | liste | Ex : SSH-READ, SSH-WRITE, DB-SELECT, DB-FULL, SUDO |
| Durée max d'accès | number (jours) | Limite la durée que l'utilisateur peut demander |
| Workflow d'approbation | référence | Quelle chaîne d'approbation s'applique |
| Tags | string[] | Pour filtrer et regrouper |
| Visible par | enum | `ALL` / `TEAM` / `ADMIN_ONLY` |
| Actif | boolean | Désactiver sans supprimer |

### 3.2 Formulaire de demande

L'utilisateur remplit :

| Champ | Notes |
|---|---|
| Ressource | Sélection dans le catalogue |
| Niveau d'accès souhaité | Selon les niveaux disponibles sur la ressource |
| Justification | Texte obligatoire : pourquoi, pour quel projet |
| Durée souhaitée | Dates début/fin ou durée (ex : "14 jours") |
| Urgence | Normale / Urgente (déclenche alerte aux approbateurs) |
| Référence projet / ticket | Lien optionnel (GitHub, Jira, interne) |

Règles :
- Un utilisateur ne peut avoir qu'une demande en cours par ressource + niveau
- Durée limitée au plafond défini sur la ressource
- Justification minimale 50 caractères pour les ressources `PRODUCTION`

### 3.3 Workflow d'approbation

Chaque ressource a un workflow configurable :

**Types de workflow :**
- `SINGLE` : un seul approbateur
- `SEQUENTIAL` : approbateurs en série (tous doivent valider dans l'ordre)
- `PARALLEL` : tous les approbateurs sont notifiés simultanément (majorité suffit, ou unanimité)
- `AUTO` : approbation automatique (pour ressources non critiques, environnements DEV)

**Approbateurs :**
- Utilisateur nommé, groupe (équipe Pivot), ou rôle (`MANAGER`, `SECURITY`, `DBA`)
- SLA par approbateur (délai au-delà duquel une relance est envoyée)
- Délégation possible (un approbateur peut déléguer temporairement)

**Actions d'un approbateur :**
- Approuver avec commentaire
- Refuser avec motif obligatoire
- Demander des informations complémentaires (remet la demande en état `PENDING_INFO`)
- Escalader (si l'approbateur considère ne pas avoir la légitimité)

### 3.4 Provisionnement

Après approbation finale :

**Manuel :** l'administrateur reçoit une notification avec les détails de l'accès à ouvrir. Il confirme le provisionnement dans l'interface (case à cocher + commentaire + date effective).

**Automatisé (v2) :** intégration avec Ansible / Terraform / API SSO pour créer automatiquement l'accès.

Une fois provisionné, la demande passe en statut `ACTIVE` et le compteur de durée commence.

### 3.5 Suivi des accès actifs

Vue tableau des accès ouverts :

| Colonne | Description |
|---|---|
| Utilisateur | Qui a l'accès |
| Ressource + niveau | Sur quoi et comment |
| Date d'expiration | Couleur : vert / orange (< 7j) / rouge (expiré) |
| Justification | La demande originale |
| Approbateurs | Qui a validé |

**Expiration automatique :** à la date de fin, une notification est envoyée à l'utilisateur et à l'admin. L'accès passe en `EXPIRED` et doit être révoqué manuellement (ou automatiquement en v2).

**Prolongation :** l'utilisateur peut déposer une demande de prolongation (workflow identique à la demande initiale).

### 3.6 Révocation

- **Manuelle** : l'admin peut révoquer n'importe quel accès à tout moment (avec motif)
- **Expiration** : déclenchée automatiquement à la date de fin
- **Départ utilisateur** : alerte si un utilisateur est désactivé dans Pivot et possède des accès actifs
- **Révision périodique** : campagne de révision (tous les accès actifs d'une ressource envoyés aux approbateurs pour confirmation)

---

## 4. Audit et reporting

**Journal d'audit (non modifiable) :**
- Chaque action (demande, approbation, refus, provisionnement, révocation) est tracée
- Export CSV / PDF

**Tableaux de bord :**

| Rapport | Description |
|---|---|
| Accès actifs par ressource | Qui a quoi en ce moment |
| Accès expirant dans les 7 jours | Actions à anticiper |
| Demandes en attente | File d'attente par approbateur |
| Temps moyen d'approbation | Par ressource, par approbateur |
| Historique des refus | Patterns et motifs récurrents |
| Campagne de révision | Accès confirmés / révoqués lors de la dernière révision |

---

## 5. Intégrations

| Module / Système | Intégration |
|---|---|
| **Notifications Pivot** | Alertes demande reçue, approuvée, refusée, expiration |
| **Audit log Pivot** | Toutes les actions remontées dans le journal Pivot |
| **MeetOps** | Lier une demande à une réunion de revue de sécurité |
| **LDAP / Active Directory (v2)** | Synchroniser les utilisateurs et groupes |
| **Ansible / Terraform (v2)** | Provisionnement automatique |

---

## 6. Droits

| Rôle | Description |
|---|---|
| **Demandeur** | Tout utilisateur Pivot — peut faire des demandes et voir ses propres accès |
| **Approbateur** | Désigné sur un workflow — peut approuver/refuser les demandes qui lui sont soumises |
| **Admin ressource** | Gère le catalogue de ressources et les workflows d'approbation |
| **Admin sécurité** | Accès complet à tous les accès, journaux, campagnes de révision |

---

## 7. Modèle de données (Prisma — ébauche)

```prisma
model AccessResource {
  id           String   @id @default(cuid())
  name         String
  type         ResourceType
  environment  ResourceEnv
  description  String?
  levels       Json     // [{ id, label, description, riskLevel }]
  maxDurationDays Int?
  workflowId   String
  workflow     AccessWorkflow @relation(fields: [workflowId], references: [id])
  tags         String[]
  visibility   ResourceVisibility @default(ALL)
  active       Boolean  @default(true)
  requests     AccessRequest[]
  createdAt    DateTime @default(now())
}

model AccessWorkflow {
  id        String   @id @default(cuid())
  name      String
  type      WorkflowType
  steps     Json     // [{ order, approverIds, role, slaDays, requireAll }]
  resources AccessResource[]
}

model AccessRequest {
  id           String   @id @default(cuid())
  requesterId  String
  resourceId   String
  resource     AccessResource @relation(fields: [resourceId], references: [id])
  level        String   // niveau d'accès demandé (id depuis resource.levels)
  justification String
  startDate    DateTime
  endDate      DateTime
  urgent       Boolean  @default(false)
  projectRef   String?
  status       RequestStatus @default(PENDING)
  approvals    AccessApproval[]
  provision    AccessProvision?
  auditEntries AccessAuditEntry[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model AccessApproval {
  id          String   @id @default(cuid())
  requestId   String
  request     AccessRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  approverId  String
  step        Int
  decision    ApprovalDecision?
  comment     String?
  decidedAt   DateTime?
  createdAt   DateTime @default(now())
}

model AccessProvision {
  id           String   @id @default(cuid())
  requestId    String   @unique
  request      AccessRequest @relation(fields: [requestId], references: [id])
  provisionedBy String
  provisionedAt DateTime @default(now())
  effectiveStart DateTime
  effectiveEnd   DateTime?
  revokedAt    DateTime?
  revokedBy    String?
  revokeReason String?
  note         String?
}

model AccessAuditEntry {
  id        String   @id @default(cuid())
  requestId String
  request   AccessRequest @relation(fields: [requestId], references: [id])
  at        DateTime @default(now())
  by        String
  action    String
  detail    String?
}

enum ResourceType       { SERVER DATABASE APPLICATION ENVIRONMENT NETWORK }
enum ResourceEnv        { PRODUCTION STAGING RECETTE DEV OTHER }
enum ResourceVisibility { ALL TEAM ADMIN_ONLY }
enum WorkflowType       { SINGLE SEQUENTIAL PARALLEL AUTO }
enum RequestStatus      { PENDING PENDING_INFO APPROVED REJECTED PROVISIONED ACTIVE EXPIRED REVOKED CANCELLED }
enum ApprovalDecision   { APPROVED REJECTED INFO_REQUESTED ESCALATED }
```

---

## 8. Questions ouvertes

- [ ] **Catalogue initial** : qui alimente le catalogue ? Les admins Pivot ou import depuis un CMDB existant ?
- [ ] **Provisionnement auto v1** : totalement manuel en v1 ? Ou déjà un webhook configurable pour déclencher un script externe ?
- [ ] **Départ utilisateur** : intégration avec le système RH / SSO pour détecter les départs automatiquement ?
- [ ] **Niveaux d'accès** : librement définis par ressource ou nomenclature imposée (ex : READ / WRITE / ADMIN) ?
- [ ] **Révision périodique** : fréquence imposée par type de ressource (PRODUCTION = trimestriel, DEV = annuel) ?

---

## 9. Périmètre v1

**Dans le scope v1 :**
- Catalogue de ressources
- Formulaire de demande
- Workflows d'approbation (SINGLE + SEQUENTIAL)
- Provisionnement manuel confirmé dans l'interface
- Suivi des accès actifs + expiration
- Révocation manuelle
- Journal d'audit
- Notifications Pivot

**Reporté v2 :**
- Provisionnement automatisé (Ansible / API)
- Workflow PARALLEL + délégation
- Campagne de révision périodique
- Synchronisation LDAP/AD
- Intégration CMDB
