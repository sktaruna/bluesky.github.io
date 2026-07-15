import { SET_MODE } from '../../constants/primitives'

export default function SetConfig({ config, onUpdateConfig }) {
  return (
    <>
      <div className="field-group">
        <label className="field-label">Datapoint</label>
        <input
          className="field-mono"
          value={config.datapoint}
          onChange={(e) => onUpdateConfig({ datapoint: e.target.value })}
          placeholder="datapoint_name"
        />
      </div>

      <div className="field-group">
        <label className="field-label">Mode</label>
        <div className="segmented">
          <button
            className={`segmented__opt ${config.mode === SET_MODE.EXACT ? 'segmented__opt--active' : ''}`}
            onClick={() => onUpdateConfig({ mode: SET_MODE.EXACT })}
          >
            Exact value
          </button>
          <button
            className={`segmented__opt ${config.mode === SET_MODE.REASONING ? 'segmented__opt--active' : ''}`}
            onClick={() => onUpdateConfig({ mode: SET_MODE.REASONING })}
          >
            Use reasoning
          </button>
        </div>
      </div>

      {config.mode === SET_MODE.EXACT ? (
        <div className="field-group">
          <label className="field-label">Literal value</label>
          <input value={config.value} onChange={(e) => onUpdateConfig({ value: e.target.value })} />
        </div>
      ) : (
        <div className="field-group">
          <label className="field-label">What should the AI infer?</label>
          <p className="field-hint">Free-text description of what to infer from context.</p>
          <textarea
            value={config.reasoning}
            onChange={(e) => onUpdateConfig({ reasoning: e.target.value })}
            rows={3}
            placeholder="e.g. infer urgency from the customer's tone"
          />
        </div>
      )}
    </>
  )
}
