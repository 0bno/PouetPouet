export type SkipIfDef = { field: string; operator: 'eq' | 'neq' | 'contains'; value: string }
export type FlowEdgeDef = { id: string; source: string; target: string; condition?: SkipIfDef; label?: string }

export type ModuleStepDef = {
  type?: string
  assignedTo?: string
  slaDays?: number
  skipIf?: SkipIfDef
  moduleAction?: 'create_board' | 'create_meeting' | 'create_daily' | 'create_scrum'
  moduleParams?: { title?: string }
  httpMethod?: string
  httpUrl?: string
  httpHeaders?: Record<string, string>
  httpBody?: string
  httpOutputKey?: string
  approvers?: string[]
  requireAll?: boolean
  aiPrompt?: string
  aiSystemPrompt?: string
  aiModel?: string
  aiOutputKey?: string
}

export function evalCondition(cond: SkipIfDef, data: Record<string, unknown>): boolean {
  const val = String(data[cond.field] ?? '')
  switch (cond.operator) {
    case 'eq': return val === cond.value
    case 'neq': return val !== cond.value
    case 'contains': return val.includes(cond.value)
  }
}

export function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(data[k] ?? ''))
}

export async function executeHttpStep(
  step: ModuleStepDef,
  instanceData: Record<string, unknown>,
): Promise<{ outputKey: string | null; output: unknown }> {
  const url = interpolate(step.httpUrl ?? '', instanceData)
  if (!url) return { outputKey: null, output: null }
  const method = step.httpMethod ?? 'GET'
  const body = step.httpBody ? interpolate(step.httpBody, instanceData) : undefined
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(step.httpHeaders ?? {}) }
  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body } : {}),
  })
  let output: unknown = null
  try { output = await res.json() } catch { output = await res.text().catch(() => null) }
  return { outputKey: step.httpOutputKey ?? null, output }
}

export async function executeAiStep(
  step: ModuleStepDef,
  instanceData: Record<string, unknown>,
  apiKey?: string,
): Promise<{ outputKey: string | null; output: unknown }> {
  if (!apiKey) return { outputKey: null, output: null }
  const prompt = interpolate(step.aiPrompt ?? '', instanceData)
  if (!prompt) return { outputKey: null, output: null }
  const model = step.aiModel ?? 'claude-haiku-4-5-20251001'
  const systemPrompt = step.aiSystemPrompt ? interpolate(step.aiSystemPrompt, instanceData) : undefined
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const json = (await res.json()) as { content?: { type: string; text: string }[] }
  const output = json.content?.[0]?.text ?? null
  return { outputKey: step.aiOutputKey ?? null, output }
}

export function resolveNextStep(
  currentIdx: number,
  steps: ModuleStepDef[],
  flowEdges: FlowEdgeDef[],
  statuses: Map<number, string>,
  instanceData: Record<string, unknown>,
): number {
  const edgesFromCurrent = flowEdges.filter((e) => e.source === String(currentIdx))
  if (edgesFromCurrent.length === 0) {
    for (let i = currentIdx + 1; i < steps.length; i++) {
      const st = statuses.get(i)
      if (st !== 'COMPLETED' && st !== 'SKIPPED') return i
    }
    return steps.length
  }
  const condEdges = edgesFromCurrent.filter((e) => e.condition)
  const uncondEdges = edgesFromCurrent.filter((e) => !e.condition)
  for (const edge of condEdges) {
    if (edge.condition && evalCondition(edge.condition, instanceData)) return parseInt(edge.target, 10)
  }
  if (uncondEdges.length > 0) return parseInt(uncondEdges[0].target, 10)
  return steps.length
}
