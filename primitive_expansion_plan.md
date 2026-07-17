# Plan: Expanding the Primitive Set from 8 to 11

**Base document:** `agent_composition_system_spec.md` v1.0
**Purpose:** Close a gap in the v1 spec — several UI elements shown in the composition examples aren't actually declared as primitives, so they'd have no schema, no accessibility spec, and no admission review. This plan adds 3 primitives to make the spec internally consistent, for a total of 11.

---

## 1. Where the gap is

Section 4 declares 8 primitives. But re-reading the Section 5 composition examples, three recurring UI elements appear over and over **without being backed by a primitive**:

| Element seen in examples | Appears in | Currently modeled as |
|---|---|---|
| Inline status badges (`✓ Found`, `⚠️ Invalid Entry`, `✓ Eligible`, `Running`/`OK`/`Wait`) | `async-result`, `guide`, `investigate`, `if/else`, `escalate` | Hand-embedded text inside `text-block` — no schema, no consistent accessibility treatment |
| Tappable suggestion tags (`[From email]`, `[My Orders]`, available date chips, auto-fill tags) | `input-with-context`, `guide`, `while`, `foreach` | Not modeled at all — the spec's schema for `collect`/`guide` has no field for them |
| Emoji satisfaction scale (`😞 😐 🙂 😄`) | `closure-celebration` | Not modeled at all |

Section 7.4 (accessibility validation) can't actually enforce "color is not the sole indicator of status" if badges aren't a declared primitive with their own schema — there's nothing to validate against. This is the concrete justification for the 3 additions below; it isn't scope creep, it's making the spec match its own examples.

---

## 2. The 3 new primitives

### `status-badge`
Small inline indicator pairing an icon/color with a text label — never color alone.

```yaml
props:
  label: string             # "Found", "Eligible", "Invalid Entry", "Running"
  state: success | warning | error | info | pending
  icon?: string             # optional override; platform picks default per state
accessibility:
  - Text label always rendered (never icon/color only)
  - role="status" for state changes announced via aria-live="polite"
```
Used by: `async-result`, `instruction-steps`, `live-dashboard`, `branch-reveal`, `handoff-package`, `retry-guide`, `batch-verifier`, `closure-celebration` — i.e. most compositions that currently fake this inside `text-block`.

### `chip-group`
A row of tappable suggestion tags that either auto-fill an input or trigger a lightweight action — distinct from `button-row`/`button-stack`, which advance the flow via `goto`.

```yaml
props:
  chips: {label, value, action: fill | select}[]
  max: 6
accessibility:
  - role="group", aria-label="Suggestions"
  - Each chip is a real button element (keyboard operable), aria-pressed if select-type
```
Used by: `input-with-context` (hint tags, "From email"/"My Orders"), `instruction-steps` and `retry-guide` (available-date tags), `batch-verifier` (retry/skip per item).

### `rating-scale`
Inline emoji/star satisfaction picker, single-select, fires once then locks.

```yaml
props:
  scale: emoji | stars
  points: number            # e.g. 4 or 5
  labels?: string[]         # optional per-point aria-labels
accessibility:
  - role="radiogroup", each point role="radio"
  - aria-label required per point (not just the emoji glyph)
```
Used by: `closure-celebration` only (the `collect_rating` field already exists in Section 5.9's schema — it just has no primitive backing it today).

---

## 3. What changes downstream in the spec

- **Section 4 (Primitive Specification):** table grows from 8 rows to 11.
- **Section 5 composition primitive lists:** 8 of the 12 compositions get an updated primitive list (add `status-badge` and/or `chip-group` where noted above; `closure-celebration` adds `rating-scale`).
- **Section 5 schemas:** `collect` gains an optional `suggestions` field (→ `chip-group`); `guide`/`while` gain `corrections` or reuse `instructions` output as chip values; no schema changes needed for badges — they derive from existing `outcomes`/`status` fields already in the `action`/`investigate`/`if` schemas.
- **Section 7.4 (Accessibility Validation):** add a rule — "every `status-badge` instance must carry a non-empty `label`, not just `state`" — this is now checkable because the primitive exists.
- **Section 8.2 (Primitive Admission Criteria):** these 3 ship as part of the v1 baseline, not as quarterly additions — call this out explicitly so it doesn't read as a governance violation of "no new primitives in v1."
- **Section 4 rule** ("No new primitives in v1") gets a footnote: baseline is 11, quarterly review applies to anything beyond that.

## 4. Rollout sequencing (fits inside existing Phase 1/2 in Section 9)

1. Phase 1 (Weeks 1-4): implement all 11 primitives as components, not 8 — `status-badge` and `chip-group` are used by more compositions than half the original 8, so building them late would block Phase 2.
2. Phase 2 (Weeks 5-8): when porting the reschedule agent, verify every badge/chip/rating shown in its actual conversation transcript maps to one of these 3 primitives — this is the acceptance test that the gap is actually closed.
3. No roadmap timeline changes — this fits inside existing Phase 1/2 windows, it's a correction to primitive count, not new scope.

## 5. Open question for sign-off

Confirm the 3 chosen (`status-badge`, `chip-group`, `rating-scale`) are the right 3 before this gets folded back into the main spec — they were chosen because they're the only undeclared elements that recur across multiple compositions in the existing examples (i.e., they clear the Section 8.2 bar of "serves 3+ agents/compositions" using the spec's own worked examples as evidence).
