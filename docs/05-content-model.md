# 05 — Content Model

Status: `draft` · Owner: content + engineering · Depends on: [03](03-skill-map.md), [14](14-content-sources.md)

The canonical model for every authored entity in the product: domains, topics, lessons,
guided examples, exercises, exams, sources and review status.

Product rules enforced here: **learning content must never be hardcoded inside UI
components**, **every content item must include source and review status**, and **every
content item must have a unique stable ID**.

---

## 1. Ownership split with 06

There is **one** content model. It is split across two documents by concern, not by entity:

| This document (05) owns | [06-question-model](06-question-model.md) owns |
| --- | --- |
| the entity graph and its cardinalities | question types and answer shapes |
| identifiers and their stability rules | rubrics, answer keys, scoring |
| the common envelope every item carries | expected answer components, common mistakes, model answers |
| sources, licensing, attribution | the feedback object |
| review status and the authoring lifecycle | attempt records and exam assembly |
| block content and the UI boundary | validation of anything that produces a score |

**06 extends the envelope defined in §5 below; it never redefines an envelope field.** Where
06 describes `Exercise`, it describes the fields *added* to the envelope. If the two documents
ever disagree about an envelope field, this document is correct.

---

## 2. Content and UI independence

```
content/                data — authored, reviewed, versioned, validated in CI
  domains/              7 domain files
  topics/               33 topic files
  skills/               67 skill files (the map from docs/03)
  summaries/            one per topic
  lessons/
  examples/             guided examples
  exercises/
  exams/                blueprints and exam item pools
  rubrics/              shared, reusable
  sources/              the source registry from docs/14
  glossary/

src/                    code — renders content, never contains content
  content/              loader, schema, validation
  components/           presentation only
  i18n/                 UI chrome strings (buttons, errors, empty states)
```

The boundary is a contract, not an aspiration. Three rules define it:

1. **No learning content in code.** No instructional prose, no question text, no answer, no
   rubric criterion, no example may appear in `src/**`.
2. **No content-specific branching in code.** A component may not test for a specific item,
   topic or skill ID. `if (topicId === 'TD/black-box')` is a content model failure expressed as
   a conditional: whatever it is doing belongs in a field on the topic.
3. **The renderer is a pure function of content.** Given the same content item, a component
   produces the same output. It may not fetch, infer or complete missing content.

The distinguishing question when something is ambiguous: *would a content author ever want to
change this without a developer?* If yes, it is content.

Enforced by `CM-20` and `CM-21` in §17, and by `AT-05-01` in
[13-acceptance-tests](13-acceptance-tests.md).

---

## 3. The entity model

```
Domain  (7)
  │
  └── Topic  (33)                        1 domain : many topics
        ├── TopicSummary        1 : 1    required, ≤ 2 page-equivalents
        ├── Lesson              1 : 1..n required
        │     └── GuidedExample 1 : 2..n required, minimum two
        ├── Exercise            1 : 0..n practice pool
        └── ExamBlueprint       1 : 0..1 the topic exam

Skill   (67)   belongs to exactly one Topic (docs/03 SM-11)
        ├── taught by    Lesson, GuidedExample
        └── measured by  Exercise, ExamItem      ≥ 1 skill per question

Rubric         referenced by every scored item; reusable across items
Source         referenced by every content item; carries licensing
ExamBlueprint  selects from an ExamItem pool, never from Exercises
```

### Cardinalities and referential rules

| Relationship | Cardinality | Rule |
| --- | --- | --- |
| Domain → Topic | 1 : 1..n | a topic names exactly one domain; the domain prefix of the topic ID must agree |
| Topic → Skill | 1 : 1..n | from the skill map; a skill belongs to exactly one topic |
| Topic → TopicSummary | 1 : 1 | required; a topic without a summary is invalid |
| Topic → Lesson | 1 : 1..n | required; every lesson names exactly one topic |
| Lesson → GuidedExample | 1 : 2..n | **minimum two**; examples are owned by the lesson |
| Topic → Exercise | 1 : 0..n | an exercise's primary skill must belong to the topic |
| Topic → ExamBlueprint | 1 : 0..1 | the topic exam |
| Item → Skill | n : 1..3 | every question measures ≥ 1 skill; ≤ 3 total |
| Item → Source | n : 1..n | every content item cites ≥ 1 source |
| ScoredItem → Rubric | n : 1 | every scored item resolves exactly one rubric |

