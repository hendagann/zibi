# 06 — Question Model

Status: `draft` · Owner: engineering + content · Depends on: [03](03-skill-map.md), [05](05-content-model.md)

The assessment half of the content model: question types, rubrics, scoring, feedback, exam
assembly and attempt records.

Product rules enforced here: **every exercise must have a rubric**, **every scored answer must
produce structured feedback**, and **AI-generated feedback must not replace deterministic
validation where a deterministic answer exists**.

---

## 1. Relationship to 05

[05-content-model](05-content-model.md) defines the entity graph, identifiers, the common
envelope, sources and review status. **This document extends that envelope; it never redefines
a field in it.** Every schema below assumes the envelope is present and adds only assessment
fields. Where the two documents appear to disagree about an envelope field, 05 is correct.

Two rules from 05 that shape everything here:

- **Every question measures at least one skill** — guaranteed structurally, because
  `skills.primary` is a required envelope field that must resolve.
- **Pool isolation** — an `exercise` and an `exam_item` have identical shape and differ only in
  `pool` and in when feedback is released. An item is never both (05 §14).

---

## 2. Every scored question has a rubric

A **rubric** is the complete specification of how an answer becomes a score. It has three
kinds, and every scored item resolves exactly one:

| Kind | Used by | Score produced by |
| --- | --- | --- |
| `answer_key` | deterministic types | code comparing against expected values |
| `criteria` | open authoring types | weighted criteria with level descriptors |
| `composite` | hybrid types | an `answer_key` part and a `criteria` part, with a weight split |

Answer keys and criterion rubrics were separate concepts in an earlier draft, which made
*"every exercise must have a rubric"* true only for open questions and left multiple-choice
items governed by something else. Unifying them means the rule holds without exception, one
validation path covers every scored item, and `CM-08` is a single check rather than a check
with a carve-out. An answer key is simply a rubric whose criteria are mechanical.

Rubrics live in `content/rubrics/`, are referenced by ID, and are **reusable**: one
`RUB.DEFECT_REPORT` serves every defect-report exercise, so improving the rubric improves every
item that uses it at once.

### 2.1 Rubric envelope

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | `RUB.*` |
| `kind` | R | `answer_key` · `criteria` · `composite` |
| `version` | R | int; incremented on any scoring-affecting change |
| `maxScore` | R | number |
| `appliesTo` | R | question type[]; guards against attaching the wrong rubric |
| `review` | R | as 05 §7 |

Editing a rubric changes historical scores' meaning, so `version` is mandatory and attempt
records store the version used (§9). A rubric edit never rewrites past attempts; it applies
from the next attempt onward, and re-scoring is an explicit, logged batch operation.

### 2.2 `answer_key`

| Field | R/O | Notes |
| --- | --- | --- |
| `comparison` | R | `exact` · `set` · `canonical_set` · `mapping` · `sequence` · `table` · `result_set` · `path` · `tolerance` |
| `expected` | R | element[]; each `{ value, required: bool, label? }` |
| `partialCredit` | R | `none` · `proportional` · `penalised` (§5) |
| `commonWrong` | O | `{ value, misconceptionId, penalty }[]` |
| `normalisation` | O | rules applied before comparison (§4) |
| `tolerance` | R when `comparison: tolerance` | numeric |

### 2.3 `criteria`

| Field | R/O | Notes |
| --- | --- | --- |
| `criteria` | R | criterion[2..8] |
| `evidenceRequired` | R | boolean; default `true` |

Each criterion:

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | stable within the rubric |
| `labelHe` | R | shown to the learner in feedback |
| `weight` | R | number; weights sum to `maxScore` |
| `levels` | R | 3–4 levels, each `{ level, points, descriptorHe }` |
| `misconceptionId` | O | attached to the lowest level, feeding feedback |

Level descriptors must be **observable statements about the answer**, not quality adjectives.
"Lists the invalid-side boundary for each bound" can be judged; "good understanding of
boundaries" cannot, and a rubric written in adjectives produces inconsistent scores between
two human reviewers, let alone between a human and a model.

