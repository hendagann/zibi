# 10 — Exam Rules

Status: `draft` · Owner: assessment · Depends on: [03](03-skill-map.md), [05](05-content-model.md), [06](06-question-model.md), [07](07-scoring-rubrics.md), [09](09-progress-model.md)

How an exam is planned, assembled, conducted and refused.

This document was blocked on [07](07-scoring-rubrics.md) (D-07-4) and is written now that
scoring and progress both exist. It resolves nothing about *scoring* — an exam item is scored by
exactly the same engine as a practice item — and everything about *which items are shown, in
what order, under what time budget, and when the whole thing must refuse to start*.

Governing rule, inherited from [06](06-question-model.md) §11: **an exam is not a random list of
questions.** Every exam satisfies a fixed plan, decided before the first item is shown.

---

## 1. What an exam is not

Three failure modes this document exists to prevent:

| Failure | Why it destroys the measurement |
| --- | --- |
| Drawing items at random from whatever exists | Two learners get exams of different difficulty and the scores are not comparable. Neither is comparable to the same learner's own previous attempt. |
| Silently rebalancing a plan the pool cannot fill | The exam reports a readiness figure for a blueprint it did not actually run. A number that means nothing is worse than an error message. |
| Reusing an item the learner has practised | It measures recall of that item's feedback, not the skill (05 §14). |

The last one is already structural: exams draw only from the `exam` pool, practice only from the
`practice` pool, and an item is never in both.

---

## 2. The blueprint

A blueprint is **authored content** (05 §13), extended here with a time-segmented structure.

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | `<SCOPE>.BP.nnn` — see §2.2 |
| `type` | R | `exam_blueprint` |
| `examType` | R | §5 |
| `scope` | R | `topic` · `domain` · `full` |
| `scopeRef` | O | topic or domain ID; absent for `full` |
| `title` | R | Hebrew |
| `durationMinutes` | R | ≤ 20 (`EX-01`) |
| `passMark` | R | percentage |
| `itemCount` | R | must equal the number of segments (`EX-02`) |
| `segments` | R | §2.1, ordered |
| `skillWeights` | O | `{ skillId: percentage }` summing to 100; in-scope only (`CM-23`) |
| `selectionRules` | R | §3 |
| `review` | R | 05 §7 |

### 2.1 Segments

A segment is **one item and its time budget**. The blueprint's segment list is what makes the
exam a plan rather than a quota:

| Field | R/O | Notes |
| --- | --- | --- |
| `segmentId` | R | stable within the blueprint |
| `minutes` | R | the budget for this segment |
| `questionFamily` | R | the `questionType` an item must have to fill it |
| `open` | R | `true` when the family is rubric-scored (an authored artifact) |
| `judgement` | R | `true` when the segment is intended to measure professional judgement |
| `skillHint` | O | preferred primary skill, used only for ordering candidates |

The standard 20-minute exam, as specified by the product owner:

```
20 דקות
├── 4 דקות – ניתוח דרישה        analyse_requirement
├── 3 דקות – דיווח תקלה         author_defect_report
├── 4 דקות – SQL                sql_query
├── 4 דקות – תחקור תקלה         investigate_failure
├── 2 דקות – תעדוף              prioritise_defects
└── 3 דקות – החלטה מקצועית      professional_decision
```

`Σ minutes` must equal `durationMinutes` exactly (`EX-03`). A plan whose parts do not add up to
its whole is not a plan.

**The generator does not know what a question family means.** It matches `questionFamily`
against an item's `questionType` as data. Adding a sixth family later is therefore a content and
scoring change, never a change to the selection engine — and until the content exists, the
segment simply cannot be filled, which §4 turns into an explicit refusal rather than a gap.

### 2.2 Blueprint identifiers, and one open decision

Content IDs are topic-scoped (05 §4), which works for a topic exam (`DOC-defects.BP.001`) and
does not work for an exam that deliberately crosses topics. The four cross-topic exam types
therefore use a scope namespace in the prefix slot — `EXAM-readiness.BP.001`,
`EXAM-weakness.BP.001` — which satisfies the existing pattern without changing it.

