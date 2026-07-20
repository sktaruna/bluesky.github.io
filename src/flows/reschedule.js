// The single "Reschedule Delivery" flow definition — one node/edge array
// shared by both the chat demo (behaviors/engine.js) and the graph editor
// (graph/rescheduleGraph.js's thin adapter). Exercises all 10 primitive
// types, including the confirmed decisions:
//   - investigate's `forEachIn: 'candidate_dates'` for slot-checking
//   - a `goto` node routing confirm's "Change Date" back to collect_new_date
//   - retry + validate on collect_new_date (3 attempts, escalates on exceed)
// Plus a `guide` node (not called out node-by-node in the confirmed
// walkthrough, but the confirmed decision explicitly wants all 10 types
// exercised) giving the user context before the "not eligible" escalation.
export const RESCHEDULE_FLOW = {
  id: 'rescheduleDelivery',
  label: 'Reschedule Delivery',
  entry: 'welcome_choice',
  initialDatapoints: {
    candidate_dates: ['2026-07-25', '2026-07-26', '2026-07-27', '2026-07-28'],
  },
  nodes: [
    {
      id: 'welcome_choice',
      type: 'choice',
      label: 'Welcome Choice',
      position: { x: 600, y: 0 },
      config: {
        prompt: 'What would you like to do?',
        options: [
          { id: 'reschedule', label: 'Reschedule delivery', subtitle: 'Pick a new date that works for you' },
          { id: 'human', label: 'Speak to a human agent', subtitle: 'Connect with support team' },
        ],
      },
    },
    {
      id: 'collect_order_id',
      type: 'collect',
      label: 'Collect Order ID',
      position: { x: 1200, y: 170 },
      config: {
        prompt: "Let's find your order. Please enter your Order ID below.",
        field: { name: 'order_id', type: 'text', placeholder: 'e.g. ORD-2026-78432' },
        hints: ['From email', 'My Orders'],
        validate: null,
      },
    },
    {
      id: 'lookup_order',
      type: 'action',
      label: 'Look Up Order',
      position: { x: 1200, y: 340 },
      config: {
        call: 'lookupOrder',
        inputs: [{ key: 'order_id', value: '{{order_id}}' }],
        outcomes: ['found', 'not_found'],
        loadingMessage: 'Looking up your order...',
        render: {
          found: {
            badge: { label: 'Found', state: 'success' },
            lines: ['Order #{{order_id}}', '{{item_name}}', 'Est. Delivery: {{current_date}}'],
          },
          not_found: {
            badge: { label: 'Not Found', state: 'error' },
            lines: ["We couldn't find an order with that ID."],
          },
        },
      },
    },
    {
      id: 'order_not_found',
      type: 'escalate',
      label: 'Order Not Found',
      position: { x: 1800, y: 510 },
      config: {
        to: 'support',
        message: "We couldn't locate an order with that ID — a support agent can help track it down.",
        context: [],
      },
    },
    {
      id: 'check_status',
      type: 'if',
      label: 'Check Order Status',
      position: { x: 600, y: 510 },
      config: {
        condition: "order_status in ['in_transit','delivered','cancelled']",
        thenText: 'Your order status is "{{order_status}}", so it can no longer be rescheduled through this channel.',
        elseText: 'Great news! Your order is currently "{{order_status}}", so it can be rescheduled. Let me fetch the available delivery slots for you.',
      },
    },
    {
      id: 'guide_not_eligible',
      type: 'guide',
      label: 'Explain Not Eligible',
      position: { x: 300, y: 680 },
      config: {
        errorContext: "Since your order is already {{order_status}}, it can't be automatically rescheduled through this channel.",
        instructions: [
          'Orders that are in transit, delivered, or cancelled cannot be rescheduled here.',
          "I'll connect you with a support agent who can look into other options for you.",
        ],
        reentryField: null,
        validate: null,
      },
    },
    {
      id: 'not_eligible',
      type: 'escalate',
      label: 'Not Eligible',
      position: { x: 300, y: 850 },
      config: {
        to: 'support',
        message: 'Your order status changed, so the reschedule can no longer be completed automatically.',
        context: [
          { label: 'Order ID', datapoint: 'order_id' },
          { label: 'Status', datapoint: 'order_status' },
        ],
      },
    },
    {
      id: 'check_slots',
      type: 'investigate',
      label: 'Check Available Slots',
      position: { x: 1200, y: 680 },
      config: {
        title: 'Checking available delivery slots...',
        actions: [{ label: 'Slot', call: 'checkSlot', forEachIn: 'candidate_dates', resultField: 'available_slots' }],
        outcomes: ['ok'],
      },
    },
    {
      id: 'collect_new_date',
      type: 'collect',
      label: 'Collect New Date',
      position: { x: 1200, y: 850 },
      config: {
        prompt: 'What new date works for you?',
        field: { name: 'chosen_date', type: 'text', placeholder: 'e.g. 2026-07-25' },
        hints: { fromDatapoint: 'available_slots' },
        invalidMessage: 'That date does not match any available slots.',
        validate: { condition: 'chosen_date in available_slots' },
        retry: { maxAttempts: 3, onExceeded: 'escalate_to_human' },
      },
    },
    {
      id: 'escalate_to_human',
      type: 'escalate',
      label: 'Escalate — Too Many Attempts',
      position: { x: 2100, y: 1020 },
      config: {
        to: 'human',
        message: "That still doesn't match an available slot after a few tries — let's get you to a person.",
        context: [
          { label: 'Order ID', datapoint: 'order_id' },
          { label: 'Attempts', value: '3 of 3' },
        ],
      },
    },
    {
      id: 'confirm_reschedule',
      type: 'confirm',
      label: 'Confirm Reschedule',
      position: { x: 1200, y: 1020 },
      config: {
        title: 'Please confirm before I proceed',
        rows: [
          { label: 'Order ID', datapoint: 'order_id' },
          { label: 'Current Date', datapoint: 'current_date' },
          { label: 'New Date', datapoint: 'chosen_date', highlight: true },
          { label: 'Item', datapoint: 'item_name' },
        ],
        actions: [
          { id: 'confirm', label: 'Confirm & Reschedule', style: 'success' },
          { id: 'change', label: 'Change Date', style: 'outline' },
        ],
      },
    },
    {
      id: 'goto_change_date',
      type: 'goto',
      label: 'Return To Date Selection',
      position: { x: 1500, y: 1190 },
      config: { target: 'collect_new_date' },
    },
    {
      id: 'do_reschedule',
      type: 'action',
      label: 'Reschedule Order',
      position: { x: 900, y: 1190 },
      config: {
        call: 'rescheduleOrder',
        inputs: [
          { key: 'order_id', value: '{{order_id}}' },
          { key: 'new_date', value: '{{chosen_date}}' },
        ],
        outcomes: ['success'],
        loadingMessage: 'Rescheduling your delivery...',
        render: {
          success: {
            badge: { label: 'Rescheduled', state: 'success' },
            lines: ['Reschedule request submitted successfully.'],
          },
        },
      },
    },
    {
      id: 'done_success',
      type: 'done',
      label: 'Reschedule Confirmed',
      position: { x: 900, y: 1360 },
      config: {
        message: 'Your delivery has been successfully rescheduled.',
        summaryRows: [
          { label: 'Order ID', datapoint: 'order_id' },
          { label: 'New Delivery Date', datapoint: 'chosen_date', highlight: true },
          { label: 'Confirmation', value: 'Sent to your email' },
        ],
        nextActions: [{ label: 'Start Over', action: 'restart' }],
        collectRating: true,
      },
    },
    {
      id: 'investigate_before_escalate',
      type: 'investigate',
      label: 'Check Account Before Escalating',
      position: { x: 0, y: 170 },
      config: {
        title: 'Checking your account...',
        actions: [
          { label: 'Account Status', call: 'getAccountStatus' },
          { label: 'Recent Tickets', call: 'getRecentTickets' },
        ],
        outcomes: ['ok'],
      },
    },
    {
      id: 'escalate_direct',
      type: 'escalate',
      label: 'Escalate Direct',
      position: { x: 0, y: 340 },
      config: {
        to: 'human',
        message: "I'm connecting you with a human agent now.",
        context: [
          { label: 'Account Status', datapoint: 'account_status' },
          { label: 'Recent Tickets', datapoint: 'recent_tickets' },
        ],
      },
    },
  ],
  edges: [
    { source: 'welcome_choice', sourceHandle: 'reschedule', target: 'collect_order_id' },
    { source: 'welcome_choice', sourceHandle: 'human', target: 'investigate_before_escalate' },

    { source: 'collect_order_id', sourceHandle: 'out', target: 'lookup_order' },

    { source: 'lookup_order', sourceHandle: 'found', target: 'check_status' },
    { source: 'lookup_order', sourceHandle: 'not_found', target: 'order_not_found' },
    { source: 'lookup_order', sourceHandle: 'onError', target: 'order_not_found' },

    { source: 'check_status', sourceHandle: 'then', target: 'guide_not_eligible' },
    { source: 'check_status', sourceHandle: 'else', target: 'check_slots' },

    { source: 'guide_not_eligible', sourceHandle: 'out', target: 'not_eligible' },

    { source: 'check_slots', sourceHandle: 'ok', target: 'collect_new_date' },
    { source: 'check_slots', sourceHandle: 'onError', target: 'escalate_to_human' },

    { source: 'collect_new_date', sourceHandle: 'out', target: 'confirm_reschedule' },

    { source: 'confirm_reschedule', sourceHandle: 'confirm', target: 'do_reschedule' },
    { source: 'confirm_reschedule', sourceHandle: 'change', target: 'goto_change_date' },

    { source: 'goto_change_date', sourceHandle: 'target', target: 'collect_new_date' },

    { source: 'do_reschedule', sourceHandle: 'success', target: 'done_success' },
    { source: 'do_reschedule', sourceHandle: 'onError', target: 'escalate_to_human' },

    { source: 'investigate_before_escalate', sourceHandle: 'ok', target: 'escalate_direct' },
    { source: 'investigate_before_escalate', sourceHandle: 'onError', target: 'escalate_direct' },
  ],
}
