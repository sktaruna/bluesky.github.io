export default function SayConfig({ config, onUpdateConfig }) {
  return (
    <div className="field-group">
      <label className="field-label">Prompt / instruction</label>
      <p className="field-hint">What the LLM should say, or how it should phrase its response.</p>
      <textarea
        value={config.prompt}
        onChange={(e) => onUpdateConfig({ prompt: e.target.value })}
        rows={5}
      />
    </div>
  )
}
