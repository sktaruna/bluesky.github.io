import { buildRescheduleGraph } from './rescheduleGraph'

// Return Eligibility was retired — Reschedule Delivery (now shared with the
// chat demo via flows/reschedule.js) is the sole remaining example.
export const EXAMPLES = [{ key: 'rescheduleDelivery', label: 'Reschedule Delivery', build: buildRescheduleGraph }]

export const DEFAULT_EXAMPLE_KEY = EXAMPLES[0].key
