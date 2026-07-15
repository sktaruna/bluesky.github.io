export default function AskConfig({ config, onUpdateConfig }) {
  return (
    <>
      <div className="field-group">
        <label className="field-label">Question / prompt text</label>
        <textarea
          value={config.prompt}
          onChange={(e) => onUpdateConfig({ prompt: e.target.value })}
          rows={3}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Target datapoint</label>
        <p className="field-hint">The extracted value is written here.</p>
        <input
          className="field-mono"
          value={config.datapoint}
          onChange={(e) => onUpdateConfig({ datapoint: e.target.value })}
          placeholder="datapoint_name"
        />
      </div>
    </>
  )
}
