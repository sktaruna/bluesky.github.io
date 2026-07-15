# Capability Graph Editor — Prototype

A design-validation prototype for a new chatbot/agent authoring model: a **deterministic
interpreter** running a **graph of 6 primitives** (`Say`, `Ask`, `Set`, `Do/Run`,
`If/Branch`, `Go To`), replacing the old flat 11-activity-type picker. The LLM's only
jobs in this model are extracting datapoints from user input and generating
natural-language output — everything else is deterministic graph structure.

This is a prototype for validating the primitive set and graph model, not the
production authoring tool. Everything lives in client-side React state and resets
on reload — there is no backend and no persistence.

## Stack

- Vite + React 19
- [`@xyflow/react`](https://reactflow.dev/) (React Flow) for canvas mechanics — drag,
  connect, rewire, pan/zoom — with fully custom node and edge rendering on top
- No backend, no router, no state library — plain React state

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL. The canvas loads pre-wired with a return-eligibility
example that exercises all 6 primitives, a bundled multi-action `Do` node, a
sub-procedure call with input/output bindings, a two-way branch, and a `Go To`
retry loop.

## Building

```bash
npm run build
```

Outputs a static build to `dist/`.

## Deploying to GitHub Pages

This repo is a GitHub **user** Pages site (`sktaruna.github.io`), served from the
domain root, so [`vite.config.js`](vite.config.js) sets `base: '/'`. If you fork this
into an ordinary project repo (served at `https://<user>.github.io/<repo-name>/`),
change `base` to `'/<repo-name>/'`.

Deployment uses the [`gh-pages`](https://www.npmjs.com/package/gh-pages) package to
push the built `dist/` folder to a `gh-pages` branch:

```bash
npm run deploy
```

Then, in the repo's GitHub Pages settings, set the Pages source to the `gh-pages`
branch. (One-time setup — subsequent `npm run deploy` runs just update that branch.)

## What's here

- **The 6 primitives** — `Say`, `Ask`, `Set` are LLM-invoked (violet accent + sparkle
  badge); `Do/Run`, `If/Branch`, `Go To` are pure-deterministic (neutral slate, no
  badge). This distinction is visible at a glance across the whole canvas.
- **Full graph editing** — add any primitive from the left palette, drag to
  reposition, delete, and wire/rewire edges by dragging between node handles.
  `If/Branch` nodes expose one output handle per condition (edit the condition list
  from the config panel; a handle appears immediately for wiring). `Go To` nodes
  pick their target from a dropdown, which keeps the canvas edge in sync.
- **Config panel** — selecting any node opens its full config form on the right,
  matching the fields specified for that primitive (including the `Do/Run` mode
  switch between Action / Sub-procedure / Escalate / Finish, and bundling 2+ actions
  in one node).
- **Click-through trace** — `Run` starts execution at the entry node; `Step forward`
  advances one node at a time, highlighting the active node distinctly from
  selection. Branch conditions evaluate against live datapoint state (editable
  inline in the trace panel, so you can flip a value and watch the flow take the
  other path). Reaching a `Finish` or `Escalate` node ends the trace.

## Explicitly out of scope

Natural-language-to-graph compilation, versioning/draft-live UI, a simulation/testing
framework, and real backend wiring are all out of scope for this prototype — see
`BUILD_PROMPT.md` for the full rationale.

## Project structure

```
src/
  constants/primitives.js   Locked primitive definitions, defaults, LLM-invoked flags
  graph/initialGraph.js     The pre-loaded return-eligibility example
  graph/graphOps.js         Pure helpers for adding/removing nodes, branches, edges
  trace/traceEngine.js      Trace stepping logic: outcome resolution, mock effects
  utils/condition.js        Minimal safe evaluator for branch condition strings
  components/
    nodes/CapNode.jsx       Single custom node renderer, styled per primitive
    edges/CapEdge.jsx       Custom edge renderer (condition labels, default/goto styling)
    ConfigPanel/            Per-primitive config forms
    TracePanel/             Trace/execution side panel
    Palette.jsx, TopBar.jsx Toolbar and run controls
  App.jsx                   App-level state (nodes, edges, selection, trace) and wiring
```
