import { PRIMITIVES, NO_RETRY_TYPES } from '../../primitives/registry'
import { SparkleIcon, TrashIcon, PlusIcon } from '../icons'
import { slugify } from '../../utils/slug'
import './configPanel.css'

// Shared naming convention for every branch/handle id in the app: lowercase
// letters, numbers, and underscores only. These ids double as edge routing
// keys, so keeping one convention (and one slugify helper) everywhere avoids
// a typo silently breaking a wire.
const ID_NAMING_HINT = 'lowercase_with_underscores — this becomes the edge\'s routing key'

// The sole config form. It reads `PRIMITIVES[type].schema` and dispatches
// per field `kind` to one of the small generic editors below — there is no
// per-type switch here, only a per-`kind` one (a fixed, type-agnostic set of
// shared field renderers, same idea as the old DoConfig's ParamRows/
// OutcomesEditor, now shared across every primitive instead of bespoke).
export default function ConfigPanel({ node, nodes, onUpdateLabel, onUpdateConfig, onDelete }) {
  if (!node) {
    return (
      <aside className="side-panel">
        <div className="side-panel__empty">
          <div className="side-panel__empty-title">No node selected</div>
          <p className="side-panel__empty-body">
            Click a node on the canvas to inspect and edit its configuration, or add a new primitive from the
            palette on the left.
          </p>
        </div>
      </aside>
    )
  }

  const { type, label, config } = node.data
  const spec = PRIMITIVES[type]
  const Icon = spec.canvas.icon
  const isLlm = spec.canvas.llmInvoked

  function setField(key, value) {
    onUpdateConfig({ [key]: value })
  }

  return (
    <aside className="side-panel">
      <div className={`side-panel__header ${isLlm ? 'side-panel__header--llm' : ''}`}>
        <span className="side-panel__icon">
          <Icon />
        </span>
        <div className="side-panel__heading">
          <div className="side-panel__type">
            {spec.meta.label}
            {isLlm && <SparkleIcon className="side-panel__sparkle" />}
          </div>
          <input className="side-panel__label-input" value={label} onChange={(e) => onUpdateLabel(e.target.value)} />
        </div>
        <button className="side-panel__delete" onClick={onDelete} title="Delete node">
          <TrashIcon />
        </button>
      </div>

      <div className="side-panel__body">
        {spec.schema.map((field) => (
          <FieldEditor
            key={field.key}
            field={field}
            value={config[field.key]}
            onChange={(v) => setField(field.key, v)}
            node={node}
            nodes={nodes}
          />
        ))}

        {!NO_RETRY_TYPES.has(type) && <RetryBlock retry={config.retry} nodes={nodes} onChange={(v) => setField('retry', v)} />}
      </div>
    </aside>
  )
}

function FieldEditor({ field, value, onChange, node, nodes }) {
  switch (field.kind) {
    case 'text':
      return <TextField field={field} value={value} onChange={onChange} />
    case 'textarea':
      return <TextAreaField field={field} value={value} onChange={onChange} />
    case 'boolean':
      return <BooleanField field={field} value={value} onChange={onChange} />
    case 'fieldSpec':
      return <FieldSpecEditor field={field} value={value} onChange={onChange} />
    case 'hints':
      return <HintsEditor field={field} value={value} onChange={onChange} />
    case 'validate':
      return <ValidateEditor field={field} value={value} onChange={onChange} />
    case 'stringList':
      return <StringListEditor field={field} value={value} onChange={onChange} />
    case 'rows':
      return <RowsEditor field={field} value={value} onChange={onChange} />
    case 'kvRows':
      return <KvRowsEditor field={field} value={value} onChange={onChange} />
    case 'optionsList':
      return <OptionsListEditor field={field} value={value} onChange={onChange} />
    case 'actionsList':
      return <ActionsListEditor field={field} value={value} onChange={onChange} />
    case 'investigateActions':
      return <InvestigateActionsEditor field={field} value={value} onChange={onChange} />
    case 'nodeSelect':
      return <NodeSelectEditor field={field} value={value} onChange={onChange} node={node} nodes={nodes} />
    default:
      return null
  }
}

