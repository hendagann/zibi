# 07 — Scoring Rubrics

Status: `draft` · Owner: assessment · Depends on: [03](03-skill-map.md), [05](05-content-model.md), [06](06-question-model.md)

The complete scoring mechanism. Defines how any answer, to any question type, becomes a number
— reproducibly, explainably, and without a language model deciding it.

**Governing guarantee:** the same answer, to the same question, against the same rubric
version, produces the same score on every evaluation. For deterministic questions the
permitted deviation is exactly `0`. For rubric questions it is `0` given the same component
detection, because points are computed from detection by a fixed function (§4).

This document contains **no feedback prose**. Feedback is a separate stage, defined in
[08-feedback-rules](08-feedback-rules.md), which consumes the structured result in §17.

---

## 1. Principles

1. **No score is produced by a general instruction.** "Grade this answer" is forbidden as a
   mechanism. Every question type resolves a fixed, pre-authored rubric.
2. **Scoring and feedback are separate systems.** Scoring decides what is correct, missing and
   wrong, and how many points each criterion earned. Feedback explains it. They run in
   sequence, never together.
3. **A language model is never the source of a score.** Where a model participates at all, it
   performs *component detection* and returns a fixed structure; a deterministic function
   converts that structure into points (§4.3). The model never sees a weight and never emits a
   number that reaches the score.
4. **Every awarded point carries evidence.** A criterion above level 0 without an evidence span
   is an invalid result, not a lenient one.
5. **Alternative correct answers are correct.** No rubric scores by similarity to one model
   answer. This is enforced structurally: rubrics score *components*, not resemblance.
6. **Every evaluation is reproducible.** Item version, rubric version and engine version are
   recorded, and re-running a stored submission must reproduce the stored score.

---

## 2. The three layers

| Layer | Decides | Can a model participate? |
| --- | --- | --- |
| **1 — Deterministic checks** | structural facts: presence, validity, safety, limits | no, never |
| **2 — Rubric evaluation** | professional quality per criterion | only to detect components (§4.3) |
| **3 — Explanation** | how to say it to the learner | yes — after the score is final and immutable |

Layer 3 is out of scope here. It is specified in [08](08-feedback-rules.md).

The boundary between layers 1 and 2 is a design rule, not a preference: **anything objectively
decidable belongs in layer 1.** If a criterion can be settled by asking "is the field present
and non-empty?", it is a deterministic check and must not be a rubric criterion. Rubric
criteria are reserved for genuinely graded judgements. Mixing them is what makes scoring drift
between runs.

---

## 3. Layer 1 — deterministic checks

### 3.1 Check definition

Every check declares:

| Field | Required | Notes |
| --- | --- | --- |
| `check_id` | ✔ | stable, `DC-<FAMILY>-<NN>` |
| `description` | ✔ | what is tested |
| `result` | ✔ | `pass` · `fail` · `partial` · `not_applicable` |
| `score_effect` | ✔ | points added or subtracted; `0` for pure gates |
| `is_gate` | ✔ | if `true`, failure ends evaluation at `final_score = 0` |
| `score_cap` | ✔ | maximum `final_score` when this check fails; `100` = no cap |
| `internal_message` | ✔ | operator-facing, never shown to the learner |
| `error_code` | ✔ | stable, `E-<AREA>-<NNN>` |

`not_applicable` never affects the score and never triggers a cap.

### 3.2 Universal checks — every question type

| ID | Check | Gate | Cap | Effect | Error |
| --- | --- | --- | --- | --- | --- |
| `DC-GEN-01` | an answer was submitted and is non-empty after trimming | ✔ | 0 | — | `E-GEN-001` |
| `DC-GEN-02` | answer meets the item's `min_length` when one is declared | ✖ | 40 | — | `E-GEN-002` |
| `DC-GEN-03` | answer is on-topic — see §16.3 for how this is decided | ✔ | 0 | — | `E-GEN-003` |
| `DC-GEN-04` | every declared part of a multi-part question was answered | ✖ | per §8.16 | — | `E-GEN-004` |
| `DC-GEN-05` | selections lie within the permitted option set | ✔ | 0 | — | `E-GEN-005` |
| `DC-GEN-06` | answer does not rely on facts absent from the scenario | ✖ | 100 | see §16.8 | `E-GEN-006` |
| `DC-GEN-07` | time limit respected (mode 3 only, §14) | ✖ | per item | — | `E-GEN-007` |
| `DC-GEN-08` | the item is evaluable — rubric resolves, is `active`, weights sum to 100 | ✔ | — | → human review | `E-GEN-008` |

`DC-GEN-08` failing does **not** produce a score of 0. It produces `unevaluable: true` and
routes to human review (§16.17). A broken question is our defect, and charging the learner for
it would corrupt both their record and the item's calibration data.

### 3.3 Bug-report checks

| ID | Check | Gate | Cap | Error |
| --- | --- | --- | --- | --- |
| `DC-BUG-01` | reproduction steps present | ✖ | 60 | `E-BUG-001` |
| `DC-BUG-02` | Actual Result present | ✖ | 60 | `E-BUG-002` |
| `DC-BUG-03` | Expected Result present | ✖ | 60 | `E-BUG-003` |
| `DC-BUG-04` | the defect is identifiable from the report | ✖ | 40 | `E-BUG-004` |
| `DC-BUG-05` | environment stated when the item requires it | ✖ | 80 | `E-BUG-005` |
| `DC-BUG-06` | severity stated when the item requires it | ✖ | 90 | `E-BUG-006` |
| `DC-BUG-07` | steps are ordered and numbered | ✖ | 100 | `E-BUG-007` |

Multiple caps do not stack: the applicable cap is the **minimum** of all triggered caps (§5.3).
A report missing steps, Actual and Expected is capped at 60, not at 20 — it is one structural
failure of the same kind, and compounding it would make the score meaningless at the bottom.

### 3.4 SQL checks

| ID | Check | Gate | Cap | Error |
| --- | --- | --- | --- | --- |
| `DC-SQL-01` | statement parses | ✖ | see §9.3 | `E-SQL-001` |
| `DC-SQL-02` | statement is read-only — no DML, DDL, DCL | ✔ | 0 | `E-SQL-002` |
| `DC-SQL-03` | single statement only | ✔ | 0 | `E-SQL-003` |
| `DC-SQL-04` | executes within the timeout | ✖ | 70 | `E-SQL-004` |
| `DC-SQL-05` | result shape matches the required columns | ✖ | 100 | `E-SQL-005` |
| `DC-SQL-06` | result matches on visible fixture data | ✖ | 100 | `E-SQL-006` |
| `DC-SQL-07` | result matches on hidden fixture data | ✖ | 100 | `E-SQL-007` |
| `DC-SQL-08` | no banned construct declared by the item | ✖ | 90 | `E-SQL-008` |

