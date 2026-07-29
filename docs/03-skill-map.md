# 03 — Skill Map

Status: `draft` · Owner: product · Depends on: [01](01-product-vision.md), [02](02-target-user.md), [14](14-content-sources.md)

The skill map is the backbone of the product. Content, questions, progress and exam blueprints
all reference skill IDs defined here. **No other document may invent a skill ID.**

---

## 1. What counts as a skill

A skill is **an observable capability that a learner can be seen to exercise, producing
evidence that discriminates between someone who has it and someone who does not.**

Three things are therefore explicitly **not** skills, and may never appear in this map:

| Not a skill | Why | Where it belongs |
| --- | --- | --- |
| Reading a lesson, watching a video, opening a syllabus | Consumption is not evidence. Two learners can read the same page and differ completely in capability. | a `concept` item in [05](05-content-model.md) |
| Completing a page, module or percentage | Measures traversal, not ability. | session telemetry, never progress |
| Knowing *about* a topic | Unfalsifiable as written. "Knows decision tables" cannot be failed. | rewrite as a behaviour, per §5 |

This is not a stylistic preference. [09-progress-model](09-progress-model.md) must answer
*"can this learner do X?"*, and the product rule states that **progress must represent
demonstrated ability, not page completion**. A map containing "read chapter 4" would make that
rule unimplementable at the data layer.

The test for admitting a skill: *can we describe, in one sentence, what the learner does that
proves it?* If not, it is a topic, and topics live at the level above.

---

## 2. The hierarchy

Four levels, each with a distinct job:

```
Domain              a broad area of professional practice          7 domains
  └─ Topic          a coherent cluster taught and revised together  33 topics
      └─ Skill      an assessable capability with a stable ID       67 skills
          └─ Demonstrated behaviour   the evidence that proves it   1 per skill
```

- **Domain** — organisational only. Carries no scheduling meaning; the learning path never
  reasons about domains.
- **Topic** — the unit a learner recognises as "a thing I'm learning". Groups skills that share
  vocabulary and are naturally revised together. Topics have no prerequisites of their own;
  their skills do.
- **Skill** — the unit of measurement. Everything downstream references this level.
- **Demonstrated behaviour** — the contract between the skill and its assessment. It states
  what the learner produces. Question authoring, rubric writing and mastery inference all
  derive from this sentence, which is why there is exactly one per skill.

---

## 3. Identifier scheme

```
Skill:  <DOMAIN>.<SKILL>          e.g. TD.BVA
Topic:  <DOMAIN>/<slug>           e.g. TD/black-box
```

Topics use a slash deliberately so that a topic ID can never be mistaken for, or collide with,
a skill ID. Adding the topic layer therefore **changed no existing skill ID** — every reference
in [05](05-content-model.md) and [06](06-question-model.md) still resolves.

Rules:

- Skill IDs are **stable forever** — never renumbered, never reused after retirement.
- Pattern `^[A-Z]{2,4}\.[A-Z0-9]{2,8}$`; topics `^[A-Z]{2,4}/[a-z-]{3,20}$`.
- Retiring a skill sets `status: retired`; it keeps its ID and stops being scheduled.
- Splitting a skill creates two new IDs and retires the old one. Never silently redefine —
  historical attempt records would otherwise re-attribute evidence to a skill the learner
  never demonstrated.

---

## 4. Dimensions on every skill

| Field | Values | Meaning |
| --- | --- | --- |
| `id` | see §3 | stable identifier |
| `topic` | topic ID | exactly one |
| `titleHe` / `titleEn` | string | Hebrew is the display name; English is the industry term |
| `tier` | `foundation` \| `applied` \| `advanced` | see §8 |
| `cognitiveLevel` | `K1` \| `K2` \| `K3` \| `K4` | highest level at which the skill is assessed |
| `behaviour` | string | the demonstrated behaviour, per §5 |
| `prerequisites` | skill ID[] | edges of the DAG, see §6 |
| `examWeight` | number \| `null` | share of the certification blueprint; `null` = not on the exam |
| `sourceCoverage` | `strong` \| `adequate` \| `partial` \| `none` | from [14](14-content-sources.md) §3–4 |
| `status` | `active` \| `retired` | |

