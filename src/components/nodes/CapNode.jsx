import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { PRIMITIVES } from '../../primitives/registry'
import { SparkleIcon } from '../icons'
import './capNode.css'

function CapNode({ data, selected }) {
  const { type, label, config, isActive, isTraced, isEntry, routesOut, routesIn } = data
  const spec = PRIMITIVES[type]
  const Icon = spec.canvas.icon
  const isLlm = spec.canvas.llmInvoked
  const handles = spec.next({ config }).handles

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

      {routesIn?.length > 0 && (
        <div className="cap-node__routes-in" title={`Routed here from: ${routesIn.join(', ')}`}>
          ← {routesIn.join(', ')}
        </div>
      )}

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
      <div className="cap-node__type-strip">{spec.meta.label}</div>
      <div className="cap-node__body">{spec.canvas.summary(data)}</div>
      {isEntry && <div className="cap-node__entry-flag">START</div>}

      {routesOut?.length > 0 && (
        <div className="cap-node__routes-out">
          {routesOut.map((r) => (
            <div className="cap-node__route-row" key={r.id}>
              <span className="cap-node__route-name">{r.label}</span>
              <span className="cap-node__route-arrow">→</span>
              <span className={`cap-node__route-target ${r.targetLabel ? '' : 'cap-node__route-target--unset'}`}>
                {r.targetLabel || 'not connected'}
              </span>
            </div>
          ))}
        </div>
      )}

      {handles.length > 1 ? (
        <div className="cap-node__branch-handles">
          {handles.map((h, i) => {
            const top = branchHandleTop(i, handles.length)
            return (
              <div key={h.id}>
                <span className="cap-node__handle-label" style={{ top: `${top}%` }}>
                  {h.labelFn ? h.labelFn() : h.id}
                </span>
                <Handle id={h.id} type="source" position={Position.Right} className="cap-handle cap-handle--branch" style={{ top: `${top}%` }} />
              </div>
            )
          })}
        </div>
      ) : handles.length === 1 ? (
        <Handle type="source" position={Position.Right} id={handles[0].id} className="cap-handle" />
      ) : null}
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