### 2.4 `composite`

| Field | R/O | Notes |
| --- | --- | --- |
| `closed` | R | `{ rubricRef | inline answer_key, weight }` |
| `open` | R | `{ rubricRef | inline criteria, weight }` |

`closed.weight + open.weight = 1`. The closed part is scored first and independently; the open
part can never change it.

---

## 3. Question types

Every type declares exactly one validation mode. The mode determines who produces the score.

| Mode | Score produced by | AI may |
| --- | --- | --- |
| `deterministic` | code | explain the result, after the score is fixed |
| `rubric` | criterion evaluation | propose criterion levels, subject to §8 |
| `hybrid` | code for the closed part, criteria for the open part | as above, per part |

**The scoring function never receives model output as an input.** AI runs after scoring, is
given the score, and cannot change it. A model response that disagrees with a deterministic
verdict is discarded and logged, never shown. There is no mode in which a model decides whether
`[0, 1, 99, 100]` are the correct boundary values — that is a set comparison.

### Deterministic types

| Type | Answer shape | Comparison |
| --- | --- | --- |
| `mcq_single` | one option ID | `exact` |
| `mcq_multi` | set of option IDs | `set`, penalised partial credit |
| `true_false_why` | boolean + reason ID | both must match |
| `match_pairs` | left → right mapping | `mapping` |
| `order_sequence` | ordered ID list | `sequence` |
| `classify_items` | item → bucket mapping | `mapping` |
| `derive_partitions` | set of partitions | `canonical_set` (§4) |
| `derive_boundaries` | set of values | `canonical_set` (§4) |
| `complete_decision_table` | filled table | `table`, cell-wise |
| `state_transition_path` | transition sequence | `path`, validated against the state model |
| `sql_query` | SQL text | `result_set` (§4) |
| `api_assertion` | assertion set | evaluated against a recorded response |
| `numeric_input` | number + unit | `tolerance` |

### Rubric types

| Type | Produces |
| --- | --- |
| `author_test_case` | a structured test case |
| `author_defect_report` | a structured defect report |
| `author_charter` | an exploratory testing charter |
| `author_acceptance_criteria` | testable acceptance criteria for a user story |
| `explain_reasoning` | free-text justification |

### Hybrid types

| Type | Closed part | Open part |
| --- | --- | --- |
| `select_technique` | which technique | why, and what was rejected |
| `risk_assessment` | likelihood/impact within an allowed band | justification |
| `prioritise_defects` | ordering within an allowed range | justification |
| `derive_and_justify` | the derived set | the reasoning |

---

## 4. Canonical comparison

Set-valued answers are compared **semantically**, never textually.

**`derive_boundaries` / `derive_partitions`.** Answers are normalised before comparison:
numeric strings parsed, ranges expressed as half-open intervals, ordering discarded, duplicates
collapsed. `"0"`, `0` and `0.0` are the same answer. A learner who writes the correct
boundaries in a different order is correct, and no model is consulted to decide that.

**`sql_query`.** The submitted query runs against a fixture database and is compared on its
**result set**, order-insensitive unless the question specifies ordering. Text comparison of
SQL is not acceptable: there are many correct spellings of one query, and the skill being
measured is data validation (`TECH.SQLV`), not syntax recall.

The sandbox is a security boundary, not a convenience: read-only role, statement timeout, no
DDL, no multi-statement, and a fresh transaction per attempt that is rolled back at the end.

**`state_transition_path`.** Validity is checked against the state model, so any path covering
the required transitions is accepted rather than one memorised path.

---

## 5. Partial credit

| Policy | Behaviour |
| --- | --- |
| `none` | all or nothing — `mcq_single`, `true_false_why` |
| `proportional` | `|correct ∩ required| / |required|` |
| `penalised` | proportional, minus a penalty per `commonWrong` element present |

`mcq_multi` uses `max(0, (correct − incorrect) / |required|)`. Selecting every option scores
zero. Without the penalty, "select all" is a dominant strategy and the item stops
discriminating between learners entirely.

