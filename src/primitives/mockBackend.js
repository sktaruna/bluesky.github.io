// Single mock-data module for both UIs. `MOCK_BACKEND` holds deterministic-ish
// stand-ins for real integrations (no network, no artificial delay of its
// own — pacing is layered on by whoever builds the `mockCall` for their
// context). `PLACEHOLDER_VALUES` is the click-through trace's guess at what
// a user might type into a given field, folding in the old traceEngine's
// `mockAskPlaceholder` map.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const MOCK_BACKEND = {
  async lookupOrder({ order_id } = {}) {
    const id = (order_id || '').trim().toUpperCase()
    if (!id.startsWith('ORD')) return { outcome: 'not_found', data: {} }
    const order_status = id.includes('999') ? 'in_transit' : 'processing'
    return {
      outcome: 'found',
      data: {
        order_id: id,
        order_status,
        item_name: 'Wireless Headphones - Black',
        current_date: 'July 21, 2026',
      },
    }
  },

  async checkSlot({ date } = {}) {
    const available = !String(date).endsWith('27')
    return { available, detail: available ? 'Open' : 'Carrier at capacity' }
  },

  async rescheduleOrder() {
    return { outcome: 'success', data: {} }
  },

  async getAccountStatus() {
    return { available: true, data: { account_status: 'Good standing, no holds' }, detail: 'Good standing' }
  },

  async getRecentTickets() {
    return { available: true, data: { recent_tickets: 'None in the last 90 days' }, detail: '0 open tickets' }
  },
}

export const PLACEHOLDER_VALUES = {
  order_id: 'ORD-58213',
  chosen_date: '2026-07-25',
}

export function placeholderFor(fieldName) {
  return PLACEHOLDER_VALUES[fieldName] || `sample_${fieldName}`
}

// Builds the `mockCall(name, args)` function threaded through execute() via
// ctx. `delayMs` paces the animated chat transcript; the click-through graph
// trace passes 0 for an instant result.
export function createMockCall(delayMs = 0) {
  return async function mockCall(name, args) {
    if (delayMs) await delay(delayMs)
    const fn = MOCK_BACKEND[name]
    if (!fn) throw new Error(`Unknown mock backend call: ${name}`)
    return fn(args)
  }
}
