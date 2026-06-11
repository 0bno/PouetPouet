import { describe, it, expect } from 'vitest'
import {
  countWorkingDays,
  absenceWorkingDays,
  computeMemberCapacity,
  computeEventCapacity,
  summarizeHistory,
  type CapacityEvent,
  type CapacityEventMember,
} from './capacity'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CapacityEvent> = {}): CapacityEvent {
  return {
    id: 'ev1',
    name: 'Sprint 1',
    ownerId: 'u1',
    teamId: null,
    parentId: null,
    type: 'SPRINT',
    status: 'PLANNING',
    startDate: '2026-01-05', // Monday
    endDate: '2026-01-09',   // Friday  → 5 working days
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    focusFactor: 0.8,
    pointsPerPersonDay: null,
    committedPoints: null,
    completedPoints: null,
    notes: null,
    members: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeMember(overrides: Partial<CapacityEventMember> = {}): CapacityEventMember {
  return {
    id: 'm1',
    eventId: 'ev1',
    name: 'Alice',
    role: 'Dev',
    fte: 1,
    focusFactor: null,
    order: 0,
    absences: [],
    ...overrides,
  }
}

// ── countWorkingDays ──────────────────────────────────────────────────────────

describe('countWorkingDays', () => {
  it('counts 5 working days for a Mon–Fri week', () => {
    expect(countWorkingDays('2026-01-05', '2026-01-09', [1, 2, 3, 4, 5])).toBe(5)
  })

  it('counts 0 when start > end', () => {
    expect(countWorkingDays('2026-01-09', '2026-01-05', [1, 2, 3, 4, 5])).toBe(0)
  })

  it('counts 1 when start === end and it is a working day', () => {
    expect(countWorkingDays('2026-01-05', '2026-01-05', [1, 2, 3, 4, 5])).toBe(1)
  })

  it('counts 0 when start === end and it is not a working day (Sunday)', () => {
    expect(countWorkingDays('2026-01-04', '2026-01-04', [1, 2, 3, 4, 5])).toBe(0)
  })

  it('handles a 4-day week (Mon–Thu)', () => {
    // Week of Jan 5–9: Mon–Thu = 4 days
    expect(countWorkingDays('2026-01-05', '2026-01-09', [1, 2, 3, 4])).toBe(4)
  })

  it('counts 10 days over two full Mon–Fri weeks', () => {
    expect(countWorkingDays('2026-01-05', '2026-01-16', [1, 2, 3, 4, 5])).toBe(10)
  })
})

// ── absenceWorkingDays ────────────────────────────────────────────────────────

describe('absenceWorkingDays', () => {
  const event = makeEvent()

  it('counts absence that exactly covers the event period', () => {
    const absence = { startDate: '2026-01-05', endDate: '2026-01-09' }
    expect(absenceWorkingDays(absence, event)).toBe(5)
  })

  it('clips absence extending before the event start', () => {
    const absence = { startDate: '2026-01-01', endDate: '2026-01-07' }
    // Jan 5 Mon, 6 Tue, 7 Wed = 3
    expect(absenceWorkingDays(absence, event)).toBe(3)
  })

  it('clips absence extending past the event end', () => {
    const absence = { startDate: '2026-01-07', endDate: '2026-01-15' }
    // Jan 7 Wed, 8 Thu, 9 Fri = 3
    expect(absenceWorkingDays(absence, event)).toBe(3)
  })

  it('returns 0 when absence is entirely outside the event', () => {
    const absence = { startDate: '2026-01-12', endDate: '2026-01-14' }
    expect(absenceWorkingDays(absence, event)).toBe(0)
  })
})

// ── computeMemberCapacity ─────────────────────────────────────────────────────

describe('computeMemberCapacity', () => {
  it('computes full-time member with no absences', () => {
    const event = makeEvent()
    const member = makeMember({ fte: 1 })
    const cap = computeMemberCapacity(member, event)
    expect(cap.netPersonDays).toBe(5)          // 5 working days × 1 fte
    expect(cap.hours).toBe(32)                  // 5 × 8h × 0.8 focus
    expect(cap.points).toBeNull()
    expect(cap.absentDays).toBe(0)
  })

  it('computes half-time member', () => {
    const event = makeEvent()
    const member = makeMember({ fte: 0.5 })
    const cap = computeMemberCapacity(member, event)
    expect(cap.netPersonDays).toBe(2.5)
    expect(cap.hours).toBe(16)
  })

  it('applies member-level focusFactor over event default', () => {
    const event = makeEvent({ focusFactor: 0.8 })
    const member = makeMember({ fte: 1, focusFactor: 0.6 })
    const cap = computeMemberCapacity(member, event)
    expect(cap.effectiveFocus).toBe(0.6)
    expect(cap.hours).toBeCloseTo(5 * 8 * 0.6)
  })

  it('deducts absences weighted by fraction', () => {
    const event = makeEvent()
    const member = makeMember({
      fte: 1,
      absences: [{
        id: 'a1',
        eventMemberId: 'm1',
        startDate: '2026-01-05',
        endDate: '2026-01-06', // Mon + Tue = 2 days
        fraction: 0.5,         // half-day absence each → deducts 1 day
        reason: null,
        createdAt: '2026-01-01T00:00:00Z',
      }],
    })
    const cap = computeMemberCapacity(member, event)
    expect(cap.absentDays).toBe(1)     // 2 days × 0.5 fraction
    expect(cap.netPersonDays).toBe(4)  // 5 - 1
    expect(cap.hours).toBe(25.6)       // 4 × 8 × 0.8
  })

  it('computes story points when pointsPerPersonDay is set', () => {
    const event = makeEvent({ pointsPerPersonDay: 3 })
    const member = makeMember({ fte: 1 })
    const cap = computeMemberCapacity(member, event)
    expect(cap.points).toBe(15) // 5 days × 3 pts
  })
})

// ── computeEventCapacity ──────────────────────────────────────────────────────

describe('computeEventCapacity', () => {
  it('sums totals across two members', () => {
    const event = makeEvent({
      members: [
        makeMember({ id: 'm1', name: 'Alice', fte: 1, order: 0 }),
        makeMember({ id: 'm2', name: 'Bob', fte: 0.5, order: 1 }),
      ],
    })
    const cap = computeEventCapacity(event)
    expect(cap.totalWorkingDays).toBe(5)
    expect(cap.totalNetPersonDays).toBe(7.5)  // 5 + 2.5
    expect(cap.totalHours).toBe(48)           // (5 × 8 × 0.8) + (2.5 × 8 × 0.8) = 32 + 20
    expect(cap.totalPoints).toBeNull()
  })

  it('computes loadRatio from committedPoints', () => {
    const event = makeEvent({
      pointsPerPersonDay: 2,
      committedPoints: 12,
      members: [makeMember({ fte: 1 })],
    })
    const cap = computeEventCapacity(event) // totalPoints = 5 × 2 = 10
    expect(cap.totalPoints).toBe(10)
    expect(cap.loadRatio).toBe(1.2) // 12 / 10
  })

  it('computes predictability from committed and completed', () => {
    const event = makeEvent({
      committedPoints: 20,
      completedPoints: 18,
      members: [],
    })
    const cap = computeEventCapacity(event)
    expect(cap.predictability).toBe(0.9) // 18 / 20
  })

  it('loadRatio is null when totalPoints is null', () => {
    const event = makeEvent({ members: [makeMember()], committedPoints: 10 })
    const cap = computeEventCapacity(event)
    expect(cap.loadRatio).toBeNull()
  })
})

// ── summarizeHistory ──────────────────────────────────────────────────────────

describe('summarizeHistory', () => {
  it('returns nulls when history is empty', () => {
    const current = makeEvent({ members: [makeMember()] })
    const s = summarizeHistory([], current)
    expect(s.avgVelocity).toBeNull()
    expect(s.avgPredictability).toBeNull()
    expect(s.forecastPoints).toBeNull()
  })

  it('computes weighted average velocity from multiple sprints', () => {
    const past1 = makeEvent({
      id: 'e2', completedPoints: 10, committedPoints: 10,
      members: [makeMember({ id: 'p1' })], // 5 net person-days → velocity = 2
    })
    const past2 = makeEvent({
      id: 'e3', completedPoints: 20, committedPoints: 20,
      startDate: '2026-01-05', endDate: '2026-01-16', // 10 working days
      members: [makeMember({ id: 'p2' })], // 10 net person-days → velocity = 2
    })
    const current = makeEvent({ members: [makeMember()] }) // 5 person-days
    const s = summarizeHistory([past1, past2], current)
    expect(s.avgVelocity).toBe(2) // both sprints have velocity 2
    expect(s.forecastPoints).toBe(10) // 5 × 2
  })

  it('forecasts null when all past events have no completedPoints', () => {
    const past = makeEvent({ id: 'p', completedPoints: null, members: [makeMember()] })
    const current = makeEvent({ members: [makeMember()] })
    const s = summarizeHistory([past], current)
    expect(s.avgVelocity).toBeNull()
    expect(s.forecastPoints).toBeNull()
  })
})
