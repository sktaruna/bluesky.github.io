import { useEffect, useRef, useState } from 'react'
import { useBehaviorEngine } from '../../behaviors/engine'
import { RESCHEDULE_FLOW } from '../../flows/reschedule'
import {
  StatusBadge,
  TextBlock,
  ChipGroup,
  KvTable,
  StatusList,
  LoadingIndicator,
  StepTracker,
  ButtonStack,
  ButtonRow,
  InputField,
  RatingScale,
} from '../../primitives/boxes'
import './behaviorChat.css'

// Generic box-id -> renderer lookup. `Message` below no longer switches on a
// per-node-type `msg.type` — it just iterates `msg.boxes` (populated by
// registry.js's execute() functions) through this fixed, type-agnostic map.
const BOX_COMPONENTS = {
  statusBadge: (props) => props?.label && <StatusBadge label={props.label} state={props.state} />,
  textBlock: (props) => props?.text != null && <TextBlock>{props.strong ? <strong>{props.text}</strong> : props.text}</TextBlock>,
  chipGroup: (props, chatCtx) =>
    props?.options?.length > 0 && <ChipGroup options={props.options} onPick={chatCtx.onPickChip} disabled={chatCtx.disabled} />,
  kvTable: (props) => props?.rows?.length > 0 && <KvTable rows={props.rows} />,
  statusList: (props) => props?.items && <StatusList items={props.items} />,
  loadingIndicator: (props) => props && <LoadingIndicator message={props.message} />,
  stepTracker: (props) => props && (props.items?.length > 0 || props.max) && <StepTracker {...props} />,
  buttonRow: (props) => props?.actions?.length > 0 && <ButtonRow actions={props.actions} onAct={() => {}} />,
  ratingScale: () => null, // rendered inline by DoneMessage below (needs local rating state)
}

function Message({ msg, onPickChip, disabled }) {
  const chatCtx = { onPickChip, disabled }
  const boxes = msg.boxes || []
  const className = `bp-msg bp-msg--${msg.variant || 'agent'}`

  if (boxes.includes('ratingScale')) {
    return <DoneMessage msg={msg} boxes={boxes} chatCtx={chatCtx} className={className} />
  }

  return (
    <div className={className}>
      {boxes.map((boxId) => {
        const render = BOX_COMPONENTS[boxId]
        if (!render) return null
        const node = render(msg[boxId], chatCtx)
        return node ? <span key={boxId}>{node}</span> : null
      })}
    </div>
  )
}

// `ratingScale` needs local component state (the picked rating), so the
// generic BOX_COMPONENTS map delegates to this small wrapper instead.
function DoneMessage({ msg, boxes, chatCtx }) {
  const [rating, setRating] = useState(null)
  return (
    <div className="bp-msg bp-msg--done">
      {boxes
        .filter((b) => b !== 'ratingScale')
        .map((boxId) => {
          const render = BOX_COMPONENTS[boxId]
          const node = render?.(msg[boxId], chatCtx)
          return node ? <span key={boxId}>{node}</span> : null
        })}
      <div className="bp-rating-block">
        <div className="bp-rating-block__label">How was your experience?</div>
        <RatingScale value={rating} onRate={setRating} />
      </div>
    </div>
  )
}

export default function BehaviorChat() {
  const engine = useBehaviorEngine(RESCHEDULE_FLOW)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [engine.transcript, engine.awaiting])

  useEffect(() => {
    setDraft('')
  }, [engine.awaiting])

  function handlePickChip(value) {
    if (engine.awaiting?.type === 'collect') engine.submitCollect(value)
  }

  return (
    <div className="behavior-chat">
      <div className="behavior-chat__header">
        <div className="behavior-chat__avatar">AI</div>
        <div>
          <div className="behavior-chat__name">Delivery Assistant</div>
          <div className="behavior-chat__status">
            {engine.status === 'running' && !engine.awaiting
              ? 'Typing…'
              : engine.status === 'finished' || engine.status === 'escalated'
                ? 'Finished'
                : 'Online'}
          </div>
        </div>
      </div>

      <div className="behavior-chat__body" ref={scrollRef}>
        {engine.status === 'idle' && (
          <div className="bp-empty">
            <p>A 10-primitive dummy conversation — real collect/branch/loop logic, not a scripted replay.</p>
          </div>
        )}
        {engine.transcript.map((msg) => (
          <Message key={msg.id} msg={msg} onPickChip={handlePickChip} disabled={engine.awaiting?.type !== 'collect'} />
        ))}
      </div>

      <div className="behavior-chat__composer">
        {engine.status === 'idle' && (
          <button className="bp-btn bp-btn--primary bp-btn--block" onClick={engine.start}>
            ▶ Start Conversation
          </button>
        )}

        {engine.awaiting?.type === 'collect' && (
          <InputField
            value={draft}
            onChange={setDraft}
            onSubmit={engine.submitCollect}
            placeholder={engine.awaiting.field?.placeholder}
            autoFocus
          />
        )}

        {engine.awaiting?.type === 'choice' && <ButtonStack options={engine.awaiting.options} onChoose={engine.chooseOption} />}

        {engine.awaiting?.type === 'confirm' && <ButtonRow actions={engine.awaiting.actions} onAct={engine.confirmAction} />}

        {(engine.status === 'finished' || engine.status === 'escalated') && (
          <button className="bp-btn bp-btn--outline bp-btn--block" onClick={engine.start}>
            ↺ Start Over
          </button>
        )}
      </div>
    </div>
  )
}