// ---------------------------------------------------------------- primitives

function TextField({ field, value, onChange }) {
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <input
        className={field.mono ? 'field-mono' : ''}
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function TextAreaField({ field, value, onChange }) {
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <textarea rows={field.rows || 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function BooleanField({ field, value, onChange }) {
  return (
    <div className="field-group">
      <label className="field-label">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}
      </label>
    </div>
  )
}

function FieldSpecEditor({ field, value, onChange }) {
  const v = value || { name: '', type: 'text', placeholder: '' }
  return (
    <div className="field-group">
      <label className="field-label">
        {field.label} {field.optional && <span className="field-label__hint">(optional)</span>}
      </label>
      <div className="param-row">
        <input
          className="field-mono"
          value={v.name}
          placeholder="datapoint_name"
          onChange={(e) => onChange({ ...v, name: e.target.value })}
        />
        <span className="param-row__sep">:=</span>
        <input value={v.placeholder} placeholder="input placeholder" onChange={(e) => onChange({ ...v, placeholder: e.target.value })} />
      </div>
      {field.optional && v.name && (
        <button className="add-row-btn add-row-btn--small" onClick={() => onChange(null)}>
          <TrashIcon /> Clear (make non-reentrant)
        </button>
      )}
    </div>
  )
}

function HintsEditor({ field, value, onChange }) {
  const isDynamic = value && !Array.isArray(value)
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <div className="segmented">
        <button className={`segmented__opt ${!isDynamic ? 'segmented__opt--active' : ''}`} onClick={() => onChange([])}>
          Literal list
        </button>
        <button className={`segmented__opt ${isDynamic ? 'segmented__opt--active' : ''}`} onClick={() => onChange({ fromDatapoint: '' })}>
          From datapoint
        </button>
      </div>
      {isDynamic ? (
        <input
          className="field-mono"
          value={value.fromDatapoint || ''}
          placeholder="datapoint_name"
          onChange={(e) => onChange({ fromDatapoint: e.target.value })}
        />
      ) : (
        <StringListEditor field={{ placeholder: 'hint text' }} value={value || []} onChange={onChange} />
      )}
    </div>
  )
}

function ValidateEditor({ field, value, onChange }) {
  const enabled = !!value
  return (
    <div className="field-group">
      <label className="field-label">
        <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked ? { condition: '' } : null)} /> {field.label}
      </label>
      {enabled && (
        <input
          className="field-mono"
          value={value.condition}
          placeholder="datapoint in other_datapoint"
          onChange={(e) => onChange({ condition: e.target.value })}
        />
      )}
    </div>
  )
}