`commonWrong` entries carry a `misconceptionId`, which flows directly into feedback (§7). This
is how a learner who submits `[1, 100]` for a range of 1–100 is told specifically that they
tested only the valid side of each bound, rather than being told "incorrect".

---

## 6. Exercise

The `exercise` and `exam_item` schemas are identical. Fields follow the structure supplied by
the product owner; those marked *envelope* are inherited from [05](05-content-model.md) §5 and
are **not** redefined here.

| Hebrew field | Schema field | R/O | Source | Notes |
| --- | --- | --- | --- | --- |
| מזהה | `id` | R | envelope | `<TOPIC>.EX.nnn` |
| תחום | `domain` | R | *derived* | from `topic`; never authored |
| תת־נושא | `skills.primary` | R | envelope | the sub-topic **is** the primary skill |
| סוג השאלה | `questionType` | R | this doc | §3 |
| רמת קושי | `difficulty` | R | envelope | 1–5 |
| ניסיון מתאים | `experienceBand` | O | envelope | derived from skill tier by default |
| זמן משוער | `estimatedSeconds` | R | envelope | |
| תרחיש | `scenario` | R | this doc | block[]; the situation |
| שאלה | `prompt` | R | this doc | block[]; what is actually asked |
| נתוני עזר | `supportingData` | O | this doc | §6.1 |
| מחוון ציון | `rubricRef` | R | this doc | resolves a rubric whose `appliesTo` includes `questionType` |
| רכיבי תשובה צפויים | `expectedComponents` | R | this doc | §6.2 |
| טעויות נפוצות | `commonMistakes` | O | this doc | §6.3 |
| תשובה לדוגמה | `modelAnswer` | R | this doc | §6.4 |
| קישורים לחומר חזרה | `revisionRefs` | R | envelope | ≥ 1 for scored items |
| מקור | `source` | R | envelope | 05 §6 |
| סטטוס אישור | `review` | R | envelope | 05 §7 |

`domain` is derived rather than authored, because a topic already determines it and two
sources of truth for the same fact drift. `subTopic` maps to `skills.primary` rather than
introducing a fifth hierarchy level: [03](03-skill-map.md) already defines
Domain → Topic → Skill, and the sub-topic an author means when writing an exercise is exactly
the skill it measures.

### 6.1 `supportingData`

Material the learner needs in order to answer: a requirements excerpt, a table of business
rules, an API response, a database schema, a log fragment.

| Field | R/O | Notes |
| --- | --- | --- |
| `kind` | R | `requirement` · `table` · `api_response` · `db_schema` · `log` · `screenshot` · `story` |
| `content` | R | block[] or typed payload |
| `availableDuringExam` | R | boolean |
| `fixtureRef` | R for `sql_query` | the fixture database |

`availableDuringExam` exists because some supporting data is the question. A decision-table
exercise that supplies the completed table under exam conditions measures nothing.

### 6.2 `expectedComponents`

The elements a complete answer contains, independent of wording.

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | stable within the item |
| `labelHe` | R | |
| `required` | R | boolean |
| `criterionId` | R for `rubric` types | the criterion this component evidences |
| `keyElement` | R for `deterministic` types | the expected value in the answer key |

This field is what connects a rubric criterion to something concrete in the answer. Without it,
a criterion like "identifies the invalid boundaries" has no defined referent, and two reviewers
will disagree about whether it was met. `QM-11` requires every required component to be
reachable from the rubric, and every rubric criterion to have at least one component.

### 6.3 `commonMistakes`

| Field | R/O | Notes |
| --- | --- | --- |
| `misconceptionId` | R | resolves in the misconception registry |
| `descriptionHe` | R | what the learner did |
| `whyTempting` | R | why it looks correct |
| `remediationRef` | R | the lesson or example that addresses it |

`whyTempting` is required because feedback that only names an error teaches less than feedback
explaining why the wrong answer was attractive. This is also the field that makes distractors
worth authoring: an option that exists only to be wrong wastes the strongest teaching moment
in the product.

### 6.4 `modelAnswer`

