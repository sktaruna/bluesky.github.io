import { RESCHEDULE_FLOW } from '../flows/reschedule'

// Thin adapter: maps the shared flow's plain node/edge shape onto xyflow's
// node/edge shape. This is now the entire graph-editor-specific surface for
// Reschedule Delivery — the actual step vocabulary lives in registry.js and
// the actual content lives in flows/reschedule.js.
export function buildRescheduleGraph() {
  const nodes = RESCHEDULE_FLOW.nodes.map((n, i) => ({
    id: n.id,
    type: 'capNode',
    position: n.position || { x: 0, y: 0 },
    data: { type: n.type, label: n.label, config: n.config, isEntry: n.id === RESCHEDULE_FLOW.entry || i === 0 },
  }))

  const edges = RESCHEDULE_FLOW.edges.map((e) => ({
    id: `e_${e.source}_${e.sourceHandle}_${e.target}`,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    type: 'capEdge',
    data: { isInlineTarget: e.sourceHandle === 'target' },
  }))

  return { nodes, edges, initialDatapoints: RESCHEDULE_FLOW.initialDatapoints || {} }
}