`Topic.guidedExamples` is a **derived** field — the union of its lessons' examples. It is not
authored, and authoring it is an error (`CM-16`). The requirement stated for lessons and the
aggregate view stated for topics are the same set, computed once.

**`Lesson` is not in the topic tree supplied by the product owner**, which lists guided
examples directly under the topic. It is introduced here because the entity list requires
lessons and because the two-guided-examples rule attaches to a lesson, not to a topic. Without
the lesson layer, "two guided examples" is unenforceable — a topic with six examples and four
lessons would pass a naive check while two lessons had none.

---

## 4. Identifiers

**Every content item has a unique, stable ID.** Stable means: assigned once, never reused,
never renumbered, never recycled after retirement.

| Entity | Pattern | Example |
| --- | --- | --- |
| Domain | `^[A-Z]{2,4}$` | `TD` |
| Topic | `^[A-Z]{2,4}/[a-z-]{2,24}$` | `TD/black-box` |
| Skill | `^[A-Z]{2,4}\.[A-Z0-9]{2,8}$` | `TD.BVA` |
| Content item | `^[A-Z]{2,4}-[a-z-]{2,24}\.[A-Z]{2,3}\.\d{3}$` | `TD-black-box.EX.007` |
| Glossary term | `^GLO\.[A-Z0-9_]{2,16}$` | `GLO.BVA` |
| Rubric | `^RUB\.[A-Z0-9_]{3,24}$` | `RUB.DEFECT_REPORT` |
| Source | `^SRC-[A-Z0-9-]{3,32}$` | `SRC-ITCB-CTFL-HE` |
| Misconception | `^MIS\.[A-Z0-9_.]{3,32}$` | `MIS.BVA.VALID_ONLY` |
| Asset | `^AST-[A-Z0-9-]{3,24}$` | `AST-DEVTOOLS-01` |

Content type codes: `SUM` summary · `LE` lesson · `GE` guided example · `EX` exercise ·
`XM` exam item · `BP` exam blueprint · `CL` checklist.

### Why content IDs are topic-scoped

Content IDs embed the **topic**, with `/` replaced by `-` so an ID is always a legal filename.

An earlier draft of this document embedded the *primary skill* instead
(`TD.BVA.EX.003`). That is revised here for two reasons. First, an ID containing `/` cannot be
a filename, and an ID that diverges from its filename invites the two drifting apart. Second,
and more importantly, the skill map is expected to keep refining — [03](03-skill-map.md) §11
already anticipates splitting `LIFE.COMP` and `TECH.SEC` — while topics are stable. Under the
old scheme, every skill split would have forced a mass retirement and reissue of item IDs, and
each reissue breaks the link from historical attempt records to the item that produced them.

Skill attribution now lives in the `skills` field, where it can be corrected without touching
the identity of the item. Re-pointing an item to a different skill **within the same topic** is
an ordinary content edit. Moving an item to a different **topic** still requires a new ID,
because that is a genuine change of what the item is.

---

## 5. The common envelope

Every content item carries this envelope. `R` = required, `O` = optional.

| Field | R/O | Type | Notes |
| --- | --- | --- | --- |
| `id` | R | string | §4; unique across all content |
| `type` | R | enum | `summary` `lesson` `guided_example` `exercise` `exam_item` `checklist` `glossary_term` |
| `schemaVersion` | R | int | current `1`; bumped only on breaking schema change |
| `topic` | R¹ | topic ID | must resolve; ID prefix must agree |
| `skills` | R¹ | object | `{ primary: skillID, secondary: skillID[0..2] }` |
| `cognitiveLevel` | R² | enum | `K1`–`K4`; ≤ primary skill's level |
| `title` | R | string | display title, Hebrew |
| `body` | R | block[] | §15; never markdown, never HTML |
| `source` | R | object[] | §6; at least one entry |
| `review` | R | object | §7 |
| `lang` | R | enum | `he` (v1) |
| `dir` | R | enum | `rtl` |
| `difficulty` | R² | int 1–5 | §16 |
| `experienceBand` | O | enum | `junior` `mid` `senior`; derived if absent, §16 |
| `estimatedSeconds` | R | int | used by the learning path for session planning |
| `pool` | R³ | enum | `practice` `exam`; §14 |
| `tags` | O | string[] | free vocabulary, for authoring search only — never for logic |
| `revisionRefs` | O | item ID[] | revision material this item points back to |
| `assets` | O | asset ID[] | referenced figures |
| `createdAt` / `updatedAt` | R | ISO date | |
| `version` | R | int | incremented on any content-affecting edit; §7 |
| `status` | R | enum | `active` `retired` |

