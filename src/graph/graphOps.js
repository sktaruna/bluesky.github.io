import { PRIMITIVE, defaultConfigFor } from '../constants/primitives'
import { nextId } from '../utils/id'

export function createNode(primitive, position) {
  const id = nextId(primitive)
  const data = {
    primitive,
    label: PRIMITIVE_DEFAULT_LABEL[primitive] || 'New node',
    config: defaultConfigFor(primitive),
  }
  if (primitive === PRIMITIVE.BRANCH) {
    data.branches = [
      { id: nextId('branch'), condition: 'condition == true', isDefault: false },
      { id: nextId('branch'), condition: 'else', isDefault: true },
    ]
  }
  return { id, type: 'capNode', position, data }
}

const PRIMITIVE_DEFAULT_LABEL = {
  [PRIMITIVE.SAY]: 'Say',
  [PRIMITIVE.ASK]: 'Ask',
  [PRIMITIVE.SET]: 'Set',
  [PRIMITIVE.DO]: 'Do / Run',
  [PRIMITIVE.BRANCH]: 'If / Branch',
  [PRIMITIVE.GOTO]: 'Go To',
}

export function removeNode(nodes, edges, nodeId) {
  const nextNodes = nodes
    .filter((n) => n.id !== nodeId)
    .map((n) =>
      n.data.primitive === PRIMITIVE.GOTO && n.data.config.targetId === nodeId
        ? { ...n, data: { ...n.data, config: { ...n.data.config, targetId: null } } }
        : n,
    )
  const nextEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
  return { nodes: nextNodes, edges: nextEdges }
}

export function updateNodeData(nodes, nodeId, patch) {
  return nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))
}

export function updateNodeConfig(nodes, nodeId, configPatch) {
  return nodes.map((n) =>
    n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...configPatch } } } : n,
  )
}

export function addBranch(nodes, nodeId) {
  return nodes.map((n) => {
    if (n.id !== nodeId) return n
    const branches = [...n.data.branches]
    const newBranch = { id: nextId('branch'), condition: 'condition == true', isDefault: false }
    // Insert before the default (last) branch so default stays last.
    const defaultIdx = branches.findIndex((b) => b.isDefault)
    if (defaultIdx === -1) branches.push(newBranch)
    else branches.splice(defaultIdx, 0, newBranch)
    return { ...n, data: { ...n.data, branches } }
  })
}

export function removeBranch(nodes, edges, nodeId, branchId) {
  const nextNodes = nodes.map((n) => {
    if (n.id !== nodeId) return n
    const branches = n.data.branches.filter((b) => b.id !== branchId)
    if (branches.length && !branches.some((b) => b.isDefault)) {
      branches[branches.length - 1] = { ...branches[branches.length - 1], isDefault: true }
    }
    return { ...n, data: { ...n.data, branches } }
  })
  const nextEdges = edges.filter((e) => !(e.source === nodeId && e.sourceHandle === branchId))
  return { nodes: nextNodes, edges: nextEdges }
}

export function updateBranch(nodes, nodeId, branchId, patch) {
  return nodes.map((n) => {
    if (n.id !== nodeId) return n
    let branches = n.data.branches.map((b) => (b.id === branchId ? { ...b, ...patch } : b))
    if (patch.isDefault) {
      branches = branches.map((b) => (b.id === branchId ? b : { ...b, isDefault: false }))
    }
    return { ...n, data: { ...n.data, branches } }
  })
}

export function syncGotoEdge(nodes, edges, gotoNodeId, targetId) {
  const withoutOld = edges.filter((e) => !(e.source === gotoNodeId && e.data?.isGoto))
  if (!targetId) return withoutOld
  return [
    ...withoutOld,
    {
      id: `e_${gotoNodeId}_out_${targetId}`,
      source: gotoNodeId,
      target: targetId,
      sourceHandle: 'out',
      type: 'capEdge',
      data: { isGoto: true },
    },
  ]
}

export function addOrReplaceEdge(edges, connection, isBranchDefault = false) {
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
      data: { isGoto: false, isDefault: isBranchDefault },
    },
  ]
}
