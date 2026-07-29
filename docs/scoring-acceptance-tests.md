# Scoring Acceptance Tests

Status: `draft` · Owner: assessment · Depends on: [07](07-scoring-rubrics.md), [08](08-feedback-rules.md), [scoring-examples](scoring-examples.md)

Acceptance criteria for the scoring mechanism. Each test is stated so that it can be executed
against an implementation without interpretation.

**Scope.** These tests cover scoring only. They are deliberately separate from the planned
`docs/13-acceptance-tests.md`, which should reference this file rather than restate it — see
D-07-10 in [07](07-scoring-rubrics.md) §21.

**Fixtures.** Tests referencing `E1`–`E8` use the worked evaluations in
[scoring-examples](scoring-examples.md) as golden records. Their stored answers, rubric
versions and final scores are the expected values.

---

## A. Determinism and reproducibility

### `AT-SC-01` — the same answer receives the same score
**Given** a stored attempt with a recorded `answer_hash`, `item_version` and `rubric_version`
**When** the evaluation is re-run 20 times
**Then** `final_score` is identical in all 20 runs, and every `criterion_results[].awarded_points`
is identical.
Permitted deviation: **0** for deterministic questions; **0** for rubric questions given
identical component detection.

### `AT-SC-02` — detection variance stays within tolerance
**Given** a rubric question whose component detection is not fully deterministic
**When** the evaluation is re-run 20 times
**Then** `final_score` varies by at most **±1 point**. Any run outside that band flags the item
for review and records the differing `detected_components`.

### `AT-SC-03` — a score is reconstructible from its own record
**Given** any stored evaluation result
**When** `Σ (max_points × level_percentage) − Σ penalties` is computed, capped and rounded per
[07](07-scoring-rubrics.md) §5
**Then** the outcome equals the stored `final_score` exactly.
This must hold **without** access to the answer, the item or any model.

### `AT-SC-04` — an unexplained score change raises an alert
**Given** two evaluations sharing `answer_hash`, `item_version`, `rubric_version` and
`evaluation_version`
**When** their `final_score` values differ
**Then** an alert is raised and both records are retained. Neither is overwritten.

### `AT-SC-05` — rounding happens once
**Given** a criterion set whose unrounded sum is `43.75`
**When** the score is computed
**Then** `raw_score` is `43.75` and `final_score` is `44`. No intermediate criterion value is
rounded. (Golden record: `E2`.)

---

## B. Score ordering and partial credit

### `AT-SC-06` — a complete answer outscores a partial one
**Given** `E1` (complete) and `E2` (partial) on the same item and rubric version
**Then** `final_score(E1) > final_score(E2)` — specifically `95 > 44`.

### `AT-SC-07` — a partial answer outscores a weak one
**Given** `E2` and `E3` on the same item
**Then** `final_score(E2) > final_score(E3)` — specifically `44 > 24`.

### `AT-SC-08` — a partial answer earns partial points
**Given** `E2`
**Then** `0 < final_score < 100`, and at least one criterion has `performance_level` in
`{1, 2, 3}` with `awarded_points > 0`.

### `AT-SC-09` — level percentages are exactly the declared set
**Given** any `criterion_results[]` entry
**Then** `level_percentage ∈ {0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100}` and
`awarded_points = round(max_points × level_percentage / 100, 2)`.

### `AT-SC-10` — volume earns nothing
**Given** an answer identical to `E3` plus 500 words matching only `non_scoring` components
**Then** `final_score` is unchanged at `24`.

---

## C. Empty, irrelevant and edge answers

### `AT-SC-11` — an empty answer scores 0
**Given** an answer that is empty or whitespace only
**Then** `DC-GEN-01` fails as a gate, `final_score = 0`, `confidence_level = high`, and no
criterion is evaluated.

### `AT-SC-12` — an irrelevant answer scores 0
**Given** a long answer in which **no** declared component is detected on any criterion
**Then** `DC-GEN-03` fails as a gate and `final_score = 0`.

### `AT-SC-13` — a short but correct answer is not penalised for length
**Given** an item with no declared `min_length`, and a correct one-sentence answer
**Then** the answer is scored on its components alone and may reach `100`.

### `AT-SC-14` — spelling does not affect any score
**Given** two answers identical except for spelling errors that do not change meaning
**Then** both produce identical `final_score` and identical `criterion_results`.

### `AT-SC-15` — Hebrew with English technical terms is fully accepted
**Given** an answer written in Hebrew using English QA terminology
**Then** no criterion is reduced for language mixing, and no penalty is recorded.

---

## D. SQL

### `AT-SC-16` — a correct alternative query is accepted in full
**Given** `E6`, whose query differs structurally from the reference solution but returns the
same result set on visible and hidden fixtures
**Then** `final_score = 96`, `c5` scores level 4, and **no** penalty of any kind is recorded
for divergence from the reference.