`DC-SQL-02` is a **safety gate**: an attempt containing `UPDATE`, `DELETE`, `DROP`, `INSERT`,
`TRUNCATE`, `GRANT` or `ALTER` fails the exercise on safety with `final_score = 0`, regardless
of anything else in the answer. The sandbox blocks execution independently (06 §4); this check
records the attempt.

### 3.5 Test-design and test-case checks

| ID | Check | Gate | Cap | Error |
| --- | --- | --- | --- | --- |
| `DC-TD-01` | at least one test scenario present | ✔ | 0 | `E-TD-001` |
| `DC-TD-02` | answer contains only happy-path scenarios | ✖ | see §8.1 | `E-TD-002` |
| `DC-TC-01` | expected result present for every test case | ✖ | 60 | `E-TC-001` |
| `DC-TC-02` | steps present for every test case | ✖ | 60 | `E-TC-002` |

`DC-TD-02` does not impose a numeric cap. It sets the negative-scenario and edge-case criteria
to level 0, which is a stronger and more precise statement than a cap: the learner did not do
that work, and the score should say exactly that rather than obscure it behind a ceiling.

---

## 4. Layer 2 — rubric evaluation

### 4.1 Performance levels

Five levels for every criterion, with fixed percentages:

| Level | Name | Meaning | % of criterion points |
| --- | --- | --- | --- |
| 0 | לא קיים | not addressed, or irrelevant; no basis to infer understanding | 0% |
| 1 | חלש | a very partial, generic mention; material components absent, or a professional error | 25% |
| 2 | בסיסי | some components identified; understanding present but incomplete | 50% |
| 3 | טוב | most relevant components identified; mostly correct; only secondary gaps | 75% |
| 4 | מלא | fully addressed, with professional reasoning and no significant error | 100% |

Intermediate percentages are permitted **only** where a rubric declares them explicitly, and
only from the set `{0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100}`. Ad-hoc percentages are
invalid. A rubric that needs finer resolution than this has criteria that are too coarse, and
the correct fix is to split the criterion.

### 4.2 Expected components

Each criterion declares the components an answer may contain:

| Field | Required | Notes |
| --- | --- | --- |
| `component_id` | ✔ | stable within the criterion |
| `label` | ✔ | Hebrew |
| `class` | ✔ | `must` · `should` · `alternative` · `non_scoring` |
| `weight` | ✔ | within the criterion; `alternative` inherits the weight of what it replaces |
| `replaces` | for `alternative` | the `component_id` it substitutes for |
| `evidence_hint` | ✔ | what in an answer indicates presence — for the detector, not the learner |

- `must` — required for full marks.
- `should` — expected of a strong answer; contributes to coverage.
- `alternative` — a different but professionally valid way to satisfy a `must` or `should`.
  Detecting an alternative satisfies the component it `replaces`, at the same weight.
- `non_scoring` — appears in answers, is not wrong, and **earns nothing**. Declaring these
  explicitly is what stops padding from inflating a score.

### 4.3 Level derivation — the reproducibility core

Levels are **computed, never chosen**. Given detected components:

```text
coverage = Σ weight(detected components, class ∈ {must, should, alternative})
         ─────────────────────────────────────────────────────────────────────
           Σ weight(all components, class ∈ {must, should})

level =  0   if coverage = 0
         1   if 0    < coverage < 0.30
         2   if 0.30 ≤ coverage < 0.55
         3   if 0.55 ≤ coverage < 0.85
         4   if 0.85 ≤ coverage ≤ 1.00

if any critical_error is present:      level = min(level, 1)
if any must-class component is absent: level = min(level, 3)
```

Two consequences worth stating plainly. A critical error caps the criterion at level 1 no
matter how much else is present — a professionally wrong answer is not a good answer with a
blemish. And a missing `must` component caps at level 3, so level 4 is unreachable while
anything required is absent.

This function is the whole reproducibility guarantee. **A model, if used, decides only whether
a component is present and supplies the evidence span. It never sees `weight`, never sees a
level, and never emits a score.** Two runs that detect the same components produce identical
points by arithmetic.

### 4.4 Criterion schema

| Field | Required | Notes |
| --- | --- | --- |
| `criterion_id` | ✔ | stable within the rubric |
| `name` | ✔ | Hebrew, shown in results |
| `description` | ✔ | professional definition of what is being judged |
| `weight` | ✔ | share of 100 |
| `max_points` | ✔ | equals `weight` when the rubric totals 100 |
| `levels` | ✔ | the five levels of §4.1, with any declared intermediates |
| `full_examples` | ✔ | ≥ 2 illustrations of level 4 |
| `partial_examples` | ✔ | ≥ 2 illustrations of level 2 |
| `missing_examples` | ✔ | ≥ 2 illustrations of level 0–1 |
| `critical_errors` | ✔ | may be empty, but the field is required |
| `expected_components` | ✔ | §4.2 |
| `alternative_components` | ✔ | may be empty |
| `non_scoring_components` | ✔ | may be empty |
| `skill_ids` | ✔ | ≥ 1, resolving in [03](03-skill-map.md) |

`skill_ids` is what connects scoring to the skill map and lets §18 emit per-skill scores. A
criterion measuring nothing in the map is either a missing skill or a criterion that does not
belong.

**Completeness gate.** A rubric may reach status `active` only when every criterion has all
fourteen fields populated. Rubrics in §8 that ship with criteria, weights, skill links and
critical errors but without full component lists remain `draft` and **cannot be used for
evaluation** (`AT-SC-27`). This is deliberate: publishing a rubric whose components are not
enumerated would mean scoring by impression, which is exactly what this document exists to
prevent.

---

## 5. Score computation

### 5.1 Formula

```text
criterion_score  = criterion_max_points × level_percentage        (2 decimal places)
raw_score        = Σ criterion_score                              (0–100)
penalised_score  = raw_score − Σ penalties
effective_cap    = min(100, every triggered score_cap)
capped_score     = min(penalised_score, effective_cap)
final_score      = round_half_up(clamp(capped_score, 0, 100))     (integer)
```