K-levels follow the ISTQB convention because our target exam uses it: **K1** recall ·
**K2** explain, compare, classify · **K3** apply a technique to produce a correct artifact ·
**K4** decompose, select among options, justify a trade-off.

The K-level constrains which question types may assess the skill — see
[06-question-model](06-question-model.md) §6.

`sourceCoverage` records whether [`research/`](../research/) gives us enough to build the
skill. It is a **content-production signal, not a learner-facing one**: `none` means the skill
is real and required, and we have nothing to teach it from yet.

---

## 5. Writing a demonstrated behaviour

The behaviour is the most load-bearing sentence in this document. Rules:

1. **Starts with a verb the learner performs** — *partitions, derives, writes, justifies,
   locates, decides*. Never *understands, knows, is familiar with, is aware of*.
2. **Names the artifact or judgement produced.** If nothing is produced, nothing is evidence.
3. **States the condition** — given what input, under what constraint.
4. **Is falsifiable.** A reviewer must be able to look at a learner's output and say no.
5. **Does not name a question type.** The behaviour outlives the format that assesses it.

Compare:

> ❌ Understands boundary value analysis.
> ✅ Produces the complete boundary set for a bounded input — including the invalid side of
> each bound — and states which requirement each value exercises.

The second can be marked. The first can only be asserted.

---

## 6. Prerequisite graph

Prerequisites form a **directed acyclic graph**, not a tree.

`A` is a prerequisite of `B` means *attempting `B` before reaching at least `practicing` on `A`
produces uninterpretable evidence* — a measurement constraint, not a curriculum preference.
This is what [04-learning-path](04-learning-path.md) uses to decide eligibility.

Invariants, enforced by §10:

1. The graph is acyclic.
2. A prerequisite's `tier` is never higher than its dependent's.
3. Every non-`foundation` skill has at least one prerequisite.
4. Every skill is reachable from at least one root.

**A prerequisite's cognitive level may exceed its dependent's, and this is not an error.**
An earlier draft of this document required prerequisite `K` ≤ dependent `K`. Validation found
three genuine counterexamples — `LIFE.WHOLE`, `MGMT.MON` and `TECH.MOBUX` each legitimately
depend on a `K3` skill while themselves being assessed at `K2`. The rule conflated *dependency*
with *cognitive escalation*, which are different things: describing what a tester contributes
across an iteration (`K2`) genuinely requires first being able to apply Agile analysis (`K3`).
The invariant was removed rather than the map distorted to satisfy it — inflating a skill's
`K` to pass a lint rule would have silently changed which question types
[06](06-question-model.md) §6 permits for it. The real hazard the rule aimed at — a foundation
skill depending on an advanced one — is already caught by invariant 2. Recorded as D-011 in
[16-decisions-log](16-decisions-log.md).

---

## 7. The map

Legend — **K** cognitive level · **T** tier (`F` foundation, `A` applied, `V` advanced) ·
**Src** source coverage from [14](14-content-sources.md) (`str` strong, `adq` adequate,
`prt` partial, `—` none).

---

### Domain `FUND` — יסודות הבדיקות · Fundamentals of testing

#### Topic `FUND/purpose` — למה בודקים

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `FUND.WHAT` מטרות הבדיקה | K2/F | str | — | States what a described testing activity is intended to achieve in a specific project situation, and distinguishes objectives testing can meet from ones it cannot. |
| `FUND.QA` QA מול QC מול בדיקות | K2/F | str | `FUND.WHAT` | Classifies a described activity as quality assurance, quality control or testing, and states the practical consequence of confusing them. |

#### Topic `FUND/principles` — עקרונות ותורת הפגם

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `FUND.PRIN` עקרונות הבדיקה | K2/F | str | `FUND.WHAT` | Identifies which testing principle a described project decision violates, and predicts the consequence of continuing. |
| `FUND.ERR` טעות, פגם, כשל | K2/F | str | `FUND.WHAT` | Traces a reported failure back to the defect and the human error that produced it, using the correct term for each link. |

#### Topic `FUND/process` — תהליך הבדיקה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `FUND.PROC` פעילויות התהליך | K2/F | str | `FUND.WHAT` | Places a described activity in the correct test process stage and names the work product it should produce. |