**Conditional requirements.** Three fields are not meaningful for every item type, and marking
them unconditionally required would force authors to invent values:

- **¹ `topic` and `skills`** — required for all *topic-scoped* types. `glossary_term` is
  **global**: a term belongs to the product, not to one topic, and its ID is `GLO.*` rather
  than topic-prefixed (§4). Global items omit both fields.
- **² `cognitiveLevel` and `difficulty`** — required for `exercise`, `exam_item` and `lesson`.
  A summary, checklist or glossary term is not assessed and has no cognitive level; a fabricated
  one would flow into `CM-04` comparisons and into learner-facing filtering as noise.
- **³ `pool`** — required for scored types only (`exercise`, `exam_item`). Lessons and summaries
  are not drawn by a blueprint and are not in a pool.

`skills` satisfies **every question must measure at least one skill**: for every scored type
`primary` is required and always resolves, so the measured set is never empty. `tags` is
explicitly excluded from logic — the moment a tag drives behaviour it becomes an untyped field
with no validation, and the boundary in §2 leaks.

---

## 6. Sources, licensing and attribution

Every content item cites at least one source. **Every imported source carries full licensing
and attribution metadata.**

### 6.1 The source registry entity

One file per source in `content/sources/`, keyed by the IDs in
[14-content-sources](14-content-sources.md) §2.

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | `SRC-*` |
| `title` | R | as published |
| `publisher` | R | organisation or author |
| `year` | O | `null` where the source is undated — never guessed (see 14 §10, C-7) |
| `url` | O | canonical location |
| `language` | R | `he` `en` `mixed` |
| `format` | R | `pdf` `web` `repo` `book` `service` `dataset` |
| `imported` | R | `true` if external material; `false` for internally produced sources |
| `licence` | R when `imported` | §6.2 |
| `attribution` | R when `imported` | §6.3 |
| `accessVerifiedAt` | O | when the link was last confirmed |
| `notes` | O | |

### 6.2 The `licence` block

| Field | R/O | Values |
| --- | --- | --- |
| `status` | R | `open` · `permitted-attribution` · `proprietary` · `unclear` |
| `name` | O | e.g. `CC BY 4.0`, `MIT`, `CC0-1.0` |
| `url` | O | licence text |
| `commercialUse` | R | `true` `false` `unknown` |
| `derivativesAllowed` | R | `true` `false` `unknown` |
| `attributionRequired` | R | boolean |
| `verifiedAt` | R | when a human last checked |
| `verifiedBy` | R | who |

`status: unclear` is **not** a synonym for permissive — it means no rights are established, and
it behaves exactly like `proprietary` at validation time. This mirrors
[14](14-content-sources.md) §1, where the great majority of the inventory sits.

### 6.3 The `attribution` block

Required whenever `licence.attributionRequired` is true.

| Field | R/O | Notes |
| --- | --- | --- |
| `text` | R | the exact credit line to render |
| `url` | O | link accompanying the credit |
| `placement` | R | `item` (with the content) or `page` (footer of any page showing it) |

Attribution text is **rendered from this field, never retyped into a component** — that is a
direct consequence of §2 and it is also how the credit stays correct if the licence changes.
Two sources make this live rather than theoretical: `SRC-BBST-FOUND` (CC Attribution) and
`SRC-GH-QAPORTFOLIO` (MIT) are the only sources in the whole inventory we may adapt closely,
and both require credit.

### 6.4 The per-item citation

Each entry in an item's `source` array:

