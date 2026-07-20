import { PRIMITIVES } from '../primitives/registry'
import { nextId } from '../utils/id'

export function createNode(type, position) {
  const id = nextId(type)
  const spec = PRIMITIVES[type]
  const data = { type, label: spec.meta.label, config: spec.defaultConfig() }
  return { id, type: 'capNode', position, data }
}

export function removeNode(nodes, edges, nodeId) {
  const nextNodes = nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => {
      const spec = PRIMITIVES[n.data.type]
      if (spec?.canvas.inlineTarget && n.data.config.target === nodeId) {
        return { ...n, data: { ...n.data, config: { ...n.data.config, target: null } } }
      }
      return n
    })
  const nextEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
  return { nodes: nextNodes, edges: nextEdges }
}

export function updateNodeData(nodes, nodeId, patch) {
  return nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))
}

export function updateNodeConfig(nodes, nodeId, configPatch) {
  return nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...configPatch } } } : n))
}

// Generic replacement for the old `syncGotoEdge` — keyed off
// `spec.canvas.inlineTarget` instead of a hardcoded goto check, so any
// primitive that declares an inline-target handle gets the same wiring.
// Currently only `goto` declares one, driven by its `target` config field.
export function setInlineTarget(nodes, edges, nodeId, targetId) {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return { nodes, edges }
  const spec = PRIMITIVES[node.data.type]
  const handleId = spec?.next({ config: node.data.config }).handles[0]?.id || 'target'

  const nextNodes = updateNodeConfig(nodes, nodeId, { target: targetId })
  const withoutOld = edges.filter((e) => !(e.source === nodeId && e.data?.isInlineTarget))
  if (!targetId) return { nodes: nextNodes, edges: withoutOld }

  return {
    nodes: nextNodes,
    edges: [
      ...withoutOld,
      {
        id: `e_${nodeId}_${handleId}_${targetId}`,
        source: nodeId,
        target: targetId,
        sourceHandle: handleId,
        type: 'capEdge',
        data: { isInlineTarget: true },
      },
    ],
  }
}

export function addOrReplaceEdge(edges, connection) {
  const handle = connection.sourceHandle || 'out'
  // A given output handle drives exactly one edge — connecting again replaces it.
  const withoutExisting = edges.filter((e) => !(e.source === connection.source && e.sourceHandle === handle))
  return [
    ...withoutExisting,
    {
      id: `e_${connection.source}_${handle}_${connection.target}_${nextId('edge')}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: handle,
      type: 'capEdge',
      data: { isInlineTarget: false },
    },
  ]
}