#### Topic `FUND/people` — תקשורת מקצועית

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `FUND.PSY` פסיכולוגיה של בדיקות | K2/F | str | `FUND.WHAT` | Identifies what caused a breakdown in a tester–developer exchange, and names a communication choice that preserves both the finding and the relationship. |

---

### Domain `LIFE` — בדיקות לאורך מחזור הפיתוח · Testing through the lifecycle

#### Topic `LIFE/models` — מודלי פיתוח

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `LIFE.MODEL` מודלי פיתוח | K2/F | str | `FUND.PROC` | States, for a given development model, which test activities happen when, and what changes if the model changes. |
| `LIFE.SHIFT` בדיקות מוקדמות | K2/A | str | `LIFE.MODEL`, `STAT.REV` | Identifies the earliest point at which a described defect could have been detected, and names the activity that would have caught it. |

#### Topic `LIFE/levels-types` — רמות וסוגי בדיקות

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `LIFE.LEVEL` רמות בדיקה | K2/F | str | `FUND.PROC` | Assigns a described defect to the test level that should have caught it, and justifies why an adjacent level would not. |
| `LIFE.TYPE` סוגי בדיקות | K2/F | str | `LIFE.LEVEL` | Classifies a stated quality concern as functional, non-functional or change-related, and names the test type that addresses it. |
| `LIFE.REG` רגרסיה ואימות תיקון | K2/F | str | `LIFE.TYPE` | Decides, for a described change, what needs confirmation testing versus regression testing, and scopes the regression set with a stated reason. |

#### Topic `LIFE/agile` — בדיקות ב־Agile

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `LIFE.AGILE` סיפורי משתמש וקריטריוני קבלה | K3/A | adq | `LIFE.MODEL`, `LIFE.LEVEL` | Converts a user story into testable acceptance criteria, and identifies criteria that cannot be verified as written. |
| `LIFE.WHOLE` גישת whole-team | K2/A | adq | `LIFE.AGILE` | Describes what the tester contributes at each point of an iteration, and identifies work that should not fall to the tester alone. |

#### Topic `LIFE/acceptance` — קבלה וחשיבה עסקית

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `LIFE.UAT` בדיקות קבלה | K3/A | adq | `LIFE.LEVEL`, `MGMT.RISK` | Derives acceptance tests from a stated business goal rather than from the implementation, and distinguishes alpha, beta and formal acceptance. |

#### Topic `LIFE/delivery` — צנרת אספקה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `LIFE.CICD` אוריינות CI/CD | K2/A | — | `LIFE.MODEL`, `LIFE.REG` | Determines, from a failed pipeline result, whether the failure indicates a product defect, a test defect or an environment problem. |

#### Topic `LIFE/compliance` — הקשר רגולטורי

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `LIFE.COMP` אילוצי רגולציה | K3/V | — | `LIFE.UAT`, `MGMT.RISK` | Identifies which regulatory constraints apply to a described Israeli product, and states what each obliges testing to demonstrate. |

---

### Domain `STAT` — בדיקות סטטיות · Static testing

#### Topic `STAT/fundamentals` — יסודות וסקירות

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `STAT.BASIC` ערך הבדיקה הסטטית | K2/F | str | `FUND.PROC` | Names what a static technique could find in a given work product that dynamic testing could not, and at what cost. |
| `STAT.REV` סוגי סקירות | K2/F | str | `STAT.BASIC` | Selects an appropriate review type for a given work product and project stage, and states the roles the review requires. |

#### Topic `STAT/requirements` — סקירת דרישות

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `STAT.CRIT` איתור אי־בהירות | K3/A | adq | `STAT.REV`, `DOC.REQ` | Marks the ambiguous, untestable and contradictory statements in a requirements excerpt, and rewrites each into a testable form. |

---

### Domain `TD` — ניתוח ותכנון בדיקות · Test analysis and design

#### Topic `TD/framing` — בחירת גישה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TD.CAT` קטגוריות טכניקות | K2/F | str | `FUND.PROC` | Classifies a technique as specification-based, structure-based or experience-based, and states what each category can and cannot reveal. |

