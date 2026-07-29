# 09 — Progress Model

Status: `draft` · Owner: assessment · Depends on: [03](03-skill-map.md), [07](07-scoring-rubrics.md)

How demonstrated ability is derived from stored evaluations.

Product rule enforced here: **progress must represent demonstrated ability, not
page completion.** Nothing in this model reads a lesson view, a page visit or a
time-on-page signal. The only input is a scored, stored attempt.

---

## 1. Why not a mean

A simple average destroys the information that matters most. Three learners:

| Learner | Attempts (in order) | Mean | Actual state |
| --- | --- | ---: | --- |
| A | 40 → 60 → 90 | 63.3 | learning fast; last work was strong |
| B | 90 → 60 → 40 | 63.3 | losing it; last work was weak |
| C | 90 → 40 → 90 | 73.3 | unreliable; cannot be predicted |
| D | 63 → 64 → 63 | 63.3 | genuinely stuck at 63 |

A, B and D share a mean. They need opposite interventions: A should move on,
B should stop and revisit, D needs a different explanation. C, whose mean is the
*highest* of the four, is the least ready of all for an exam — a coin flip.

The model therefore never reports one number. It reports **five dimensions plus
four state signals**, and the two that separate the cases above are *trend* and
*stability*.

---

## 2. The five dimensions

| Dimension | Hebrew | What it measures | Source |
| --- | --- | --- | --- |
| `knowledge` | ידע | grasp of concepts and terminology | criteria tagged `knowledge` |
| `application` | יישום | producing a correct artifact | criteria tagged `application` |
| `reasoning` | חשיבה | quality of analysis and justification | criteria tagged `reasoning` |
| `speed` | מהירות | working within expected time | attempt duration vs `estimatedSeconds` |
| `stability` | יציבות | repeating success rather than achieving it once | dispersion of recent scores |

`knowledge`, `application` and `reasoning` come from the rubric: **every
criterion declares a `dimension`** (docs/07 §4.4). This is content-driven — a
rubric author decides what a criterion measures, and no dimension logic lives in
code. Validation rejects a criterion without one (`RB-01`).

`speed` and `stability` are attempt-level and cannot be tagged: they are
properties of a sequence, not of a single answer.

A dimension with no evidence reports `null`, never `0`. Zero is a claim about
the learner; null is the honest absence of a measurement.

---

## 3. Weighting: recency × novelty

Every per-skill and per-dimension figure is a **weighted** mean over attempts,
ordered oldest to newest. Two factors:

```
recency(k) = 0.7 ^ k          k = 0 for the newest attempt, 1 for the one before…
novelty    = 1.0  for the first attempt at an item
           = 0.4  for any repeat of an item already attempted

weight = recency × novelty
```

**Recency** is why A and B separate. With `α = 0.7` on the sequences above:

- A (40, 60, 90) → ability **69**
- B (90, 60, 40) → ability **58**

Same mean, eleven points apart, and the ordering is correct.

**Novelty** exists because docs/07 §18 requires it: *"a repeat attempt after
viewing the solution must not carry the same weight as an independent first
solve."* After an attempt, the learner has seen per-criterion feedback naming
exactly what was missing. Scoring well on the same item next time is partly
recall of that feedback. `0.4` keeps repeats meaningful — improvement should
show — without letting a learner reach a high ability by grinding one exercise.

The decay constant and the novelty factor are the two tuning knobs in this
model. Both are named constants in one place, and changing either is a product
decision, not an implementation detail.

---

## 4. State signals

Four signals accompany every skill. None is derivable from the ability number.

### 4.1 `latest` — last performance

The most recent `final_score`. Reported raw, because "what happened last time"
is the question a learner actually asks.

### 4.2 `trend` — direction

Least-squares slope over the last up to five attempts, in points per attempt:

| Slope | Label |
| --- | --- |
| ≥ +5 | משתפרת |
| ≤ −5 | נסוגה |
| otherwise | יציבה |

Fewer than three attempts → `null`. Two points make a line but not a trend.

### 4.3 `stability` — reliability

Stability measures **unexplained** variation: the spread of residuals around
the fitted trend line over the recent window, not the raw span of scores.

| Residual spread | Level | Meaning |
| --- | --- | --- |
| ≤ 10 | גבוהה | predictable |
| ≤ 25 | בינונית | uneven |
| > 25 | נמוכה | unpredictable |

The raw range cannot do this job, and the first version of this model used it
and got the answer wrong. Learners A (40→60→90) and C (90→40→90) both span
exactly 50 points. A is improving steadily and entirely predictable; C is a
coin flip. Fitting the trend and measuring what is left over separates them —
A's residuals span 5 points, C's span 50 — and it is what stops the model from
telling a steadily improving learner that they are unstable.

The raw range is still reported alongside, because it is the number a learner
can check against their own history by eye.

### 4.4 `freshFirstAttempt` — success on unseen work

The share of **first attempts on items never attempted before** that reached the
pass threshold (70).

This is the sharpest signal in the model. A learner who scores 100 on every
exercise *after* three tries has demonstrated something real but different from
a learner who scores 85 first time on a new item. Only the second has shown they
can do it without being told what was missing. When repeat scores are high and
this figure is low, the learner is learning the feedback rather than the skill —
and §6 flags exactly that.