function StringListEditor({ field, value, onChange }) {
  const rows = value || []
  function update(i, v) {
    onChange(rows.map((r, idx) => (idx === i ? v : r)))
  }
  function add() {
    onChange([...rows, ''])
  }
  function remove(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }
  return (
    <div className="field-group">
      {field.label && <label className="field-label">{field.label}</label>}
      {field.namingHint && <p className="field-hint">Name: {ID_NAMING_HINT}.</p>}
      <div className="branch-list">
        {rows.map((r, i) => (
          <div className="branch-row" key={i}>
            <span className="branch-row__dot" />
            <input
              className={field.namingHint ? 'field-mono' : ''}
              value={r}
              placeholder={field.placeholder}
              onChange={(e) => update(i, field.namingHint ? slugify(e.target.value) : e.target.value)}
            />
            <button className="branch-row__icon-btn" onClick={() => remove(i)} title="Remove">
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button className="add-row-btn add-row-btn--small" onClick={add}>
        <PlusIcon /> Add
      </button>
    </div>
  )
}

function RowsEditor({ field, value, onChange }) {
  const rows = value || []
  const { leftField, rightField, leftPlaceholder, rightPlaceholder } = field
  function update(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...rows, { [leftField]: '', [rightField]: '' }])
  }
  function remove(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }
  return (
    <div className="param-block">
      <div className="param-block__label">{field.label}</div>
      {rows.map((r, i) => (
        <div className="param-row" key={i}>
          <input className="field-mono" value={r[leftField]} placeholder={leftPlaceholder} onChange={(e) => update(i, { [leftField]: e.target.value })} />
          <span className="param-row__sep">=</span>
          <input className="field-mono" value={r[rightField]} placeholder={rightPlaceholder} onChange={(e) => update(i, { [rightField]: e.target.value })} />
          <button className="branch-row__icon-btn" onClick={() => remove(i)} title="Remove">
            <TrashIcon />
          </button>
        </div>
      ))}
      <button className="add-row-btn add-row-btn--small" onClick={add}>
        <PlusIcon /> Add row
      </button>
    </div>
  )
}

function KvRowsEditor({ field, value, onChange }) {
  const rows = value || []
  function update(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...rows, { label: '', datapoint: '', value: '', highlight: false }])
  }
  function remove(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <p className="field-hint">Bind a row to a datapoint, or leave it blank and set a literal value.</p>
      {rows.map((r, i) => (
        <div className="action-card" key={i}>
          <div className="param-row">
            <input value={r.label} placeholder="label" onChange={(e) => update(i, { label: e.target.value })} />
            <button className="branch-row__icon-btn" onClick={() => remove(i)} title="Remove">
              <TrashIcon />
            </button>
          </div>
          <div className="param-row">
            <input className="field-mono" value={r.datapoint || ''} placeholder="datapoint (optional)" onChange={(e) => update(i, { datapoint: e.target.value })} />
            <span className="param-row__sep">or</span>
            <input value={r.value || ''} placeholder="literal value" onChange={(e) => update(i, { value: e.target.value })} />
          </div>
          <label className="field-label">
            <input type="checkbox" checked={!!r.highlight} onChange={(e) => update(i, { highlight: e.target.checked })} /> Highlight
          </label>
        </div>
      ))}
      <button className="add-row-btn add-row-btn--small" onClick={add}>
        <PlusIcon /> Add row
      </button>
    </div>
  )
}

function OptionsListEditor({ field, value, onChange }) {
  const rows = value || []
  function update(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...rows, { id: `opt_${rows.length + 1}`, label: 'New option', subtitle: '' }])
  }
  function remove(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <p className="field-hint">
        Each option has a stable <code>id</code> ({ID_NAMING_HINT}) — the outgoing edge for this option is wired to
        that id. Rename it any time; the "Name it" button fills the id in from the label.
      </p>
      {rows.map((r, i) => (
        <div className="action-card" key={i}>
          <div className="param-row">
            <input
              className="field-mono"
              value={r.id}
              placeholder="option_id"
              onChange={(e) => update(i, { id: slugify(e.target.value) })}
            />
            <button className="branch-row__icon-btn" onClick={() => update(i, { id: slugify(r.label) || r.id })} title="Name it from the label">
              <SparkleIcon />
            </button>
            <button className="branch-row__icon-btn" onClick={() => remove(i)} title="Remove">
              <TrashIcon />
            </button>
          </div>
          <input value={r.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
          <input value={r.subtitle || ''} placeholder="Subtitle (optional)" onChange={(e) => update(i, { subtitle: e.target.value })} />
        </div>
      ))}
      <button className="add-row-btn add-row-btn--small" onClick={add}>
        <PlusIcon /> Add option
      </button>
    </div>
  )
}