#### Topic `TD/black-box` — טכניקות מבוססות מפרט

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TD.EP` מחלקות שקילות | K3/F | str | `TD.CAT` | Partitions the input domain of a given specification into valid and invalid classes with no gaps or overlaps, and selects one representative per class. |
| `TD.BVA` ערכי גבול | K3/F | str | `TD.EP` | Produces the complete boundary set for a bounded input — including the invalid side of each bound — and states which requirement each value exercises. |
| `TD.DT` טבלאות החלטה | K3/F | str | `TD.CAT` | Builds a decision table from stated business rules, collapses infeasible and redundant combinations, and derives one test per remaining rule. |
| `TD.ST` מעברי מצבים | K3/F | str | `TD.CAT` | Derives the state model implied by a specification and produces paths covering valid transitions plus at least one invalid transition. |

#### Topic `TD/experience-based` — טכניקות מבוססות ניסיון

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TD.EXP` ניחוש שגיאות | K2/F | str | `TD.CAT` | Generates plausible failure hypotheses for a feature and states the experience or defect history each is grounded in. |
| `TD.CHK` בדיקה מבוססת רשימות | K3/A | str | `TD.EXP` | Applies a checklist to a feature, identifying both the entries that do not apply and the risks the checklist misses. |
| `TD.EXPL` בדיקות חוקרות | K3/A | str | `TD.EXP`, `DOC.CHART` | Runs a time-boxed exploratory session against a charter and reports coverage achieved, findings, and what was deliberately left unexplored. |

#### Topic `TD/adequacy` — כיסוי ובחירה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TD.COV` כיסוי ואורקלים | K4/A | adq | `TD.EP`, `TD.BVA` | Argues what a given test set does and does not cover, and names the oracle used to decide each result. |
| `TD.SEL` בחירת טכניקה | K4/V | adq | `TD.COV`, `TD.DT`, `TD.ST`, `MGMT.RISK` | Chooses a technique for a described situation, justifies it against at least one rejected alternative, and states the conditions under which the choice would change. |
| `TD.COMBO` שילוב טכניקות | K4/V | adq | `TD.SEL` | Combines techniques so their coverage complements rather than repeats, and identifies which tests the combination makes redundant. |

---

### Domain `MGMT` — ניהול בדיקות · Test management

#### Topic `MGMT/risk` — סיכון

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `MGMT.RISK` ניתוח סיכונים | K3/A | adq | `FUND.PROC`, `LIFE.TYPE` | Rates a product risk on likelihood and impact with stated reasoning, and distinguishes product risk from project risk. |
| `MGMT.RBT` בדיקות מבוססות סיכון | K4/V | adq | `MGMT.RISK`, `TD.SEL` | Orders a test effort by risk under a stated constraint, and states explicitly what will not be tested and what that leaves exposed. |

#### Topic `MGMT/planning` — תכנון ואומדן

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `MGMT.PLAN` תכנון וקריטריונים | K3/A | adq | `FUND.PROC`, `MGMT.RISK` | Writes entry and exit criteria that can be objectively evaluated, and identifies criteria that cannot be met as written. |
| `MGMT.EST` אומדן מאמץ | K3/A | prt | `MGMT.PLAN` | Produces a test effort estimate with its assumptions stated, and identifies which assumption most affects the result. |

#### Topic `MGMT/control` — ניטור ומדידה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `MGMT.MON` ניטור ובקרה | K2/A | adq | `MGMT.PLAN` | Interprets a set of test progress data, stating both what it shows about progress and what it does not. |
| `MGMT.METRIC` מדדים | K4/V | prt | `MGMT.MON` | Identifies how a proposed metric can be satisfied without improving quality, and proposes a metric less easy to game. |

#### Topic `MGMT/strategy` — אסטרטגיה ובשלות

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `MGMT.STRAT` אסטרטגיית בדיקות | K4/V | prt | `MGMT.PLAN`, `MGMT.RBT` | Proposes a test strategy for a described context and justifies it against that organisation's constraints and maturity. |
| `MGMT.DEFPREV` מניעת פגמים | K4/V | prt | `MGMT.METRIC`, `DOC.BUG` | Analyses a set of defects for a common cause and proposes a process change that prevents the class, not the instance. |