### 5.2 Order of operations, and why

Penalties are applied **before** the cap. A cap expresses "whatever else is true, this answer
cannot be worth more than X". A penalty expresses "deduct for this specific fault". Applying
the cap first and then subtracting would punish the same structural failure twice — once by
ceiling, once by deduction — and would make a capped answer's score depend on faults the cap
was already accounting for.

Rounding happens **once**, at the very end. Criterion scores are held to two decimal places
throughout. Rounding each criterion would accumulate error across eight criteria and make the
total depend on evaluation order, which breaks reproducibility for no benefit.

`round_half_up`: `62.5 → 63`. Banker's rounding is rejected because a learner comparing two
attempts at 62.5 and 63.5 would see 62 and 64, which reads as arbitrary.

### 5.3 Caps

- Caps do not stack. The effective cap is the **minimum** of all triggered caps.
- A cap never raises a score; `min` only lowers.
- Caps apply to `final_score`, not to individual criteria.
- A gate is not a cap. A failed gate ends evaluation immediately at `final_score = 0` with the
  triggering `error_code` recorded.

### 5.4 Fixed answers to the standing questions

| Question | Answer |
| --- | --- |
| Is the score an integer? | Yes — `final_score` is an integer 0–100. Intermediate values keep 2 dp. |
| How is rounding done? | `round_half_up`, once, at the end. |
| Can the score exceed 100? | No. |
| Are there bonus points? | No. Nothing above 100 exists, and no undeclared bonus may be awarded. |
| Are there deductions? | Yes — only those declared as penalties on the rubric or a check. |
| When does a cap apply? | When a check with `score_cap < 100` fails. |
| Does time affect the score? | Only in mode 3 (§14). Default is mode 2 — reported separately. |
| Unevaluable question? | `unevaluable: true`, no score, human review. Never 0. |
| Empty answer? | `final_score = 0` via gate `DC-GEN-01`. |
| Irrelevant answer? | `final_score = 0` via gate `DC-GEN-03`. |
| Partial answer? | Partial credit by rubric. Never rounded up to a pass. |

---

## 6. Partial credit

Partial credit exists at three places, and they must not be confused:

1. **Within a criterion** — via level percentages (§4.1). This is the normal case.
2. **Across criteria** — a criterion at level 0 does not zero the others. Each is independent
   except where §4.3's caps apply.
3. **Within deterministic answers** — the answer-key policies in [06](06-question-model.md) §5:
   `none`, `proportional`, `penalised`.

Rules:

- Partial credit is never awarded for an answer that is professionally wrong. Level 1 exists
  for weak-but-not-wrong; a critical error caps at level 1 and cannot reach 2.
- Partial credit is never awarded for volume. `non_scoring` components exist to make this
  explicit, and coverage is computed only over `must`, `should` and `alternative`.
- Partial credit is never awarded for restating the question.

---

## 7. The base test-design rubric — review

The rubric supplied by the product owner:

| Criterion | Weight |
| --- | ---: |
| הבנת הדרישה | 15 |
| תרחישים חיוביים | 15 |
| תרחישים שליליים | 20 |
| מקרי קצה וגבולות | 15 |
| נתוני בדיקה | 10 |
| תלויות ואינטגרציות | 10 |
| סיכונים ותעדוף | 10 |
| בהירות ומבנה התשובה | 5 |
| **Total** | **100** |

**Verdict: adopted unchanged as `RUB.TEST_DESIGN` v1.** Weights sum to 100. Every criterion
maps to at least one skill in [03](03-skill-map.md). The distribution is professionally sound —
negative scenarios carry the single largest weight, which matches the finding in
[14](14-content-sources.md) §4 that candidates fail on everything except the happy path.

**One gap identified, addressed by addition rather than modification.** The rubric scores the
*output* — the resulting test set — and contains no criterion for *technique selection and
justification*. [03](03-skill-map.md) §8 identifies `TD.SEL` (K4) as the skill that separates a
mid-level tester from a senior one, and [14](14-content-sources.md) §4 reaches the same
conclusion independently.

For foundation and applied items this is correct as it stands: those questions ask for a test
set, not for a defence of method, and adding an unasked-for criterion would penalise a complete
answer. For advanced (K4) items it leaves the defining skill unmeasured.

Therefore a **variant** is proposed, not a replacement:

| Criterion | Base v1 | Proposed `ADV` variant | Change |
| --- | ---: | ---: | --- |
| הבנת הדרישה | 15 | 12 | −3 |
| תרחישים חיוביים | 15 | 10 | −5 |
| תרחישים שליליים | 20 | 16 | −4 |
| מקרי קצה וגבולות | 15 | 12 | −3 |
| נתוני בדיקה | 10 | 8 | −2 |
| תלויות ואינטגרציות | 10 | 8 | −2 |
| סיכונים ותעדוף | 10 | 10 | 0 |
| בהירות ומבנה התשובה | 5 | 4 | −1 |
| **בחירת טכניקה והנמקתה** | — | **20** | **+20 (new)** |
| **Total** | **100** | **100** | ✔ |

What changed: one criterion added at weight 20, funded by proportional reduction of the seven
output criteria, with risk-and-prioritisation held constant because it is already the closest
thing to a reasoning criterion and reducing it would work against the intent.

Why: without it, an advanced item cannot measure `TD.SEL`, and `SM-10` in
[03](03-skill-map.md) requires every K4 skill to be assessed by a rubric or hybrid type that
actually reaches it.

**This variant is `Decision Required` (D-07-1).** It is not active. Base v1 applies to all
test-design items until the variant is approved.

---

## 8. Rubric registry — the seventeen families

Every rubric below totals 100 and declares its criteria, weights and skill links. Rubrics
marked ⚙ are **`draft`**: criteria and weights are fixed, component lists are not yet
authored, and they cannot be used for evaluation until they are (§4.4).

### 8.1 `RUB.TEST_DESIGN` — תכנון בדיקות

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | הבנת הדרישה | 15 | `DOC.REQ` |
| `c2` | תרחישים חיוביים | 15 | `TD.EP` |
| `c3` | תרחישים שליליים | 20 | `TD.EP`, `TD.EXP` |
| `c4` | מקרי קצה וגבולות | 15 | `TD.BVA` |
| `c5` | נתוני בדיקה | 10 | `MGMT.DATA` |
| `c6` | תלויות ואינטגרציות | 10 | `LIFE.LEVEL` |
| `c7` | סיכונים ותעדוף | 10 | `MGMT.RISK` |
| `c8` | בהירות ומבנה התשובה | 5 | `DOC.TC` |

