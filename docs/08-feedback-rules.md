# 08 — Feedback Rules

Status: `draft` · Owner: assessment · Depends on: [07](07-scoring-rubrics.md)

**Scope of this version.** This document defines the boundary between scoring and feedback, the
data the feedback stage receives, what it may and may not do, the shape of the feedback it will
produce, and the rules that protect the score from it.

It deliberately does **not** contain the final feedback prompt. The prompt is written only
after the scoring mechanism, the worked examples and the acceptance tests are approved —
writing it earlier would encode assumptions the scoring layer has not yet settled.

---

## 1. The boundary

Two systems, running strictly in sequence, with a one-way data flow.

```
┌──────────────────────────────┐        ┌───────────────────────────────┐
│  SCORING  (docs/07)          │        │  FEEDBACK  (this document)    │
│                              │        │                               │
│  decides:                    │        │  explains:                    │
│   • what is correct          │ ─────▶ │   • what was good             │
│   • what is missing          │ result │   • what was missing          │
│   • what is wrong            │ object │   • how to think about it     │
│   • points per criterion     │        │   • what to revise            │
│   • the total score          │        │   • how to improve the answer │
│                              │        │                               │
│  output: numbers + evidence  │        │  output: prose                │
│  contains no prose           │   ✗    │  contains no authority        │
└──────────────────────────────┘  ◀───  └───────────────────────────────┘
                              no return path
```

The rule that makes this real: **the feedback stage runs after the score is final and
persisted.** By the time feedback is generated, the evaluation record already exists and is
immutable. There is no code path by which feedback output re-enters scoring.

The score decides *what happened*. Feedback decides *how to say it*. When the two disagree, the
score is right by definition — feedback that disagrees with its own input is a defect, and §6
specifies how it is caught and discarded.

---

## 2. What the feedback stage receives

Exactly the evaluation result defined in [07](07-scoring-rubrics.md) §17, plus the question and
the learner's answer. Nothing else.

| Input | Source |
| --- | --- |
| question text and scenario | the item |
| the learner's answer, verbatim | the attempt |
| deterministic check results | `deterministic_checks[]` |
| score per criterion | `criterion_results[]` |
| total score | `final_score`, `raw_score`, `score_cap`, `cap_source` |
| detected answer components | `criterion_results[].detected_components` |
| missing components | `criterion_results[].missing_elements` |
| errors | `criterion_results[].errors` |
| recommended revision topics | `recommended_topic_ids` |
| confidence | `confidence_level`, `confidence_reasons` |
| skills measured and demonstrated | `skills_measured`, `skills_demonstrated`, `skills_needing_review` |

**Not supplied:** rubric weights, level thresholds, the coverage formula, other learners' data,
and the model answer *except* where the item's `releasePolicy` ([06](06-question-model.md) §6.4)
already permits releasing it to this learner at this moment.

Withholding the weights is deliberate. A stage that cannot see how points are distributed
cannot argue about the distribution, and cannot leak "this criterion is worth 20 points" into
prose that reads as an invitation to game the rubric.

---

## 3. What the feedback stage may do

1. Explain what the learner did well, citing the evidence spans already recorded.
2. Explain what was missing, naming the missing components from the result.
3. Explain what was wrong, and why the correct professional reasoning differs.
4. Present a better way to think about the problem.
5. Propose an improved **structure** for the answer.
6. Point to learning material from `recommended_topic_ids`.
7. Suggest a follow-up exercise from `recommended_exercise_ids`.
8. Rewrite its own explanation into clearer Hebrew at a fixed reading level.
9. State that more than one professionally valid answer exists, where the item declares
   alternatives.

Every claim in feedback must trace to a field in the result. Feedback is a **rendering** of the
evaluation, in the same sense that a chart is a rendering of data.

---

## 4. What the feedback stage may not do

| Forbidden | Why |
| --- | --- |
| change the score, in any direction | the score is decided and persisted before feedback runs |
| change rubric weights | weights are not even supplied (§2) |
| introduce a criterion that is not in the rubric | it would score something never authored |
| overturn a deterministic result | layer 1 is not a matter of opinion |
| award bonus points, or imply the learner "deserved" more | no bonus exists ([07](07-scoring-rubrics.md) §5.4) |
| penalise writing style when the content is correct | style is scored only where a rubric declares a clarity criterion |
| present an assumption as a fact | see §8 |
| present one valid answer as the only solution | see §5.4 |
| invent a source, a standard, or a syllabus reference | citations come from content, not from generation |
| reveal a model answer the release policy withholds | it would destroy the item's future value |
| comment on the learner rather than the answer | the product measures work, not people |

---

## 5. The shape of feedback

Structured, not free prose. The interface renders these fields; it never receives a paragraph
to display verbatim.