| Field | R/O | Notes |
| --- | --- | --- |
| `sourceId` | R | resolves in the registry |
| `locator` | O | section, page, file path |
| `derivation` | R | `original` · `adapted` · `quoted` |
| `licenceCleared` | R when `quoted` | must be `true`, with `clearedBy` and `clearedAt` |
| `note` | O | |

- `original` — we wrote it; the source is intellectual provenance only.
- `adapted` — structure or scenario derived from the source, expressed in our own words.
- `quoted` — contains verbatim source text.

`CM-07` fails the build on any `quoted` item whose source is not `open` or explicitly cleared.
This is a legal control, not a style preference: [14](14-content-sources.md) §8.3 concludes
that content must be **original by default**, because nearly every source is non-commercial or
unlicensed. The default value of `derivation` is therefore `original`, and anything else is a
deliberate, reviewed act.

---

## 7. Review status

```
draft ──▶ in_review ──▶ approved ──▶ needs_update ──▶ in_review ──▶ approved
   │                        │
   └──────────▶ retired ◀───┘
```

| Field | R/O | Notes |
| --- | --- | --- |
| `status` | R | `draft` `in_review` `approved` `needs_update` `retired` |
| `reviewedBy` | R when `approved` | must differ from the author |
| `reviewedAt` | R when `approved` | ISO date |
| `reviewNote` | O | |
| `technicalReviewer` | O | subject-matter reviewer, where different from the editorial one |

Rules:

- **Only `approved` items are served in production.** Filtering happens in the content loader,
  not in components. This is how the product rule *"do not use mock data in completed
  production flows"* is satisfied structurally: there is no mock content, only unapproved
  content, and unapproved content cannot reach a learner.
- Approval requires a named reviewer who is not the author.
- Any edit to an `approved` item's `body`, rubric or answer key increments `version` and forces
  `status` back to `needs_update`. A pre-commit hook performs this; `CM-14` verifies it.
- `retired` items remain in the repository permanently, because attempt records reference them.

The topic-level field the product owner calls *סטטוס בדיקה מקצועית* (professional review
status) is `review.status` on the topic, and it is **derived-constrained**: a topic may not be
`approved` while any item it owns is not (`CM-17`). Approving a topic is a statement about the
whole topic, and it should not be possible to make it falsely.

---

## 8. Domain

The coarsest grouping. Organisational only — nothing in the product reasons about domains.

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | `FUND` `LIFE` `STAT` `TD` `MGMT` `DOC` `TECH` |
| `nameHe` / `nameEn` | R | |
| `description` | R | one paragraph |
| `order` | R | display order |
| `status` | R | `active` `retired` |

Domains carry no `source` or `review` block: they are structural, not instructional.

---

## 9. Topic

The unit a learner recognises as "a thing I'm learning". Fields follow the structure supplied
by the product owner, mapped to schema names.

| Hebrew field | Schema field | R/O | Type | Notes |
| --- | --- | --- | --- | --- |
| מזהה | `id` | R | topic ID | `TD/black-box` |
| שם | `nameHe`, `nameEn` | R | string | |
| תחום | `domain` | R | domain ID | must match the ID prefix |
| תיאור | `description` | R | block[] | 1–2 paragraphs |
| מטרות למידה | `learningObjectives` | R | string[1..6] | each maps to ≥ 1 measured skill |
| דרישות מקדימות | `prerequisites` | R | topic ID[] | derived-checked against skill prerequisites |
| רמת קושי | `difficulty` | R | int 1–5 | |
| זמן לימוד משוער | `estimatedMinutes` | R | int | sum of owned items, author-overridable |
| מיומנויות נמדדות | `measuredSkills` | R | skill ID[1..n] | must equal the topic's skills in [03](03-skill-map.md) |
| דף סיכום | `summaryRef` | R | item ID | exactly one, §10 |
| דוגמאות מודרכות | `guidedExamples` | — | item ID[] | **derived** — union over lessons, never authored |
| תרגילים | `exerciseRefs` | O | item ID[] | may be empty while a topic is being built |
| מבחן נושא | `topicExamRef` | O | blueprint ID | §13 |
| סטטוס בדיקה מקצועית | `review` | R | object | §7 |
| — | `lessonRefs` | R | item ID[1..n] | added; see §3 |