**Critical errors:** inventing a requirement that is not in the scenario and testing against it
(`c1`); presenting a happy-path-only answer as complete coverage (`c3`).

**Caps:** happy-path only → `c3` and `c4` forced to level 0 (`DC-TD-02`). Fabricated
requirements earn nothing; the components they would have satisfied are not credited.

**Asking rather than assuming.** Where a requirement is genuinely absent, an answer that
*identifies the gap and states the question* earns full credit on `c1` — component
`c1.k4 זיהוי חוסר בדרישה`. This is the professionally correct behaviour and the rubric must
reward it, not treat it as a non-answer.

### 8.2 `RUB.REQ_ANALYSIS` — ניתוח דרישות ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | זיהוי מה ניתן לבדיקה | 20 | `DOC.REQ` |
| `c2` | איתור אי־בהירות | 20 | `STAT.CRIT` |
| `c3` | זיהוי חוסרים | 20 | `STAT.CRIT` |
| `c4` | זיהוי סתירות | 15 | `STAT.CRIT` |
| `c5` | ניסוח קריטריוני קבלה | 15 | `LIFE.AGILE` |
| `c6` | בהירות | 10 | `DOC.REQ` |

**Critical errors:** rewriting an ambiguous requirement into one specific reading and treating
it as settled, without flagging that a choice was made.

### 8.3 `RUB.TEST_CASE` — כתיבת Test Cases ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | תנאים מקדימים | 15 | `DOC.TC` |
| `c2` | צעדים ברורים וניתנים לביצוע | 25 | `DOC.TC` |
| `c3` | נתוני בדיקה | 15 | `MGMT.DATA` |
| `c4` | תוצאה מצופה | 25 | `DOC.TC` |
| `c5` | עקיבות לדרישה | 10 | `DOC.RTM` |
| `c6` | בהירות ועקביות | 10 | `DOC.TC` |

**Critical errors:** an expected result that restates the step instead of stating an
observable outcome; steps that cannot be executed by another tester without asking a question.

**Caps:** `DC-TC-01`/`DC-TC-02` → 60.

### 8.4 `RUB.BUG_REPORT` — כתיבת דיווח באג

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | כותרת | 8 | `DOC.BUG` |
| `c2` | סביבת בדיקה | 8 | `MGMT.CONF` |
| `c3` | תנאים מקדימים | 7 | `DOC.BUG` |
| `c4` | צעדי שחזור | 22 | `DOC.BUG` |
| `c5` | Actual Result | 12 | `DOC.BUG` |
| `c6` | Expected Result | 12 | `DOC.BUG` |
| `c7` | ראיות | 8 | `DOC.BUG` |
| `c8` | חומרה והנמקתה | 13 | `DOC.ADV` |
| `c9` | ניסוח ניטרלי והימנעות מהנחות | 10 | `DOC.ADV`, `FUND.PSY` |

Full rules in §10.

### 8.5 `RUB.BUG_REPAIR` — תיקון דיווח באג קיים ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | אבחון הליקויים בדיווח המקורי | 25 | `DOC.BUG` |
| `c2` | תיקון צעדי השחזור | 25 | `DOC.BUG` |
| `c3` | תיקון Actual ו־Expected | 20 | `DOC.BUG` |
| `c4` | השלמת סביבה וראיות | 10 | `MGMT.CONF` |
| `c5` | הערכת חומרה מחדש | 10 | `DOC.ADV` |
| `c6` | תיקון ניסוח והנחות | 10 | `DOC.ADV` |

**Critical errors:** rewriting the report wholesale without identifying what was wrong with it
— the skill being measured is diagnosis, not composition.

### 8.6 `RUB.SQL` — SQL

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | הבנת המשימה | 10 | `TECH.SQL` |
| `c2` | בחירת טבלאות ושדות | 15 | `TECH.SQL` |
| `c3` | חיבור בין טבלאות | 20 | `TECH.SQL` |
| `c4` | תנאי סינון | 15 | `TECH.SQL` |
| `c5` | נכונות התוצאה | 25 | `TECH.SQLV` |
| `c6` | טיפול במקרי קצה | 10 | `TECH.SQLV` |
| `c7` | בהירות השאילתה | 5 | `TECH.SQL` |

Adopted as supplied; weights sum to 100. Full rules and the reweighting mechanism in §9.

### 8.7 `RUB.SQL_ANALYSIS` — ניתוח תוצאת SQL ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | קריאה נכונה של התוצאה | 20 | `TECH.SQLV` |
| `c2` | שיפוט עקביות מול הממשק | 25 | `TECH.SQLV` |
| `c3` | קביעה איזה צד שגוי | 20 | `TECH.SQLV` |
| `c4` | ראיות לתמיכה במסקנה | 15 | `TECH.SQLV` |
| `c5` | גבולות המסקנה | 10 | `TD.COV` |
| `c6` | בהירות | 10 | `DOC.BUG` |

### 8.8 `RUB.INVESTIGATION` — תחקור תקלה

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | שאלות הבהרה | 10 | `DOC.REQ` |
| `c2` | ניסיון שחזור | 15 | `DOC.BUG` |
| `c3` | בידוד הבעיה וזיהוי שלב הכשל | 20 | `TECH.DEV` |
| `c4` | כיסוי שכבות — UI, API, DB, לוגים | 20 | `TECH.DEV`, `TECH.API`, `TECH.SQLV`, `TECH.LOG` |
| `c5` | השוואה למצב תקין וזיהוי תלויות | 10 | `TECH.DEV` |
| `c6` | איסוף ראיות וזיהוי השפעה | 10 | `DOC.BUG` |
| `c7` | סדר פעולות והימנעות מ־Root Cause מוקדם | 15 | `FUND.ERR` |

Full rules in §11.

### 8.9 `RUB.LOG_ANALYSIS` — ניתוח לוגים וזרימת מערכת ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | איתור הרשומות הרלוונטיות | 25 | `TECH.LOG` |
| `c2` | הבחנה בין מה שהוכח למה שלא ידוע | 25 | `TECH.LOG` |
| `c3` | קישור בין אירועים | 20 | `TECH.LOG` |
| `c4` | שחזור הזרימה | 20 | `TECH.WEB` |
| `c5` | בהירות | 10 | `DOC.BUG` |

