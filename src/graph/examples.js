import { buildInitialGraph } from './initialGraph'
import { buildRescheduleGraph } from './rescheduleGraph'

export const EXAMPLES = [
  { key: 'returnEligibility', label: 'Return Eligibility', build: buildInitialGraph },
  { key: 'rescheduleDelivery', label: 'Reschedule Delivery', build: buildRescheduleGraph },
]

export const DEFAULT_EXAMPLE_KEY = EXAMPLES[0].key
