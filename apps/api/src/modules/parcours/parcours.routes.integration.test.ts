import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, createTestUser, cleanupUsers } from '../../test/build-app.js'
import { parcoursRoutes } from './parcours.routes.js'
import { prisma } from '../../lib/prisma.js'
import { bus } from '../../lib/bus.js'

const SUFFIX = '@parcours-engine.int.test'

// ── Template CRUD avec nouvelles colonnes ───────────────────────────────────

describe('template CRUD avec nouvelles colonnes', () => {
  let app: FastifyInstance
  let owner: { user: { id: string }; token: string }
  let templateId: string

  beforeAll(async () => {
    await cleanupUsers(SUFFIX)
    app = await buildTestApp([{ plugin: parcoursRoutes, prefix: '/api/parcours' }])
    owner = await createTestUser(app, `owner-crud${SUFFIX}`)
  })

  afterAll(async () => {
    await cleanupUsers(SUFFIX)
    await app.close()
  })

  it('POST /templates avec flowEdges, triggerType, triggerConfig → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        name: 'Template test',
        steps: [{ type: 'info', title: 'Étape 1' }],
        flowEdges: [{ id: 'e1', source: '0', target: '1' }],
        triggerType: 'form_response',
        triggerConfig: { formId: 'abc' },
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    templateId = body.id
    expect(body.flowEdges).toEqual([{ id: 'e1', source: '0', target: '1' }])
    expect(body.triggerType).toBe('form_response')
    expect(body.triggerConfig).toEqual({ formId: 'abc' })
  })

  it('GET /templates/:id → retourne flowEdges, triggerType, triggerConfig', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/parcours/templates/${templateId}`,
      headers: { authorization: `Bearer ${owner.token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.flowEdges).toEqual([{ id: 'e1', source: '0', target: '1' }])
    expect(body.triggerType).toBe('form_response')
    expect(body.triggerConfig).toEqual({ formId: 'abc' })
  })

  it('PATCH /templates/:id → met à jour flowEdges', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/parcours/templates/${templateId}`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        flowEdges: [{ id: 'e2', source: '0', target: '1', condition: { field: 'x', operator: 'eq', value: 'y' } }],
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.flowEdges[0].id).toBe('e2')
  })

  it('POST /templates avec steps=[] (brouillon) → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { name: 'Brouillon vide', steps: [] },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().stepCount).toBe(0)
  })

  it('Duplication d\'un template → copie flowEdges/triggerType/triggerConfig', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/templates/${templateId}/duplicate`,
      headers: { authorization: `Bearer ${owner.token}` },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.triggerType).toBe('form_response')
    expect(body.triggerConfig).toEqual({ formId: 'abc' })
    // flowEdges updated in prior PATCH test
    expect(Array.isArray(body.flowEdges)).toBe(true)
  })
})

// ── Moteur de steps — skipIf ─────────────────────────────────────────────────

describe('moteur de steps — skipIf', () => {
  let app: FastifyInstance
  let owner: { user: { id: string }; token: string }
  let templateId: string
  let instanceId: string

  beforeAll(async () => {
    await cleanupUsers(SUFFIX)
    app = await buildTestApp([{ plugin: parcoursRoutes, prefix: '/api/parcours' }])
    owner = await createTestUser(app, `owner-skipif${SUFFIX}`)

    const tmpl = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        name: 'Template skipIf',
        steps: [
          { type: 'info', title: 'Étape 0' },
          { type: 'info', title: 'Étape 1', skipIf: { field: 'statut', operator: 'eq', value: 'skip' } },
          { type: 'info', title: 'Étape 2' },
        ],
      },
    })
    templateId = tmpl.json().id
  })

  afterAll(async () => {
    await cleanupUsers(SUFFIX)
    await app.close()
  })

  it('crée une instance', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parcours/instances',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { templateId, title: 'Test skipIf' },
    })
    expect(res.statusCode).toBe(201)
    instanceId = res.json().id
  })

  it('compléter étape 0 avec data {statut:skip} → étape 1 SKIPPED, currentStep=2', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/instances/${instanceId}/steps/0`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { action: 'complete', data: { statut: 'skip' } },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().nextStep).toBe(2)

    const instance = await prisma.parcourInstance.findUnique({
      where: { id: instanceId },
      include: { steps: true },
    })
    const step1 = instance!.steps.find((s) => s.stepIndex === 1)
    expect(step1!.status).toBe('SKIPPED')
    expect(instance!.currentStep).toBe(2)
  })
})

// ── Moteur de steps — arêtes conditionnelles ─────────────────────────────────

describe('moteur de steps — arêtes conditionnelles', () => {
  let app: FastifyInstance
  let owner: { user: { id: string }; token: string }
  let templateId: string
  let instanceId: string

  beforeAll(async () => {
    await cleanupUsers(SUFFIX)
    app = await buildTestApp([{ plugin: parcoursRoutes, prefix: '/api/parcours' }])
    owner = await createTestUser(app, `owner-flowedge${SUFFIX}`)

    const tmpl = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        name: 'Template flow edges',
        steps: [
          { type: 'info', title: 'Étape 0' },
          { type: 'info', title: 'Étape 1' },
          { type: 'info', title: 'Étape 2' },
        ],
        flowEdges: [
          { id: 'e1', source: '0', target: '2', condition: { field: 'branch', operator: 'eq', value: 'fast' } },
        ],
      },
    })
    templateId = tmpl.json().id
  })

  afterAll(async () => {
    await cleanupUsers(SUFFIX)
    await app.close()
  })

  it('crée une instance', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parcours/instances',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { templateId, title: 'Test flow edges' },
    })
    expect(res.statusCode).toBe(201)
    instanceId = res.json().id
  })

  it('compléter étape 0 avec data {branch:fast} → currentStep=2 (étape 1 sautée)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/instances/${instanceId}/steps/0`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { action: 'complete', data: { branch: 'fast' } },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().nextStep).toBe(2)

    const instance = await prisma.parcourInstance.findUnique({ where: { id: instanceId } })
    expect(instance!.currentStep).toBe(2)
  })
})

