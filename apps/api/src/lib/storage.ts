import { Storage } from '@google-cloud/storage'
import fs from 'node:fs/promises'
import path from 'node:path'

const BUCKET = process.env.GCS_BUCKET ?? 'pouetpouet-documents'

// En local (pas de credentials GCS), on stocke les fichiers dans .uploads/
// et on expose des endpoints dev /api/parcours/_dev/:key
const IS_LOCAL_DEV = !process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production'
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.uploads')
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let _storage: Storage | null = null
function gcs() {
  if (!_storage) _storage = new Storage()
  return _storage
}

export async function getUploadSignedUrl(key: string, mimeType: string): Promise<string> {
  if (IS_LOCAL_DEV) {
    await fs.mkdir(path.join(LOCAL_UPLOAD_DIR, path.dirname(key)), { recursive: true })
    return `${API_BASE}/api/parcours/_dev/${key}?mimeType=${encodeURIComponent(mimeType)}`
  }
  const [url] = await gcs().bucket(BUCKET).file(key).getSignedUrl({
    version: 'v4', action: 'write', expires: Date.now() + 15 * 60 * 1000, contentType: mimeType,
  })
  return url
}

export async function getDownloadSignedUrl(key: string): Promise<string> {
  if (IS_LOCAL_DEV) {
    return `${API_BASE}/api/parcours/_dev/${key}`
  }
  const [url] = await gcs().bucket(BUCKET).file(key).getSignedUrl({
    version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
  })
  return url
}

export async function deleteStorageFile(key: string): Promise<void> {
  if (IS_LOCAL_DEV) {
    await fs.unlink(path.join(LOCAL_UPLOAD_DIR, key)).catch(() => {})
    return
  }
  await gcs().bucket(BUCKET).file(key).delete({ ignoreNotFound: true })
}

// Écrit/lit un buffer reçu côté serveur (upload public formulaires : on ne passe
// pas par une signed URL côté client car le répondant est anonyme).
export async function saveFile(key: string, buffer: Buffer): Promise<void> {
  if (IS_LOCAL_DEV) {
    const dest = path.join(LOCAL_UPLOAD_DIR, key)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.writeFile(dest, buffer)
    return
  }
  await gcs().bucket(BUCKET).file(key).save(buffer)
}

export async function readFile(key: string): Promise<Buffer | null> {
  if (IS_LOCAL_DEV) {
    try { return await fs.readFile(path.join(LOCAL_UPLOAD_DIR, key)) } catch { return null }
  }
  try { const [buf] = await gcs().bucket(BUCKET).file(key).download(); return buf } catch { return null }
}
