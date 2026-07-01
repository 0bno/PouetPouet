'use client'

import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, Trash2, Zap, Globe, CheckSquare, Mail, FileText, Info, Users, Link2 } from 'lucide-react'
import type { StepDef, FlowEdge, TriggerType } from '@pouetpouet/shared'

// ─── Palette des types de nœuds ──────────────────────────────────────────────

const NODE_TYPES_DEF = [
  { type: 'info',           label: 'Info',           icon: Info,        color: 'bg-sky-500',    shape: 'rect' },
  { type: 'form',           label: 'Formulaire',     icon: FileText,    color: 'bg-violet-500', shape: 'rect' },
  { type: 'document',       label: 'Document',       icon: FileText,    color: 'bg-amber-500',  shape: 'rect' },
  { type: 'approval',       label: 'Validation',     icon: CheckSquare, color: 'bg-emerald-500',shape: 'diamond' },
  { type: 'approval-chain', label: 'Chaîne appro.',  icon: Users,       color: 'bg-emerald-600',shape: 'diamond' },
  { type: 'email',          label: 'Email',          icon: Mail,        color: 'bg-pink-500',   shape: 'rect' },
  { type: 'http',           label: 'HTTP',           icon: Globe,       color: 'bg-orange-500', shape: 'hexagon' },
  { type: 'module',         label: 'Module Pivot',   icon: Link2,       color: 'bg-indigo-500', shape: 'rect' },
] as const

type StepType = (typeof NODE_TYPES_DEF)[number]['type']

function getNodeDef(type: string) {
  return NODE_TYPES_DEF.find((n) => n.type === type) ?? NODE_TYPES_DEF[0]
}

// ─── Nœuds personnalisés ─────────────────────────────────────────────────────

type StepNodeData = {
  step: StepDef
  index: number
  onChange: (s: StepDef) => void
  onDelete: () => void
}

function RectNode({ data, selected }: NodeProps<Node<StepNodeData>>) {
  const def = getNodeDef(data.step.type)
  const Icon = def.icon
  return (
    <div className={`relative min-w-[160px] rounded-xl border-2 bg-white dark:bg-gray-900 shadow-lg transition-all ${selected ? 'border-cyan-500' : 'border-gray-200 dark:border-gray-700'}`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`flex-shrink-0 w-7 h-7 rounded-lg ${def.color} flex items-center justify-center`}>
          <Icon size={14} className="text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{def.label}</p>
          <p className="text-sm font-semibold dark:text-white truncate max-w-[120px]">{data.step.title || <span className="italic text-gray-400">Sans titre</span>}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  )
}

function DiamondNode({ data, selected }: NodeProps<Node<StepNodeData>>) {
  const def = getNodeDef(data.step.type)
  const Icon = def.icon
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 100 }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
      <div
        className={`absolute inset-0 rotate-45 rounded-lg border-2 ${selected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : `border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20`}`}
        style={{ transform: 'rotate(45deg)' }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1 px-2">
        <span className={`w-7 h-7 rounded-lg ${def.color} flex items-center justify-center`}>
          <Icon size={14} className="text-white" />
        </span>
        <p className="text-xs font-semibold dark:text-white text-center leading-tight">{data.step.title || <span className="italic text-gray-400">Validation</span>}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
      <Handle type="source" id="false" position={Position.Right} className="!w-3 !h-3 !bg-red-400" />
    </div>
  )
}

function HexagonNode({ data, selected }: NodeProps<Node<StepNodeData>>) {
  const def = getNodeDef(data.step.type)
  const Icon = def.icon
  return (
    <div className="relative flex items-center justify-center" style={{ width: 150, height: 86 }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 150 86" fill="none">
        <path
          d="M37.5 2 L112.5 2 L150 43 L112.5 84 L37.5 84 L0 43 Z"
          className={selected ? 'fill-orange-100 stroke-cyan-500 dark:fill-orange-900/30' : 'fill-orange-50 stroke-orange-300 dark:fill-orange-900/20 dark:stroke-orange-600'}
          strokeWidth="2"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-1">
        <span className={`w-7 h-7 rounded-lg ${def.color} flex items-center justify-center`}>
          <Icon size={14} className="text-white" />
        </span>
        <p className="text-xs font-semibold dark:text-white text-center">{data.step.title || 'HTTP'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  )
}

function TriggerNode({ data: _data, selected }: NodeProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white dark:bg-gray-900 shadow ${selected ? 'border-cyan-500' : 'border-gray-300 dark:border-gray-600'}`}>
      <Zap size={16} className="text-yellow-500" />
      <span className="text-sm font-semibold dark:text-white">Déclencheur</span>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  )
}

function EndNode({ data: _data, selected }: NodeProps) {
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 bg-white dark:bg-gray-900 shadow ${selected ? 'border-cyan-500' : 'border-gray-400 dark:border-gray-600'}`}>
      <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-500" />
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  )
}

