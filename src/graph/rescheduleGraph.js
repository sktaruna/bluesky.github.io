import { PRIMITIVE, DO_MODE } from '../constants/primitives'

// "Reschedule Delivery" — a second, more complex example imported from a
// richer step-vocabulary YAML (collect/action/choice/guide/confirm/escalate/
// done/if) and decomposed into the 6 locked primitives. See
// BUILD_PROMPT_2_RESCHEDULE_FLOW.md for the decomposition rules and the four
// source-YAML bugs fixed during import (noted inline below where relevant).

export function buildRescheduleGraph() {
  const nodes = [
    // --- Check Request Type (choice -> Ask + Branch) ---
    node('r_check_request_type', PRIMITIVE.ASK, 'Check Request Type', { x: 40, y: 360 }, {
      prompt:
        'Just to confirm — would you like me to help reschedule your delivery date, or would you prefer to speak with a human agent?',
      datapoint: 'request_type_choice',
    }, { isEntry: true }),
    branchNode('r_route_request_type', 'Route Request Type', { x: 360, y: 360 }, [
      { condition: 'request_type_choice == "Speak to a human agent"', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),

    // --- Collect Order ID (collect -> Ask), with bug-fix #4 validate+reprompt loop ---
    node('r_collect_order_id', PRIMITIVE.ASK, 'Collect Order ID', { x: 680, y: 520 }, {
      prompt: 'Please type your Order ID below. You can find it in your order confirmation email or under My Orders in your account.',
      datapoint: 'order_id',
    }),
    doAction(
      'r_get_order_info_1',
      'Get Order Info',
      { x: 1000, y: 520 },
      'nk-reschedule.get-order-info',
      [{ key: 'order_id', value: '{{order_id}}' }],
      [
        // Bug fix #1: dead {{current-estimated-delivery}} reference in Confirm
        // Reschedule — capture it here as an explicit mocked output field.
        { datapoint: 'current_estimated_delivery', value: '2026-07-08' },
        { datapoint: 'reschedule_order_status', value: 'pending' },
      ],
      ['order found', 'order not found'],
      'order found',
    ),
    // Bug fix #4: Collect Order ID had no "did you mistype it" retry path,
    // unlike the date-collection loop below — give it the same pattern.
    branchNode('r_check_order_id_validity', 'Check Order ID Validity', { x: 1320, y: 520 }, [
      { condition: 'get_order_info_outcome == "order found"', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    gotoNode('r_retry_order_id', 'Retry Order ID', { x: 1320, y: 720 }, 'r_collect_order_id'),

    // --- Check Initial Order Status (if -> Branch) ---
    branchNode('r_check_initial_order_status', 'Check Initial Order Status', { x: 1640, y: 380 }, [
      { condition: "reschedule_order_status in ['in_transit','delivered','cancelled']", isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    doNode('r_order_not_reschedulable_info', 'Order Not Reschedulable Info', { x: 1960, y: 160 }, DO_MODE.FINISH, {
      finish: {
        note: 'Your order is currently showing a status of {{reschedule-order-status}}, which means it is no longer eligible for rescheduling. If there is anything else I can help you with, please let me know.',
      },
    }),

    // --- Get Reschedule Slots (action -> Do + Branch) ---
    doAction(
      'r_get_reschedule_slots',
      'Get Reschedule Slots',
      { x: 1960, y: 460 },
      'nk-reschedule.reschedule-slots',
      [{ key: 'order_id', value: '{{order_id}}' }],
      [
        // Bug fix #2: available-delivery-slots was referenced downstream but
        // never explicitly bound — add the output binding here.
        { datapoint: 'available_delivery_slots', value: '2026-07-14, 2026-07-15, 2026-07-16' },
      ],
      ['order not found', 'slots available', 'no slots available'],
      'slots available',
    ),
    branchNode('r_route_reschedule_slots', 'Route Reschedule Slots', { x: 2280, y: 460 }, [
      { condition: 'get_reschedule_slots_outcome == "order not found"', isDefault: false },
      { condition: 'get_reschedule_slots_outcome == "no slots available"', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    doNode('r_no_slots_available_escalation', 'No Slots Available Escalation', { x: 2600, y: 300 }, DO_MODE.ESCALATE, {
      escalate: {
        note: 'There are no delivery slots currently available for your order. A member of our support team will be in touch to arrange an alternative.',
      },
    }),

    // --- Collect Chosen Date (collect -> Ask), guide folded in + Go To loop ---
    node('r_collect_chosen_date', PRIMITIVE.ASK, 'Collect Chosen Date', { x: 2600, y: 560 }, {
      prompt:
        'The following delivery dates are available for your order:\n\n{{available-delivery-slots}}\n\nPlease type the date you would like exactly as shown above (for example: 2026-07-14). Do not use natural-language dates such as "tomorrow" or "next Tuesday" — only the exact date format displayed will be accepted.',
      datapoint: 'chosen_delivery_slot',
    }),
    branchNode('r_validate_chosen_date', 'Validate Chosen Date', { x: 2920, y: 560 }, [
      { condition: 'chosen_delivery_slot in available_delivery_slots', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    // Bug fix #3: available-delivery-slots is fetched once and never
    // re-fetched inside this retry loop — left as a visible note on the
    // node label (simpler than adding a re-fetch node for this prototype).
    gotoNode('r_reprompt_date', 'Re-prompt Date — note: slots not re-fetched', { x: 2920, y: 760 }, 'r_collect_chosen_date'),

    // --- Re-check Order Info Before Confirm (action -> Do + Branch) ---
    doAction(
      'r_recheck_order_info',
      'Re-check Order Info Before Confirm',
      { x: 3240, y: 460 },
      'nk-reschedule.get-order-info',
      [{ key: 'order_id', value: '{{order_id}}' }],
      [{ datapoint: 'reschedule_order_status', value: 'pending' }],
      ['order found', 'order not found'],
      'order found',
    ),
    branchNode('r_check_order_info_validity_2', 'Check Order Info Validity', { x: 3560, y: 460 }, [
      { condition: 're_check_order_info_before_confirm_outcome == "order found"', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    branchNode('r_check_status_still_reschedulable', 'Check Status Still Reschedulable', { x: 3880, y: 460 }, [
      { condition: "reschedule_order_status in ['in_transit','delivered','cancelled']", isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    doNode('r_status_changed_escalation', 'Status Changed Escalation', { x: 4200, y: 260 }, DO_MODE.ESCALATE, {
      escalate: {
        note: 'Your order status has changed to {{reschedule-order-status}} since we began this conversation, which means the reschedule can no longer be completed. A member of our support team will be able to assist you with next steps.',
      },
    }),

    // --- Confirm Reschedule (confirm -> Ask in yes/no mode, + Branch for on_change) ---
    node('r_confirm_reschedule', PRIMITIVE.ASK, 'Confirm Reschedule', { x: 4200, y: 560 }, {
      prompt:
        'Please confirm the following reschedule before I make any changes:\n\nNew delivery date: {{chosen-delivery-slot}}\n\nCurrent delivery date: {{current-estimated-delivery}}\n\nShall I go ahead and reschedule your delivery to {{chosen-delivery-slot}}?',
      datapoint: 'confirm_reschedule',
    }),
    branchNode('r_route_confirm_reschedule', 'Route Confirm Reschedule', { x: 4520, y: 560 }, [
      { condition: 'confirm_reschedule == "change_requested"', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    gotoNode('r_return_to_date_selection', 'Return to Date Selection', { x: 4840, y: 760 }, 'r_collect_chosen_date'),

    // --- Reschedule Action (action -> Do + Branch) ---
    doAction(
      'r_reschedule_action',
      'Reschedule Action',
      { x: 4840, y: 520 },
      'nk-reschedule.reschedule-action',
      [
        { key: 'new_date', value: '{{chosen_delivery_slot}}' },
        { key: 'order_id', value: '{{order_id}}' },
      ],
      [],
      ['rescheduled', 'invalid date', 'order not found', 'order not eligible'],
      'rescheduled',
    ),
    branchNode('r_route_reschedule_action', 'Route Reschedule Action', { x: 5160, y: 520 }, [
      { condition: 'reschedule_action_outcome == "rescheduled"', isDefault: false },
      { condition: 'reschedule_action_outcome == "invalid date"', isDefault: false },
      { condition: 'reschedule_action_outcome == "order not found"', isDefault: false },
      { condition: 'reschedule_action_outcome == "order not eligible"', isDefault: false },
      { condition: 'else', isDefault: true },
    ]),
    doNode('r_reschedule_success', 'Reschedule Success', { x: 5480, y: 320 }, DO_MODE.FINISH, {
      finish: {
        note: 'Your delivery has been successfully rescheduled. Your new delivery date is {{chosen-delivery-slot}}. You will receive a confirmation shortly. If there is anything else I can help you with, please let me know.',
      },
    }),
    doNode('r_business_rule_rejection_escalation', 'Business Rule Rejection Escalation', { x: 5480, y: 520 }, DO_MODE.ESCALATE, {
      escalate: {
        note: 'I was unable to complete the reschedule for your order. This is due to a business rule that prevents the change from being applied. A member of our support team will be in touch to assist you further.',
      },
    }),
    doNode('r_system_error_escalation', 'System Error Escalation', { x: 5480, y: 720 }, DO_MODE.ESCALATE, {
      escalate: {
        note: 'Something unexpected occurred and the change did not go through. A member of our support team will be with you shortly.',
      },
    }),

    // --- Shared escalation targets ---
    doNode('r_order_system_error_escalation', 'Order System Error Escalation', { x: 2280, y: 700 }, DO_MODE.ESCALATE, {
      escalate: {
        note: 'I was unable to reach the order system at this time and the change did not go through. A member of our support team will be with you shortly.',
      },
    }),
    doNode('r_human_requested_escalation', 'Human Requested Escalation', { x: 360, y: 140 }, DO_MODE.ESCALATE, {
      escalate: { note: 'Connecting you to a member of our support team now.' },
    }),
  ]

  const edges = [
    edge('r_check_request_type', 'r_route_request_type'),
    edge('r_route_request_type', 'r_human_requested_escalation', 'r_route_request_type__0'),
    edge('r_route_request_type', 'r_collect_order_id', 'r_route_request_type__1'),

    edge('r_collect_order_id', 'r_get_order_info_1'),
    edge('r_get_order_info_1', 'r_check_order_id_validity'),
    edge('r_check_order_id_validity', 'r_check_initial_order_status', 'r_check_order_id_validity__0'),
    edge('r_check_order_id_validity', 'r_retry_order_id', 'r_check_order_id_validity__1'),
    edge('r_retry_order_id', 'r_collect_order_id', 'out', true),

    edge('r_check_initial_order_status', 'r_order_not_reschedulable_info', 'r_check_initial_order_status__0'),
    edge('r_check_initial_order_status', 'r_get_reschedule_slots', 'r_check_initial_order_status__1'),

    edge('r_get_reschedule_slots', 'r_route_reschedule_slots'),
    edge('r_route_reschedule_slots', 'r_order_system_error_escalation', 'r_route_reschedule_slots__0'),
    edge('r_route_reschedule_slots', 'r_no_slots_available_escalation', 'r_route_reschedule_slots__1'),
    edge('r_route_reschedule_slots', 'r_collect_chosen_date', 'r_route_reschedule_slots__2'),

    edge('r_collect_chosen_date', 'r_validate_chosen_date'),
    edge('r_validate_chosen_date', 'r_recheck_order_info', 'r_validate_chosen_date__0'),
    edge('r_validate_chosen_date', 'r_reprompt_date', 'r_validate_chosen_date__1'),
    edge('r_reprompt_date', 'r_collect_chosen_date', 'out', true),

    edge('r_recheck_order_info', 'r_check_order_info_validity_2'),
    edge('r_check_order_info_validity_2', 'r_check_status_still_reschedulable', 'r_check_order_info_validity_2__0'),
    edge('r_check_order_info_validity_2', 'r_order_system_error_escalation', 'r_check_order_info_validity_2__1'),

    edge('r_check_status_still_reschedulable', 'r_status_changed_escalation', 'r_check_status_still_reschedulable__0'),
    edge('r_check_status_still_reschedulable', 'r_confirm_reschedule', 'r_check_status_still_reschedulable__1'),

    edge('r_confirm_reschedule', 'r_route_confirm_reschedule'),
    edge('r_route_confirm_reschedule', 'r_return_to_date_selection', 'r_route_confirm_reschedule__0'),
    edge('r_route_confirm_reschedule', 'r_reschedule_action', 'r_route_confirm_reschedule__1'),
    edge('r_return_to_date_selection', 'r_collect_chosen_date', 'out', true),

    edge('r_reschedule_action', 'r_route_reschedule_action'),
    edge('r_route_reschedule_action', 'r_reschedule_success', 'r_route_reschedule_action__0'),
    edge('r_route_reschedule_action', 'r_business_rule_rejection_escalation', 'r_route_reschedule_action__1'),
    edge('r_route_reschedule_action', 'r_business_rule_rejection_escalation', 'r_route_reschedule_action__2'),
    edge('r_route_reschedule_action', 'r_business_rule_rejection_escalation', 'r_route_reschedule_action__3'),
    edge('r_route_reschedule_action', 'r_system_error_escalation', 'r_route_reschedule_action__4'),
  ]

  return { nodes, edges }
}

function node(id, primitive, label, position, config, extra = {}) {
  return { id, type: 'capNode', position, data: { primitive, label, config, ...extra } }
}

function branchNode(id, label, position, branchDefs) {
  const branches = branchDefs.map((b, i) => ({ id: `${id}__${i}`, condition: b.condition, isDefault: b.isDefault }))
  return { id, type: 'capNode', position, data: { primitive: PRIMITIVE.BRANCH, label, config: {}, branches } }
}

function gotoNode(id, label, position, targetId) {
  return node(id, PRIMITIVE.GOTO, label, position, { targetId })
}

function doNode(id, label, position, mode, extraConfig) {
  return node(id, PRIMITIVE.DO, label, position, {
    mode,
    actions: [{ name: 'new_action', params: [{ key: 'param', value: 'value' }], mockOutputs: [] }],
    subprocedure: { name: '', inputBindings: [], outputBindings: [] },
    escalate: { note: '' },
    finish: { note: '' },
    ...extraConfig,
  })
}

function doAction(id, label, position, actionName, params, mockOutputs, outcomes = [], mockOutcome = '') {
  return doNode(id, label, position, DO_MODE.ACTION, {
    actions: [{ name: actionName, params, mockOutputs }],
    outcomes,
    mockOutcome: mockOutcome || outcomes[0] || '',
  })
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
