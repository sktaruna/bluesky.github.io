// Shared `{{datapoint}}` template substitution — used by the registry's
// execute() functions (action inputs, message text) on both the chat engine
// and the graph trace engine.
export function fill(str, datapoints) {
  if (!str) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (datapoints?.[k] ?? '').toString())
}
