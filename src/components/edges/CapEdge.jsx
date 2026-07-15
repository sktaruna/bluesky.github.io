import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import './capEdge.css'

export default function CapEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const classes = [
    'cap-edge',
    data?.isDefault ? 'cap-edge--default' : '',
    data?.isGoto ? 'cap-edge--goto' : '',
    data?.isActive ? 'cap-edge--active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const label = data?.isGoto ? 'go to' : data?.conditionLabel

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} className={classes} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`cap-edge__label ${data?.isDefault ? 'cap-edge__label--default' : ''} ${
              data?.isGoto ? 'cap-edge__label--goto' : ''
            } ${data?.isActive ? 'cap-edge__label--active' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
