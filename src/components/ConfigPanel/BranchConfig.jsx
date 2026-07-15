import { PRIMITIVE, DO_MODE } from '../../constants/primitives'
import { outcomeDatapointName } from '../../utils/slug'
import { PlusIcon, TrashIcon } from '../icons'

export default function BranchConfig({ node, nodes, edges, graphOps }) {
  const branches = node.data.branches || []

  const incomingEdge = edges?.find((e) => e.target === node.id)
  const upstream = incomingEdge && nodes?.find((n) => n.id === incomingEdge.source)
  const upstreamHasOutcomes =
    upstream?.data.primitive === PRIMITIVE.DO && upstream.data.config.mode === DO_MODE.ACTION && upstream.data.config.outcomes?.length > 0

  const datapointName = upstreamHasOutcomes ? outcomeDatapointName(upstream.data.label) : null

  return (
    <div className="field-group">
      <label className="field-label">Outgoing conditions</label>
      {upstreamHasOutcomes ? (
        <p className="field-hint branch-config__source-note">
          Branching on: <strong>{upstream.data.label}</strong> — outcome
        </p>
      ) : (
        <p className="field-hint">
          Each condition drives one outgoing edge — drag from its handle on the node to wire it. The default/else
          branch always fires last.
        </p>
      )}
      <div className="branch-list">
        {branches.map((b) => (
          <div className="branch-row" key={b.id}>
            <span className={`branch-row__dot ${b.isDefault ? 'branch-row__dot--default' : ''}`} />
            {b.isDefault ? (
              <input className="field-mono" value="else (default)" disabled />
            ) : upstreamHasOutcomes ? (
              <select
                className="field-mono"
                value={extractPickedOutcome(b.condition, datapointName) || ''}
                onChange={(e) =>
                  graphOps.updateBranch(b.id, { condition: `${datapointName} == "${e.target.value}"` })
                }
              >
                <option value="" disabled>
                  — pick an outcome —
                </option>
                {upstream.data.config.outcomes.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="field-mono"
                value={b.condition}
                onChange={(e) => graphOps.updateBranch(b.id, { condition: e.target.value })}
                placeholder="datapoint == value"
              />
            )}
            <div className="branch-row__actions">
              {!b.isDefault && (
                <button
                  className="branch-row__default-btn"
                  onClick={() => graphOps.updateBranch(b.id, { isDefault: true })}
                  title="Make this the default/else branch"
                >
                  set default
                </button>
              )}
              {branches.length > 1 && (
                <button className="branch-row__icon-btn" onClick={() => graphOps.removeBranch(b.id)} title="Remove condition">
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => graphOps.addBranch()}>
        <PlusIcon /> Add condition
      </button>
    </div>
  )
}

// Recovers "order found" from a stored condition like `get_order_info_outcome == "order found"`,
// so the picker reflects what's already there when re-opening the panel.
function extractPickedOutcome(condition, datapointName) {
  if (!condition || !datapointName) return null
  const match = condition.match(/^(.+?)==(.+)$/)
  if (!match) return null
  const [, left, right] = match
  if (left.trim() !== datapointName) return null
  const quoted = right.trim().match(/^["'](.*)["']$/)
  return quoted ? quoted[1] : right.trim()
}