**Critical errors:** asserting a cause the log does not support.

### 8.10 `RUB.PRIORITISATION` — תעדוף בדיקות

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | זיהוי הסיכון | 15 | `MGMT.RISK` |
| `c2` | חומרת ההשפעה | 15 | `MGMT.RISK` |
| `c3` | הסתברות | 10 | `MGMT.RISK` |
| `c4` | היקף המשתמשים המושפעים | 10 | `MGMT.RISK` |
| `c5` | השפעה עסקית | 10 | `LIFE.UAT` |
| `c6` | פתרון עוקף ויכולת התאוששות | 10 | `MGMT.RBT` |
| `c7` | תלויות וזמן שנותר | 10 | `MGMT.RBT` |
| `c8` | איכות ההנמקה | 12 | `MGMT.RBT` |
| `c9` | עקביות עם נתוני התרחיש | 8 | `MGMT.RBT` |

Full rules in §12.

### 8.11 `RUB.REGRESSION` — תכנון Regression ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | ניתוח השפעת השינוי | 25 | `LIFE.REG` |
| `c2` | בחירת היקף | 25 | `LIFE.REG` |
| `c3` | הבחנה בין אימות תיקון לרגרסיה | 15 | `LIFE.REG` |
| `c4` | צמצום מבוסס סיכון | 15 | `MGMT.RBT` |
| `c5` | הצהרה מפורשת על מה לא ייבדק | 10 | `MGMT.RBT` |
| `c6` | בהירות | 10 | `DOC.TC` |

**Critical errors:** "run everything" presented as a plan under a stated constraint — it is the
absence of a decision, not a conservative one.

### 8.12 `RUB.RELEASE_DECISION` — החלטת שחרור גרסה ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | ביסוס על ראיות | 20 | `MGMT.MON` |
| `c2` | סיכון שיורי | 25 | `MGMT.RBT` |
| `c3` | קריטריוני יציאה | 15 | `MGMT.PLAN` |
| `c4` | ניסוח לבעלי עניין | 15 | `DOC.STAKE` |
| `c5` | בהירות ההמלצה | 15 | `DOC.SUM` |
| `c6` | יושרה לגבי אי־ודאות | 10 | `DOC.SUM` |

### 8.13 `RUB.OPEN_KNOWLEDGE` — שאלת ידע פתוחה ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | נכונות מקצועית | 35 | per item |
| `c2` | שלמות | 25 | per item |
| `c3` | דיוק במונחים | 20 | per item |
| `c4` | דוגמה או יישום | 10 | per item |
| `c5` | בהירות | 10 | per item |

### 8.14 `RUB.COMPARISON` — השוואה בין מושגים ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | הגדרת שני המושגים | 20 | per item |
| `c2` | הבדלים מהותיים | 30 | per item |
| `c3` | נקודות דמיון | 15 | per item |
| `c4` | מתי משתמשים בכל אחד | 25 | per item |
| `c5` | בהירות | 10 | per item |

**Critical errors:** defining one concept by negating the other without independent content.

### 8.15 `RUB.SCENARIO` — שאלת תרחיש מקצועי ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | קריאה נכונה של המצב | 20 | per item |
| `c2` | פעולה מקצועית מתאימה | 25 | per item |
| `c3` | הנמקה | 25 | per item |
| `c4` | מודעות לסיכון | 15 | `MGMT.RISK` |
| `c5` | תקשורת ושיתוף | 15 | `FUND.PSY` |

### 8.16 `RUB.MULTIPART` — שאלה מרובת חלקים

A composite rubric. Each part is scored by its own family rubric; the multipart rubric declares
only the split.

| Field | Required | Notes |
| --- | --- | --- |
| `parts[]` | ✔ | `{ part_id, rubric_id, rubric_version, weight }` |
| `weights` | ✔ | must sum to 100 |
| `unanswered_part_policy` | ✔ | `zero_part` (default) or `cap_total` |

`final = Σ (part_final_score × part_weight / 100)`, computed on **unrounded** part scores and
rounded once at the end (§5.2). Default policy for an unanswered part is `zero_part`: that part
scores 0 and the others stand. `DC-GEN-04` records which parts were missing.

### 8.17 `RUB.ANSWER_IMPROVEMENT` — שיפור תשובה קודמת ⚙

| ID | Criterion | Wt | Skills |
| --- | --- | ---: | --- |
| `c1` | אבחון מה היה חסר או שגוי | 30 | per item |
| `c2` | תיקון ממוקד | 30 | per item |
| `c3` | שימור החלקים שהיו נכונים | 15 | per item |
| `c4` | העמקה מעבר לתיקון | 15 | per item |
| `c5` | בהירות | 10 | per item |

**Critical errors:** discarding correct material from the original answer. `c3` exists because
the common failure in a revision task is to rewrite rather than repair.

---

## 9. SQL scoring rules

### 9.1 Never compare query text

A submitted query is never compared to a reference query as text. Many correct queries exist
for one question, and text comparison would score spelling. Scoring is on **behaviour**:

| Dimension | How assessed |
| --- | --- |
| syntactic validity | parses — `DC-SQL-01` |
| safety | read-only, single statement — `DC-SQL-02`, `DC-SQL-03` |
| executability | runs within timeout — `DC-SQL-04` |
| result shape | column count, names or semantic equivalents — `DC-SQL-05` |
| row count | exact match against fixture |
| row values | set comparison, order-insensitive unless ordering is required |
| duplicate handling | as specified by the item |
| NULL handling | as specified by the item |
| ordering | checked **only** when the item requires it |
| visible fixture | `DC-SQL-06` |
| hidden fixture | `DC-SQL-07` |
| basic efficiency | scored **only** when efficiency is part of the item's stated goal |

**Any query returning the correct result on both visible and hidden fixtures is correct**,
regardless of how it is written. Column names are accepted when semantically equivalent unless
the item declares exact names.

### 9.2 Reweighting for question shape

Not every SQL question exercises every criterion. A basic `SELECT` with no join must not carry
20 points for joins.

When a criterion is `not_applicable`, its weight is redistributed **proportionally** across the
remaining applicable criteria, and the resulting weights are stored on the rubric instance:

```text
new_weight(i) = old_weight(i) × 100 / Σ old_weight(applicable)
```