```jsonc
{
  "feedback_id": "string",
  "evaluation_id": "string",         // the immutable input
  "prompt_version": "string",        // for reproducibility
  "generated_at": "datetime",
  "language": "he",

  "summary": "string",               // 1–2 sentences, states the outcome plainly
  "what_was_good": [
    { "criterion_id": "c4", "text": "string", "evidence_ref": "string" }
  ],
  "what_was_missing": [
    { "criterion_id": "c3", "component_id": "c3.k2", "text": "string" }
  ],
  "what_was_wrong": [
    { "criterion_id": "c1", "text": "string", "why": "string" }
  ],
  "how_to_think_about_it": [ /* blocks */ ],
  "improved_answer_structure": [ /* blocks — a structure, not a finished answer */ ],
  "revision_links": [ { "topic_id": "string", "reason": "string" } ],
  "next_exercise": { "exercise_id": "string", "reason": "string" },
  "alternative_solutions_note": "string | null",
  "uncertainty_note": "string | null",

  "grounding": [                     // every claim traced to its source field
    { "field": "what_was_missing[0]", "derived_from": "criterion_results[2].missing_elements[1]" }
  ]
}
```

`grounding` is what makes the "every claim traces to the result" rule enforceable rather than
aspirational. A feedback object whose grounding does not resolve is rejected before display.

`improved_answer_structure` deliberately produces a **structure** — the shape a strong answer
takes — not a finished answer. Handing back a complete model answer on a first attempt removes
the reason to attempt it again and contaminates the item.

---

## 6. Protecting the score

Five mechanisms, in order of when they act:

1. **Sequencing.** Feedback runs only after the evaluation record is persisted. There is no
   API by which the feedback stage can write to an evaluation.
2. **Input restriction.** Weights and thresholds are never supplied (§2).
3. **Output restriction.** The feedback schema has no score field. There is nowhere to put one.
4. **Contradiction detection.** Before display, feedback is checked against its evaluation:
   - it may not claim a criterion was met that scored level 0
   - it may not claim a criterion was missed that scored level 4
   - it may not state a number that differs from `final_score`
   - it may not name a component absent from the item's declared set
   A failing check discards the output, logs it, and retries once. A second failure falls back
   to a deterministic rendering assembled directly from the result fields.
5. **Versioning.** `prompt_version` is stored on every feedback record, so a change in feedback
   behaviour is attributable and reversible without touching any score.

The fallback in mechanism 4 matters more than it looks. Because a deterministic rendering
always exists, the system is never forced to choose between showing wrong feedback and showing
none. Feedback quality can degrade; feedback correctness cannot.

---

## 7. Linking to learning material

- Links come **only** from `recommended_topic_ids` and `recommended_exercise_ids` in the
  evaluation result. The feedback stage does not choose material; it explains a choice already
  made.
- Every link must resolve to an `approved` content item ([05](05-content-model.md) §7). A link
  to draft content is a broken promise at the moment the learner is most motivated to follow it.
- Each link states **why** it is relevant, in terms of the specific gap: "you covered the valid
  range but not the values just outside it" rather than "review boundary value analysis".
- At most three revision links and one follow-up exercise. A list of eight links is a way of
  not choosing.
- No link is offered for a criterion that scored level 4.

---

## 8. Expressing uncertainty

When `confidence_level` is `low` or `requires_human_review`, feedback must say so, in plain
language, without undermining what is certain.

Rules:

- An uncertain judgement is stated as a judgement: "as I read your answer, X was missing — if
  you meant Y, that would change this" rather than "X was missing".
- The deterministic parts are always stated with full confidence, because they are certain.
  Uncertainty about a rubric criterion never spreads to a deterministic check.
- When `requires_human_review` is set, the learner is told the evaluation is awaiting review,
  and the score is shown as provisional. It is never hidden — a hidden score reads as a bad
  score.
- Where several professional readings are defensible ([07](07-scoring-rubrics.md) §13), feedback
  says so explicitly rather than presenting one reading as settled.
- Feedback never expresses confidence it was not given. It has no independent basis for
  certainty; its input is the only thing it knows.

---

## 9. Preventing generic feedback

Generic feedback is the main failure mode of automated assessment: fluent, encouraging, and
indistinguishable from what any other answer would have received. It teaches nothing and it
erodes trust in the score attached to it.

Rules:

1. **Every statement cites something specific** — an evidence span from the learner's own
   answer, or a named missing component. Feedback that could be pasted onto another learner's
   answer without editing is rejected.
2. **Quote the learner.** `what_was_good` entries reference `evidence_ref`, which points at
   text the learner actually wrote.
3. **Name the component, not the topic.** "You did not test the value just above the upper
   bound" — not "consider edge cases".
4. **No praise without a referent.** "Good work" with no cited evidence is rejected by the same
   check as any other ungrounded claim.
5. **Length is bounded.** Two sentences per criterion. Long feedback correlates with vague
   feedback, and a learner who stops reading gets nothing from any of it.
6. **No restating the score in words.** "You scored 62, which is a moderate result" carries no
   information the number did not.
7. **Different scores must produce different feedback.** A regression check compares feedback
   generated for a strong and a weak answer to the same item; overlap above a threshold fails.

Rule 7 is the only one of these that is mechanically testable end to end, which is why it
exists as a check rather than as guidance.

---

## 10. Not in this version

- The final feedback prompt.
- Model selection, temperature, or any generation parameter.
- Tone and voice guidelines beyond the constraints above.
- Localisation of feedback into any language other than Hebrew.
- The interface presentation of feedback.

These are blocked on approval of [07](07-scoring-rubrics.md),
[scoring-examples](scoring-examples.md) and
[scoring-acceptance-tests](scoring-acceptance-tests.md).
