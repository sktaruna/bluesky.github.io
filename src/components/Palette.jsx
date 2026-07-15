import { PALETTE_ORDER, PRIMITIVE_META, IS_LLM_INVOKED } from '../constants/primitives'
import { PRIMITIVE_ICON } from './icons'
import './palette.css'

export default function Palette({ onAdd }) {
  return (
    <aside className="palette">
      <div className="palette__heading">Primitives</div>
      <div className="palette__list">
        {PALETTE_ORDER.map((type) => {
          const Icon = PRIMITIVE_ICON[type]
          const isLlm = IS_LLM_INVOKED[type]
          return (
            <button
              key={type}
              className={`palette__item ${isLlm ? 'palette__item--llm' : 'palette__item--det'}`}
              onClick={() => onAdd(type)}
              title={PRIMITIVE_META[type].description}
            >
              <span className="palette__icon">
                <Icon />
              </span>
              <span className="palette__label">{PRIMITIVE_META[type].label}</span>
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