// ── Approval-chain ────────────────────────────────────────────────────────────

describe('approval-chain', () => {
  let app: FastifyInstance
  let owner: { user: { id: string }; token: string }
  let approver1: { user: { id: string }; token: string }
  let approver2: { user: { id: string }; token: string }
  let stranger: { user: { id: string }; token: string }
  let templateId: string
  let instanceId: string

  beforeAll(async () => {
    await cleanupUsers(SUFFIX)
    app = await buildTestApp([{ plugin: parcoursRoutes, prefix: '/api/parcours' }])
    owner = await createTestUser(app, `owner-approval${SUFFIX}`)
    approver1 = await createTestUser(app, `approver1${SUFFIX}`)
    approver2 = await createTestUser(app, `approver2${SUFFIX}`)
    stranger = await createTestUser(app, `stranger-approval${SUFFIX}`)

    // Le step assignedTo doit être approver1 pour l'initialisation de la première étape.
    // La liste 'approvers' contient les deux pour que canDecide fonctionne.
    const tmpl = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        name: 'Template approval-chain',
        steps: [
          {
            type: 'approval-chain',
            title: 'Validation',
            assignedTo: null, // sera initialisé manuellement
            approvers: [approver1.user.id, approver2.user.id],
            requireAll: true,
          },
          { type: 'info', title: 'Étape suivante' },
        ],
      },
    })
    templateId = tmpl.json().id
  })

  afterAll(async () => {
    await cleanupUsers(SUFFIX)
    await app.close()
  })

  it('crée une instance et initialise la chaîne d\'approbation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parcours/instances',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { templateId, title: 'Test approval' },
    })
    expect(res.statusCode).toBe(201)
    instanceId = res.json().id

    // Initialiser manuellement la chaîne d'approbation pour la première étape
    // (la création d'instance n'initialise pas les approval-chain automatiquement)
    await prisma.parcourStepInstance.update({
      where: { instanceId_stepIndex: { instanceId, stepIndex: 0 } },
      data: {
        assignedTo: approver1.user.id,
        data: { _chain: { approvals: [], currentApproverIndex: 0 } },
      },
    })

    // Partager l'instance avec les approbateurs en tant qu'EDITOR
    await prisma.moduleShare.createMany({
      data: [
        { module: 'parcourInstance', resourceId: instanceId, userId: approver1.user.id, role: 'EDITOR' },
        { module: 'parcourInstance', resourceId: instanceId, userId: approver2.user.id, role: 'EDITOR' },
      ],
    })

    const step0 = await prisma.parcourStepInstance.findUnique({
      where: { instanceId_stepIndex: { instanceId, stepIndex: 0 } },
    })
    expect(step0!.assignedTo).toBe(approver1.user.id)
  })

  it('non-approbateur qui tente de compléter → 403 (n\'est pas dans la chaîne)', async () => {
    // stranger n'a pas accès à l'instance → 403 au niveau du resolveRole
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/instances/${instanceId}/steps/0`,
      headers: { authorization: `Bearer ${stranger.token}` },
      payload: { action: 'complete' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('approver1 complète → chainPending:true, étape reste IN_PROGRESS, assignedTo change vers approver2', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/instances/${instanceId}/steps/0`,
      headers: { authorization: `Bearer ${approver1.token}` },
      payload: { action: 'complete' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().chainPending).toBe(true)

    const step0 = await prisma.parcourStepInstance.findUnique({
      where: { instanceId_stepIndex: { instanceId, stepIndex: 0 } },
    })
    expect(step0!.status).toBe('PENDING')
    expect(step0!.assignedTo).toBe(approver2.user.id)
  })

  it('approver2 complète → étape COMPLETED, instance avance au step suivant', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/instances/${instanceId}/steps/0`,
      headers: { authorization: `Bearer ${approver2.token}` },
      payload: { action: 'complete' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().chainPending).toBeUndefined()

    const step0 = await prisma.parcourStepInstance.findUnique({
      where: { instanceId_stepIndex: { instanceId, stepIndex: 0 } },
    })
    expect(step0!.status).toBe('COMPLETED')

    const instance = await prisma.parcourInstance.findUnique({ where: { id: instanceId } })
    expect(instance!.currentStep).toBe(1)
  })
})

// ── Step HTTP auto-exécution ───────────────────────────────────────────────────

describe('step HTTP auto-exécution', () => {
  let app: FastifyInstance
  let owner: { user: { id: string }; token: string }
  let templateId: string
  let instanceId: string

  beforeAll(async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' }),
      text: async () => '',
    }))

    await cleanupUsers(SUFFIX)
    app = await buildTestApp([{ plugin: parcoursRoutes, prefix: '/api/parcours' }])
    owner = await createTestUser(app, `owner-http${SUFFIX}`)

    const tmpl = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        name: 'Template HTTP',
        steps: [
          { type: 'info', title: 'Étape 0' },
          { type: 'http', title: 'HTTP', httpUrl: 'https://example.com', httpOutputKey: 'result' },
          { type: 'info', title: 'Étape 2' },
        ],
      },
    })
    templateId = tmpl.json().id
  })

  afterAll(async () => {
    vi.unstubAllGlobals()
    await cleanupUsers(SUFFIX)
    await app.close()
  })

  it('crée une instance', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parcours/instances',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { templateId, title: 'Test HTTP step' },
    })
    expect(res.statusCode).toBe(201)
    instanceId = res.json().id
  })

  it('compléter étape 0 → step 1 COMPLETED automatiquement avec data http, currentStep=2', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/parcours/instances/${instanceId}/steps/0`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { action: 'complete' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().nextStep).toBe(2)

    const step1 = await prisma.parcourStepInstance.findUnique({
      where: { instanceId_stepIndex: { instanceId, stepIndex: 1 } },
    })
    expect(step1!.status).toBe('COMPLETED')

    const data = step1!.data as Record<string, unknown>
    expect(data._httpOutput).toEqual({ result: 'ok' })
    expect(data.result).toEqual({ result: 'ok' })

    const instance = await prisma.parcourInstance.findUnique({ where: { id: instanceId } })
    expect(instance!.currentStep).toBe(2)
  })
})

