# 06 — Question Model

Status: `draft` · Owner: engineering + content · Depends on: [03](03-skill-map.md), [05](05-content-model.md)

Defines every question type, how each is validated, and which validation is allowed to
produce a score.

Product rule enforced here: **AI-generated feedback must not replace deterministic validation
where a deterministic answer exists.**

---

## 1. Validation modes

Every question type declares exactly one mode. The mode determines who produces the score.

| Mode | Score produced by | AI may |
| --- | --- | --- |
| `deterministic` | code | explain the result only, after the score is fixed |
| `rubric` | rubric evaluation ([07](07-scoring-rubrics.md)) | propose criterion-level judgements, subject to §5 |
| `hybrid` | code for the closed part, rubric for the open part | as above, per part |

The rule that makes this real: **the scoring function never receives model output as an
input**. AI runs *after* scoring, is given the score, and cannot change it. An AI response
that disagrees with the deterministic verdict is discarded and logged, never shown — see
[08-feedback-rules](08-feedback-rules.md) §6.

There is no mode in which a model decides whether `[0, 1, 99, 100]` are the correct boundary
values. That is a set comparison.

---

## 2. Type catalogue

### Deterministic types

| Type | Answer shape | Comparison |
| --- | --- | --- |
| `mcq_single` | one option ID | equality |
| `mcq_multi` | set of option IDs | set equality, partial credit per §4 |
| `true_false_why` | boolean + one reason ID | both must match |
| `match_pairs` | left→right mapping | per-pair equality |
| `order_sequence` | ordered list of IDs | exact order, or Kendall distance for partial |
| `classify_items` | item→bucket mapping | per-item equality |
| `derive_partitions` | set of partitions | canonical set equality, §3 |
| `derive_boundaries` | set of values | canonical set equality, §3 |
| `complete_decision_table` | filled table | cell-wise equality |
| `state_transition_path` | sequence of transitions | path validity against the state machine |
| `sql_query` | SQL text | executed against a fixture DB, **result-set** comparison, §3 |
| `api_assertion` | set of assertions | evaluated against a recorded response |
| `numeric_input` | number + unit | tolerance-based |

### Rubric types

| Type | Produces |
| --- | --- |
| `author_test_case` | a structured test case artifact |
| `author_defect_report` | a structured defect report |
| `author_charter` | an exploratory testing charter |
| `explain_reasoning` | free text justification |

### Hybrid types

| Type | Deterministic part | Rubric part |
| --- | --- | --- |
| `select_technique` | which technique (closed) | why (open) |
| `risk_assessment` | likelihood/impact ratings against a band | justification |
| `prioritise_defects` | ordering against an allowed range | justification |
| `derive_and_justify` | the derived set | the reasoning |

---

## 3. Canonical comparison — the part that is easy to get wrong

Set-valued answers must be compared **semantically**, not textually.

**`derive_boundaries` / `derive_partitions`.** Answers are normalised into a canonical form
before comparison: numeric strings parsed, ranges expressed as half-open intervals, ordering
discarded, duplicates collapsed. `"0"`, `0`, and `0.0` are the same answer. A learner who
writes the correct boundaries in a different order is correct, and no model is consulted to
decide that.

Partial credit: the answer key marks each expected element `required` or `optional`, and
declares `commonWrong` elements with an attached misconception ID. Score is
`|correct ∩ required| / |required|`, with a penalty per `commonWrong` element present. The
misconception ID flows straight into feedback ([08](08-feedback-rules.md) §4) — this is how a
learner who tests `[1, 100]` but not `[0, 101]` is told *specifically* that they tested valid
boundaries only, rather than being told "incorrect".

**`sql_query`.** The submitted query runs against a fixture database in a sandbox with a
timeout and a read-only role. Comparison is on the **result set**, order-insensitive unless
the question specifies ordering. Text comparison of SQL is not acceptable: there are many
correct spellings of one query, and this is a data-validation skill (`TECH.SQLV`), not a
syntax-recall skill.

Sandbox constraints are a security boundary, not a nicety: read-only role, statement timeout,
no DDL, no multi-statement, per-attempt fresh transaction rolled back at the end.

---

## 4. Partial credit

Only these types award partial credit: `mcq_multi`, `order_sequence`, `match_pairs`,
`classify_items`, `derive_*`, `complete_decision_table`, and the deterministic part of hybrid
types. `mcq_single` is all-or-nothing.

