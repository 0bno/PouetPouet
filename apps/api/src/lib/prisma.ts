import { PrismaClient } from '@prisma/client'

// Borne explicitement le pool de connexions par instance.
// Avec plusieurs instances Cloud Run, chaque pool consomme des connexions Cloud SQL :
// il faut garder (nb_instances × connection_limit) sous le max_connections de Postgres.
// Le défaut Prisma (num_cpus×2+1 ≈ 3 sur 1 vCPU) est ici relevé à 10/instance, et
// reste surchargeable via DB_CONNECTION_LIMIT. `pool_timeout` borne l'attente d'une
// connexion libre avant erreur (au lieu de pendre indéfiniment sous pic de charge).
function pooledDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_URL
  if (!base) return undefined
  try {
    const url = new URL(base)
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', process.env.DB_CONNECTION_LIMIT ?? '10')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '10')
    }
    return url.toString()
  } catch {
    return base // chaîne non parsable : on laisse Prisma la gérer telle quelle
  }
}

const datasourceUrl = pooledDatasourceUrl()

export const prisma = datasourceUrl
  ? new PrismaClient({ datasourceUrl })
  : new PrismaClient()
