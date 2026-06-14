// Test de charge k6 — parcours lecture représentatif (santé + liste boards + board).
//
// Usage local :  k6 run load-test/board-load.js
//   BASE_URL=https://api.example.com VUS=100 DURATION=2m k6 run load-test/board-load.js
//
// Cibler de préférence un environnement de type staging/prod : les chiffres mesurés
// sur un runner CI éphémère mono-instance ne sont pas représentatifs.
//
// Prérequis côté API : ALLOW_EMAIL_BYPASS=true (setup() crée un compte vérifié).
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE_URL || 'http://localhost:4000'
const VUS = Number(__ENV.VUS || 100)
const DURATION = __ENV.DURATION || '1m'

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: VUS }, // montée
        { duration: DURATION, target: VUS }, // palier
        { duration: '15s', target: 0 }, // descente
      ],
    },
  },
  // Aligné sur les SLO internes (docs/ops/observability-slo-alerting.md)
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1 % d'erreurs
    http_req_duration: ['p(95)<500'], // p95 < 500 ms
  },
}

// Exécuté une fois : crée un compte (bypass) + un board à lire pendant le test.
export function setup() {
  const email = `loadtest-${Date.now()}@test.local`
  const reg = http.post(
    `${BASE}/api/auth/register`,
    JSON.stringify({ name: 'Load Test', email, password: 'load-Test-123!', bypass: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  check(reg, { 'register 200': (r) => r.status === 200 })
  const token = reg.json('token')

  const board = http.post(
    `${BASE}/api/boards/`,
    JSON.stringify({ name: `Load board ${Date.now()}` }),
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  )
  check(board, { 'board created': (r) => r.status === 200 })

  return { token, boardId: board.json('id') }
}

export default function (data) {
  const authParams = { headers: { Authorization: `Bearer ${data.token}` } }

  const health = http.get(`${BASE}/health`)
  check(health, { 'health 200': (r) => r.status === 200 })

  const list = http.get(`${BASE}/api/boards/`, authParams)
  check(list, { 'boards list 200': (r) => r.status === 200 })

  if (data.boardId) {
    const board = http.get(`${BASE}/api/boards/${data.boardId}`, authParams)
    check(board, { 'board get 200': (r) => r.status === 200 })
  }

  sleep(1)
}
