export function slugify(label) {
  return (label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// The implicit datapoint a Do/Run (Action mode) node's declared outcome is
// written to, derived from its node label so it stays stable and readable
// in the trace panel without requiring a separate name field.
export function outcomeDatapointName(label) {
  return `${slugify(label)}_outcome`
}