| Field | R/O | Notes |
| --- | --- | --- |
| `answer` | R | a full answer that would score `maxScore` |
| `annotations` | O | which component or criterion each part satisfies |
| `releasePolicy` | R | `after_attempt` · `after_mastery` · `after_exam` |

`releasePolicy` defaults to `after_attempt` for practice and is forced to `after_exam` for
items in the exam pool. `QM-09` requires the model answer to score `maxScore` against its own
rubric — a reference answer that fails its own key is one of the most common authoring errors,
and it is mechanically detectable.

---

## 7. Feedback

**Every scored answer produces a structured feedback object.** Fields follow the structure
supplied by the product owner.

| Hebrew field | Schema field | Produced by |
| --- | --- | --- |
| ציון כולל | `overallScore` | **scoring only** |
| ציונים לפי מדד | `criterionScores` | **scoring only** |
| מה נעשה נכון | `whatWasCorrect` | derived from met criteria / matched components |
| מה חסר | `whatIsMissing` | derived from unmet required components |
| מה שגוי | `whatIsWrong` | derived from `commonWrong` matches and failed criteria |
| דרך החשיבה המומלצת | `recommendedApproach` | authored, or AI-phrased from authored material |
| תשובה משופרת | `improvedAnswer` | AI, constrained by §8 |
| נושאים לחזרה | `topicsToRevise` | selection policy over misconceptions → skills |
| תרגיל המשך מומלץ | `recommendedNextExercise` | selection policy ([04](04-learning-path.md)) |
| רמת ביטחון בהערכה | `assessmentConfidence` | computed, §7.2 |
| האם נדרשת בדיקה אנושית | `requiresHumanReview` | computed, §7.3 |

### 7.1 Shape

```jsonc
{
  "attemptId": "...",
  "itemId": "TD-black-box.EX.007",
  "rubricId": "RUB.BVA_DERIVATION", "rubricVersion": 3,
  "validation": "deterministic",
  "verdict": "partially_correct",          // correct | partially_correct | incorrect

  "overallScore":   { "raw": 3, "max": 4, "normalized": 0.75 },
  "criterionScores": [
    { "criterionId": "c1", "labelHe": "...", "awarded": 2, "max": 2, "evidence": "..." }
  ],

  "whatWasCorrect": [ { "componentId": "k1", "textHe": "..." } ],
  "whatIsMissing":  [ { "componentId": "k3", "textHe": "...", "misconceptionId": "..." } ],
  "whatIsWrong":    [ { "textHe": "...", "misconceptionId": "MIS.BVA.VALID_ONLY" } ],

  "recommendedApproach": [ /* blocks */ ],
  "improvedAnswer": { "text": "...", "generated": true, "model": "...", "basedOn": "learner" },
  "topicsToRevise": [ { "ref": "TD-black-box.LE.001", "reason": "..." } ],
  "recommendedNextExercise": { "ref": "TD-black-box.EX.011", "reason": "..." },

  "assessmentConfidence": 1.0,
  "requiresHumanReview": false,
  "aiFields": ["improvedAnswer"]
}
```

`aiFields` lists exactly which fields were model-generated. It drives the interface disclosure
and makes the boundary auditable after the fact rather than assumed.

The three narrative fields are deliberately separated. `whatIsMissing` and `whatIsWrong` are
different failures needing different remediation — an omission means the learner did not think
of something, an error means they thought something untrue — and collapsing them into a single
"issues" list loses the distinction that determines what to practise next.

### 7.2 `assessmentConfidence`

Confidence in the **assessment**, not in the learner. Range 0–1.

| Validation | Value |
| --- | --- |
| `deterministic` | always `1.0` — a set comparison has no uncertainty |
| `rubric` | `min(evidenceCoverage, validatorAgreement)`, reduced by `0.2` per retry |
| `hybrid` | `min(closed, open)` = the open part's confidence |

`evidenceCoverage` is the share of awarded criteria whose evidence span was located in the
submission. `validatorAgreement` is the share of criteria on which two independent evaluations
of the same submission agree.

