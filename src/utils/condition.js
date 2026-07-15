// Minimal, safe evaluator for simple condition expressions like:
//   returnable == true
//   order_number != ""
//   identity_verified
// No eval(), no arbitrary code execution — just a two-sided comparison
// against the live datapoints map, with a truthy fallback for bare names.

function coerceLiteral(raw) {
  const s = raw.trim()
  if (s === 'true') return true
  if (s === 'false') return false
  if (s === 'null' || s === '') return null
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  const quoted = s.match(/^["'](.*)["']$/)
  if (quoted) return quoted[1]
  return { ref: s } // treated as a datapoint reference
}

function resolveSide(side, datapoints) {
  const literal = coerceLiteral(side)
  if (literal && typeof literal === 'object' && 'ref' in literal) {
    return datapoints[literal.ref]
  }
  return literal
}

export function evaluateCondition(expression, datapoints) {
  if (!expression || !expression.trim()) return false
  const eqMatch = expression.match(/^(.+?)(==|!=)(.+)$/)
  if (eqMatch) {
    const [, left, op, right] = eqMatch
    const leftVal = resolveSide(left, datapoints)
    const rightVal = resolveSide(right, datapoints)
    // Loose-ish comparison so "true" (string) and true (bool) both work.
    // eslint-disable-next-line eqeqeq
    const equal = leftVal == rightVal
    return op === '==' ? equal : !equal
  }
  const name = expression.trim()
  return Boolean(datapoints[name])
}