const CUSTOM_NODE_TYPES = {
  trigger: TriggerNode,
  rect: RectNode,
  diamond: DiamondNode,
  hexagon: HexagonNode,
  end: EndNode,
}

// ─── Conversion steps ↔ nodes/edges ──────────────────────────────────────────

function stepsToNodes(steps: StepDef[], onStepChange: (idx: number, s: StepDef) => void, onStepDelete: (idx: number) => void): Node[] {
  const nodes: Node[] = [
    { id: 'trigger', type: 'trigger', position: { x: 200, y: 20 }, data: {} },
  ]
  steps.forEach((step, idx) => {
    const def = getNodeDef(step.type)
    const shape = def.shape as 'rect' | 'diamond' | 'hexagon'
    nodes.push({
      id: String(idx),
      type: shape,
      position: { x: 200, y: 120 + idx * 140 },
      data: {
        step,
        index: idx,
        onChange: (s: StepDef) => onStepChange(idx, s),
        onDelete: () => onStepDelete(idx),
      },
    })
  })
  nodes.push({ id: 'end', type: 'end', position: { x: 220, y: 120 + steps.length * 140 }, data: {} })
  return nodes
}

function flowEdgesToRfEdges(flowEdges: FlowEdge[]): Edge[] {
  return flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.condition ? `${e.condition.field} ${e.condition.operator} ${e.condition.value}` : (e.label ?? undefined),
    animated: !!e.condition,
    style: { stroke: e.condition ? '#f59e0b' : '#6b7280' },
  }))
}

function rfEdgesToFlowEdges(rfEdges: Edge[]): FlowEdge[] {
  return rfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: typeof e.label === 'string' ? e.label : undefined,
  }))
}

// ─── Panneau d'édition de nœud ────────────────────────────────────────────────