Defining this concretely matters: a confidence score that is not computed from something is
decoration, and decoration in a scoring interface is worse than no number at all.

### 7.3 `requiresHumanReview`

Set `true` when any of:

- `assessmentConfidence < 0.7`
- rubric validation failed after retry (§8)
- the learner disputes the score
- the item is uncalibrated (`difficultyCalibrated: false`) **and** the verdict is `incorrect`
- the answer is empty or degenerate but the rubric awarded points

When `true`, the learner sees the deterministic parts plus an honest statement that the
remainder is awaiting review. They are never shown an invented score, and the attempt does not
update mastery until it is resolved.

---

## 8. What AI may and may not do

**Permitted**

- Explain *why* a deterministic answer is wrong, given the answer key and misconception ID.
- Propose criterion levels for `rubric` types, each with a quoted span of the learner's answer.
- Phrase `recommendedApproach` from authored material.
- Produce `improvedAnswer` as a revision of the learner's own answer.
- Rewrite feedback into clearer Hebrew at a fixed reading level.

**Forbidden**

- Deciding correctness where an answer key exists.
- Producing a numeric score directly.
- Awarding a criterion without an evidence span present in the submission.
- Introducing a misconception ID not declared on the item.
- Contradicting the deterministic verdict.
- Generating `improvedAnswer` for an item in the exam pool before the exam ends.

Model proposals for `rubric` types are validated before becoming a score: every criterion
present, every awarded level existing in the rubric, every evidence span a literal substring of
the submission. Failure triggers one retry, then `requiresHumanReview`.

`improvedAnswer` revises the learner's own answer rather than presenting the model answer,
which is a separate field with its own `releasePolicy` (§6.4). Showing the model answer as
"improved" would leak the reference answer on the first attempt and destroy the item's future
value.

---

## 9. Attempt record

```jsonc
{
  "attemptId": "...", "userId": "...", "sessionId": "...",
  "itemId": "TD-black-box.EX.007", "itemVersion": 4,
  "rubricId": "RUB.BVA_DERIVATION", "rubricVersion": 3,
  "context": "practice",              // practice | exam | placement | review
  "startedAt": "...", "submittedAt": "...", "durationMs": 184000,
  "answer": { /* type-specific, raw as submitted */ },
  "score": { "raw": 3, "max": 4, "normalized": 0.75 },
  "validation": "deterministic",
  "verdict": "partially_correct",
  "criteria": [ /* for rubric and hybrid */ ],
  "misconceptions": ["MIS.BVA.VALID_ONLY"],
  "skillsCredited": { "TD.BVA": 1.0, "DOC.TC": 0.3 },
  "assessmentConfidence": 1.0,
  "requiresHumanReview": false,
  "hintsUsed": 1,
  "aiAssisted": false
}
```

Attempt records are **append-only**.

`itemVersion` and `rubricVersion` are both mandatory. Without them, an item or rubric edited
after an attempt makes the historical score unexplainable and
[09-progress-model](09-progress-model.md) cannot reproduce a mastery estimate.

`answer` stores the raw submission, never a normalised form — re-scoring after an answer-key
correction requires the original.

`skillsCredited` records how the evidence was distributed: the primary skill at full weight,
secondaries at partial. Storing it rather than recomputing means a later change to the item's
skill mapping does not silently rewrite what past attempts are taken to have demonstrated.

---

## 10. Cognitive level constraints

From [03-skill-map](03-skill-map.md) §8:

| Skill K-level | Requirement on the item set for that skill |
| --- | --- |
| `K1` | any deterministic type |
| `K2` | deterministic, but not `mcq_single` as the skill's only type |
| `K3` | ≥ 1 authoring or derivation type |
| `K4` | ≥ 1 `rubric` or `hybrid` type |

Enforced by `SM-10` and `QM-06`. The intent is to stop the map degrading into a
multiple-choice quiz — the failure mode that makes an exam-prep product feel useless the
moment the learner sits a real exam or a real interview.

---

## 11. Exam assembly