### `AT-SC-17` — text comparison is never used
**Given** any two queries returning identical result sets on both fixtures
**Then** their `c5` (נכונות התוצאה) scores are identical, regardless of syntax, formatting,
join style or aliasing.

### `AT-SC-18` — unsafe SQL is blocked
**Given** a submission containing `UPDATE`, `DELETE`, `DROP`, `INSERT`, `TRUNCATE`, `GRANT` or
`ALTER`
**Then** the statement is **not executed**, `DC-SQL-02` fails as a gate, `final_score = 0`, and
`error_code = E-SQL-002` is recorded.

### `AT-SC-19` — a wrong result zeroes correctness but not structure
**Given** `E7`, a query that runs and returns the wrong result
**Then** `c5 = 0`, **no cap is applied**, and the structural criteria retain their points, for
`final_score = 51`.

### `AT-SC-20` — redistributed weights still total 100
**Given** any SQL item where one or more criteria are `not_applicable`
**Then** the stored rubric instance weights sum to exactly `100.00`, and the redistribution
matches [07](07-scoring-rubrics.md) §9.2.

---

## E. Caps and gates

### `AT-SC-21` — a missing mandatory field triggers a cap
**Given** `E5`, a bug report with no Expected Result
**Then** `DC-BUG-03` fails, `raw_score = 79.00`, `score_cap = 60`,
`cap_source = E-BUG-003`, and `final_score = 60`.

### `AT-SC-22` — caps do not stack
**Given** a bug report missing reproduction steps, Actual Result **and** Expected Result
(three checks each capping at 60)
**Then** the effective cap is `60`, not `20` — the minimum of triggered caps, never their
product or sum.

### `AT-SC-23` — penalties apply before the cap
**Given** `raw_score = 90`, a declared penalty of `10`, and a triggered cap of `60`
**Then** `penalised_score = 80`, `capped_score = 60`, `final_score = 60`.
**And given** `raw_score = 65`, penalty `10`, cap `60`
**Then** `penalised_score = 55`, `capped_score = 55`, `final_score = 55` — the penalty bites
below the cap.

### `AT-SC-24` — a gate ends evaluation immediately
**Given** any failed check with `is_gate = true`
**Then** `final_score = 0`, no criterion is evaluated, and the triggering `error_code` is
recorded. A gate is never treated as a cap.

---

## F. Rubric integrity

### `AT-SC-25` — every rubric totals 100
**Given** every rubric in [07](07-scoring-rubrics.md) §8
**Then** `Σ weight = 100` exactly, for all seventeen families and for every rubric instance
after redistribution.
**Exception by design:** `RUB.MULTIPART` (§8.16) is composite and declares no criteria of its
own. For it the test applies to `Σ parts[].weight = 100`. A checker that looks only for a
criteria table will report a false failure on this rubric.

### `AT-SC-26` — every criterion has five performance levels
**Given** any criterion in any rubric
**Then** levels `0`–`4` are all defined, each with a percentage from the declared set, and no
criterion defines fewer than five.

### `AT-SC-27` — an incomplete rubric cannot become active
**Given** a rubric where any criterion is missing any of the fourteen fields in
[07](07-scoring-rubrics.md) §4.4 — including `expected_components`, `full_examples`,
`partial_examples`, `missing_examples` and `skill_ids`
**Then** the rubric cannot transition to `status: active`, and any attempt to evaluate with it
fails with `E-GEN-008`.
This test governs every rubric marked ⚙ in [07](07-scoring-rubrics.md) §8.

### `AT-SC-28` — every criterion links to the skill map
**Given** any criterion
**Then** `skill_ids` is non-empty and every entry resolves to an `active` skill in
[03](03-skill-map.md).

### `AT-SC-29` — levels are computed, not assigned
**Given** a criterion's `detected_components` and the coverage formula in
[07](07-scoring-rubrics.md) §4.3
**Then** the recomputed level equals the stored `performance_level`.
**And** a critical error caps the level at `1`; a missing `must` component caps it at `3`.

---

## G. Versioning

### `AT-SC-30` — a rubric change does not alter an old attempt
**Given** a stored evaluation scored with `RUB.TEST_DESIGN` v1
**When** `RUB.TEST_DESIGN` v2 is approved and activated
**Then** the stored evaluation's `final_score` and `criterion_results` are unchanged, and it
still reports `rubric_version: 1`.

### `AT-SC-31` — only an active rubric may score a new evaluation
**Given** a rubric with status `draft`, `needs_review`, `approved`, `deprecated` or `archived`
**When** a new evaluation is requested against it
**Then** the evaluation fails with `E-GEN-008` and routes to human review. `approved` alone is
insufficient — `active` and `effective_from` govern.

### `AT-SC-32` — re-scoring writes a new record
**Given** an explicit batch re-score of historical attempts
**Then** new evaluation records are written with a new `evaluation_id` and the current
`evaluation_version`; no existing record is mutated or deleted.

---

## H. The AI boundary