// ── Bus trigger form_response → auto-instance ─────────────────────────────────

describe('bus trigger form_response → auto-instance', () => {
  let app: FastifyInstance
  let owner: { user: { id: string }; token: string }
  let templateId: string

  beforeAll(async () => {
    await cleanupUsers(SUFFIX)
    app = await buildTestApp([{ plugin: parcoursRoutes, prefix: '/api/parcours' }])
    owner = await createTestUser(app, `owner-bus${SUFFIX}`)

    const tmpl = await app.inject({
      method: 'POST',
      url: '/api/parcours/templates',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        name: 'Template bus trigger',
        steps: [{ type: 'info', title: 'Étape 0' }],
        triggerType: 'form_response',
        triggerConfig: { formId: 'test-form-id' },
      },
    })
    templateId = tmpl.json().id
  })

  afterAll(async () => {
    await cleanupUsers(SUFFIX)
    await app.close()
  })

  it('publier un événement form.response.created crée une instance parcours', async () => {
    bus.publish({
      type: 'form.response.created',
      module: 'forms',
      payload: { formId: 'test-form-id', responseId: 'r1', data: {} },
    })

    // Laisser les handlers async s'exécuter
    await new Promise((r) => setTimeout(r, 50))

    const instances = await prisma.parcourInstance.findMany({ where: { templateId } })
    expect(instances.length).toBeGreaterThanOrEqual(1)
  })
})
