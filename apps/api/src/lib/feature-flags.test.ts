import { describe, it, expect } from 'vitest'
import { hashPercent, evaluateOverride, isAdminEmail } from './feature-flags.js'

describe('hashPercent', () => {
  it('est déterministe et dans [0,100)', () => {
    const a = hashPercent('user1:flag')
    expect(a).toBe(hashPercent('user1:flag'))
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(100)
  })
  it('disperse les valeurs selon la graine', () => {
    const values = Array.from({ length: 200 }, (_, i) => hashPercent(`u${i}:flag`))
    expect(new Set(values).size).toBeGreaterThan(50)
  })
})

describe('evaluateOverride', () => {
  it('false si désactivé', () => {
    expect(evaluateOverride({ enabled: false, rolloutPercent: 100, whitelist: [] }, 'u', 'k')).toBe(false)
  })
  it('true pour tous à 100% (y compris anonyme)', () => {
    const o = { enabled: true, rolloutPercent: 100, whitelist: [] }
    expect(evaluateOverride(o, 'u', 'k')).toBe(true)
    expect(evaluateOverride(o, null, 'k')).toBe(true)
  })
  it('false à 0% sauf whitelist', () => {
    expect(evaluateOverride({ enabled: true, rolloutPercent: 0, whitelist: [] }, 'u', 'k')).toBe(false)
    const wl = { enabled: true, rolloutPercent: 0, whitelist: ['vip'] }
    expect(evaluateOverride(wl, 'vip', 'k')).toBe(true)
    expect(evaluateOverride(wl, 'other', 'k')).toBe(false)
  })
  it('anonyme exclu du rollout partiel', () => {
    expect(evaluateOverride({ enabled: true, rolloutPercent: 50, whitelist: [] }, null, 'k')).toBe(false)
  })
  it('rollout partiel déterministe par utilisateur', () => {
    const o = { enabled: true, rolloutPercent: 50, whitelist: [] }
    const first = evaluateOverride(o, 'stable-user', 'k')
    expect(evaluateOverride(o, 'stable-user', 'k')).toBe(first)
  })
  it('la part activée approche le pourcentage sur un grand échantillon', () => {
    const o = { enabled: true, rolloutPercent: 30, whitelist: [] }
    const n = 2000
    let on = 0
    for (let i = 0; i < n; i++) if (evaluateOverride(o, `user-${i}`, 'flag')) on++
    const ratio = on / n
    expect(ratio).toBeGreaterThan(0.22)
    expect(ratio).toBeLessThan(0.38)
  })
})

describe('isAdminEmail', () => {
  it('false pour vide / null', () => {
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
  })
})