This is **`Decision Required` (D-10-1)**: it reads as a topic prefix and is not one. Recorded
here rather than silently resolved, because 05 §4 is the document that owns the ID scheme and it
should say so explicitly.

---

## 3. Selection rules

```
selectionRules: {
  poolRef: 'exam',                 // required; never 'practice'
  noRepeatWithinDays: 90,          // an item seen in an exam within the window is excluded
  excludeAttempted: true,          // an item ever attempted at all is excluded
  minOpenQuestions: 1,             // §3.9
  requireJudgementItem: true,      // §3.10
  maxItemsPerSkill: 2,             // §3.8
  difficultyBand: [1, 5],          // inclusive
  experienceBand: null,            // null = any
}
```

The ten constraints the generator honours, and where each one's data comes from. Nothing here is
inferred from a page visit; every learner-derived input is a scored attempt.

| # | Constraint | Source |
| --- | --- | --- |
| 1 | pool isolation | `item.pool === 'exam'`, `type === 'exam_item'`, servable per 05 §7 |
| 2 | questions already solved | the attempt log — any attempt on the item at all |
| 3 | duplicate prevention across sittings | `noRepeatWithinDays` against exam-context attempts |
| 4 | duplicate prevention within one exam | an item fills at most one segment |
| 5 | difficulty | `item.difficulty` against `difficultyBand` |
| 6 | experience level | `item.experienceBand`, else derived from the primary skill's tier (05 §16) |
| 7 | topics already learned | topics with ≥ 1 scored attempt, from the attempt log |
| 8 | spread across skills | `skillWeights` and `maxItemsPerSkill` |
| 9 | number of open questions | `segment.open`, counted against `minOpenQuestions` |
| 10 | at least one judgement item | a segment with `judgement: true`, filled by a `K4`/`advanced` skill |
| — | total time | `Σ item.estimatedSeconds` ≤ `durationMinutes`, and per segment per §6 |
| — | weaknesses | `SkillProgress.ability`, `needsReview` ([09](09-progress-model.md)) — ordering only |

**Weaknesses order candidates; they never relax a constraint.** A weakness-focused exam is still
a valid exam: it prefers the learner's weakest skills, and if that preference cannot be satisfied
inside the plan it selects a valid item anyway rather than producing an invalid exam.

---

## 4. Refusal

**If the pool cannot satisfy the blueprint, the exam does not start.** It is never silently
rebalanced, never shortened, and never padded from the practice pool ([06](06-question-model.md)
§11 rule 5).

The planner returns either a plan or a refusal, and a refusal states, per segment, what was
required and what was found:

```jsonc
{
  "ok": false,
  "blueprintId": "EXAM-readiness.BP.001",
  "reasons": [
    { "code": "no_item_for_family", "segmentId": "req-analysis",
      "questionFamily": "analyse_requirement", "found": 0 },
    { "code": "segment_over_budget", "segmentId": "defect-report",
      "budgetSeconds": 180, "shortestCandidateSeconds": 600 }
  ]
}
```

| Refusal code | Meaning |
| --- | --- |
| `no_item_for_family` | no servable exam-pool item has the segment's `questionFamily` |
| `all_candidates_seen` | items exist, but every one is excluded by §3.2 or §3.3 |
| `segment_over_budget` | the cheapest candidate exceeds the segment's own time budget |
| `over_total_budget` | the assembled set exceeds `durationMinutes` |
| `too_few_open_questions` | fewer open segments filled than `minOpenQuestions` |
| `no_judgement_item` | `requireJudgementItem` is set and no filled segment qualifies |
| `blueprint_invalid` | segments do not sum to `durationMinutes`, or `itemCount` disagrees |

A refusal is a **product state, not an error**: the exam surface shows the learner what is
missing in plain Hebrew, because "the exam is not available yet" with no reason is
indistinguishable from a broken product.

Today's pool satisfies two of the six standard segments. That is reported, not hidden.

---

## 5. The five exam types

All five run through **one** planner. They differ only in the blueprint they execute and in how
candidates are ordered.