`learningObjectives` are prose statements aimed at the learner. They are **not** skills and
carry no measurement role — the measurable statements are the demonstrated behaviours in
[03](03-skill-map.md) §7. `CM-18` requires every objective to be traceable to at least one
entry in `measuredSkills`, so an objective cannot promise something the topic never assesses.

`prerequisites` at topic level must be consistent with the skill-level prerequisite graph: if
any skill in topic *B* depends on a skill in topic *A*, then *A* must appear in *B*'s
prerequisites (`CM-19`). Topic prerequisites are a presentational convenience derived from a
real graph, and letting them drift from it would make the learner-facing ordering a fiction.

---

## 10. Topic summary

Exactly one per topic. **Maximum two page-equivalents.**

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | `<TOPIC>.SUM.001` |
| `type` | R | `summary` |
| `body` | R | block[] |
| `keyPoints` | R | string[3..7] — the takeaways |
| `termRefs` | O | glossary IDs introduced by the topic |
| envelope | R | §5 |

### Defining "two pages" measurably

A page is not a digital unit, so the constraint is expressed in **page-equivalents** computed
from the content itself:

| Content | Cost |
| --- | --- |
| body text | 1 unit per character |
| table | 80 units per row, plus 80 for the header |
| figure | 400 units |
| code block | its literal character length |
| callout | its text length, plus 40 |

**1 page-equivalent = 2,400 units. The summary budget is 2 page-equivalents = 4,800 units.**
`CM-15` computes this and fails the build when a summary exceeds it.

Characters rather than words, because this product mixes Hebrew and English in the same
sentence and word counts diverge sharply between the two — an English-heavy technical
paragraph and a Hebrew one of identical visual length differ by roughly a third in word count.
Characters are stable across both scripts and produce a budget that means the same thing in
either language.

---

## 11. Lesson

| Field | R/O | Type | Notes |
| --- | --- | --- | --- |
| `id` | R | item ID | `<TOPIC>.LE.001` |
| `type` | R | `lesson` | |
| `title` | R | string | |
| `body` | R | block[] | the teaching content |
| `teachesSkills` | R | skill ID[1..n] | subset of the topic's skills |
| `guidedExamples` | R | item ID[**2**..n] | **minimum two** |
| `prerequisiteLessons` | O | item ID[] | within the topic |
| `checklistRefs` | O | item ID[] | reference aids usable alongside |
| envelope | R | §5 | |

**Every lesson has at least two guided examples** (`CM-22`). The rule is a floor, not a fixed
count: a third example is permitted where a technique has a genuinely distinct third case, and
blocking that would push authors toward cramming two cases into one example. What the rule
prevents is the common failure of one example — a learner shown a single worked case cannot
distinguish the technique from the specifics of that case, which is precisely the confusion
that makes exam performance collapse when the surface details change.

A lesson is **not** a unit of progress. Reading it produces no mastery evidence; only scored
attempts do. See [03](03-skill-map.md) §1 and [09-progress-model](09-progress-model.md).

---

## 12. Guided example

A technique applied end to end, with the reasoning made visible. Owned by exactly one lesson.

| Field | R/O | Type | Notes |
| --- | --- | --- | --- |
| `id` | R | item ID | `<TOPIC>.GE.001` |
| `type` | R | `guided_example` | |
| `lesson` | R | item ID | owning lesson; must list this example |
| `scenario` | R | block[] | the situation, before any technique is applied |
| `steps` | R | object[2..n] | see below |
| `outcome` | R | block[] | the finished artifact or conclusion |
| `commonMistakes` | O | object[] | `{ mistake, whyTempting, misconceptionId? }` |
| envelope | R | §5 | |

Each entry in `steps`:

| Field | R/O | Notes |
| --- | --- | --- |
| `action` | R | what is done |
| `reasoning` | R | **why** — the field that makes the example guided rather than worked |
| `artifact` | O | the intermediate state after this step |

`reasoning` is required on every step. An example that shows only actions is a solution, and a
learner can follow it without acquiring the decision that produced it. The distinction matters
most for the `applied` and `advanced` tiers, where [03](03-skill-map.md) §8 locates the actual
skill gap in choosing and justifying rather than executing.

