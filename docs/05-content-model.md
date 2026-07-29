# 05 — Content Model

Status: `draft` · Owner: content + engineering · Depends on: [03](03-skill-map.md)

Defines how every piece of learning content is stored, identified, validated and reviewed.

Product rule enforced here: **learning content must never be hardcoded inside UI components**,
and **every content item must include source and review status**.

---

## 1. The separation that matters

```
content/          data — authored, reviewed, versioned, validated in CI
  skills/         the skill map from docs/03
  items/          concepts, examples, drills, exercises
  exams/          exam blueprints and item pools
  sources/        source registry

src/              code — renders content, never contains content
  content/        loader, schema, validation
  components/     presentation only
```

The rule is testable, not aspirational. See `AT-05-01` in
[13-acceptance-tests](13-acceptance-tests.md): a CI check greps `src/components/**` for
Hebrew instructional prose and for known QA terminology, and fails the build on a hit.
Strings that legitimately live in code — button labels, error states, empty states — live in
`src/i18n/`, which is UI chrome, not learning content. The distinguishing question is:
*would a content author ever want to change this without a developer?* If yes, it is content.

---

## 2. Item types

| Type | Purpose | Scored | Rubric required |
| --- | --- | --- | --- |
| `concept` | teaches an idea | no | no |
| `worked_example` | shows a technique applied end to end | no | no |
| `drill` | short, repeatable, single-skill practice | yes | answer key |
| `exercise` | produces a realistic artifact | yes | **yes** |
| `exam_item` | certification-style, blueprint-eligible | yes | answer key |
| `checklist` | reference aid, usable during exercises | no | no |
| `glossary_term` | bilingual term with definition | no | no |

`drill` and `exam_item` differ in intent, not shape: a drill is scheduled by
[04-learning-path](04-learning-path.md) and gives immediate feedback; an exam item is drawn by
[10-exam-rules](10-exam-rules.md) and gives none until the exam ends. An item may not be both —
see §7 on pool isolation.

---

## 3. Common envelope

Every item, regardless of type, carries the same envelope:

```jsonc
{
  "id": "TD.BVA.EX.003",
  "type": "exercise",
  "schemaVersion": 1,

  "skills": {
    "primary": "TD.BVA",              // exactly one
    "secondary": ["DOC.TC"]           // 0..3, receives partial mastery credit
  },
  "cognitiveLevel": "K3",             // ≤ primary skill's cognitiveLevel
  "difficulty": 3,                    // 1..5, calibrated — see §6

  "lang": "he",
  "dir": "rtl",
  "title": "...",
  "body": [ /* block content, see §4 */ ],

  "source": {                          // REQUIRED — product rule
    "sourceId": "SRC-ITCB-CTFL-4.0.1",
    "locator": "§4.2.2",
    "derivation": "original",         // original | adapted | quoted
    "note": "..."
  },

  "review": {                          // REQUIRED — product rule
    "status": "approved",             // draft | in_review | approved | needs_update | retired
    "reviewedBy": "...",
    "reviewedAt": "2026-07-29",
    "reviewNote": "..."
  },

  "estimatedSeconds": 240,
  "tags": ["boundary", "form-validation"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `source.derivation` — why this field exists

The licensing position of our source material is restrictive: the official syllabi are
non-commercial-with-attribution, and the catalogs in
[14-content-sources](14-content-sources.md) are third-party compilations. We therefore need to
know, per item, whether we wrote it or borrowed it.

- `original` — we wrote it; the source is intellectual provenance only.
- `adapted` — structure or scenario derived from the source, expressed in our own words.
- `quoted` — contains verbatim source text. **Requires `source.licenceCleared: true`.**

CI fails on any `quoted` item without clearance (`CM-07`). This is a legal control, not a
style preference. See risk R-1 in [15-backlog](15-backlog.md).

### `review.status` — the gate

Only `approved` items are served to learners in production. `draft` and `in_review` are
visible in the authoring environment only. This is how we satisfy "do not use mock data in
completed production flows": there is no mock content, only unapproved content, and it is
filtered at the loader, not the component.

---

## 4. Block content

`body` is an array of typed blocks, never raw HTML and never a markdown blob:

```jsonc
[
  { "kind": "paragraph", "text": "..." },
  { "kind": "list", "ordered": false, "items": ["...", "..."] },
  { "kind": "term", "he": "ערכי גבול", "en": "boundary values", "definitionRef": "GLO.BVA" },
  { "kind": "table", "headers": [...], "rows": [[...]] },
  { "kind": "callout", "tone": "warning", "text": "..." },
  { "kind": "code", "lang": "sql", "text": "SELECT ..." },
  { "kind": "figure", "assetId": "IMG-042", "altHe": "..." },
  { "kind": "artifactSample", "artifact": "test_case", "value": { /* typed */ } }
]
```

Typed blocks rather than markdown because:

1. **Bidi correctness.** Hebrew prose containing English technical terms and code needs
   per-run direction control. A markdown blob gives us one direction for the whole string and
   produces exactly the scrambling seen in [12-design-system](12-design-system.md) §5.
2. **Validation.** We can assert that every `term` resolves to a glossary entry and every
   `figure` has Hebrew alt text. A blob is unvalidatable.
3. **Reuse.** `artifactSample` renders through the same component as a learner's own answer,
   so the model answer and the learner's attempt are visually comparable in feedback.

---

## 5. Item ID scheme

```
<SKILL>.<TYPE_CODE>.<SEQ>     e.g. TD.BVA.EX.003
```

Type codes: `CN` concept · `WE` worked example · `DR` drill · `EX` exercise ·
`XM` exam item · `CL` checklist · `GLO` glossary.

The primary skill is embedded in the ID deliberately: a reviewer reading a failing CI line
knows immediately which skill is affected. Re-pointing an item to a different primary skill
means a **new ID** — the old one is retired. Otherwise historical attempt records in
[09-progress-model](09-progress-model.md) would silently re-attribute mastery evidence to a
skill the learner never demonstrated.

---

## 6. Difficulty calibration

`difficulty` starts as an author estimate (1–5) and is **replaced by observed data** once an
item has ≥ 30 scored attempts from learners at known mastery.

Until calibrated, an item carries `difficultyCalibrated: false`, and
[09-progress-model](09-progress-model.md) §5 down-weights the evidence it produces. This
prevents an author's guess from moving a mastery estimate as much as a measured item does.

Recalibration runs as a batch job, never inline. Its output is written back into the content
files and reviewed like any other content change — an item silently changing difficulty in
production would make progress non-reproducible.

---

## 7. Pool isolation

An item is in exactly one pool: `practice` or `exam`.

An item may never move from `practice` to `exam`. Once a learner has practised an item with
feedback, that item can no longer measure readiness — it measures recall of the feedback.
The reverse move (`exam` → `practice`) is allowed **only after the item is retired from all
active blueprints**, and it is a one-way door.

Enforced by `CM-09`. This constraint is why [10-exam-rules](10-exam-rules.md) needs its own
item pool sized independently, and it is the single most common way an exam-prep product
quietly stops measuring anything.

---

## 8. Validation rules

Run in CI on every change to `content/**`. Build fails on any violation.

| Rule | Check |
| --- | --- |
| `CM-01` | item validates against its type's JSON Schema |
| `CM-02` | `id` unique, matches pattern, type code agrees with `type` |
| `CM-03` | `skills.primary` resolves to an active skill; secondary skills resolve and exclude primary |
| `CM-04` | `cognitiveLevel` ≤ primary skill's `cognitiveLevel` |
| `CM-05` | `source` present, `sourceId` resolves in `content/sources/` |
| `CM-06` | `review` present with a valid status |
| `CM-07` | `derivation: quoted` ⇒ `licenceCleared: true` |
| `CM-08` | every `exercise` has a rubric that resolves — see [07](07-scoring-rubrics.md) |
| `CM-09` | `pool` is set and no item appears in both pools |
| `CM-10` | every `term` block resolves to a glossary item |
| `CM-11` | every `figure` block has non-empty `altHe` |
| `CM-12` | no `approved` item references a `draft` item |
| `CM-13` | Hebrew body text contains no unescaped bidi control characters |

`CM-12` matters more than it looks: an approved lesson linking to a draft checklist produces a
dead end in production for the learner who follows the link.

---

## 9. Authoring lifecycle

```
draft ──▶ in_review ──▶ approved ──▶ needs_update ──▶ in_review ──▶ approved
   │                        │
   └──────────▶ retired ◀───┘
```

- Content is authored as files and reviewed via pull request. There is no CMS in v1 —
  see D-006 in [16-decisions-log](16-decisions-log.md).
- Moving to `approved` requires a named reviewer who is not the author.
- Any edit to an `approved` item's `body`, answer key or rubric forces status back to
  `needs_update`. A pre-commit hook does this automatically; CI verifies it (`CM-14`).
- `retired` items are kept in the repository forever, because attempt history references them.

---

## 10. Open questions

- **Q-05-1** — whether `worked_example` should be schedulable independently or only reachable
  from its `concept`. Currently the second, which means an author cannot ship an example
  without a concept.
- **Q-05-2** — asset storage for `figure` blocks. Not needed for the foundation tier, which is
  text-only; must be resolved before mobile and DevTools content, which is inherently visual.
- **Q-05-3** — whether English content is a future variant of the same item (`translations`)
  or separate items. Affects the ID scheme, so it must be decided before content volume grows.
