// Minimal, safe evaluator for simple condition expressions like:
//   returnable == true
//   order_number != ""
//   identity_verified
//   reschedule_order_status in ['in_transit','delivered','cancelled']
//   chosen_delivery_slot in available_delivery_slots
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

// Resolves the right-hand side of an `in` check into an array of values —
// either a bracketed literal list (['a','b']) or a datapoint holding a
// comma-separated string (as our mocked action outputs produce).
function resolveList(side, datapoints) {
  const trimmed = side.trim()
  const bracketed = trimmed.match(/^\[(.*)\]$/)
  const inner = bracketed ? bracketed[1] : datapoints[trimmed]
  if (inner == null) return []
  return String(inner)
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter((s) => s.length)
}

export function evaluateCondition(expression, datapoints) {
  if (!expression || !expression.trim()) return false

  const inMatch = expression.match(/^(.+?)\s+in\s+(.+)$/)
  if (inMatch) {
    const [, left, right] = inMatch
    const leftVal = resolveSide(left, datapoints)
    const list = resolveList(right, datapoints)
    return list.some((item) => String(item) === String(leftVal))
  }

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