#### Topic `MGMT/infrastructure` — סביבות ונתונים

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `MGMT.CONF` ניהול תצורה | K2/A | prt | `FUND.PROC` | Determines which build and configuration a defect was observed on, and what must be recorded for it to be reproducible. |
| `MGMT.ENV` סביבות בדיקה | K3/A | — | `MGMT.CONF`, `TECH.WEB` | Identifies which differences between two environments could explain a defect reproducing in one and not the other, and states how to confirm each. |
| `MGMT.DATA` ניהול נתוני בדיקה | K3/A | — | `DOC.REQ`, `TECH.SQL` | Specifies the test data a scenario requires — creation, isolation and reset — and identifies personal data requiring protection. |

#### Topic `MGMT/tooling` — כלים ואוטומציה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `MGMT.TOOL` כלי ניהול בדיקות ופגמים | K3/A | — | `DOC.BUG`, `DOC.RTM` | Moves a defect through a tool's workflow with correct state, fields and traceability links, and identifies what information the workflow loses. |
| `MGMT.AUTO` אוריינות אוטומציה | K4/V | prt | `TD.SEL`, `MGMT.EST` | Decides which tests in a given set justify automation, and states the maintenance cost accepted for each. |

---

### Domain `DOC` — תוצרי בדיקה ודיווח · Test artifacts and reporting

#### Topic `DOC/requirements` — עבודה מול דרישות

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `DOC.REQ` ניתוח דרישה לבדיקה | K3/F | adq | `FUND.PROC` | Extracts from a requirement what can be verified, and lists the questions that must be answered before it can be tested at all. |

#### Topic `DOC/design-artifacts` — תוצרי תכנון

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `DOC.TC` כתיבת מקרה בדיקה | K3/F | str | `DOC.REQ`, `TD.EP` | Writes a test case another tester can execute identically without asking a question — preconditions, data, steps, expected result. |
| `DOC.TS` תרחישי בדיקה | K3/A | adq | `DOC.TC` | Sequences test cases into a scenario whose order and shared state are deliberate, and states the dependencies between them. |
| `DOC.RTM` מטריצת עקיבות | K3/A | str | `DOC.TC`, `DOC.REQ` | Builds traceability between requirements and tests, and identifies both requirements with no coverage and tests with no requirement. |

#### Topic `DOC/defects` — דיווח פגמים

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `DOC.BUG` כתיבת דוח פגם | K3/F | str | `FUND.ERR`, `DOC.REQ` | Writes a defect report a developer can reproduce without a follow-up question — steps, actual versus expected, environment, evidence. |
| `DOC.ADV` הצדקת חומרה ועדיפות | K4/A | str | `DOC.BUG`, `MGMT.RISK` | Justifies a severity and priority from user and business impact, and defends the assessment when it is disputed. |

#### Topic `DOC/exploration` — תיעוד חקירה

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `DOC.CHART` כתיבת charter | K3/A | adq | `DOC.REQ` | Writes an exploratory charter that scopes a session — target, resources, information sought — narrowly enough to be actionable. |

#### Topic `DOC/reporting` — דיווח לבעלי עניין

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `DOC.SUM` דוח סיכום והמלצת שחרור | K4/V | prt | `MGMT.MON`, `DOC.RTM` | Writes a test summary that supports a release decision, stating residual risk in terms a non-tester can act on. |
| `DOC.STAKE` תקשורת מול בעלי עניין | K4/V | — | `DOC.SUM`, `MGMT.METRIC` | Presents quality status to a non-testing audience and states a recommendation that survives challenge without overstating certainty. |

---

### Domain `TECH` — הקשר טכני · Technical context

#### Topic `TECH/web` — רשת ואבחון

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TECH.WEB` מודל בקשה־תגובה | K2/F | prt | — | Traces what happens between a user action and a rendered result, and states where a described symptom could originate. |
| `TECH.DEV` כלי מפתחים בדפדפן | K3/A | prt | `TECH.WEB` | Uses browser developer tools to capture the evidence that distinguishes a client-side cause from a server-side one. |
| `TECH.LOG` קריאת לוגים | K3/A | — | `TECH.DEV` | Locates the entries relevant to a failure in a log excerpt, and states what they establish and what remains unknown. |

#### Topic `TECH/api` — ממשקי API

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TECH.API` יסודות API | K2/A | adq | `TECH.WEB` | Interprets a request and response, stating what the method, status code, headers and authentication indicate about the outcome. |
| `TECH.APIV` אימות תגובת API | K3/A | adq | `TECH.API`, `DOC.REQ` | Validates an API response against a stated requirement, identifying discrepancies in values, structure and status. |