function StepEditor({ step, onSave }: { step: StepDef; onSave: (s: StepDef) => void }) {
  const [draft, setDraft] = useState(step)
  const up = (patch: Partial<StepDef>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
        <select
          value={draft.type}
          onChange={(e) => up({ type: e.target.value as StepDef['type'] })}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
        >
          {NODE_TYPES_DEF.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Titre <span className="text-red-500">*</span></label>
        <input
          value={draft.title}
          onChange={(e) => up({ title: e.target.value })}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
        />
      </div>
      {draft.type !== 'http' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigné à (userId)</label>
          <input
            value={draft.assignedTo ?? ''}
            onChange={(e) => up({ assignedTo: e.target.value || undefined })}
            placeholder="userId…"
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}
      {draft.type === 'http' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Méthode</label>
            <select value={draft.httpMethod ?? 'GET'} onChange={(e) => up({ httpMethod: e.target.value as StepDef['httpMethod'] })}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white">
              {['GET','POST','PUT','PATCH','DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">URL</label>
            <input value={draft.httpUrl ?? ''} onChange={(e) => up({ httpUrl: e.target.value })} placeholder="https://…"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Clé de sortie (output key)</label>
            <input value={draft.httpOutputKey ?? ''} onChange={(e) => up({ httpOutputKey: e.target.value || undefined })} placeholder="Ex: status"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" />
          </div>
        </>
      )}
      {draft.type === 'approval-chain' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Approbateurs (userId, un par ligne)</label>
          <textarea
            rows={3}
            value={(draft.approvers ?? []).join('\n')}
            onChange={(e) => up({ approvers: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white resize-none font-mono"
          />
        </div>
      )}
      {(draft.type === 'info' || draft.type === 'email') && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Corps</label>
          <textarea rows={3} value={draft.body ?? ''} onChange={(e) => up({ body: e.target.value || undefined })}
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white resize-none" />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SLA (jours)</label>
        <input type="number" min={0} value={draft.slaDays ?? ''} onChange={(e) => up({ slaDays: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" />
      </div>
      <button onClick={() => onSave(draft)}
        className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-colors">
        Appliquer
      </button>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  steps: StepDef[]
  flowEdges: FlowEdge[]
  triggerType: TriggerType
  triggerConfig: { formId?: string }
  onChange: (steps: StepDef[], flowEdges: FlowEdge[], triggerType: TriggerType, triggerConfig: { formId?: string }) => void
}

export function FlowBuilder({ steps, flowEdges, triggerType, triggerConfig, onChange }: Props) {
  const nextIdRef = useRef(steps.length)

  const handleStepChange = useCallback((idx: number, s: StepDef) => {
    const next = [...steps]
    next[idx] = s
    onChange(next, flowEdges, triggerType, triggerConfig)
  }, [steps, flowEdges, triggerType, triggerConfig, onChange])

  const handleStepDelete = useCallback((idx: number) => {
    const next = steps.filter((_, i) => i !== idx)
    const cleanEdges = flowEdges.filter((e) => e.source !== String(idx) && e.target !== String(idx))
    onChange(next, cleanEdges, triggerType, triggerConfig)
  }, [steps, flowEdges, triggerType, triggerConfig, onChange])

  const [nodes, setNodes, onNodesChange] = useNodesState(
    stepsToNodes(steps, handleStepChange, handleStepDelete)
  )
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowEdgesToRfEdges(flowEdges))
  const [selectedStep, setSelectedStep] = useState<{ idx: number; step: StepDef } | null>(null)

  const onConnect = useCallback((params: Connection) => {
    setRfEdges((es) => {
      const next = addEdge({ ...params, style: { stroke: '#6b7280' } }, es)
      onChange(steps, rfEdgesToFlowEdges(next), triggerType, triggerConfig)
      return next
    })
  }, [steps, triggerType, triggerConfig, onChange])

  function addStep(type: StepType) {
    const newStep: StepDef = { type, title: '' }
    const idx = steps.length
    nextIdRef.current = idx + 1
    const nextSteps = [...steps, newStep]
    const updatedNodes = stepsToNodes(nextSteps, handleStepChange, handleStepDelete)
    setNodes(updatedNodes)
    onChange(nextSteps, flowEdges, triggerType, triggerConfig)
    setSelectedStep({ idx, step: newStep })
  }

  function handleNodeClick(_: React.MouseEvent, node: Node) {
    if (node.type === 'trigger' || node.type === 'end') return
    const idx = parseInt(node.id, 10)
    if (!isNaN(idx) && steps[idx]) setSelectedStep({ idx, step: steps[idx] })
  }

  function handleSaveStep(s: StepDef) {
    if (selectedStep === null) return
    const next = [...steps]
    next[selectedStep.idx] = s
    const updatedNodes = stepsToNodes(next, handleStepChange, handleStepDelete)
    setNodes(updatedNodes)
    onChange(next, flowEdges, triggerType, triggerConfig)
    setSelectedStep({ idx: selectedStep.idx, step: s })
  }

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Canvas */}
      <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-950">
        <ReactFlow
          nodes={nodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={CUSTOM_NODE_TYPES}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} className="opacity-30" />
          <Controls className="!bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow" />
          <MiniMap className="!bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700 !rounded-xl" />
        </ReactFlow>
      </div>

      {/* Panneau latéral */}
      <div className="w-64 flex flex-col gap-4 overflow-y-auto">
        {/* Déclencheur */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Déclencheur</h3>
          <select
            value={triggerType}
            onChange={(e) => onChange(steps, flowEdges, e.target.value as TriggerType, triggerConfig)}
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white mb-2"
          >
            <option value="manual">Manuel</option>
            <option value="form_response">Réponse formulaire</option>
          </select>
          {triggerType === 'form_response' && (
            <input
              value={triggerConfig.formId ?? ''}
              onChange={(e) => onChange(steps, flowEdges, triggerType, { formId: e.target.value || undefined })}
              placeholder="ID du formulaire…"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
            />
          )}
        </div>

        {/* Palette */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Plus size={13} /> Ajouter une étape
          </h3>
          <div className="flex flex-col gap-1.5">
            {NODE_TYPES_DEF.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.type}
                  onClick={() => addStep(t.type as StepType)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors group"
                >
                  <span className={`w-7 h-7 rounded-lg ${t.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={13} className="text-white" />
                  </span>
                  <span className="text-sm font-medium dark:text-white">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Éditeur de nœud sélectionné */}
        {selectedStep && (
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">Étape {selectedStep.idx + 1}</h3>
              <button onClick={() => { handleStepDelete(selectedStep.idx); setSelectedStep(null) }}
                className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            <StepEditor step={selectedStep.step} onSave={handleSaveStep} />
          </div>
        )}
      </div>
    </div>
  )
}