Rounded to 2 dp, with any residual assigned to the highest-weighted criterion so the total is
exactly 100. Worked example, a single-table `SELECT` with no joins:

| Criterion | Base | Applicable | Redistributed |
| --- | ---: | --- | ---: |
| הבנת המשימה | 10 | ✔ | 12.50 |
| בחירת טבלאות ושדות | 15 | ✔ | 18.75 |
| חיבור בין טבלאות | 20 | ✖ | — |
| תנאי סינון | 15 | ✔ | 18.75 |
| נכונות התוצאה | 25 | ✔ | 31.25 |
| טיפול במקרי קצה | 10 | ✔ | 12.50 |
| בהירות השאילתה | 5 | ✔ | 6.25 |
| **Total** | 100 | | **100.00** |

The redistribution is computed once when the item is authored and **frozen into the rubric
instance**, never recomputed at evaluation time. A weight that could change between runs would
break the reproducibility guarantee.

### 9.3 SQL caps

| Situation | Effect |
| --- | --- |
| does not parse | `c5` and `c6` → level 0; cap 40. Comprehension criteria (`c1`, `c2`) may still score from the attempt. |
| runs, wrong result | `c5` → level 0. No cap; structure criteria stand. |
| forbidden data-modifying statement | **safety failure**, `final_score = 0`, gate `DC-SQL-02` |
| correct on visible, fails hidden | `c5` capped at level 2; `c6` at most level 1 |
| different from the model answer, correct result | **full credit** — no penalty of any kind |
| timeout | cap 70 |

---

## 10. Bug-report scoring rules

Required elements: title, problem description, environment, preconditions, reproduction steps,
Actual Result, Expected Result, evidence, severity, priority *where the item asks for it*,
business impact, neutral wording, reproducibility, absence of unfounded assumptions.

Rules:

- **Severity and priority are not the same thing**, and a rubric must not treat disagreement
  between them as an error. `c8` scores the *justification*, not the label.
- **Priority is not required in every item.** It is scored only when the item declares it; the
  criterion is `not_applicable` otherwise and its weight redistributes per §9.2.
- **Different wording is not wrong.** No component is detected by keyword matching, and an
  answer that expresses the same content differently earns the same points.
- **The real test is reproducibility**: could another person follow these steps and see this?
  That is what `c4` measures, and it is what `DC-BUG-04` gates at cap 40.
- An unsupported claim reduces `c9` (accuracy of statement), not `c4`. Asserting a cause the
  evidence does not support is a `c9` critical error.

Caps are in §3.3.

---

## 11. Investigation scoring rules

The defining rule: **credit correct investigative method even when the learner cannot possibly
know the root cause from the information given.** Most investigation items deliberately supply
insufficient information; the skill is the approach.

Consequences for the rubric:

- Naming a root cause the evidence does not support is a **critical error** on `c7`, capping it
  at level 1 — even if the guess happens to be right. Method is what is measured.
- Asking a clarifying question is a scoring component (`c1`), not a non-answer.
- Layer coverage (`c4`) scores *appropriate* layers, not all four. Checking the database for a
  pure rendering defect is not coverage, it is noise, and it earns nothing.
- Order matters (`c7`): reproduce → isolate → gather evidence → hypothesise. An answer that
  hypothesises first and reasons backwards scores low on `c7` regardless of correctness.

---

## 12. Prioritisation and professional-judgement rules

**No score is awarded for matching the decision in the model answer.** These items have no
single correct answer, and scoring by agreement would teach conformity instead of reasoning.

What is scored: risk identification, severity of impact, likelihood, users affected, business
impact, recoverability and workaround, dependencies, time remaining, quality of reasoning, and
consistency with the scenario's stated facts.

Therefore:

- Two learners reaching **opposite** decisions can both score full marks if both are reasoned
  and consistent with the data.
- A decision that contradicts a fact stated in the scenario is penalised on `c9`, regardless of
  how well argued it otherwise is.
- A decision with no stated reasoning caps `c8` at level 1 even when the decision matches what
  an expert would choose. An unreasoned right answer is indistinguishable from a guess.

---

## 13. Multi-solution questions

Every item admitting multiple correct answers must declare:

| Field | Required | Notes |
| --- | --- | --- |
| `mandatory_components` | ✔ | must appear in any acceptable answer |
| `recommended_components` | ✔ | expected of a strong answer |
| `alternative_components` | ✔ | valid substitutes, each naming what it `replaces` |
| `acceptable_answers` | ✔ | described by component profile, never as fixed text |
| `valid_professional_considerations` | ✔ | reasoning that earns credit |
| `invalid_answers` | ✔ | with the reason each is invalid |
| `permitted_assumptions` | ✔ | assumptions a learner may state and still score fully |
| `clarification_expected` | ✔ | when asking is the correct response rather than assuming |

**Keyword matching alone is forbidden** as a detection mechanism. Detection judges professional
meaning — but every detected component must map to a declared `component_id`, so the judgement
can never invent a scoring category. This is the whole point of §4.3: meaning is judged,
arithmetic is fixed.

An answer that states an assumption listed in `permitted_assumptions` and proceeds is fully
correct. An answer that states an assumption **not** listed is judged on whether the assumption
contradicts the scenario: if it does, `DC-GEN-06` applies; if not, it is treated as a
reasonable reading and scored normally.

---

## 14. Time

| Mode | Behaviour | Used for |
| --- | --- | --- |
| 1 | time recorded, no effect, not shown | early practice |
| 2 | **default** — professional score and a separate speed indicator; no deduction | all practice |
| 3 | time affects the score | only items explicitly declared as timed-work items |

Mode 3 requires the item to declare `time_limit_seconds`, `grace_period_seconds`,
`overrun_penalty`, `max_score_after_overrun`, and behaviour on disconnection.

**Mode 2 is the platform default.** A professional score and a speed measure answer different
questions, and merging them produces a number that answers neither.

Disconnection and technical failure behaviour depends on [10-exam-rules](10-exam-rules.md) and
[11-user-flows](11-user-flows.md), **neither of which exists** — see D-07-4.

---

## 15. Rubric versioning

Every rubric carries:

| Field | Notes |
| --- | --- |
| `rubric_id` | stable forever |
| `version` | semantic, incremented on any scoring-affecting change |
| `status` | `draft` · `needs_review` · `approved` · `active` · `deprecated` · `archived` |
| `created_at` · `approved_at` · `approved_by` | |
| `change_reason` | required for every version after the first |
| `effective_from` | timestamp from which new evaluations use it |

