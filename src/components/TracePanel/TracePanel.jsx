import { useState } from 'react'
import { PRIMITIVES } from '../../primitives/registry'
import './tracePanel.css'

export default function TracePanel({ status, activeNode, datapoints, history, draftValue, attemptCounts, onDraftChange, onEditDatapoint }) {
  const spec = activeNode ? PRIMITIVES[activeNode.data.type] : null
  const Icon = spec?.canvas.icon

  const flowNode = activeNode ? { id: activeNode.id, type: activeNode.data.type, config: activeNode.data.config } : null
  const attempt = activeNode ? attemptCounts?.[activeNode.id] : 0
  const trace = { datapoints, draftValue }
  const helpers = { onDraftChange }

  return (
    <aside className="side-panel">
      <div className="trace-panel__status-block">
        <StatusBanner status={status} />
      </div>

      {activeNode && (
        <div className="trace-panel__active">
          <div className="trace-panel__active-label">
            <span className="trace-panel__active-icon">
              <Icon />
            </span>
            {spec.meta.label} — {activeNode.data.label}
          </div>

          {attempt > 0 && activeNode.data.config.retry && (
            <div className="trace-panel__branch-note">
              Attempt {attempt} of {activeNode.data.config.retry.maxAttempts} — will jump to{' '}
              <code>{activeNode.data.config.retry.onExceeded || '(none — fails open)'}</code> if exceeded.
            </div>
          )}

          {status === 'running' && spec.canvas.traceDetail?.(flowNode, trace, helpers)}
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

function StatusBanner({ status }) {
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
      <span className="datapoint-row__value">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
    </div>
  )
}

function coerce(raw) {
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}
