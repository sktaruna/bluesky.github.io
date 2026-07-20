import { PRIMITIVES, PRIMITIVE_ORDER } from '../primitives/registry'
import './palette.css'

export default function Palette({ onAdd }) {
  return (
    <aside className="palette">
      <div className="palette__heading">Primitives</div>
      <div className="palette__list">
        {PRIMITIVE_ORDER.map((type) => {
          const spec = PRIMITIVES[type]
          const Icon = spec.canvas.icon
          const isLlm = spec.canvas.llmInvoked
          return (
            <button
              key={type}
              className={`palette__item ${isLlm ? 'palette__item--llm' : 'palette__item--det'}`}
              onClick={() => onAdd(type)}
              title={spec.meta.description}
            >
              <span className="palette__icon">
                <Icon />
              </span>
              <span className="palette__label">{spec.meta.label}</span>
            </button>
          )
        })}
      </div>
      <div className="palette__legend">
        <div className="palette__legend-row">
          <span className="palette__legend-swatch palette__legend-swatch--llm" />
          LLM-invoked
        </div>
        <div className="palette__legend-row">
          <span className="palette__legend-swatch palette__legend-swatch--det" />
          Deterministic
        </div>
      </div>
    </aside>
  )
}
