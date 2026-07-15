import { PRIMITIVE, DO_MODE, SET_MODE } from '../constants/primitives'

// The pre-loaded return-eligibility example. Demonstrates all 6 primitives,
// a bundled multi-action Do node, a sub-procedure call with input/output
// bindings, a two-way branch, and a Go To retry loop.

export function buildInitialGraph() {
  const nodes = [
    {
      id: 'ask_order',
      type: 'capNode',
      position: { x: 40, y: 300 },
      data: {
        primitive: PRIMITIVE.ASK,
        label: 'Ask order number',
        isEntry: true,
        config: {
          prompt: "What's your order number?",
          datapoint: 'order_number',
        },
      },
    },
    {
      id: 'set_channel',
      type: 'capNode',
      position: { x: 360, y: 300 },
      data: {
        primitive: PRIMITIVE.SET,
        label: 'Set channel',
        config: {
          datapoint: 'channel',
          mode: SET_MODE.EXACT,
          value: 'web',
          reasoning: '',
        },
      },
    },
    {
      id: 'valid_check',
      type: 'capNode',
      position: { x: 680, y: 300 },
      data: {
        primitive: PRIMITIVE.BRANCH,
        label: 'Order number valid?',
        config: {},
        branches: [
          { id: 'valid_check__true', condition: 'order_number != ""', isDefault: false },
          { id: 'valid_check__false', condition: 'else', isDefault: true },
        ],
      },
    },
    {
      id: 'goto_retry',
      type: 'capNode',
      position: { x: 1000, y: 520 },
      data: {
        primitive: PRIMITIVE.GOTO,
        label: 'Retry order number',
        config: { targetId: 'ask_order' },
      },
    },
    {
      id: 'do_verify',
      type: 'capNode',
      position: { x: 1000, y: 160 },
      data: {
        primitive: PRIMITIVE.DO,
        label: 'Verify identity',
        config: {
          mode: DO_MODE.SUBPROCEDURE,
          actions: [{ name: 'new_action', params: [{ key: 'param', value: 'value' }] }],
          subprocedure: {
            name: 'verify_identity',
            inputBindings: [
              { parentDatapoint: 'order_number', paramName: 'order_ref' },
              { parentDatapoint: 'channel', paramName: 'request_channel' },
            ],
            outputBindings: [{ outputName: 'identity_verified', parentDatapoint: 'identity_verified' }],
          },
          escalate: { note: '' },
          finish: { note: '' },
        },
      },
    },
    {
      id: 'do_lookup',
      type: 'capNode',
      position: { x: 1330, y: 160 },
      data: {
        primitive: PRIMITIVE.DO,
        label: 'Look up order & window',
        config: {
          mode: DO_MODE.ACTION,
          actions: [
            {
              name: 'lookup_order',
              params: [{ key: 'order_number', value: '{{order_number}}' }],
              mockOutputs: [{ datapoint: 'order_id', value: 'ORD-58213-ID' }],
            },
            {
              name: 'check_return_window',
              params: [{ key: 'order_id', value: '{{order_id}}' }],
              mockOutputs: [],
            },
          ],
          // Declared outcomes — the downstream "Returnable?" branch picks
          // from this list instead of a free-text condition.
          outcomes: ['returnable', 'not returnable'],
          mockOutcome: 'returnable',
          subprocedure: { name: '', inputBindings: [], outputBindings: [] },
          escalate: { note: '' },
          finish: { note: '' },
        },
      },
    },
    {
      id: 'returnable_check',
      type: 'capNode',
      position: { x: 1660, y: 160 },
      data: {
        primitive: PRIMITIVE.BRANCH,
        label: 'Returnable?',
        config: {},
        branches: [
          { id: 'returnable_check__true', condition: 'look_up_order_window_outcome == "returnable"', isDefault: false },
          { id: 'returnable_check__false', condition: 'else', isDefault: true },
        ],
      },
    },
    {
      id: 'say_eligible',
      type: 'capNode',
      position: { x: 1980, y: 20 },
      data: {
        primitive: PRIMITIVE.SAY,
        label: 'Confirm eligibility',
        config: {
          prompt:
            "Great news — you're eligible for a refund. I'll email you a prepaid return label within the next few minutes.",
        },
      },
    },
    {
      id: 'do_finish',
      type: 'capNode',
      position: { x: 2300, y: 20 },
      data: {
        primitive: PRIMITIVE.DO,
        label: 'End flow',
        config: {
          mode: DO_MODE.FINISH,
          actions: [{ name: 'new_action', params: [{ key: 'param', value: 'value' }] }],
          subprocedure: { name: '', inputBindings: [], outputBindings: [] },
          escalate: { note: '' },
          finish: { note: 'Return flow completed successfully.' },
        },
      },
    },
    {
      id: 'do_escalate',
      type: 'capNode',
      position: { x: 1980, y: 320 },
      data: {
        primitive: PRIMITIVE.DO,
        label: 'Escalate to agent',
        config: {
          mode: DO_MODE.ESCALATE,
          actions: [{ name: 'new_action', params: [{ key: 'param', value: 'value' }] }],
          subprocedure: { name: '', inputBindings: [], outputBindings: [] },
          escalate: { note: 'Outside the return window — hand off to a human agent for a manual review.' },
          finish: { note: '' },
        },
      },
    },
  ]

  const edges = [
    edge('ask_order', 'set_channel'),
    edge('set_channel', 'valid_check'),
    edge('valid_check', 'do_verify', 'valid_check__true'),
    edge('valid_check', 'goto_retry', 'valid_check__false'),
    edge('goto_retry', 'ask_order', 'out', true),
    edge('do_verify', 'do_lookup'),
    edge('do_lookup', 'returnable_check'),
    edge('returnable_check', 'say_eligible', 'returnable_check__true'),
    edge('returnable_check', 'do_escalate', 'returnable_check__false'),
    edge('say_eligible', 'do_finish'),
  ]

  return { nodes, edges }
}

function edge(source, target, sourceHandle = 'out', isGoto = false) {
  return {
    id: `e_${source}_${sourceHandle}_${target}`,
    source,
    target,
    sourceHandle,
    type: 'capEdge',
    data: { isGoto },
  }
}