---

## 5. Per-skill record

Stored — that is, recomputed deterministically from the attempt log — for every
skill with at least one attempt:

| Field | Hebrew | Definition |
| --- | --- | --- |
| `attempts` | מספר ניסיונות | count of scored, evaluable attempts touching the skill |
| `latest` | ציון אחרון | most recent `final_score` |
| `mean` | ציון ממוצע | plain arithmetic mean — reported for transparency, never used for ability |
| `best` | ציון מיטבי | highest `final_score` |
| `successRate` | אחוז הצלחה | share of attempts ≥ 70 |
| `meanTimeSeconds` | זמן ממוצע | median duration, in seconds (median, not mean — §7) |
| `recurringErrors` | טעויות חוזרות | missing components or critical errors appearing in ≥ 2 attempts |
| `lastPractisedAt` | תאריך תרגול אחרון | ISO date of the newest attempt |
| `confidence` | רמת ביטחון | §8 |
| `needsReview` | זקוק לחזרה | §6 |
| `ability` | רמת היכולת | §3 — the headline figure |
| `trend`, `stabilityLevel`, `freshFirstAttemptRate` | | §4 |
| `dimensions` | ממדים | the five of §2, each `0–100` or `null` |

`mean` is kept deliberately. Showing it next to `ability` makes the difference
visible instead of hiding a formula — and a learner who wonders why the two
differ is asking exactly the right question.

---

## 6. Needs review

`needsReview` is true when any of these hold, and each carries a reason so the
learner is told *why*:

| Trigger | Reason shown |
| --- | --- |
| `latest < 70` | הביצוע האחרון מתחת לסף |
| `trend = declining` | מגמת ירידה בניסיונות האחרונים |
| `stability = low` | תוצאות לא יציבות |
| `recurringErrors` non-empty | אותה טעות חוזרת |
| `lastPractisedAt` older than 21 days | לא תורגל לאחרונה |
| `ability ≥ 70` **and** `freshFirstAttemptRate < 0.5` | הצלחה בעיקר בניסיונות חוזרים |

The last row is the one that earns its place. Without it, a learner who has
retried three exercises to 100 each looks finished, and the model would
recommend moving on from a skill they have never once demonstrated cold.

---

## 7. Speed

`speed` is scored from the **ratio** of actual duration to the item's
`estimatedSeconds`:

```
ratio  = duration / estimatedSeconds
score  = 100                     ratio ≤ 1.0
       = 100 − (ratio − 1) × 50  1.0 < ratio < 3.0
       = 0                       ratio ≥ 3.0
```

Two deliberate choices:

- **Median, not mean.** The form starts its timer on mount, so a learner who
  opens an exercise and returns after lunch records an enormous duration. A
  median over attempts absorbs one such outlier; a mean would be destroyed by it.
- **Never penalised below the professional score.** Speed is reported as its own
  dimension and never reduces `ability`. This follows docs/07 §14: mode 2 is the
  platform default, and merging a professional score with a speed measure
  produces a number that answers neither question.

Durations are recorded per attempt. Attempts with no recorded duration are
excluded from `speed` entirely — an unmeasured attempt is not a fast one.

---

## 8. Confidence

How much the model trusts its own estimate — not how good the learner is.

| Level | Conditions |
| --- | --- |
| `high` | ≥ 3 attempts, across ≥ 2 distinct items, newest within 21 days, stability not low |
| `medium` | ≥ 2 attempts |
| `low` | 1 attempt, or every attempt on a single item |

A skill practised only through repeats of one exercise never reaches `high`,
however good the scores are: the evidence covers one situation.

Low confidence never changes `ability` — the same rule as docs/07 §20. It
changes how the figure is presented.

---

## 9. Aggregation

Topic-level and overall figures are the **weighted mean of their skills'
abilities**, weighted by attempt count, so a skill with one attempt does not
outweigh one with ten. Dimensions aggregate the same way, skipping nulls.

No topic is ever reported as "complete". Completion is a page-traversal concept,
and this model has no place to put it.

---

## 10. Determinism

Progress is computed from the attempt log on every read. It is not cached and
not stored separately, so:

- there is no second source of truth to drift,
- re-running the computation on the same log always produces the same result,
- an attempt log copied to another machine produces identical progress.

The only time-dependent inputs are the staleness checks in §6 and §8, which
compare against the current date. They are passed in as a parameter rather than
read from the clock inside the computation, so tests are deterministic.

---

## 11. Open questions

- **Q-09-1** — the decay constant `0.7` and novelty factor `0.4` are reasoned
  but not calibrated against real learner data. They should be revisited once
  there are enough attempts to check whether ability predicts exam performance.
- **Q-09-2** — `speed` currently compares against an author's `estimatedSeconds`
  guess. It should move to observed medians once items have enough attempts,
  exactly as difficulty calibration does (docs/05 §16).
- **Q-09-3** — no forgetting curve. A skill not practised for 21 days is flagged
  for review, but `ability` itself does not decay. Adding decay would make the
  figure change without the learner doing anything, which needs a product
  decision before it is implemented.
