// The 6 locked primitives. Do not add, remove, or rename.
export const PRIMITIVE = {
  SAY: 'say',
  ASK: 'ask',
  SET: 'set',
  DO: 'do',
  BRANCH: 'branch',
  GOTO: 'goto',
}

export const DO_MODE = {
  ACTION: 'action',
  SUBPROCEDURE: 'subprocedure',
  ESCALATE: 'escalate',
  FINISH: 'finish',
}

export const SET_MODE = {
  EXACT: 'exact',
  REASONING: 'reasoning',
}

// LLM-invoked steps get the violet treatment + sparkle badge.
// Do/If/GoTo are pure-deterministic: neutral slate, no badge.
export const IS_LLM_INVOKED = {
  [PRIMITIVE.SAY]: true,
  [PRIMITIVE.ASK]: true,
  [PRIMITIVE.SET]: true,
  [PRIMITIVE.DO]: false,
  [PRIMITIVE.BRANCH]: false,
  [PRIMITIVE.GOTO]: false,
}

export const PRIMITIVE_META = {
  [PRIMITIVE.SAY]: { label: 'Say', short: 'S', description: 'LLM generates NL output to the user' },
  [PRIMITIVE.ASK]: { label: 'Ask', short: 'A', description: 'Prompts user, extracts a value into a datapoint' },
  [PRIMITIVE.SET]: { label: 'Set', short: 'V', description: 'Silently assigns a datapoint' },
  [PRIMITIVE.DO]: { label: 'Do / Run', short: 'D', description: 'Runs an action, sub-procedure, escalation, or finish' },
  [PRIMITIVE.BRANCH]: { label: 'If / Branch', short: 'B', description: 'Conditional branching on datapoint state' },
  [PRIMITIVE.GOTO]: { label: 'Go To', short: 'G', description: 'Jump to another node, enabling loops' },
}

export const PALETTE_ORDER = [
  PRIMITIVE.SAY,
  PRIMITIVE.ASK,
  PRIMITIVE.SET,
  PRIMITIVE.DO,
  PRIMITIVE.BRANCH,
  PRIMITIVE.GOTO,
]

export function defaultConfigFor(type) {
  switch (type) {
    case PRIMITIVE.SAY:
      return { prompt: 'Say something to the user…' }
    case PRIMITIVE.ASK:
      return { prompt: 'Ask the user something…', datapoint: 'new_datapoint' }
    case PRIMITIVE.SET:
      return { datapoint: 'new_datapoint', mode: SET_MODE.EXACT, value: '', reasoning: '' }
    case PRIMITIVE.DO:
      return {
        mode: DO_MODE.ACTION,
        actions: [{ name: 'new_action', params: [{ key: 'param', value: 'value' }] }],
        subprocedure: { name: 'sub_procedure', inputBindings: [], outputBindings: [] },
        escalate: { note: 'Hand off to a human agent.' },
        finish: { note: 'Exit the flow.' },
      }
    case PRIMITIVE.BRANCH:
      return { conditionsNote: 'Configure branches via outgoing edges below.' }
    case PRIMITIVE.GOTO:
      return { targetId: null }
    default:
      return {}
  }
}
