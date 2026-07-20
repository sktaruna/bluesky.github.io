// The single source of truth for the 10-type primitive vocabulary shared by
// the graph editor and the chat demo. Every per-type behavior (icon, form
// fields, handle shape, LLM-invoked styling, execution semantics, canvas
// preview, trace detail) lives here — no other file should switch/if-chain
// on `type`/`data.type`.
import { evaluateCondition } from '../utils/condition'
import { fill } from '../utils/fill'
import { PRIMITIVE_ICON } from '../components/icons'

function truncate(str, n) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

function resolveHints(hints, datapoints) {
  if (!hints) return []
  if (Array.isArray(hints)) return hints
  if (hints.fromDatapoint) return datapoints?.[hints.fromDatapoint] || []
  return []
}

function resolveRows(rows, datapoints) {
  return (rows || []).map((r) => ({
    label: r.label,
    value: r.datapoint ? datapoints?.[r.datapoint] : r.value,
    highlight: !!r.highlight,
  }))
}

export const PRIMITIVES = {
  // ------------------------------------------------------------------ collect
  collect: {
    meta: { label: 'Collect', description: 'Prompts the user and extracts a value into a datapoint' },
    schema: [
      { key: 'prompt', label: 'Prompt', kind: 'textarea', rows: 3 },
      { key: 'field', label: 'Field', kind: 'fieldSpec' },
      { key: 'hints', label: 'Hints', kind: 'hints' },
      { key: 'validate', label: 'Validate on collect', kind: 'validate' },
    ],
    defaultConfig: () => ({
      prompt: 'Ask the user something…',
      field: { name: 'new_datapoint', type: 'text', placeholder: '' },
      hints: [],
      validate: null,
    }),
    next: () => ({ kind: 'single', handles: [{ id: 'out' }] }),
    canvas: {
      icon: PRIMITIVE_ICON.collect,
      llmInvoked: true,
      summary: (data) => (
        <>
          <p className="cap-node__quote">"{truncate(data.config.prompt, 70)}"</p>
          <div className="cap-node__row">
            <span className="cap-node__tag">→</span>
            <code className="cap-node__mono">{data.config.field?.name || '—'}</code>
          </div>
        </>
      ),
      traceDetail: (node, trace, helpers) => (
        <div className="trace-panel__ask">
          <div className="trace-panel__ask-prompt">"{fill(node.config.prompt, trace.datapoints)}"</div>
          <label className="field-label">Mock user reply</label>
          <input value={trace.draftValue ?? ''} onChange={(e) => helpers.onDraftChange(e.target.value)} autoFocus />
          <p className="field-hint">
            Written to <code>{node.config.field?.name}</code> when you step forward.
          </p>
        </div>
      ),
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      const hints = resolveHints(config.hints, dp)
      if (ctx.attempt > 1) {
        ctx.pushMessage?.({
          variant: 'agent',
          boxes: ['statusBadge', 'textBlock', 'stepTracker'],
          statusBadge: { label: 'Invalid Entry', state: 'error' },
          textBlock: { text: fill(config.invalidMessage || 'That value did not pass validation — please try again.', dp) },
          stepTracker: { attempt: ctx.attempt - 1, max: node.config.retry?.maxAttempts },
        })
      } else {
        ctx.pushMessage?.({
          variant: 'agent',
          boxes: hints.length ? ['textBlock', 'chipGroup'] : ['textBlock'],
          textBlock: { text: fill(config.prompt, dp) },
          chipGroup: { options: hints },
        })
      }
      const value = await ctx.waitFor({ type: 'collect', field: config.field, hints })
      ctx.pushMessage?.({ variant: 'user', boxes: ['textBlock'], textBlock: { text: String(value) } })
      const patch = { [config.field.name]: value }
      const nextDp = { ...dp, ...patch }
      if (config.validate?.condition && !evaluateCondition(config.validate.condition, nextDp)) {
        return { failed: true, patch }
      }
      return { outcome: 'out', patch }
    },
  },

  // ------------------------------------------------------------------- action
  action: {
    meta: { label: 'Action', description: 'Runs a deterministic backend call' },
    schema: [
      { key: 'call', label: 'Call', kind: 'text', mono: true, placeholder: 'action_name' },
      { key: 'inputs', label: 'Inputs', kind: 'rows', leftField: 'key', rightField: 'value', leftPlaceholder: 'param', rightPlaceholder: '{{datapoint}}' },
      { key: 'outcomes', label: 'Outcomes', kind: 'stringList', placeholder: 'outcome_name', namingHint: true },
      { key: 'loadingMessage', label: 'Loading message', kind: 'text' },
    ],
    defaultConfig: () => ({ call: 'new_action', inputs: [], outcomes: [], loadingMessage: 'Working…', render: {} }),
    next: (node) => ({
      kind: 'map',
      handles: [...(node.config.outcomes || []).map((o) => ({ id: o })), { id: 'onError' }],
    }),
    canvas: {
      icon: PRIMITIVE_ICON.action,
      llmInvoked: false,
      summary: (data) => (
        <div className="cap-node__row">
          <span className="cap-node__tag cap-node__tag--det">action</span>
          <code className="cap-node__mono">{data.config.call || '—'}</code>
          {(data.config.outcomes || []).length > 0 && <span className="cap-node__badge-count">×{data.config.outcomes.length}</span>}
        </div>
      ),
      traceDetail: () => <div className="trace-panel__branch-note">Runs the mocked backend call immediately on step.</div>,
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      const filledInputs = Object.fromEntries((config.inputs || []).map((r) => [r.key, fill(r.value, dp)]))
      const loadingId = ctx.pushMessage?.({
        variant: 'muted',
        boxes: ['loadingIndicator'],
        loadingIndicator: { message: config.loadingMessage || 'Working…' },
      })
      let result
      try {
        result = await ctx.mockCall(config.call, filledInputs)
      } catch {
        result = { outcome: 'onError', data: {} }
      }
      const outcome = result.outcome || 'onError'
      const render = config.render?.[outcome] || (outcome === 'onError' ? { badge: { label: 'Error', state: 'error' }, lines: ['Something went wrong.'] } : null)
      const mergedDp = { ...dp, ...(result.data || {}) }
      ctx.updateMessage?.(loadingId, {
        variant: 'agent',
        boxes: render ? ['statusBadge', 'textBlock'] : [],
        statusBadge: render?.badge,
        textBlock: render ? { text: (render.lines || []).map((l) => fill(l, mergedDp)).join('\n') } : undefined,
      })
      return { outcome, patch: result.data || {}, failed: outcome === 'onError' }
    },
  },

  // ------------------------------------------------------------------- choice
  choice: {
    meta: { label: 'Choice', description: 'Presents a fixed menu of options' },
    schema: [
      { key: 'prompt', label: 'Prompt', kind: 'textarea' },
      { key: 'options', label: 'Options', kind: 'optionsList' },
    ],
    defaultConfig: () => ({
      prompt: 'What would you like to do?',
      options: [
        { id: 'opt_1', label: 'Option 1', subtitle: '' },
        { id: 'opt_2', label: 'Option 2', subtitle: '' },
      ],
    }),
    next: (node) => ({ kind: 'map', handles: (node.config.options || []).map((o) => ({ id: o.id, labelFn: () => o.label })) }),
    canvas: {
      icon: PRIMITIVE_ICON.choice,
      llmInvoked: false,
      summary: (data) => (
        <div className="cap-node__row">
          <span className="cap-node__tag">{(data.config.options || []).length} options</span>
        </div>
      ),
      traceDetail: (node, trace, helpers) => (
        <div className="trace-panel__branch-note">
          <p className="field-hint">Pick which option the mock user chooses:</p>
          <div className="segmented segmented--wrap">
            {(node.config.options || []).map((o) => (
              <button
                key={o.id}
                className={`segmented__opt ${trace.draftValue === o.id ? 'segmented__opt--active' : ''}`}
                onClick={() => helpers.onDraftChange(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    async execute(node, ctx) {
      const { config } = node
      ctx.pushMessage?.({ variant: 'agent', boxes: ['textBlock'], textBlock: { text: fill(config.prompt, ctx.datapoints) } })
      const choice = await ctx.waitFor({ type: 'choice', options: config.options })
      ctx.pushMessage?.({ variant: 'user', boxes: ['textBlock'], textBlock: { text: choice.label } })
      return { outcome: choice.id }
    },
  },

  // ------------------------------------------------------------------ confirm
  confirm: {
    meta: { label: 'Confirm', description: 'Shows a summary card with confirm/alternate actions' },
    schema: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'rows', label: 'Summary rows', kind: 'kvRows' },
      { key: 'actions', label: 'Actions', kind: 'actionsList' },
    ],
    defaultConfig: () => ({
      title: 'Please confirm before I proceed',
      rows: [],
      actions: [
        { id: 'confirm', label: 'Confirm', style: 'success' },
        { id: 'cancel', label: 'Cancel', style: 'outline' },
      ],
    }),
    next: (node) => ({ kind: 'map', handles: (node.config.actions || []).map((a) => ({ id: a.id, labelFn: () => a.label })) }),
    canvas: {
      icon: PRIMITIVE_ICON.confirm,
      llmInvoked: false,
      summary: (data) => (
        <div className="cap-node__row">
          <span className="cap-node__tag cap-node__tag--det">confirm</span>
          <code className="cap-node__mono">{truncate(data.config.title, 40) || '—'}</code>
        </div>
      ),
      traceDetail: (node, trace, helpers) => (
        <div className="trace-panel__branch-note">
          <p className="field-hint">Pick which action the mock user takes:</p>
          <div className="segmented segmented--wrap">
            {(node.config.actions || []).map((a) => (
              <button
                key={a.id}
                className={`segmented__opt ${trace.draftValue === a.id ? 'segmented__opt--active' : ''}`}
                onClick={() => helpers.onDraftChange(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      const rows = resolveRows(config.rows, dp)
      ctx.pushMessage?.({
        variant: 'agent',
        boxes: ['textBlock', 'kvTable'],
        textBlock: { text: config.title, strong: true },
        kvTable: { rows },
      })
      const action = await ctx.waitFor({ type: 'confirm', actions: config.actions })
      ctx.pushMessage?.({ variant: 'user', boxes: ['textBlock'], textBlock: { text: action.label } })
      return { outcome: action.id }
    },
  },

  // -------------------------------------------------------------------- guide
  guide: {
    meta: { label: 'Guide', description: 'Walks the user through instructions, with optional re-entry' },
    schema: [
      { key: 'errorContext', label: 'Context text', kind: 'textarea' },
      { key: 'instructions', label: 'Instructions', kind: 'stringList', placeholder: 'Step…' },
      { key: 'reentryField', label: 'Re-entry field (optional)', kind: 'fieldSpec', optional: true },
      { key: 'validate', label: 'Validate on re-entry', kind: 'validate' },
    ],
    defaultConfig: () => ({ errorContext: '', instructions: [], reentryField: null, validate: null }),
    next: () => ({ kind: 'single', handles: [{ id: 'out' }] }),
    canvas: {
      icon: PRIMITIVE_ICON.guide,
      llmInvoked: true,
      summary: (data) => <p className="cap-node__quote">"{truncate(data.config.errorContext, 80)}"</p>,
      traceDetail: (node, trace, helpers) =>
        node.config.reentryField ? (
          <div className="trace-panel__ask">
            <label className="field-label">Mock re-entry value</label>
            <input value={trace.draftValue ?? ''} onChange={(e) => helpers.onDraftChange(e.target.value)} autoFocus />
          </div>
        ) : (
          <div className="trace-panel__branch-note">No re-entry — advances immediately on step.</div>
        ),
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      const boxes = ['textBlock']
      if (config.instructions?.length) boxes.push('stepTracker')
      ctx.pushMessage?.({
        variant: 'agent',
        boxes,
        textBlock: { text: fill(config.errorContext || '', dp) },
        stepTracker: { items: config.instructions },
      })
      if (config.reentryField) {
        const value = await ctx.waitFor({ type: 'collect', field: config.reentryField })
        ctx.pushMessage?.({ variant: 'user', boxes: ['textBlock'], textBlock: { text: String(value) } })
        const patch = { [config.reentryField.name]: value }
        const nextDp = { ...dp, ...patch }
        if (config.validate?.condition && !evaluateCondition(config.validate.condition, nextDp)) {
          return { failed: true, patch }
        }
        return { outcome: 'out', patch }
      }
      return { outcome: 'out' }
    },
  },

  // --------------------------------------------------------------- investigate
  investigate: {
    meta: { label: 'Investigate', description: 'Runs one or more deterministic checks, optionally per item in a list' },
    schema: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'actions', label: 'Checks', kind: 'investigateActions' },
      { key: 'outcomes', label: 'Outcomes', kind: 'stringList', placeholder: 'outcome_name', namingHint: true },
    ],
    defaultConfig: () => ({ title: 'Checking…', actions: [], outcomes: ['ok'] }),
    next: (node) => ({
      kind: 'map',
      handles: [...(node.config.outcomes || []).map((o) => ({ id: o })), { id: 'onError' }],
    }),
    canvas: {
      icon: PRIMITIVE_ICON.investigate,
      llmInvoked: false,
      summary: (data) => (
        <div className="cap-node__row">
          <span className="cap-node__tag cap-node__tag--det">investigate</span>
          <span className="cap-node__badge-count">{(data.config.actions || []).length} check(s)</span>
        </div>
      ),
      traceDetail: () => <div className="trace-panel__branch-note">Runs all checks immediately on step.</div>,
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      ctx.pushMessage?.({ variant: 'agent', boxes: ['textBlock'], textBlock: { text: config.title } })
      const plan = []
      for (const action of config.actions || []) {
        if (action.forEachIn) {
          const list = dp[action.forEachIn] || []
          list.forEach((item) => plan.push({ label: `${action.label || item} ${item}`.trim(), call: action.call, args: { date: item }, resultField: action.resultField, item }))
        } else {
          plan.push({ label: action.label, call: action.call, args: {} })
        }
      }
      let items = plan.map((p) => ({ label: p.label, status: 'pending', detail: '' }))
      const listId = ctx.pushMessage?.({ variant: 'bare', boxes: ['statusList'], statusList: { items } })
      const patch = {}
      let anyError = false
      for (let i = 0; i < plan.length; i++) {
        items = items.map((it, idx) => (idx === i ? { ...it, status: 'active', detail: 'Checking...' } : it))
        ctx.updateMessage?.(listId, { statusList: { items: [...items] } })
        let r
        try {
          r = await ctx.mockCall(plan[i].call, plan[i].args)
        } catch {
          r = { available: false, detail: 'Error' }
        }
        const ok = r.available !== false && r.ok !== false
        if (!ok) anyError = true
        if (plan[i].resultField) {
          const arr = patch[plan[i].resultField] || []
          if (ok) arr.push(plan[i].item)
          patch[plan[i].resultField] = arr
        } else if (r.data) {
          Object.assign(patch, r.data)
        }
        items = items.map((it, idx) => (idx === i ? { ...it, status: ok ? 'done' : 'error', detail: r.detail || (ok ? 'OK' : 'Unavailable') } : it))
        ctx.updateMessage?.(listId, { statusList: { items: [...items] } })
      }
      if (anyError) return { outcome: 'onError', patch, failed: true }
      return { outcome: config.outcomes?.[0] || 'ok', patch }
    },
  },

  // ------------------------------------------------------------------------ if
  if: {
    meta: { label: 'If', description: 'Branches on a condition against current datapoints' },
    schema: [
      { key: 'condition', label: 'Condition', kind: 'text', mono: true, placeholder: 'datapoint == value' },
      { key: 'thenLabel', label: 'Then branch name (optional)', kind: 'text', placeholder: 'Then' },
      { key: 'thenText', label: 'Then text', kind: 'textarea' },
      { key: 'elseLabel', label: 'Else branch name (optional)', kind: 'text', placeholder: 'Else' },
      { key: 'elseText', label: 'Else text', kind: 'textarea' },
    ],
    defaultConfig: () => ({ condition: 'condition == true', thenLabel: '', thenText: '', elseLabel: '', elseText: '' }),
    next: (node) => ({
      kind: 'fixed',
      handles: [
        { id: 'then', labelFn: () => node.config.thenLabel || 'Then' },
        { id: 'else', labelFn: () => node.config.elseLabel || 'Else' },
      ],
    }),
    canvas: {
      icon: PRIMITIVE_ICON.if,
      llmInvoked: false,
      summary: (data) => (
        <div className="cap-node__row">
          <code className="cap-node__mono cap-node__mono--small">{data.config.condition || '—'}</code>
        </div>
      ),
      traceDetail: () => <div className="trace-panel__branch-note">Evaluating condition against current datapoints…</div>,
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      await ctx.delay?.(400)
      const truthy = evaluateCondition(config.condition, dp)
      const label = truthy ? config.thenLabel || 'Then' : config.elseLabel || 'Else'
      ctx.pushMessage?.({
        variant: 'agent',
        boxes: ['statusBadge', 'textBlock'],
        statusBadge: { label, state: truthy ? 'success' : 'error' },
        textBlock: { text: fill(truthy ? config.thenText : config.elseText, dp) },
      })
      return { outcome: truthy ? 'then' : 'else' }
    },
  },

  // ------------------------------------------------------------------ escalate
  escalate: {
    meta: { label: 'Escalate', description: 'Terminal hand-off to a human agent' },
    schema: [
      { key: 'to', label: 'Escalate to', kind: 'text' },
      { key: 'message', label: 'Message', kind: 'textarea' },
      { key: 'context', label: 'Context rows', kind: 'kvRows' },
    ],
    defaultConfig: () => ({ to: 'human', message: 'Hand off to a human agent.', context: [] }),
    next: () => ({ kind: 'none', handles: [] }),
    canvas: {
      icon: PRIMITIVE_ICON.escalate,
      llmInvoked: false,
      summary: (data) => <div className="trace-panel__end-note trace-panel__end-note--warn">{truncate(data.config.message, 90)}</div>,
      traceDetail: (node) => <div className="trace-panel__end-note trace-panel__end-note--warn">{node.config.message}</div>,
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      const rows = resolveRows(config.context, dp)
      ctx.pushMessage?.({
        variant: 'escalate',
        boxes: rows.length ? ['textBlock', 'kvTable'] : ['textBlock'],
        textBlock: { text: fill(config.message, dp) },
        kvTable: { rows },
      })
      return { terminal: 'escalate' }
    },
  },

  // ---------------------------------------------------------------------- done
  done: {
    meta: { label: 'Done', description: 'Terminal successful completion' },
    schema: [
      { key: 'message', label: 'Message', kind: 'textarea' },
      { key: 'summaryRows', label: 'Summary rows', kind: 'kvRows' },
      { key: 'nextActions', label: 'Next actions (inert)', kind: 'actionsList' },
      { key: 'collectRating', label: 'Collect satisfaction rating', kind: 'boolean' },
    ],
    defaultConfig: () => ({ message: 'All done.', summaryRows: [], nextActions: [], collectRating: false }),
    next: () => ({ kind: 'none', handles: [] }),
    canvas: {
      icon: PRIMITIVE_ICON.done,
      llmInvoked: false,
      summary: (data) => <div className="trace-panel__end-note trace-panel__end-note--success">{truncate(data.config.message, 90)}</div>,
      traceDetail: (node) => <div className="trace-panel__end-note trace-panel__end-note--success">{node.config.message}</div>,
    },
    async execute(node, ctx) {
      const { config } = node
      const dp = ctx.datapoints
      const rows = resolveRows(config.summaryRows, dp)
      const boxes = ['statusBadge', 'textBlock', 'kvTable']
      if (config.nextActions?.length) boxes.push('buttonRow')
      if (config.collectRating) boxes.push('ratingScale')
      ctx.pushMessage?.({
        variant: 'done',
        boxes,
        statusBadge: { label: 'Confirmed', state: 'success' },
        textBlock: { text: fill(config.message, dp) },
        kvTable: { rows },
        buttonRow: { actions: config.nextActions || [] },
        ratingScale: {},
      })
      return { terminal: 'done' }
    },
  },

  // ---------------------------------------------------------------------- goto
  goto: {
    meta: { label: 'Go To', description: 'Silently jumps execution to another node, enabling loops' },
    schema: [{ key: 'target', label: 'Target node', kind: 'nodeSelect' }],
    defaultConfig: () => ({ target: null }),
    next: () => ({ kind: 'fixed', handles: [{ id: 'target' }] }),
    canvas: {
      icon: PRIMITIVE_ICON.goto,
      llmInvoked: false,
      inlineTarget: true,
      summary: (data) => (
        <div className="cap-node__row">
          <span className="cap-node__tag cap-node__tag--det">jump to</span>
          <code className="cap-node__mono">{data.targetLabel || data.config.target || 'unset'}</code>
        </div>
      ),
      traceDetail: () => <div className="trace-panel__branch-note">Silent jump — advances immediately on step.</div>,
    },
    async execute() {
      // Silent — no pushMessage, per the confirmed decision that goto fires without a chat message.
      return { outcome: 'target' }
    },
  },
}

export const PRIMITIVE_ORDER = ['collect', 'action', 'choice', 'confirm', 'if', 'escalate', 'done', 'goto', 'guide', 'investigate']
export const TERMINAL_TYPES = new Set(['escalate', 'done'])
export const NO_RETRY_TYPES = new Set(['escalate', 'done', 'goto', 'choice', 'confirm', 'if'])
