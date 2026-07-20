import { useCallback, useMemo, useRef, useState } from 'react'
import { PRIMITIVES, NO_RETRY_TYPES } from '../primitives/registry'
import { createMockCall } from '../primitives/mockBackend'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Scans the flow's shared `edges` array for the transition a node's outcome
// handle drives — the one real structural change chat's engine absorbs vs.
// the old per-node inline goto/outcomes maps.
function resolveNext(flow, nodeId, handle) {
  if (handle == null) return null
  const edge = flow.edges.find((e) => e.source === nodeId && e.sourceHandle === handle)
  return edge ? edge.target : null
}

// Interprets a shared flow (src/flows/reschedule.js) step by step, entirely
// through the registry's `execute()` — no per-type switch/if-chain here.
// Pauses at collect/choice/confirm nodes for real user input (via
// `waitFor`/`respond`) and resumes automatically for everything else.
export function useBehaviorEngine(flow) {
  const nodeMap = useMemo(() => Object.fromEntries(flow.nodes.map((n) => [n.id, n])), [flow])
  const mockCall = useMemo(() => createMockCall(700), [])

  const [transcript, setTranscript] = useState([])
  const [datapoints, setDatapoints] = useState(flow.initialDatapoints || {})
  const [awaiting, setAwaiting] = useState(null)
  const [status, setStatus] = useState('idle') // idle | running | finished | escalated

  const resolverRef = useRef(null)
  const runIdRef = useRef(0)
  const attemptsRef = useRef(new Map())
  const seqRef = useRef(0)

  const pushMessage = useCallback((msg) => {
    seqRef.current += 1
    const id = `m${seqRef.current}`
    setTranscript((t) => [...t, { id, ...msg }])
    return id
  }, [])
  const updateMessage = useCallback((id, patch) => {
    setTranscript((t) => t.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const waitFor = useCallback((spec) => {
    setAwaiting(spec)
    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const respond = useCallback((value) => {
    const resolve = resolverRef.current
    if (!resolve) return
    resolverRef.current = null
    setAwaiting(null)
    resolve(value)
  }, [])

  const start = useCallback(() => {
    runIdRef.current += 1
    const myRunId = runIdRef.current
    setTranscript([])
    setStatus('running')
    setAwaiting(null)
    attemptsRef.current = new Map()

    let dp = { ...(flow.initialDatapoints || {}) }
    setDatapoints(dp)
    const stale = () => runIdRef.current !== myRunId

    async function run(startId) {
      let id = startId

      while (id) {
        if (stale()) return
        const node = nodeMap[id]
        const spec = node && PRIMITIVES[node.type]
        if (!node || !spec) {
          setStatus('finished')
          return
        }

        const attempt = (attemptsRef.current.get(id) || 0) + 1
        const ctx = { datapoints: dp, attempt, waitFor, pushMessage, updateMessage, mockCall, delay }

        const result = await spec.execute(node, ctx)
        if (stale()) return

        if (result.patch) {
          dp = { ...dp, ...result.patch }
          setDatapoints(dp)
        }

        if (result.terminal) {
          setStatus(result.terminal === 'escalate' ? 'escalated' : 'finished')
          return
        }

        const retryCfg = !NO_RETRY_TYPES.has(node.type) ? node.config.retry : null

        if (result.failed && retryCfg) {
          attemptsRef.current.set(id, attempt)
          if (attempt >= retryCfg.maxAttempts) {
            attemptsRef.current.delete(id)
            if (!retryCfg.onExceeded) {
              // eslint-disable-next-line no-console
              console.warn(`Node "${id}" exceeded retry attempts but has no onExceeded target — failing open.`)
              id = resolveNext(flow, id, result.outcome)
              continue
            }
            id = retryCfg.onExceeded
            continue
          }
          continue // re-present the same node; execute() renders "Attempt N of M"
        }

        // Not retrying (either it succeeded, or it failed with no retry
        // configured — fail open per the confirmed decision).
        let outcome = result.outcome
        if (outcome == null) {
          const shape = spec.next(node)
          if (shape.handles.length === 1) outcome = shape.handles[0].id
        }
        attemptsRef.current.delete(id)
        id = resolveNext(flow, id, outcome)
      }
      setStatus('finished')
    }

    run(flow.entry)
  }, [flow, nodeMap, mockCall, pushMessage, updateMessage, waitFor])

  const submitCollect = useCallback((value) => respond(value), [respond])
  const chooseOption = useCallback((option) => respond(option), [respond])
  const confirmAction = useCallback((action) => respond(action), [respond])

  return { transcript, datapoints, awaiting, status, start, submitCollect, chooseOption, confirmAction }
}