---

## 13. Exercises, exam items and exams — content side

Full schemas are in [06-question-model](06-question-model.md). This document defines only
their place in the content graph.

**Exercise** (`<TOPIC>.EX.nnn`, pool `practice`) — a scored question producing an artifact or a
derived answer. Carries the envelope plus the assessment fields in [06](06-question-model.md) §6.

**Exam item** (`<TOPIC>.XM.nnn`, pool `exam`) — same shape, drawn only by a blueprint, and
never given feedback until the exam ends.

**Exam blueprint** (`<TOPIC>.BP.nnn`) — authored content, so it lives here:

| Field | R/O | Notes |
| --- | --- | --- |
| `id` | R | blueprint ID |
| `scope` | R | `topic` · `domain` · `full` |
| `scopeRef` | R | topic or domain ID; absent for `full` |
| `skillWeights` | R | `{ skillId: percentage }`, summing to 100 |
| `itemCount` | R | int |
| `durationMinutes` | R | int |
| `passMark` | R | percentage |
| `selectionRules` | R | see 06 §11 |
| `review` | R | §7 |

A topic exam is a blueprint with `scope: topic`. `skillWeights` may only name skills within
scope (`CM-23`).

---

## 14. Pool isolation

An item is in exactly one pool: `practice` or `exam`.

An item may never move from `practice` to `exam`. Once a learner has practised an item with
feedback, it no longer measures readiness — it measures recall of the feedback. The reverse
move (`exam` → `practice`) is permitted **only** after the item is retired from every active
blueprint, and it is a one-way door.

Enforced by `CM-09`. This is why exam pools must be sized independently of practice pools, and
it is the most common way an exam-prep product quietly stops measuring anything.

---

## 15. Block content

`body` is an array of typed blocks — never raw HTML, never a markdown blob:

```jsonc
[
  { "kind": "paragraph", "text": "..." },
  { "kind": "list", "ordered": false, "items": ["...", "..."] },
  { "kind": "term", "he": "ערכי גבול", "en": "boundary values", "definitionRef": "GLO.BVA" },
  { "kind": "table", "headers": [...], "rows": [[...]] },
  { "kind": "callout", "tone": "info|warning|pitfall", "text": "..." },
  { "kind": "code", "lang": "sql", "text": "SELECT ..." },
  { "kind": "figure", "assetId": "AST-DEVTOOLS-01", "altHe": "..." },
  { "kind": "artifactSample", "artifact": "test_case", "value": { /* typed */ } },
  { "kind": "itemRef", "ref": "TD-black-box.GE.001", "label": "..." }
]
```

Typed blocks rather than markdown, for three reasons:

1. **Bidi correctness.** Hebrew prose containing English technical terms and code needs
   per-run direction control. A markdown blob carries one direction for the whole string and
   produces exactly the scrambling this product exists to teach people to find (`TECH.I18N`).
2. **Validation.** Every `term` can be required to resolve, every `figure` to carry Hebrew alt
   text, every `itemRef` to point at an approved item. A blob is unvalidatable.
3. **Reuse.** `artifactSample` renders through the same component as a learner's own
   submission, so a model answer and an attempt are directly comparable in feedback.

---

## 16. Difficulty and experience band

`difficulty` (1–5) is a property of the **item**. It begins as an author estimate and is
replaced by observed data once the item has ≥ 30 scored attempts from learners of known
mastery. Until then it carries `difficultyCalibrated: false`, and
[09-progress-model](09-progress-model.md) down-weights the evidence it produces, so an
author's guess never moves a mastery estimate as far as a measurement does.

Recalibration runs as a batch job and writes back into the content files, where it is reviewed
like any other content change. An item whose difficulty shifts silently in production would
make progress non-reproducible.

`experienceBand` (`junior` · `mid` · `senior`) is **audience targeting**, used for filtering
and recommendation. It is **derived by default** from the primary skill's tier —
`foundation → junior`, `applied → mid`, `advanced → senior` — and may be overridden only with
`experienceBandReason` stated (`CM-24`).