#### Topic `TECH/data` — נתונים

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TECH.SQL` שאילתות לאיתור נתונים | K3/F | adq | — | Writes a query returning the data needed to answer a stated question, using filtering, grouping and joins across related tables. |
| `TECH.SQLV` אימות עקביות נתונים | K3/A | prt | `TECH.SQL`, `DOC.REQ` | Confirms or refutes consistency between what an interface displays and what the database holds, and states which of the two is wrong. |

#### Topic `TECH/mobile` — מובייל וכיסוי מכשירים

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TECH.MOB` בדיקות מובייל ידניות | K3/A | adq | `LIFE.TYPE` | Tests a mobile feature against interruption, permission, connectivity and lifecycle conditions, and reports device-specific behaviour. |
| `TECH.MOBUX` התקנה, שדרוג והבדלי מכשירים | K2/A | adq | `TECH.MOB` | Identifies which install, upgrade and device-difference conditions affect a described feature. |
| `TECH.MATRIX` מטריצת כיסוי | K4/V | — | `TECH.MOBUX`, `MGMT.RBT` | Defines a browser and device coverage matrix under a stated budget, and justifies each exclusion by the risk accepted. |

#### Topic `TECH/quality-attributes` — מאפייני איכות

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TECH.A11Y` בדיקות נגישות | K3/A | — | `DOC.REQ`, `TECH.WEB` | Evaluates an interface against stated accessibility criteria using keyboard and screen reader, and reports each failure with the criterion cited. |
| `TECH.I18N` בדיקות לוקליזציה ו־RTL | K3/A | — | `TECH.WEB`, `DOC.REQ` | Identifies where a bilingual Hebrew/English interface breaks — direction, alignment, mixed-direction strings, dates, numbers, currency — and reports the rendering fault precisely. |
| `TECH.SEC` יסודות אבטחה לבודק | K3/A | — | `TECH.API`, `TECH.WEB` | Tests whether a user can reach data or actions outside their authorisation, and reports what was accessed and by what path. |
| `TECH.PERF` פרשנות תוצאות ביצועים | K3/V | prt | `TECH.WEB`, `MGMT.RISK` | Interprets a performance result against a stated expectation and identifies the user-facing risk it indicates. |

#### Topic `TECH/ai` — תכונות מבוססות בינה מלאכותית

| Skill | K/T | Src | Prereq | Demonstrated behaviour |
| --- | --- | --- | --- | --- |
| `TECH.AI` בדיקת פלט לא־דטרמיניסטי | K4/V | prt | `TD.COV`, `TECH.APIV` | Defines what "correct" means for a non-deterministic feature output, and designs checks that tolerate variation without accepting wrong answers. |

---

## 8. Tier semantics

Tiers are not difficulty labels. They are claims about what evidence is worth collecting,
taken from the level analysis in both research documents:

- **`foundation`** (23 skills) — vocabulary and mechanical technique. Assessable almost
  entirely with deterministic items. Where a learner with 0–2 years lives.
- **`applied`** (31 skills) — applying a technique in a context that is not pre-labelled, and
  producing a real artifact. Requires rubric-scored authoring items. Both research documents
  identify this as the actual Junior→Mid gap: *not more definitions, but the ability to think
  in context*.
- **`advanced`** (13 skills) — selecting among techniques, justifying, and reasoning about
  strategy and risk. Almost entirely `K4`, almost entirely rubric or hybrid scored.

This mapping is why [06-question-model](06-question-model.md) §6 forbids assessing an
`advanced` skill with `mcq_single` alone.

---

## 9. Source coverage

From [14-content-sources](14-content-sources.md), **23 of 67 skills (34%) lack an adequate
source**:

| Coverage | Count | Meaning for production |
| --- | --- | --- |
| `strong` | 25 | can author from provenance immediately |
| `adequate` | 19 | can author, with gaps to fill |
| `partial` | 12 | source exists but is mis-levelled or aimed at another role |
| `none` | 11 | must be built from scratch, including fixtures |

The eleven skills with **no source at all**: `LIFE.CICD`, `LIFE.COMP`, `MGMT.ENV`,
`MGMT.DATA`, `MGMT.TOOL`, `DOC.STAKE`, `TECH.LOG`, `TECH.MATRIX`, `TECH.A11Y`, `TECH.I18N`,
`TECH.SEC`.

Two observations that should drive sequencing:

1. **They cluster in `applied` and `advanced`** — exactly the tiers the research says
   distinguish a five-year professional. The material is abundant where the market cares least.
2. **`TECH.A11Y` and `TECH.I18N` are the most exposed.** They are simultaneously the clearest
   Israeli-market requirement and entirely absent from every source examined. `TECH.I18N` is
   also a subject this product must get right in its own Hebrew RTL interface regardless.

Skills with `sourceCoverage: none` are **fully valid and fully scheduled**. The flag constrains
content production, never the learner's path.

---

## 10. Validation rules

The skill map ships as data (`content/skills/*.json`, see
[05-content-model](05-content-model.md) §3) and is validated in CI. Build fails on:

| Rule | Check |
| --- | --- |
| `SM-01` | every `id` matches the pattern and is unique |
| `SM-02` | prerequisite graph is acyclic |
| `SM-03` | every prerequisite ID resolves to an active skill |
| `SM-04` | prerequisite `tier` ≤ dependent `tier` |
| `SM-05` | *withdrawn* — see §6. The ID is retired, not reused. |
| `SM-06` | every non-`foundation` skill has ≥ 1 prerequisite |
| `SM-07` | every skill is reachable from a root |
| `SM-08` | every active skill has ≥ 1 approved content item and ≥ 3 approved questions |
| `SM-09` | `examWeight` values, where non-null, sum to 100 per blueprint |
| `SM-10` | every skill with `cognitiveLevel` ≥ K3 has ≥ 1 non-MCQ question |
| `SM-11` | every skill belongs to exactly one topic, and every topic to one domain |
| `SM-12` | every skill has a non-empty `behaviour` |
| `SM-13` | `behaviour` passes the observability lint — see below |
| `SM-14` | every skill declares `sourceCoverage` |

`SM-13` is the mechanical enforcement of §1 and of the product rule that progress must
represent demonstrated ability. Prose drifts back toward "understands X" under authoring
pressure, and this catches it at commit time. It rejects two distinct things:

- **Non-observable verbs** in the leading position: `understand`, `know`, `learn`,
  `be aware`, `be familiar`, `appreciate`, `grasp`, `study`.
- **Consumption phrases** anywhere: `reads a lesson`, `reads the chapter`, `completes a
  module`, `views`, `watches`, `finishes the section`.

The rule deliberately does **not** ban the verb *read* outright. Reading a log excerpt, a
pipeline result or an HTTP response and drawing a conclusion from it is an evidence-producing
act; reading a lesson is not. An earlier draft banned the verb and produced three false
positives (`LIFE.CICD`, `MGMT.MON`, `TECH.API`), all of which described real assessable work.
Those behaviours now lead with the judgement verb — `determines`, `interprets` — which is
better writing regardless, and the rule targets the object of consumption rather than the verb.

`SM-08` and `SM-10` will fail during early authoring by design. A skill a learner can reach
but cannot practise is worse than one that does not exist yet, because
[09-progress-model](09-progress-model.md) would report a gap it cannot help them close.

---

## 11. Open questions

- **Q-03-1** — `examWeight` is unset pending resolution of conflict C-1 in
  [14](14-content-sources.md): the Hebrew syllabus is v4.0 while the English sample exams are
  v4.0.1. No exam-readiness claim may be shown until the delta is known.
- **Q-03-2** — white-box techniques (statement/branch coverage) are omitted. They appear in the
  certification but not in manual QA work. If we later claim full certification coverage,
  a `TD/structure-based` topic must be added.
- **Q-03-3** — `TECH.SQL` is now `foundation` with no prerequisites, so it can be scheduled as
  an independent track from day one. This resolves the earlier invariant violation where it was
  `applied` with no prerequisite, contradicting `SM-06`.
- **Q-03-4** — `LIFE.COMP` and `TECH.SEC` may need splitting once real content exists; both
  currently compress a broad subject into one behaviour.
- **Q-03-5** — should `sourceCoverage` be a derived field computed from the content that
  actually cites each source, rather than a hand-maintained one? Derived is more honest but
  cannot be populated before content exists.