function ActionsListEditor({ field, value, onChange }) {
  const rows = value || []
  function update(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...rows, { id: `action_${rows.length + 1}`, label: 'New action', style: 'default' }])
  }
  function remove(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <p className="field-hint">
        Each action has a stable <code>id</code> ({ID_NAMING_HINT}) — the outgoing edge for this action is wired to
        that id.
      </p>
      {rows.map((r, i) => (
        <div className="param-row" key={i}>
          <input className="field-mono" value={r.id} placeholder="action_id" onChange={(e) => update(i, { id: slugify(e.target.value) })} />
          <button className="branch-row__icon-btn" onClick={() => update(i, { id: slugify(r.label) || r.id })} title="Name it from the label">
            <SparkleIcon />
          </button>
          <input value={r.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
          <select value={r.style || 'default'} onChange={(e) => update(i, { style: e.target.value })}>
            <option value="default">default</option>
            <option value="primary">primary</option>
            <option value="success">success</option>
            <option value="outline">outline</option>
          </select>
          <button className="branch-row__icon-btn" onClick={() => remove(i)} title="Remove">
            <TrashIcon />
          </button>
        </div>
      ))}
      <button className="add-row-btn add-row-btn--small" onClick={add}>
        <PlusIcon /> Add action
      </button>
    </div>
  )
}

function InvestigateActionsEditor({ field, value, onChange }) {
  const rows = value || []
  function update(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...rows, { label: 'Check', call: 'mock_call' }])
  }
  function remove(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <p className="field-hint">
        Set <code>forEachIn</code> to a datapoint name to run this check once per item in that list (e.g. slot-checking
        across candidate dates) instead of once.
      </p>
      {rows.map((r, i) => (
        <div className="action-card" key={i}>
          <div className="param-row">
            <input value={r.label} placeholder="label" onChange={(e) => update(i, { label: e.target.value })} />
            <button className="branch-row__icon-btn" onClick={() => remove(i)} title="Remove">
              <TrashIcon />
            </button>
          </div>
          <input className="field-mono" value={r.call} placeholder="mock_call_name" onChange={(e) => update(i, { call: e.target.value })} />
          <div className="param-row">
            <input
              className="field-mono"
              value={r.forEachIn || ''}
              placeholder="forEachIn: datapoint (optional)"
              onChange={(e) => update(i, { forEachIn: e.target.value || undefined })}
            />
            <input
              className="field-mono"
              value={r.resultField || ''}
              placeholder="resultField (optional)"
              onChange={(e) => update(i, { resultField: e.target.value || undefined })}
            />
          </div>
        </div>
      ))}
      <button className="add-row-btn add-row-btn--small" onClick={add}>
        <PlusIcon /> Add check
      </button>
    </div>
  )
}

function NodeSelectEditor({ field, value, onChange, node, nodes }) {
  const options = (nodes || []).filter((n) => n.id !== node.id)
  return (
    <div className="field-group">
      <label className="field-label">{field.label}</label>
      <p className="field-hint">Jump execution directly to this node — enables loops and non-linear flow.</p>
      <select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
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

function RetryBlock({ retry, nodes, onChange }) {
  const enabled = !!retry
  return (
    <div className="field-group">
      <label className="field-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked ? { maxAttempts: 2, onExceeded: '' } : null)}
        />{' '}
        Retry on failure
      </label>
      {enabled && (
        <>
          <div className="field-group">
            <label className="field-label">Max attempts</label>
            <input
              type="number"
              min={1}
              value={retry.maxAttempts}
              onChange={(e) => onChange({ ...retry, maxAttempts: Number(e.target.value) || 1 })}
            />
          </div>
          <div className="field-group">
            <label className="field-label">On exceeded — jump to node</label>
            <select value={retry.onExceeded || ''} onChange={(e) => onChange({ ...retry, onExceeded: e.target.value })}>
              <option value="">— choose a node —</option>
              {(nodes || []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.label} ({n.id})
                </option>
              ))}
            </select>
            {!retry.onExceeded && (
              <p className="field-hint">maxAttempts set without onExceeded — runtime will fail open (no retry).</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