For `mcq_multi` we use `max(0, (correct − incorrect) / |required|)`. Selecting everything
scores zero. Without the penalty, "select all" is a dominant strategy and the item stops
discriminating.

---

## 5. What AI may and may not do

**Permitted**

- Explain *why* a deterministic answer is wrong, given the answer key and misconception ID.
- Propose criterion-level judgements for `rubric` types, each with a quoted span of the
  learner's answer as evidence.
- Rewrite feedback into clearer Hebrew at a fixed reading level.
- Suggest which worked example to revisit, chosen from a supplied candidate list.

**Forbidden**

- Deciding correctness where an answer key exists.
- Producing a numeric score directly.
- Awarding a criterion without an evidence span that exists in the learner's answer.
- Introducing a misconception ID that is not in the item's declared set.
- Contradicting the deterministic verdict.

For `rubric` types the model's proposal is validated before it becomes a score: every
criterion must be present, each awarded level must exist in the rubric, and each evidence span
must be a literal substring of the submission. Failing validation triggers one retry, then
falls back to `manual_review` — the learner sees the deterministic parts plus an honest
"this part is awaiting review" rather than an invented score.

---

## 6. K-level constraints

From [03-skill-map](03-skill-map.md) §7, the assessable pairing is:

| Skill K-level | Allowed types |
| --- | --- |
| `K1` | any deterministic type |
| `K2` | deterministic, excluding bare `mcq_single` for the skill's *only* items |
| `K3` | must include ≥ 1 authoring or derivation type |
| `K4` | must include ≥ 1 `rubric` or `hybrid` type |

Enforced by `SM-10` and `QM-06`. The intent is to stop the map from silently degrading into a
multiple-choice quiz, which is the failure mode that makes exam-prep products feel useless
the moment the learner sits a real exam or a real interview.

---

## 7. Attempt record

```jsonc
{
  "attemptId": "...",
  "userId": "...",
  "itemId": "TD.BVA.EX.003",
  "sessionId": "...",
  "context": "practice",            // practice | exam | placement | review
  "startedAt": "...", "submittedAt": "...", "durationMs": 184000,
  "answer": { /* type-specific, raw as submitted */ },
  "score": { "raw": 3, "max": 4, "normalized": 0.75 },
  "validation": "deterministic",
  "verdict": "partially_correct",
  "criteria": [ /* rubric types */ ],
  "misconceptions": ["MIS.BVA.VALID_ONLY"],
  "aiAssisted": false,
  "itemVersion": 4,
  "hintsUsed": 1
}
```

`itemVersion` is mandatory. Without it, an item edited after an attempt makes the historical
score unexplainable, and [09-progress-model](09-progress-model.md) cannot reproduce a mastery
estimate. Attempt records are **append-only**.

`answer` stores the raw submission, never a normalised form. Re-scoring after an answer-key
fix requires the original.

---

## 8. Validation rules

| Rule | Check |
| --- | --- |
| `QM-01` | question validates against its type schema |
| `QM-02` | every deterministic item has a complete answer key |
| `QM-03` | every rubric item resolves to a rubric with weights summing to its max score |
| `QM-04` | hybrid items define both parts and their weight split |
| `QM-05` | every distractor in `mcq_*` has a misconception ID or an explicit `plausible_only` flag |
| `QM-06` | K-level/type pairing per §6 |
| `QM-07` | every declared misconception ID resolves in the misconception registry |
| `QM-08` | `sql_query` items name a fixture DB that exists, and the reference query runs |
| `QM-09` | reference answers pass their own validator (a key that fails its own check is a bug) |
| `QM-10` | no two active items share an identical normalised stem |

`QM-09` catches a surprising number of authoring errors. `QM-05` is what makes distractors
teach: an option that exists only to be wrong wastes the strongest feedback opportunity in
the whole product.

---

## 9. Open questions

- **Q-06-1** — should `explain_reasoning` be scored at all in v1, or captured for review
  without affecting mastery? Scoring free text is where rubric reliability is weakest.
- **Q-06-2** — fixture DB engine for `sql_query`. In-browser SQLite would remove server
  round-trips and the sandbox risk entirely; dialect divergence from what learners meet at
  work is the trade-off.
- **Q-06-3** — whether hints reduce score or only annotate the attempt. Currently
  `hintsUsed` is recorded and [09](09-progress-model.md) down-weights the evidence rather than
  cutting the score.