| Type | Scope | Ordering preference | Notes |
| --- | --- | --- | --- |
| `topic` | one topic | difficulty closest to the band's centre | the topic exam of 05 §13 |
| `random` | any learned topic | stable, spread across skills | comparable across sittings |
| `weakness` | any learned topic | weakest skill first (`ability` ascending, `needsReview` first) | §3, ordering only |
| `senior` | any | highest tier first; `advanced`/`K4` required | every segment `open: true` |
| `readiness` | `full` | balanced by `skillWeights` | the full 20-minute plan; all segments must fill |

`readiness` is the only type that may not degrade: it is the exam whose result is read as "am I
ready", so a partially assembled readiness exam is a false claim and refuses instead.

---

## 6. Time

- Each segment carries its own budget; an item whose `estimatedSeconds` exceeds
  `segment.minutes × 60` cannot fill that segment (`segment_over_budget`).
- The sum of chosen items' `estimatedSeconds` must not exceed `durationMinutes × 60`.
- Time is **recorded, not scored**: [07](07-scoring-rubrics.md) §14 mode 2 is the platform
  default, so exceeding a segment's budget during the sitting does not reduce the professional
  score. It feeds the `speed` dimension ([09](09-progress-model.md) §7) like any other attempt.
- Mode 3 (time affecting the score) remains forbidden until an item declares it, per D-07-4.

Segment budgets are therefore a **planning** instrument — they decide what fits — and a pacing
signal for the learner, not a penalty.

---

## 7. Conduct

1. The plan is fixed before the first item renders. Selection is **not adaptive**
   ([06](06-question-model.md) §11 rule 2), so two sittings of one blueprint are comparable.
2. **No feedback of any kind until the exam is submitted** — no verdict, no score, no
   `improvedAnswer`, no revision link. Enforced by `releasePolicy: after_exam` (`QM-15`).
3. Each item is scored by the same engine as practice, and each attempt is stored with
   `context: 'exam'` so [09](09-progress-model.md) can weight it and §3.3 can exclude it later.
4. Disconnection mid-exam is **still undefined** (D-07-4). Until it is decided, an exam is a
   single sitting and an interrupted one is recorded as submitted-with-missing-parts, which
   `DC-GEN-04` already handles per [07](07-scoring-rubrics.md) §8.16.

---

## 8. Determinism

The planner is a pure function of `(pool, attempts, blueprint, now)`.

There is **no random source**. Candidate ordering is fully determined by the preference key of
§5 and broken, finally, by item ID — so the same learner with the same history and the same
blueprint gets the same exam, and a test can assert an exact item list. `Math.random()` in a
selector would make the "random exam" unreproducible and the refusal path untestable, which is
why `random` means *spread across skills*, not *randomised*.

`now` is passed in, never read from the clock inside the planner, exactly as in
[09](09-progress-model.md) §10.

---

## 9. Validation rules

| Rule | Check |
| --- | --- |
| `EX-01` | `durationMinutes` ≤ 20 |
| `EX-02` | `itemCount` equals the number of segments |
| `EX-03` | `Σ segment.minutes` equals `durationMinutes` |
| `EX-04` | every `segmentId` is unique within the blueprint |
| `EX-05` | `selectionRules.poolRef` is `exam` |
| `EX-06` | `skillWeights`, when present, sum to 100 and name in-scope skills |
| `EX-07` | at least one segment has `judgement: true` when `requireJudgementItem` is set |

`EX-01` already ships in the validator. `EX-02`–`EX-07` are added with this document.

---

## 10. Open questions

- **Q-10-1** — D-10-1 above: the `EXAM-*` prefix for cross-topic blueprints needs a sentence in
  05 §4 confirming it.
- **Q-10-2** — the standard plan's segments are 2–4 minutes, while every exam item authored so
  far is 10–11 minutes. The segment budgets are the product owner's specification and are kept;
  it follows that exam items must be authored **short and new**, not adapted from the practice
  pool. Recorded because it is a content-production consequence, not a design choice left open.
- **Q-10-3** — whether `readiness` should require coverage of every *domain* rather than every
  segment, once more than two domains exist.
- **Q-10-4** — resitting policy: how soon a learner may repeat the same blueprint. Currently only
  item-level repetition is constrained (`noRepeatWithinDays`).