### `AT-SC-33` — the feedback stage cannot change a score
**Given** any evaluation result and any feedback output whatsoever
**Then** the stored `final_score`, `raw_score` and every `awarded_points` are byte-identical
before and after feedback generation.

### `AT-SC-34` — the feedback stage never receives weights
**Given** the payload passed to feedback generation
**Then** it contains no `weight`, no `max_points`, no level thresholds and no coverage formula,
per [08](08-feedback-rules.md) §2.

### `AT-SC-35` — contradictory feedback is discarded
**Given** feedback claiming a criterion was met that scored level 0, or stating a number other
than `final_score`
**Then** the output is rejected, logged, and regenerated once; a second failure falls back to
the deterministic rendering. Nothing contradictory is ever displayed.

### `AT-SC-36` — component detection returns structure, never points
**Given** any model participation in layer 2
**Then** its output conforms to the fixed detection schema — `{component_id, present,
evidence_span}` — and contains no numeric score, no level and no weight. Points are produced
only by the deterministic function in [07](07-scoring-rubrics.md) §4.3.

---

## I. Confidence and human review

### `AT-SC-37` — an ambiguous answer is flagged with low confidence
**Given** an answer whose components contradict one another, or which admits several
professional readings
**Then** `confidence_level` is `low` or `requires_human_review`, and `confidence_reasons` is
non-empty.

### `AT-SC-38` — low confidence never changes the score
**Given** two identical answers, one flagged `high` and one artificially flagged `low`
**Then** their `final_score` values are identical. Confidence flags an evaluation; it never
adjusts it.

### `AT-SC-39` — a broken item routes to human review and is not scored 0
**Given** an item whose rubric does not resolve, is not `active`, or whose weights do not sum
to 100
**Then** `unevaluable = true`, `human_review_required = true`, **no `final_score` is recorded**,
the item is flagged, and the learner's progress is unaffected.
A broken item must never produce a score of `0`.

### `AT-SC-40` — a borderline score is flagged
**Given** a `final_score` within 2 points of a declared meaningful boundary
**Then** `confidence_level` is reduced by at least one band and the reason is recorded.

---

## J. Evidence and auditability

### `AT-SC-41` — every awarded point has evidence
**Given** any criterion with `performance_level > 0`
**Then** `evidence[]` is non-empty, and every entry is a literal span present in the learner's
submitted answer.
A criterion scoring above 0 with empty evidence is an **invalid result**, not a lenient one, and
fails the evaluation.

### `AT-SC-42` — every detected component is declared
**Given** any `detected_components[]` entry
**Then** its `component_id` exists in the item's rubric. Detection can never invent a scoring
category.

### `AT-SC-43` — the audit trail is complete
**Given** any evaluation
**Then** it records `item_version`, `rubric_id`, `rubric_version`, `rubric_instance_id`,
`evaluation_version`, `answer_hash`, `evaluated_at`, every deterministic check with its
`error_code`, and every criterion with its coverage and detected components.

### `AT-SC-44` — a different decision with valid reasoning scores fully
**Given** `E8`, a prioritisation answer reaching a different decision from the reference with
sound reasoning
**Then** `final_score = 95`, and **no** criterion is reduced for disagreeing with the reference
decision.
This is the structural test that the platform scores reasoning rather than conformity.

---

## Coverage against the required list

| Required test | Covered by |
| --- | --- |
| same answer, same score | `AT-SC-01`, `AT-SC-02` |
| complete answer scores above partial | `AT-SC-06`, `AT-SC-07` |
| partial answer earns partial points | `AT-SC-08` |
| empty answer scores 0 | `AT-SC-11` |
| alternative correct SQL accepted | `AT-SC-16`, `AT-SC-17` |
| unsafe SQL blocked | `AT-SC-18` |
| missing mandatory field triggers a cap | `AT-SC-21`, `AT-SC-22` |
| rubric change does not alter old attempts | `AT-SC-30` |
| AI cannot change a score | `AT-SC-33`, `AT-SC-34`, `AT-SC-35`, `AT-SC-36` |
| ambiguous answer flagged low confidence | `AT-SC-37` |
| broken item routes to human review | `AT-SC-39` |
| every rubric totals 100 | `AT-SC-25` |
| every criterion has performance levels | `AT-SC-26` |
| every score has evidence | `AT-SC-41` |
| every evaluation is reproducible | `AT-SC-03`, `AT-SC-43` |

---

## Tests that cannot run yet

| Test | Blocked on |
| --- | --- |
| timed-exam overrun and grace period | `docs/10-exam-rules.md` — D-07-4 |
| disconnection during an exam | `docs/10-exam-rules.md`, `docs/11-user-flows.md` — D-07-4 |
| progress weighting of a repeat attempt after viewing the solution | `docs/09-progress-model.md` — D-07-2 |
| feedback generation end to end | [08](08-feedback-rules.md) is intentionally incomplete; the prompt is not yet written |

These are recorded rather than omitted so that the gaps stay visible when the mechanism is
reviewed.