**Only `active` rubrics may score a new evaluation.**

`approved` and `active` are deliberately distinct: a rubric can be signed off before it should
take effect, and `effective_from` governs the transition. This differs from the content review
status in [05](05-content-model.md) §7, which has no such need — see D-07-3.

**A rubric change never alters an existing score.** Each attempt stores `rubric_id`,
`rubric_version` and `evaluation_version`; re-scoring is an explicit, logged batch operation
that writes new evaluation records rather than mutating old ones.

---

## 16. Edge cases

| # | Case | Behaviour |
| --- | --- | --- |
| 16.1 | empty answer | `DC-GEN-01` gate → `final_score = 0`, confidence `high` |
| 16.2 | very short answer | not automatically 0. If below a declared `min_length`, cap 40; otherwise scored normally — a correct one-line answer to a one-line question is correct |
| 16.3 | long but irrelevant | `DC-GEN-03` gate → 0. Relevance is decided by whether **any** declared component is detected; zero components across every criterion means off-topic |
| 16.4 | partly right, partly wrong | scored normally; correct parts earn, wrong parts trigger critical errors on their own criteria only |
| 16.5 | self-contradictory | the contradicting components are **both** treated as undetected on the affected criterion; confidence drops to `low` |
| 16.6 | several solutions offered | the **strongest coherent** one is scored, per §13. Listing every option to cover the ground is not rewarded — spread across mutually exclusive answers reduces confidence to `low` |
| 16.7 | asks a clarifying question instead of answering | scored per §8.1 and §11: full credit where the gap is real, level 0 where the information was supplied |
| 16.8 | assumes requirements not given | if it contradicts the scenario, `DC-GEN-06` and no credit for dependent components; if merely unstated, treated as a reasonable reading |
| 16.9 | correct term in the wrong context | the component is **not** detected; a critical error on the precision criterion where the rubric declares one |
| 16.10 | Hebrew with English technical terms | fully accepted. This is normal Israeli professional usage and carries no penalty |
| 16.11 | spelling error not affecting meaning | ignored entirely; never affects any criterion |
| 16.12 | unprofessional wording, correct content | content criteria score fully. Only an explicit clarity or tone criterion may be affected, and only where the rubric declares one |
| 16.13 | professionally correct, differs from model answer | full credit. Detection is by component, never by resemblance |
| 16.14 | time overrun | mode 1–2: recorded only. Mode 3: per item declaration |
| 16.15 | disconnection mid-exam | **undefined — D-07-4** |
| 16.16 | item changed after submission | the stored `item_version` governs; the attempt is re-evaluated only by explicit batch re-scoring |
| 16.17 | rubric changed after submission | old score stands unchanged (§15) |
| 16.18 | broken or incomplete item | `unevaluable: true`, no score, human review, item flagged. Never 0 |
| 16.19 | cannot be evaluated with confidence | score stands, `confidence_level: requires_human_review`, `human_review_required: true` |

Two of these carry the most weight in practice. **16.11 and 16.12** exist because a learner
whose Hebrew spelling costs them points learns to write cautiously rather than to test well,
and this platform measures testing. **16.13** is the structural commitment that makes the whole
model defensible: nothing is scored by resemblance to a reference answer.

---

## 17. Evaluation result structure

The canonical output of scoring. **It contains no feedback prose** — no explanation, no
suggestion, no improved answer. Those are produced later by [08](08-feedback-rules.md) from
this structure.

```jsonc
{
  "evaluation_id": "string",
  "question_id": "string",
  "item_version": 4,                    // ADDED
  "attempt_id": "string",
  "attempt_number": 1,                  // ADDED
  "user_id": "string",
  "question_type": "string",
  "question_family": "string",          // ADDED
  "rubric_id": "string",
  "rubric_version": "string",
  "rubric_instance_id": "string",       // ADDED — the frozen weights actually used
  "evaluation_version": "string",
  "submitted_at": "datetime",
  "evaluated_at": "datetime",           // ADDED
  "answer_hash": "string",              // ADDED
  "time_spent_seconds": 0,
  "time_mode": 2,                       // ADDED
  "time_status": "within",              // ADDED — within | grace | exceeded

  "deterministic_checks": [
    {
      "check_id": "string",
      "status": "pass | fail | partial | not_applicable",
      "is_gate": false,                 // ADDED
      "score_effect": 0,
      "score_cap": 100,
      "error_code": "string",           // ADDED
      "details": "string"
    }
  ],

  "criterion_results": [
    {
      "criterion_id": "string",
      "criterion_name": "string",
      "skill_ids": ["TD.BVA"],          // ADDED
      "weight": 0,
      "performance_level": 0,
      "level_percentage": 0,            // ADDED
      "coverage": 0.0,                  // ADDED
      "awarded_points": 0,
      "max_points": 0,
      "detected_components": [],        // ADDED
      "evidence": ["string"],
      "missing_elements": ["string"],
      "errors": ["string"],
      "critical_error_triggered": false // ADDED
    }
  ],

  "raw_score": 0,
  "penalties": [],
  "score_cap": 100,
  "cap_source": "string",               // ADDED — which check imposed it
  "final_score": 0,

  "confidence_level": "high | medium | low | requires_human_review",
  "confidence_reasons": [],             // ADDED
  "human_review_required": false,
  "human_review_reason": "string",      // ADDED
  "unevaluable": false,                 // ADDED

  "skills_measured": [],
  "skills_demonstrated": [],
  "skills_needing_review": [],
  "per_skill_scores": {},               // ADDED — { "TD.BVA": 0.75 }
  "difficulty": 3,                      // ADDED
  "recommended_topic_ids": [],
  "recommended_exercise_ids": [],

  "help_used": false,                   // ADDED
  "solution_viewed_before_submit": false // ADDED
}
```

### 17.1 Proposed additions and why

