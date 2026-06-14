# Tests de charge (k6)

Tests de charge HTTP de l'API, alignés sur les SLO internes
(`docs/ops/observability-slo-alerting.md`) : **p95 < 500 ms**, **< 1 % d'erreurs**.

## Prérequis
- [k6](https://k6.io/docs/get-started/installation/) installé.
- API joignable, avec `ALLOW_EMAIL_BYPASS=true` (le `setup()` crée un compte vérifié).

## Lancer

```bash
# Local (API sur :4000)
k6 run load-test/board-load.js

# Contre un environnement, 100 VUs pendant 2 min
BASE_URL=https://api.example.com VUS=100 DURATION=2m k6 run load-test/board-load.js
```

Variables : `BASE_URL` (défaut `http://localhost:4000`), `VUS` (défaut `100`),
`DURATION` (palier, défaut `1m`). Le scénario monte 30 s → palier → descente 15 s.

## En CI
Workflow manuel `.github/workflows/load-test.yml` (`workflow_dispatch`) : fournir
l'URL cible (de préférence un staging, **pas** un runner CI mono-instance, non
représentatif), le nombre de VUs et la durée.

## Scénario
`board-load.js` — parcours lecture : `GET /health`, `GET /api/boards/`,
`GET /api/boards/:id`. Les endpoints d'écriture/auth sont rate-limités et ne sont
pas martelés ici.

## À venir
- Charge WebSocket (sessions/scrum/board temps réel) — nécessite un module ws/socket.io k6.
