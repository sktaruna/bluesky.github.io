import { useState } from 'react'
import { PRIMITIVE, PRIMITIVE_META, DO_MODE } from '../../constants/primitives'
import { PRIMITIVE_ICON } from '../icons'
import './tracePanel.css'

export default function TracePanel({ status, activeNode, datapoints, history, askDraft, onAskDraftChange, onEditDatapoint }) {
  const Icon = activeNode ? PRIMITIVE_ICON[activeNode.data.primitive] : null

  return (
    <aside className="side-panel">
      <div className="trace-panel__status-block">
        <StatusBanner status={status} activeNode={activeNode} />
      </div>

      {activeNode && (
        <div className="trace-panel__active">
          <div className="trace-panel__active-label">
            <span className="trace-panel__active-icon">
              <Icon />
            </span>
            {PRIMITIVE_META[activeNode.data.primitive].label} — {activeNode.data.label}
          </div>

          {activeNode.data.primitive === PRIMITIVE.ASK && status === 'running' && (
            <div className="trace-panel__ask">
              <div className="trace-panel__ask-prompt">“{activeNode.data.config.prompt}”</div>
              <label className="field-label">Mock user reply</label>
              <input value={askDraft} onChange={(e) => onAskDraftChange(e.target.value)} autoFocus />
              <p className="field-hint">
                Written to <code>{activeNode.data.config.datapoint}</code> when you step forward.
              </p>
            </div>
          )}

          {activeNode.data.primitive === PRIMITIVE.BRANCH && (
            <div className="trace-panel__branch-note">Evaluating conditions against current datapoints…</div>
          )}

          {activeNode.data.primitive === PRIMITIVE.DO && activeNode.data.config.mode === DO_MODE.ESCALATE && (
            <div className="trace-panel__end-note trace-panel__end-note--warn">{activeNode.data.config.escalate.note}</div>
          )}
          {activeNode.data.primitive === PRIMITIVE.DO && activeNode.data.config.mode === DO_MODE.FINISH && (
            <div className="trace-panel__end-note trace-panel__end-note--success">{activeNode.data.config.finish.note}</div>
          )}
        </div>
      )}

      <div className="trace-panel__datapoints">
        <div className="trace-panel__section-title">Datapoints</div>
        {Object.keys(datapoints).length === 0 ? (
          <p className="field-hint">Nothing captured yet.</p>
        ) : (
          <div className="datapoint-list">
            {Object.entries(datapoints).map(([key, value]) => (
              <DatapointRow key={key} k={key} v={value} editable={status === 'running'} onEdit={onEditDatapoint} />
            ))}
          </div>
        )}
      </div>

      {history?.length > 0 && (
        <div className="trace-panel__history">
          <div className="trace-panel__section-title">Path so far</div>
          <ol className="trace-history">
            {history.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  )
}

function StatusBanner({ status, activeNode }) {
  if (status === 'idle') {
    return (
      <div className="trace-banner trace-banner--idle">
        Press <strong>Run</strong> to start a click-through trace from the entry node.
      </div>
    )
  }
  if (status === 'complete') {
    return <div className="trace-banner trace-banner--success">✓ Flow complete</div>
  }
  if (status === 'escalated') {
    return <div className="trace-banner trace-banner--warn">⚠ Escalated to a human agent</div>
  }
  return <div className="trace-banner trace-banner--running">● Running — step through the flow</div>
}

function DatapointRow({ k, v, editable, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(v))

  if (editing) {
    return (
      <div className="datapoint-row datapoint-row--editing">
        <code className="datapoint-row__key">{k}</code>
        <input
          className="datapoint-row__input"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      </div>
    )
  }

  function commit() {
    setEditing(false)
    onEdit(k, coerce(draft))
  }

  return (
    <div
      className={`datapoint-row ${editable ? 'datapoint-row--editable' : ''}`}
      onClick={() => editable && setEditing(true)}
      title={editable ? 'Click to edit (e.g. to test the other branch)' : ''}
    >
      <code className="datapoint-row__key">{k}</code>
      <span className="datapoint-row__value">{String(v)}</span>
    </div>
  )
}

function coerce(raw) {
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}