| Field | Reason |
| --- | --- |
| `item_version` | without it a score cannot be reproduced after the item is edited. [06](06-question-model.md) §9 already requires it; the supplied structure omitted it |
| `rubric_instance_id` | §9.2 freezes redistributed weights per item. `rubric_id` + `version` alone do not identify the weights actually used |
| `evaluated_at`, `answer_hash` | the consistency harness (§19) needs to detect "same answer, different score" without storing the answer twice |
| `error_code`, `is_gate` | §3.1 requires both per check; the supplied structure carried neither |
| `skill_ids`, `per_skill_scores` | §18 must hand per-skill results to progress. Deriving them from criterion names at read time would be fragile |
| `coverage`, `level_percentage`, `detected_components` | make the level derivation in §4.3 auditable. Without them a level is an assertion, not a computation |
| `critical_error_triggered`, `cap_source` | make it visible *why* a score was limited |
| `confidence_reasons`, `human_review_reason` | a confidence value with no stated cause cannot be triaged |
| `unevaluable` | distinguishes "scored 0" from "not scored", which are completely different for progress |
| `attempt_number`, `help_used`, `solution_viewed_before_submit` | §18 requires all three; they cannot be reconstructed later |
| `difficulty`, `time_mode`, `time_status`, `question_family` | required by progress and by the time rules |

---

## 18. Hand-off to the progress mechanism

The progress mechanism receives the **whole structure**, never just `final_score`. Specifically:

| Passed | Source |
| --- | --- |
| skills measured | `skills_measured` |
| score per skill | `per_skill_scores` |
| difficulty | `difficulty` |
| first attempt or repeat | `attempt_number` |
| item seen before | derived from attempt history |
| time taken | `time_spent_seconds` |
| confidence | `confidence_level` |
| recurring errors | `criterion_results[].errors` compared against history |
| help used | `help_used` |
| completed after viewing the solution | `solution_viewed_before_submit` |

`per_skill_scores` is computed as the weighted mean of the criteria carrying that skill:

```text
per_skill_score(s) = Σ awarded_points(c)  for c where s ∈ c.skill_ids
                     ────────────────────
                     Σ max_points(c)
```

**A repeat attempt after viewing the solution must not carry the same weight as an independent
first solve.** The evaluation records the facts; the weighting rule belongs to the progress
model, which does not exist yet — see D-07-2.

---

## 19. Consistency and reliability

| # | Mechanism | Requirement |
| --- | --- | --- |
| 1 | re-evaluation of a stored answer | on demand and on a nightly sample |
| 2 | comparison across two runs | scores compared field by field |
| 3 | permitted deviation | **0** for deterministic; **0** for rubric given identical detection; ±1 point tolerated on detection variance, above which the item is flagged |
| 4 | unexplained change detection | same `answer_hash` + same `item_version` + same `rubric_version` + different `final_score` → alert |
| 5 | rubric version stored | `rubric_version`, `rubric_instance_id` |
| 6 | engine version stored | `evaluation_version` |
| 7 | feedback prompt version stored | in the feedback record, not here ([08](08-feedback-rules.md)) |
| 8 | score reconstruction | every score recomputable from `criterion_results` and `deterministic_checks` alone |
| 9 | audit trail | evaluation records are append-only; re-scoring writes a new record |
| 10 | human review flag | `human_review_required` with `human_review_reason` |

Requirement 8 is the strongest of these: `Σ (max_points × level_percentage) − penalties`, capped
and rounded, must equal `final_score` exactly. This is checkable arithmetically without the
answer, the item or the model, and it is the test that catches an engine that has started doing
something other than what this document says.

---

## 20. Confidence level

| Value | Meaning |
| --- | --- |
| `high` | deterministic, or rubric with full evidence coverage and no ambiguity |
| `medium` | rubric with a minor detection gap |
| `low` | ambiguity present; result usable but uncertain |
| `requires_human_review` | not usable without a person |

Confidence drops when: the answer is ambiguous; the question itself is unclear; components
contradict one another; several professional readings are defensible; detection cannot link the
answer to the rubric; the score sits within 2 points of a meaningful boundary; the answer
contains professional content absent from the evaluation data; or a claim may be true but
cannot be verified against the item.

**Low confidence never changes the score.** It flags the evaluation. Adjusting a score for
uncertainty would corrupt the record with a judgement no one made deliberately.

This **conflicts with [06](06-question-model.md) §7.2**, which specifies a numeric
`assessmentConfidence` in 0–1. See D-07-5.

---

## 21. Decisions required

| ID | Issue | Recommendation |
| --- | --- | --- |
| **D-07-1** | `RUB.TEST_DESIGN.ADV` variant (§7) adds technique-selection at weight 20 for K4 items | Approve for advanced items only; base v1 unchanged elsewhere |
| **D-07-2** | The weighting of a repeat attempt after viewing the solution is undefined; `docs/09-progress-model.md` does not exist | Record the facts now (done); decide the weight when 09 is written |
| **D-07-3** | Rubric statuses (6) differ from content review statuses (5) in [05](05-content-model.md) §7 | Keep both. A rubric needs `active` separate from `approved`; content does not |
| **D-07-4** | Disconnection, grace periods and timed-exam conduct are undefined; `docs/10-exam-rules.md` and `docs/11-user-flows.md` do not exist | Default to mode 2 everywhere until 10 and 11 exist. No item may declare mode 3 before then |
| **D-07-5** | [06](06-question-model.md) §7.2 defines numeric confidence 0–1; this document defines a four-value enum | Compute the numeric internally, expose the enum. Bands: ≥0.85 `high`, ≥0.65 `medium`, ≥0.40 `low`, below `requires_human_review`. **Requires editing 06 §7.2** |
| **D-07-6** | [06](06-question-model.md) §2.3 requires 3–4 rubric levels; this document requires exactly 5 | Adopt 5. **Requires editing 06 §2.3** |
| **D-07-7** | [06](06-question-model.md) §2.1 rubric envelope lacks `status`, `created_at`, `approved_at`, `approved_by`, `change_reason`, `effective_from` | Adopt the §15 envelope. **Requires editing 06 §2.1** |
| **D-07-8** | [06](06-question-model.md) §7 defines a feedback object mixing score and prose; this document forbids prose in the evaluation result | Split into `EvaluationResult` (§17) and `FeedbackObject` ([08](08-feedback-rules.md)). **Supersedes 06 §7** |
| **D-07-9** | `docs/01-product-vision.md` does not exist, so the base rubric cannot be verified against stated product goals as instructed | Verified against [03](03-skill-map.md) and [14](14-content-sources.md) instead; re-verify when 01 exists |
| **D-07-10** | Relationship between `docs/scoring-acceptance-tests.md` and the planned `docs/13-acceptance-tests.md` | Keep scoring tests separate; 13 should reference rather than duplicate them |

No document outside this task was edited. D-07-5 through D-07-8 require changes to
[06](06-question-model.md) and are **not applied** pending approval.
