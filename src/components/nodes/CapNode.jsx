import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { PRIMITIVE, PRIMITIVE_META, IS_LLM_INVOKED, DO_MODE, SET_MODE } from '../../constants/primitives'
import { PRIMITIVE_ICON, SparkleIcon } from '../icons'
import './capNode.css'

function Preview({ data }) {
  const { primitive, config } = data
  switch (primitive) {
    case PRIMITIVE.SAY:
      return <p className="cap-node__quote">“{truncate(config.prompt, 90)}”</p>
    case PRIMITIVE.ASK:
      return (
        <>
          <p className="cap-node__quote">“{truncate(config.prompt, 70)}”</p>
          <div className="cap-node__row">
            <span className="cap-node__tag">→</span>
            <code className="cap-node__mono">{config.datapoint || '—'}</code>
          </div>
        </>
      )
    case PRIMITIVE.SET:
      return (
        <div className="cap-node__row">
          <code className="cap-node__mono">{config.datapoint || '—'}</code>
          <span className="cap-node__tag">{config.mode === SET_MODE.REASONING ? 'reasoning' : 'exact'}</span>
        </div>
      )
    case PRIMITIVE.DO: {
      if (config.mode === DO_MODE.ACTION) {
        const actions = config.actions || []
        return (
          <div className="cap-node__row">
            <span className="cap-node__tag cap-node__tag--det">action</span>
            <code className="cap-node__mono">{actions[0]?.name || '—'}</code>
            {actions.length > 1 && <span className="cap-node__badge-count">×{actions.length}</span>}
          </div>
        )
      }
      if (config.mode === DO_MODE.SUBPROCEDURE) {
        return (
          <div className="cap-node__row">
            <span className="cap-node__tag cap-node__tag--det">sub-procedure</span>
            <code className="cap-node__mono">{config.subprocedure?.name || '—'}</code>
          </div>
        )
      }
      if (config.mode === DO_MODE.ESCALATE) {
        return <span className="cap-node__tag cap-node__tag--danger">escalate</span>
      }
      return <span className="cap-node__tag cap-node__tag--success">finish</span>
    }
    case PRIMITIVE.BRANCH:
      return (
        <div className="cap-node__branches">
          {(data.branches || []).map((b) => (
            <div className="cap-node__branch-row" key={b.id}>
              <span className={`cap-node__dot ${b.isDefault ? 'cap-node__dot--default' : ''}`} />
              <code className="cap-node__mono cap-node__mono--small">{b.isDefault ? 'else' : b.condition}</code>
            </div>
          ))}
        </div>
      )
    case PRIMITIVE.GOTO:
      return (
        <div className="cap-node__row">
          <span className="cap-node__tag cap-node__tag--det">jump to</span>
          <code className="cap-node__mono">{data.targetLabel || config.targetId || 'unset'}</code>
        </div>
      )
    default:
      return null
  }
}

function truncate(str, n) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

function CapNode({ id, data, selected }) {
  const { primitive, label, isActive, isTraced } = data
  const isLlm = IS_LLM_INVOKED[primitive]
  const Icon = PRIMITIVE_ICON[primitive]
  const meta = PRIMITIVE_META[primitive]

  const classes = [
    'cap-node',
    isLlm ? 'cap-node--llm' : 'cap-node--det',
    selected ? 'cap-node--selected' : '',
    isActive ? 'cap-node--active' : '',
    isTraced ? 'cap-node--traced' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Left} className="cap-handle" />

      <div className="cap-node__header">
        <span className="cap-node__icon">
          <Icon />
        </span>
        <span className="cap-node__label">{label}</span>
        {isLlm && (
          <span className="cap-node__sparkle" title="LLM-invoked step">
            <SparkleIcon />
          </span>
        )}
      </div>
      <div className="cap-node__type-strip">{meta.label}</div>
      <div className="cap-node__body">
        <Preview data={data} />
      </div>
      {data.isEntry && <div className="cap-node__entry-flag">START</div>}

      {primitive === PRIMITIVE.BRANCH ? (
        <div className="cap-node__branch-handles">
          {(data.branches || []).map((b, i) => (
            <Handle
              key={b.id}
              id={b.id}
              type="source"
              position={Position.Right}
              className={`cap-handle cap-handle--branch ${b.isDefault ? 'cap-handle--default' : ''}`}
              style={{ top: `${branchHandleTop(i, (data.branches || []).length)}%` }}
            />
          ))}
        </div>
      ) : (
        primitive !== PRIMITIVE.DO ||
        (data.config.mode !== 'escalate' && data.config.mode !== 'finish') ? (
          <Handle type="source" position={Position.Right} id="out" className="cap-handle" />
        ) : null
      )}
    </div>
  )
}

function branchHandleTop(index, count) {
  const usable = 70 // percentage band used for handles, leaving header room
  const start = 26
  if (count <= 1) return start
  return start + (usable * index) / (count - 1)
}

export default memo(CapNode)