A blueprint (05 §13) is executed by the selection engine. Detailed timing, pass marks and
conduct are in [10-exam-rules](10-exam-rules.md); item selection is here.

`selectionRules`:

| Field | R/O | Notes |
| --- | --- | --- |
| `poolRef` | R | must be the `exam` pool |
| `perSkillCount` | R | derived from `skillWeights` × `itemCount` |
| `difficultyDistribution` | R | target share per difficulty band |
| `typeDistribution` | O | minimum share of non-MCQ items |
| `noRepeatWithinDays` | R | default 90 |
| `maxItemsPerLesson` | O | prevents a single lesson dominating |

Rules that hold for every exam:

1. Selection draws **only** from the exam pool. An exercise the learner has practised can
   never appear (05 §14).
2. Selection is **not adaptive**. The blueprint is fixed before the first item is shown, so the
   result is comparable across attempts and across learners.
3. No feedback of any kind is released until the exam is submitted — no verdict, no score, no
   `improvedAnswer`.
4. An item the learner saw in an exam within `noRepeatWithinDays` is excluded.
5. If the pool cannot satisfy the blueprint, the exam **fails to start** with an explicit
   reason. It is never silently rebalanced. An exam that quietly changed its own blueprint to
   fit a thin pool would report a readiness figure that means nothing, which is worse than an
   error message.

---

## 12. Validation rules

| Rule | Check |
| --- | --- |
| `QM-01` | item validates against its question type's schema |
| `QM-02` | every scored item resolves exactly one rubric |
| `QM-03` | rubric `appliesTo` includes the item's `questionType` |
| `QM-04` | `criteria` weights sum to `maxScore`; `composite` part weights sum to 1 |
| `QM-05` | every `mcq_*` distractor carries a misconception ID or an explicit `plausible_only` flag |
| `QM-06` | K-level / type pairing per §10 |
| `QM-07` | every misconception ID resolves in the registry |
| `QM-08` | `sql_query` items name an existing fixture, and the reference query runs against it |
| `QM-09` | `modelAnswer` scores `maxScore` against its own rubric |
| `QM-10` | no two active items share an identical normalised stem |
| `QM-11` | every required `expectedComponent` is reachable from the rubric, and every criterion has ≥ 1 component |
| `QM-12` | every scored item has ≥ 1 `revisionRef` resolving to an approved item |
| `QM-13` | `answer_key` `expected` is non-empty and contains ≥ 1 `required` element |
| `QM-14` | criterion level descriptors contain no bare quality adjectives (lint, §2.3) |
| `QM-15` | exam-pool items have `releasePolicy: after_exam` |
| `QM-16` | every `commonMistakes` entry has a `remediationRef` to an approved item |
| `QM-17` | `supportingData.availableDuringExam` is set for every exam-pool item |

`QM-09` catches more authoring errors than any other rule in this document. `QM-12` guarantees
that a learner who gets something wrong always has somewhere to go — a scored item with no
revision material produces a dead end at exactly the moment the learner is most motivated.

---

## 13. Open questions

- **Q-06-1** — should `explain_reasoning` affect mastery in v1, or be captured for review only?
  Free-text scoring is where rubric reliability is weakest.
- **Q-06-2** — fixture database engine for `sql_query`. In-browser SQLite removes the sandbox
  risk entirely; dialect divergence from what learners meet at work is the trade-off. Blocked
  on conflict C-5 in [14](14-content-sources.md), which found five sources using three dialects.
- **Q-06-3** — whether hints reduce the score or only annotate the attempt. Currently
  `hintsUsed` is recorded and [09](09-progress-model.md) down-weights the evidence rather than
  cutting the score.
- **Q-06-4** — `validatorAgreement` in §7.2 requires two independent evaluations per rubric
  attempt, which doubles cost. Whether to sample rather than always run it is unresolved.
- **Q-06-5** — whether `criteria` rubrics should support a critical-criterion rule, where
  failing one specific criterion caps the total regardless of the others. Relevant to
  `author_defect_report`, where an unreproducible report is not a partially good report.
