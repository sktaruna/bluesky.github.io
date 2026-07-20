import { PRIMITIVES, NO_RETRY_TYPES } from '../primitives/registry'
import { createMockCall, placeholderFor } from '../primitives/mockBackend'

// Instant, no-delay mock backend for the click-through graph trace (vs.
// engine.js's paced version for the animated chat transcript).
const instantMockCall = createMockCall(0)

export function findEntryNodeId(nodes) {
  const explicit = nodes.find((n) => n.data.isEntry)
  if (explicit) return explicit.id
  return nodes[0]?.id ?? null
}

function outEdge(edges, nodeId, handle) {
  return edges.find((e) => e.source === nodeId && e.sourceHandle === handle)
}

function withoutKey(map, key) {
  if (!(key in map)) return map
  const next = { ...map }
  delete next[key]
  return next
}

// Suggests a sensible default draft value for a node that just became
// active, so the trace panel starts with something to step forward with.
export function draftValueFor(node) {
  const { type, config } = node.data
  if (type === 'collect') return placeholderFor(config.field?.name)
  if (type === 'guide' && config.reentryField) return placeholderFor(config.reentryField.name)
  if (type === 'choice') return config.options?.[0]?.id ?? null
  if (type === 'confirm') return config.actions?.[0]?.id ?? null
  return null
}

function toFlowNode(canvasNode) {
  return { id: canvasNode.id, type: canvasNode.data.type, label: canvasNode.data.label, config: canvasNode.data.config }
}

function enterNext(nextNode, prevId, datapoints) {
  return {
    status: 'running',
    activeNodeId: nextNode.id,
    prevActiveNodeId: prevId,
    datapoints,
    draftValue: draftValueFor(nextNode),
  }
}

// Executes exactly one node via the SAME `PRIMITIVES[type].execute()` the
// chat engine uses — no per-type switch/if-chain here — but with an instant
// mock backend and a `waitFor` that resolves immediately with the caller's
// draftValue instead of really pausing for user input.
export async function step({ node, nodes, edges, datapoints, draftValue, attemptCounts }) {
  const spec = PRIMITIVES[node.data.type]
  const attempt = (attemptCounts[node.id] || 0) + 1
  const flowNode = toFlowNode(node)

  const ctx = {
    datapoints,
    attempt,
    mockCall: instantMockCall,
    delay: async () => {},
    waitFor: async () => draftValue,
    pushMessage: undefined,
    updateMessage: undefined,
  }

  const result = await spec.execute(flowNode, ctx)
  const nextDatapoints = result.patch ? { ...datapoints, ...result.patch } : datapoints

  if (result.terminal) {
    return {
      status: result.terminal === 'escalate' ? 'escalated' : 'complete',
      datapoints: nextDatapoints,
      attemptCounts: withoutKey(attemptCounts, node.id),
    }
  }

  const retryCfg = !NO_RETRY_TYPES.has(node.data.type) ? node.data.config.retry : null

  if (result.failed && retryCfg) {
    if (attempt >= retryCfg.maxAttempts) {
      const clearedCounts = withoutKey(attemptCounts, node.id)
      const target = nodes.find((n) => n.id === retryCfg.onExceeded)
      if (!target) return { status: 'complete', datapoints: nextDatapoints, attemptCounts: clearedCounts }
      return { ...enterNext(target, node.id, nextDatapoints), attemptCounts: clearedCounts }
    }
    return {
      status: 'running',
      datapoints: nextDatapoints,
      draftValue: draftValueFor(node),
      attemptCounts: { ...attemptCounts, [node.id]: attempt },
    }
  }

  let outcome = result.outcome
  if (outcome == null) {
    const shape = spec.next(flowNode)
    if (shape.handles.length === 1) outcome = shape.handles[0].id
  }

  const clearedCounts = withoutKey(attemptCounts, node.id)
  const edge = outEdge(edges, node.id, outcome)
  if (!edge) return { status: 'complete', datapoints: nextDatapoints, attemptCounts: clearedCounts }
  const nextNode = nodes.find((n) => n.id === edge.target)
  if (!nextNode) return { status: 'complete', datapoints: nextDatapoints, attemptCounts: clearedCounts }

  return { ...enterNext(nextNode, node.id, nextDatapoints), attemptCounts: clearedCounts }
}
