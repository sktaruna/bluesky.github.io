import { PlusIcon, TrashIcon } from '../icons'

export default function BranchConfig({ node, graphOps }) {
  const branches = node.data.branches || []

  return (
    <div className="field-group">
      <label className="field-label">Outgoing conditions</label>
      <p className="field-hint">
        Each condition drives one outgoing edge — drag from its handle on the node to wire it. The default/else
        branch always fires last.
      </p>
      <div className="branch-list">
        {branches.map((b) => (
          <div className="branch-row" key={b.id}>
            <span className={`branch-row__dot ${b.isDefault ? 'branch-row__dot--default' : ''}`} />
            {b.isDefault ? (
              <input className="field-mono" value="else (default)" disabled />
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
