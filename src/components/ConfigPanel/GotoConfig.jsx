export default function GotoConfig({ node, nodes, graphOps }) {
  const options = nodes.filter((n) => n.id !== node.id)

  return (
    <div className="field-group">
      <label className="field-label">Target node</label>
      <p className="field-hint">Jump execution directly to this node — enables loops and non-linear flow.</p>
      <select
        value={node.data.config.targetId || ''}
        onChange={(e) => graphOps.setGotoTarget(e.target.value || null)}
      >
        <option value="">— choose a node —</option>
        {options.map((n) => (
          <option key={n.id} value={n.id}>
            {n.data.label} ({n.id})
          </option>
        ))}
      </select>
    </div>
  )
}