Three scales exist because they answer three different questions, and collapsing them would
lose information: `tier` is a property of the skill (what evidence is worth collecting),
`difficulty` of the item (how hard this particular question is), and `experienceBand` of the
audience (who should see it). A hard question about a foundation skill is entirely ordinary.
Deriving the band by default is what stops the three from drifting apart in practice.

---

## 17. Validation rules

Run in CI on every change to `content/**`. The build fails on any violation.

| Rule | Check |
| --- | --- |
| `CM-01` | item validates against its type's JSON Schema |
| `CM-02` | `id` unique across all content, matches its pattern, type code agrees with `type` |
| `CM-03` | `skills.primary` resolves to an active skill; secondaries resolve, exclude the primary, ≤ 2 |
| `CM-04` | `cognitiveLevel` ≤ primary skill's `cognitiveLevel` |
| `CM-05` | ≥ 1 `source` entry; every `sourceId` resolves in the registry |
| `CM-06` | `review` present and valid; `approved` carries a reviewer who is not the author |
| `CM-07` | `derivation: quoted` ⇒ source is `open` **or** `licenceCleared: true` with clearer and date |
| `CM-08` | every scored item resolves exactly one rubric — see [06](06-question-model.md) §2 |
| `CM-09` | `pool` set; no item in both pools; no `practice` → `exam` transition in history |
| `CM-10` | every `term` block resolves to a glossary item |
| `CM-11` | every `figure` block has non-empty `altHe` and a resolving `assetId` |
| `CM-12` | no `approved` item references a `draft`, `in_review` or `needs_update` item |
| `CM-13` | Hebrew body text contains no unescaped bidi control characters |
| `CM-14` | an edited `approved` item has `version` incremented and status reset |
| `CM-15` | every topic summary is ≤ 4,800 page-equivalent units (§10) |
| `CM-16` | `Topic.guidedExamples` is absent from authored files (it is derived) |
| `CM-17` | a topic is `approved` only if every item it owns is `approved` |
| `CM-18` | every `learningObjective` traces to ≥ 1 entry in `measuredSkills` |
| `CM-19` | topic `prerequisites` are consistent with the skill prerequisite graph |
| `CM-20` | no learning content in `src/**` — Hebrew instructional prose, question text, rubric criteria |
| `CM-21` | no content-specific identifier appears in a conditional in `src/components/**` |
| `CM-22` | every lesson has ≥ 2 guided examples, each owned by that lesson |
| `CM-23` | blueprint `skillWeights` name only in-scope skills and sum to 100 |
| `CM-24` | an overridden `experienceBand` carries `experienceBandReason` |
| `CM-25` | every topic has exactly one summary and ≥ 1 lesson |
| `CM-26` | `imported: true` sources carry a complete `licence` block, and `attribution` when required |
| `CM-27` | every guided example step has non-empty `reasoning` |

`CM-12` matters more than it looks: an approved lesson linking to a draft checklist is a dead
end for the learner who follows the link. `CM-17` and `CM-25` together mean a topic cannot be
declared professionally reviewed while it is structurally incomplete.

---

## 18. Authoring lifecycle

- Content is authored as files and reviewed by pull request. There is no CMS in v1 —
  D-006 in [16-decisions-log](16-decisions-log.md).
- Schema validation runs pre-commit; the full rule set runs in CI.
- `retired` content is never deleted.
- Sources are added to the registry **before** any item cites them, so that licensing is
  decided before content is written rather than after it exists.

---

## 19. Open questions

- **Q-05-1** — asset storage and licensing for `figure` blocks. Not needed for the foundation
  tier, which is text-only; blocking for DevTools, mobile and accessibility content, which is
  inherently visual.
- **Q-05-2** — whether English content is a future translation of the same item or a separate
  item. Affects nothing in the ID scheme now that IDs are topic-scoped, but it does affect
  whether `lang` belongs on the item or on a variant beneath it.
- **Q-05-3** — whether `checklist` items should be topic-owned or global. Several checklists
  (heuristics, RIMGEN-style reporting frames) are useful across topics.
- **Q-05-4** — the page-equivalent constants in §10 are a first estimate. They should be
  calibrated against three real summaries before the budget is treated as authoritative.
- **Q-05-5** — whether `estimatedMinutes` on a topic should be authored at all, given it is
  computable from owned items. Currently author-overridable, which risks drift.
