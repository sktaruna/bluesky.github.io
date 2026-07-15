import { PRIMITIVE, DO_MODE, SET_MODE } from '../constants/primitives'
import { evaluateCondition } from '../utils/condition'
import { outcomeDatapointName } from '../utils/slug'

export function findEntryNodeId(nodes) {
  const explicit = nodes.find((n) => n.data.isEntry)
  if (explicit) return explicit.id
  // Fall back to a node nothing points to.
  const targeted = new Set(nodes.flatMap((n) => []))
  return nodes[0]?.id ?? null
}

function outEdge(edges, nodeId, handle = 'out') {
  return edges.find((e) => e.source === nodeId && e.sourceHandle === handle)
}

// Mock value generation — deterministic-ish placeholders for the click-through trace.
export function mockAskPlaceholder(datapoint) {
  const known = {
    order_number: 'ORD-58213',
    order_id: 'ORD-58213',
    request_type_choice: 'Reschedule delivery date',
    chosen_delivery_slot: '2026-07-14',
    confirm_reschedule: 'confirmed',
  }
  return known[datapoint] || `sample_${datapoint}`
}

export function computeSetValue(config) {
  if (config.mode === SET_MODE.EXACT) return config.value
  return `‹inferred: ${config.reasoning || 'unspecified'}›`
}

// Applies a Do node's mocked effects to datapoints, returning a new datapoints object.
export function applyDoEffects(node, datapoints) {
  const { config } = node.data
  if (config.mode === DO_MODE.ACTION) {
    let next = datapoints
    for (const action of config.actions || []) {
      for (const out of action.mockOutputs || []) {
        if (!out.datapoint) continue
        next = { ...next, [out.datapoint]: coerceMock(out.value) }
      }
    }
    if (config.outcomes?.length) {
      const picked = config.mockOutcome || config.outcomes[0]
      next = { ...next, [outcomeDatapointName(node.data.label)]: picked }
    }
    return next
  }
  if (config.mode === DO_MODE.SUBPROCEDURE) {
    let next = datapoints
    for (const binding of config.subprocedure?.outputBindings || []) {
      if (!binding.parentDatapoint) continue
      next = { ...next, [binding.parentDatapoint]: coerceMock(`‹${config.subprocedure.name || 'sub_procedure'}.${binding.outputName}›`) }
    }
    return next
  }
  return datapoints
}

function coerceMock(value) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value
}

// Resolves what happens after a node is active. Returns:
//   { kind: 'advance', nextId, resolvedHandle? }
//   { kind: 'complete' } | { kind: 'escalated' } | { kind: 'dead-end' }
export function resolveOutcome(node, nodes, edges, datapoints) {
  const { primitive, config } = node.data

  if (primitive === PRIMITIVE.SAY || primitive === PRIMITIVE.ASK || primitive === PRIMITIVE.SET) {
    const e = outEdge(edges, node.id)
    return e ? { kind: 'advance', nextId: e.target } : { kind: 'dead-end' }
  }

  if (primitive === PRIMITIVE.DO) {
    if (config.mode === DO_MODE.ESCALATE) return { kind: 'escalated' }
    if (config.mode === DO_MODE.FINISH) return { kind: 'complete' }
    const e = outEdge(edges, node.id)
    return e ? { kind: 'advance', nextId: e.target } : { kind: 'dead-end' }
  }

  if (primitive === PRIMITIVE.GOTO) {
    if (!config.targetId || !nodes.some((n) => n.id === config.targetId)) return { kind: 'dead-end' }
    return { kind: 'advance', nextId: config.targetId }
  }

  if (primitive === PRIMITIVE.BRANCH) {
    const branches = node.data.branches || []
    const nonDefault = branches.filter((b) => !b.isDefault)
    const chosen = nonDefault.find((b) => evaluateCondition(b.condition, datapoints)) || branches.find((b) => b.isDefault)
    if (!chosen) return { kind: 'dead-end' }
    const e = outEdge(edges, node.id, chosen.id)
    if (!e) return { kind: 'dead-end' }
    return { kind: 'advance', nextId: e.target, resolvedHandle: chosen.id }
  }

  return { kind: 'dead-end' }
}
