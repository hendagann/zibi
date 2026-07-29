# 14 — Content Sources

Status: `draft` · Owner: content · Depends on: [03](03-skill-map.md), [05](05-content-model.md)

Inventory of the source material in [`research/`](../research/), assessed for what it covers,
what it does not, what each source is good for, and whether we are allowed to reuse it.

Product rule served here: **every content item must include source and review status**.
Every `sourceId` referenced by a content item must resolve to a row in §2 of this document.

---

## 1. Scope and method

Two research documents were read in full:

| Ref | Document | Pages | Sources listed |
| --- | --- | --- | --- |
| `R1` | [מקורות מומלצים להורדה ולתרגול ב־QA](../research/מקורות-מומלצים-להורדה-ותרגול-QA.pdf) | 13 | ~45, incl. 10 GitHub repositories |
| `R2` | [קטלוג מעודכן של חומרי לימוד להורדה ל-QA ידני עד 2026](../research/קטלוג-חומרי-לימוד-QA-ידני-2026.pdf) | 10 | 25 core + 7 academic |

The two overlap but are not redundant. `R2` is scoped deliberately to **manual** QA and to
material published or updated 2021–2026. `R1` is broader and includes automation and
performance tooling. Where they disagree, §9 records it rather than silently picking one.

**Assessment vocabulary.** Difficulty is stated in this project's tier vocabulary from
[03-skill-map](03-skill-map.md) — `foundation`, `applied`, `advanced` — not in the research
documents' own `Junior / Mid / Senior` year-bands. The two are related but not identical, and
§8 flags every source where our assessment differs from the research's tag.

**Licence status** is recorded as one of:

| Status | Meaning |
| --- | --- |
| `open` | an explicit reusable licence is stated (CC, MIT, CC0, Apache) |
| `permitted-attribution` | explicit copyright notice, some use allowed with attribution, non-commercial |
| `proprietary` | explicit copyright, no reuse permission stated |
| `unclear` | no licence stated on the resource page checked |

`unclear` is not a synonym for permissive. It is the default assumption of **no rights**.

---

## 2. Master source registry

Legend — Role: `T` theory · `P` practical exercise · `Q` interview/exam questions.
Difficulty: `F` foundation · `A` applied · `V` advanced.

### Official certification bodies

| ID | Source | Year | Lang | Format | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-ISTQB-CTFL-SYL` | ISTQB CTFL Syllabus v4.0.1 | 2024 | EN | PDF, free | `permitted-attribution` | T | F |
| `SRC-ITCB-CTFL-HE` | סילבוס CTFL 4.0 בעברית (ITCB), 77 pp | 2024 | HE | PDF, free | `permitted-attribution` | T | F |
| `SRC-ISTQB-CTFL-EX-A` | CTFL Sample Exam Set A + answers | 2025 | EN | 2 PDF, free | `permitted-attribution` | Q | F |
| `SRC-ISTQB-CTFL-EX-BD` | CTFL Sample Exam Sets B–D | 2025 | EN | 6 PDF, free | `permitted-attribution` | Q | F |
| `SRC-ISTQB-CTFL-EX-C` | CTFL Sample Exam Set C, 21 pp + answers | n/s | EN | 2 PDF, free | `permitted-attribution` | Q | F |
| `SRC-ISTQB-CTFL-AT` | CTFL-AT (Agile Tester) syllabus + sample exam v1.3 | 2023 | EN | 2 PDF, free | `permitted-attribution` | T, Q | A |
| `SRC-ISTQB-CT-MAT` | CT-MAT (Mobile App Testing) sample exam A v1.3 | 2023 | EN | 2 PDF, free | `permitted-attribution` | T, Q | A |
| `SRC-ISTQB-CT-ACT` | CT-AcT (Acceptance Testing) sample exam A v1.3 | 2023 | EN | 2 PDF, free | `permitted-attribution` | T, Q | A |
| `SRC-ISTQB-CT-PT` | CT-PT (Performance Testing) syllabus + 40-q exam | n/s | EN | PDF, free | `permitted-attribution` | T, Q | V |
| `SRC-ISTQB-CTAL-TA-SYL` | CTAL-TA Syllabus v4.0 | 2025 | EN | PDF, free | `permitted-attribution` | T | V |
| `SRC-ISTQB-CTAL-TA-EX` | CTAL-TA Sample Exam v4.1 + answers | 2025 | EN | 2 PDF, free | `permitted-attribution` | Q | V |
| `SRC-ASTQB-CTFL-RES` | ASTQB CTFL Resources v4.0 (≥5 exam sets + glossary) | n/s | EN | PDF pages | `unclear` | Q | F |
| `SRC-ASTQB-TM` | ASTQB Test Management resources | n/s | EN | PDF | `unclear` | T, Q | V |
| `SRC-ASTQB-TAE` | ASTQB Test Automation Engineering exam (63 pts / 90 min) | n/s | EN | PDF | `proprietary` | Q | V |
| `SRC-ASTQB-GENAI` | ASTQB Testing with Generative AI resources | n/s | EN | PDF | `unclear` | T, Q | V |
| `SRC-ITCB-GLOSSARY` | ITCB ISTQB glossary, Hebrew/English | n/s | HE/EN | web → PDF | `unclear` | T | F |
| `SRC-WORLDSKILLS-2026` | WorldSkills 2026 Software Testing Technical Description | 2025 | EN | PDF, free | `proprietary` (© WorldSkills International) | T | V |

### Books

| ID | Source | Year | Lang | Format | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-BK-STARTING` | Starting Your Software Testing Career | 2024 | EN | Leanpub, paid + free sample | `proprietary` (DRM-free) | T | F |
| `SRC-BK-BEDROCK` | Manual Testing Fundamentals: The Bedrock | 2026 | EN | Leanpub, paid | `proprietary` (DRM-free) | T | F–A |
| `SRC-BK-TESTFOUND` | Testing Foundations | 2022 | EN | Leanpub, paid + free sample | derived from CC BY-SA + Leanpub terms | T | F |
| `SRC-BK-BUGADV` | Bug Advocacy (Leanpub) | 2022 | EN | Leanpub, paid + free sample | derived from CC BY-SA + Leanpub terms | T | A |
| `SRC-BK-EXPLORATORY` | Contemporary Exploratory Testing | 2024 | EN | Leanpub, **free** PDF/EPUB | `proprietary` (DRM-free, free of charge) | T | A |
| `SRC-BK-SENIOR` | Testing Like a Senior | 2026 | EN | Leanpub, paid | `proprietary` (DRM-free) | T | V |
| `SRC-BK-STRATEGY` | Test Strategy and Quality Metrics | 2026 | EN | Leanpub, paid | `proprietary` (DRM-free) | T | V |

### Open courseware

| ID | Source | Year | Lang | Format | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-BBST-FOUND` | BBST Foundations open course materials | n/s | EN | slides, video, docs | **`open` — CC Attribution, explicitly stated** | T, P | A |
| `SRC-BBST-BUGADV` | BBST Bug Advocacy lecture | n/s | EN | PDF | `proprietary` (Altom rights, BBST-derived) | T | V |
| `SRC-BBST-RIMGEN` | BBST RIMGEN cards (≥7 PDF cards) | n/s | EN | PDF | `unclear` | T, P | A |
| `SRC-BRAUDE-INTRO` | Braude — Introduction to Software Testing (academic) | n/s | HE | PDF | `unclear` | T | F |
| `SRC-LTH-LAB2` | LTH Lab 2 — Black-Box Testing (EP + BVA) | n/s | EN | PDF | `unclear` | P | F–A |
| `SRC-POLITO-SQL2` | Politecnico di Torino SQL Homework 2 + solutions | n/s | EN | PDF | `unclear` | P | A |

### Hebrew-language material

| ID | Source | Year | Lang | Format | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-TW-40` | ITCB TestingWorld Magazine #40 (CTFL 4.0 self-test, regression) | 2025 | HE | PDF, free | `unclear` | Q, T | F |
| `SRC-TW-41` | ITCB TestingWorld Magazine #41 | n/s | HE | PDF, free | `unclear` | Q, T | F |
| `SRC-TW-42` | ITCB TestingWorld Magazine #42 (decision tables, OAT) | 2025 | HE | PDF, free | `unclear` | Q, T | A |
| `SRC-SELA-QUESTIONS` | Sela — ISTQB questions in Hebrew (~20) | n/s | HE | web | `unclear` | Q | F |
| `SRC-QAONLINE` | QA Online — QA course with exercises, 33 units | n/s | HE | web | `unclear` | T, P | F |
| `SRC-JOHNBRYCE-SYL` | John Bryce QA/ISTQB course syllabus | n/s | HE | PDF | `unclear` | T | F |
| `SRC-ELEVIFY` | Elevify QA course, 8 chapters / 39 lessons + PDF booklets | n/s | HE | PDF, registration | `unclear` | T, P | F |
| `SRC-QAEXPERTS-100` | QA Experts — 100+ interview questions, 52 pp | n/s | HE | PDF via form | `unclear` | Q | F |

### Practice environments, templates and reference aids

| ID | Source | Year | Lang | Format | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-POSTMAN-ECHO` | Postman Echo — live request/response sandbox | n/a | EN | live service | `unclear` (Postman terms) | P | A |
| `SRC-POSTMAN-WS` | Postman public workspace test examples | n/a | EN | workspace | `unclear` (Postman terms) | P | A |
| `SRC-SWAGGER-PETSTORE` | Swagger Petstore demo API + OpenAPI spec | n/a | EN | live + YAML | `unclear` (public repo exists) | P | A |
| `SRC-W3RESOURCE-SQL` | w3resource SQL exercises (~2,605 problems) | n/a | EN | web | `unclear` | P | F–A |
| `SRC-MS-ADVENTUREWORKS` | Microsoft AdventureWorks sample database | n/a | EN | DB backup | `unclear` on the page checked | P | A |
| `SRC-STH-TCTEMPLATES` | SoftwareTestingHelp test case templates (DOC/XLS) | n/a | EN | DOC/XLS | `unclear` (site terms) | P | F |
| `SRC-STH-180TC` | SoftwareTestingHelp 180+ test scenarios | n/a | EN | web | `unclear` (site terms) | P, T | F–A |
| `SRC-STH-EBOOKS` | SoftwareTestingHelp free/semi-free eBooks | n/a | EN | PDF | `unclear` | T, Q | F |
| `SRC-GURU99-PDF` | Guru99 software testing PDF/course | n/a | EN | PDF preview | `unclear` | T | F |
| `SRC-INFLECTRA-TC` | Inflectra free test case template | 2025 | EN | PDF/XLSX | `unclear` | P | F |
| `SRC-ATLASSIAN-BUG` | Atlassian bug report / triage template | n/a | EN | web/Jira | `unclear` (Atlassian terms) | P | F |
| `SRC-MOT-HEURISTICS` | Ministry of Testing — Test Heuristics Cheat Sheet | n/s | EN | PDF | `unclear` | P, T | A |
| `SRC-TESTLIO-CHECKLIST` | Testlio functional testing checklist | n/a | EN | PDF via form | `unclear` | P | A |

### Tooling documentation (in `R1` only)

| ID | Source | Lang | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- |
| `SRC-JMETER-MANUAL` | Apache JMeter user manual | EN | `unclear` on page | T, P | V |
| `SRC-JMETER-DIST` | JMeter distributed testing guide (4 pp) | EN | `unclear` | T | V |
| `SRC-K6-EXAMPLES` | Grafana k6 examples & getting started | EN | `unclear` on page | P | V |
| `SRC-LOCUST-DOCS` | Locust docs + offline PDF | EN | `unclear` | T, P | V |
| `SRC-APPIUM-QS` | Appium quickstart | EN | project repo Apache-2.0; page silent | P | V |
| `SRC-ANDROID-CODELABS` | Android Developers testing codelabs | EN | `unclear` on page | P | V |

### GitHub repositories

| ID | Repository | Contents | Licence | Role | Diff |
| --- | --- | --- | --- | --- | --- |
| `SRC-GH-QAPORTFOLIO` | `eGoOki/QA-Portfolio` | test cases, bug reports, checklists, API, SQL, reports, mindmaps | **`open` — MIT** | P | A |
| `SRC-GH-AWESOME` | `upgundecha/awesome-testing-courses` | curated course list | **`open` — CC0-1.0** | T | F–V |
| `SRC-GH-OPENCART` | OpenCart-ManualTesting | FRS, test plan, RTM, scenarios, cases, execution, bug report | `unclear` | P | A |
| `SRC-GH-ARTIFACTS` | Manual Testing Project Artifacts Repository | full manual-testing artifacts, metrics, mindmaps, Excel | `unclear` | P | A |
| `SRC-GH-INTERVIEWQ` | Manual-Testing-Interview-Questions | interview bank split beginner/experienced | `unclear` — no licence file found | Q | F–A |
| `SRC-GH-QAGUIDE` | `aeshamangukiya/qa-testing-guide` | theory, tools, SQL, API, non-functional | `unclear` — check LICENSE | T, P | F–A |
| `SRC-GH-MANUALQATC` | `yogendradayal/Manual-QA-TestCases` | test cases, scenarios, bug reports, Excel templates | `unclear` — check LICENSE | P | F |
| `SRC-GH-QAFUND` | `Smrity-Thapa33/qa_fundamentals` | concepts, techniques, bug reports, JPetStore/SauceDemo | `unclear` — check LICENSE | P, T | F |
| `SRC-GH-HYF` | `HackYourFuture/QA-Training` | course-style exercises | `unclear` — check LICENSE | P | F |
| `SRC-GH-MFAISAL` | `mfaisalkhatri/Manual_Testing` | web/mobile/API cases, bug bash, test plan templates | `unclear` — check LICENSE | P | F–A |
| `SRC-GH-SQLEX` | `XD-DENG/sql-exercise` | schemas, questions, solutions | `unclear` — check LICENSE | P | A |
| `SRC-GH-JMETER` | `kowalcj0/jmeter-example-test-plans` | JMeter test plans | `unclear` — check LICENSE | P | V |
| `SRC-GH-APPIUM` | `sharmadhiraj/Appium-Android-Test-Demo` | Android UI test demo | `unclear` — check LICENSE | P | V |
| `SRC-GH-K6WOO` | `grafana/k6-example-woocommerce` | official k6 e-commerce scripts | `unclear` — check LICENSE | P | V |

### Pedagogy research (method, not QA content)

`SRC-EDU-*` — seven academic references in `R2` covering microlearning, hands-on labs, pair
testing, scenario-based learning, spaced repetition and gamification in software-testing
education, plus two surveys reporting a persistent gap between what testing courses teach and
what the market expects. These inform [04-learning-path](04-learning-path.md), not content.

---

## 3. Inventory 1 — QA subjects covered by the research

Coverage is graded by whether the research supplies enough to both **teach** and **assess** a
subject.

| Subject | Coverage | Principal sources |
| --- | --- | --- |
| Testing fundamentals, principles, error/defect/failure, QA vs testing | **strong** | `SRC-ISTQB-CTFL-SYL`, `SRC-ITCB-CTFL-HE`, `SRC-BK-TESTFOUND` |
| Test process and activities | **strong** | CTFL syllabi |
| SDLC models, test levels, test types, regression and confirmation | **strong** | CTFL syllabi, `SRC-WORLDSKILLS-2026` |
| Static testing and reviews | **strong** | CTFL syllabi |
| Black-box techniques — EP, BVA, decision tables, state transition | **strong** | CTFL syllabi, `SRC-LTH-LAB2`, `SRC-TW-42`, `SRC-BK-BEDROCK` |
| Experience-based testing, error guessing, heuristics, oracles | **strong** | `SRC-MOT-HEURISTICS`, `SRC-BBST-FOUND`, `SRC-BK-TESTFOUND` |
| Exploratory and session-based testing | **strong** | `SRC-BK-EXPLORATORY` (free), `SRC-ISTQB-CTAL-TA-SYL` |
| Defect reporting and advocacy | **strong** | `SRC-BK-BUGADV`, `SRC-BBST-BUGADV`, `SRC-BBST-RIMGEN`, `SRC-ATLASSIAN-BUG` |
| Test case authoring and templates | **strong** | `SRC-INFLECTRA-TC`, `SRC-STH-TCTEMPLATES`, `SRC-GH-*` |
| Test artifacts — test plan, RTM, execution, summary | **strong** | `SRC-GH-OPENCART`, `SRC-GH-ARTIFACTS`, `SRC-GURU99-PDF` |
| Agile testing, user stories, acceptance criteria, whole-team | **adequate** | `SRC-ISTQB-CTFL-AT` |
| UAT, acceptance testing, alpha/beta, business needs | **adequate** | `SRC-ISTQB-CT-ACT` |
| Mobile manual testing — interrupts, install/upgrade, permissions, connectivity | **adequate** | `SRC-ISTQB-CT-MAT` |
| SQL for data validation | **adequate** | `SRC-W3RESOURCE-SQL`, `SRC-GH-SQLEX`, `SRC-POLITO-SQL2`, `SRC-MS-ADVENTUREWORKS` |
| API fundamentals and validation | **adequate** | `SRC-POSTMAN-ECHO`, `SRC-SWAGGER-PETSTORE`, `SRC-GH-QAPORTFOLIO` |
| Risk analysis and risk-based testing | **adequate** | `SRC-ISTQB-CTAL-TA-SYL`, `SRC-ISTQB-CTAL-TA-EX` |
| Test management — planning, monitoring, estimation | **adequate** | CTFL syllabi, `SRC-ASTQB-TM` |
| Test strategy, metrics, maturity | **thin** | `SRC-BK-STRATEGY` (paid), `SRC-ASTQB-TM` |
| Defect prevention, quality characteristics | **thin** | `SRC-ISTQB-CTAL-TA-SYL` only |
| Web fundamentals and DevTools | **thin** | no primary source; inferred from `SRC-GH-*` checklists and `SRC-JOHNBRYCE-SYL` |
| Performance testing | **tool-heavy** | `SRC-JMETER-*`, `SRC-K6-*`, `SRC-LOCUST-DOCS`, `SRC-ISTQB-CT-PT` |
| Test automation | **out of manual scope** | `SRC-APPIUM-QS`, `SRC-ANDROID-CODELABS`, `SRC-ASTQB-TAE` |
| Testing GenAI-based features | **thin** | `SRC-ASTQB-GENAI` only |

**Hebrew coverage is materially weaker than English.** `R1` states this explicitly: the deep
practical material in Hebrew is much smaller, particularly for API, performance and mobile.
Hebrew sources are concentrated in theory (`SRC-ITCB-CTFL-HE`, `SRC-ITCB-GLOSSARY`) and light
self-test questions (`SRC-TW-*`, `SRC-SELA-QUESTIONS`, `SRC-QAEXPERTS-100`). Since the product
is Hebrew-first, **most practical content will have to be authored, not adapted.** This is the
single largest content-production consequence in this document.

---

## 4. Inventory 2 — Subjects missing for a five-year manual QA professional

Assessed against what the research itself says separates a candidate at five years: analysing
risk, choosing a technique and justifying it, defining strategy, discussing metrics, and
explaining trade-offs. Judged missing when the research supplies no usable source, or supplies
one aimed at a different role.

| # | Missing subject | Why it matters at five years | Research status |
| --- | --- | --- | --- |
| M-01 | **Accessibility testing** — WCAG, Israeli Standard IS 5568 | Legally mandatory for Israeli public-facing services. A senior manual tester is expected to own it. | absent — one passing mention in a heuristics sheet |
| M-02 | **Localization / RTL and bidi testing** | Hebrew and Arabic RTL, mixed-direction strings, date/currency/number formats. Core to the local market and to this product's own UI. | entirely absent |
| M-03 | **Security testing basics for manual QA** | Authentication and authorisation testing, IDOR, session handling, OWASP-level awareness. Routinely asked at Mid and Senior interviews. | absent — "security" appears only as a scenario category |
| M-04 | **Test data management** | Creating, refreshing, masking and isolating data; handling personal data lawfully. Daily work at scale. | absent |
| M-05 | **Test environment strategy** | Environment parity, versioning, deployment awareness, "works on staging" triage. | glancing only, inside test management |
| M-06 | **Reading logs and observability signals** | Distinguishing a client-side symptom from a server-side cause before filing a defect. Directly determines defect report quality. | absent |
| M-07 | **CI/CD literacy for testers** | Where manual testing sits in a pipeline, reading a failed build, release gating. | one mention inside `SRC-ISTQB-CTFL-AT` |
| M-08 | **Automation literacy (not engineering)** | Deciding *what* to automate, reading automation results, understanding maintenance cost. | mis-levelled — the research offers automation *engineering* (`SRC-ASTQB-TAE`, `SRC-APPIUM-QS`), which is a different role |
| M-09 | **Performance thinking for manual testers** | Recognising performance risk and interpreting results, without writing load scripts. | mis-levelled — sources are scripting tools (`SRC-K6-*`, `SRC-JMETER-*`, `SRC-LOCUST-DOCS`) |
| M-10 | **Test case management tooling** | Jira, TestRail, Xray, Zephyr — defect workflows, states, traceability in a real tool. | absent apart from one Atlassian template |
| M-11 | **Stakeholder reporting and escalation** | Presenting quality status and a release recommendation to non-testers; disagreeing productively. | thin — only inside paid `SRC-BK-STRATEGY` and `SRC-BK-SENIOR` |
| M-12 | **Testing AI/LLM-backed features** | Non-deterministic outputs, prompt/response validation, hallucination and safety risk. Increasingly present in Israeli products. | thin — `SRC-ASTQB-GENAI` only, licence unclear |
| M-13 | **Regulatory and sector context** | Israeli privacy law, and sector rules in fintech, health and defence — the dominant local employers. | absent |
| M-14 | **Cross-browser and device coverage strategy** | Choosing a defensible matrix under budget constraints. | absent as a decision skill; only device differences within `SRC-ISTQB-CT-MAT` |

M-01 and M-02 are the most consequential. They are simultaneously the clearest local-market
requirement and the least covered by any source in the research, and M-02 is a subject this
product must get right in its own interface regardless — see
[12-design-system](12-design-system.md).

Every gap above is represented in [03-skill-map](03-skill-map.md) as a skill carrying
`sourceCoverage: none` or `partial`, so the map states what must be taught even where we have
nothing yet to teach it from.

---

## 5. Inventory 3 — Sources that can support theory

Ranked by usefulness as a **provenance** reference for original writing. None of these may be
copied; see §7.

**Tier 1 — authoritative, free, reusable with attribution**

`SRC-ISTQB-CTFL-SYL` · `SRC-ITCB-CTFL-HE` · `SRC-ISTQB-CTAL-TA-SYL` · `SRC-ISTQB-CTFL-AT` ·
`SRC-ISTQB-CT-ACT` · `SRC-ISTQB-CT-MAT`

These define the terminology and the assessable objectives. `SRC-ITCB-CTFL-HE` is the single
most valuable source in the entire inventory for this product, because it fixes the **Hebrew
technical vocabulary** — without it we would invent inconsistent Hebrew terms for concepts
learners will meet in English at work.

**Tier 2 — genuinely open**

`SRC-BBST-FOUND` — the only substantial course material with an explicit Creative Commons
Attribution licence. It is the one source we may adapt closely rather than merely consult, and
it is strongest exactly where the certification syllabi are weakest: critical thinking,
oracles, coverage reasoning.

**Tier 3 — free but restricted**

`SRC-BK-EXPLORATORY` (free of charge, not openly licensed) · `SRC-WORLDSKILLS-2026`
(competency framing, © WorldSkills) · `SRC-ITCB-GLOSSARY` · `SRC-TW-40/41/42`

**Tier 4 — paid, single-reader**

`SRC-BK-BEDROCK` · `SRC-BK-STRATEGY` · `SRC-BK-SENIOR` · `SRC-BK-BUGADV` · `SRC-BK-STARTING` ·
`SRC-BK-TESTFOUND`. Usable for author background only. Cost and per-reader licensing make them
unsuitable as a dependency for content production.

---

## 6. Inventory 4 — Sources that can support practical exercises

Practical value depends on whether a learner can **produce an artifact or a verifiable result**.

| Capability needed | Usable sources | Note |
| --- | --- | --- |
| Live API to query | `SRC-POSTMAN-ECHO`, `SRC-SWAGGER-PETSTORE` | best practical assets in the inventory: real responses, no account, deterministic |
| SQL against real schemas | `SRC-W3RESOURCE-SQL`, `SRC-GH-SQLEX`, `SRC-MS-ADVENTUREWORKS`, `SRC-POLITO-SQL2` | needed for the `sql_query` type in [06](06-question-model.md) §3 |
| Worked black-box technique lab | `SRC-LTH-LAB2` | structured EP/BVA exercise with a defined answer |
| Full artifact set to imitate | `SRC-GH-OPENCART`, `SRC-GH-ARTIFACTS`, `SRC-GH-QAPORTFOLIO` | FRS → test plan → RTM → cases → execution → bug report, end to end |
| Test case and bug templates | `SRC-INFLECTRA-TC`, `SRC-ATLASSIAN-BUG`, `SRC-STH-TCTEMPLATES` | field structure for our `artifactSample` blocks |
| Idea generation under exploration | `SRC-MOT-HEURISTICS`, `SRC-BBST-RIMGEN`, `SRC-TESTLIO-CHECKLIST` | heuristics and the RIMGEN reporting frame |
| Application under test | `SRC-GH-QAFUND` (JPetStore, SauceDemo), `SRC-GH-OPENCART` | needed for exploratory charters and mobile-style scenarios |

`SRC-GH-QAPORTFOLIO` is the strongest single practical source: MIT-licensed, current, and it
contains exactly the artifact types our `exercise` items must elicit.

**Gap.** Nothing in the inventory provides a practice environment for accessibility (M-01),
RTL/localization (M-02), security (M-03) or log reading (M-06). Those exercises must be built
from scratch, including their fixtures.

---

## 7. Inventory 5 — Sources that can support interview or exam questions

Two distinct needs. **Blueprint calibration** — how a real exam distributes and phrases
questions. **Interview realism** — what a hiring manager actually asks.

| Need | Sources | Assessment |
| --- | --- | --- |
| Certification blueprint and phrasing | `SRC-ISTQB-CTFL-EX-A`, `SRC-ISTQB-CTFL-EX-BD`, `SRC-ISTQB-CTFL-EX-C`, `SRC-ASTQB-CTFL-RES` | four to eight independent sets; enough to infer weighting and distractor style |
| Advanced reasoning items | `SRC-ISTQB-CTAL-TA-EX` | the only source modelling technique-selection with rationale — directly relevant to `select_technique` |
| Specialism practice | `SRC-ISTQB-CTFL-AT`, `SRC-ISTQB-CT-ACT`, `SRC-ISTQB-CT-MAT`, `SRC-ISTQB-CT-PT` | Agile, acceptance, mobile, performance |
| Interview banks | `SRC-GH-INTERVIEWQ`, `SRC-QAEXPERTS-100`, `SRC-STH-EBOOKS` | volume is high, quality unverified, licence unclear |
| Hebrew self-test | `SRC-TW-40/41/42`, `SRC-SELA-QUESTIONS` | small — roughly 20 questions plus per-issue self-tests |

**Critical constraint.** These are calibration references, not an item bank. Sample exam
questions may not be imported: they are `permitted-attribution`, **non-commercial**, and any
question a learner may have already seen cannot measure readiness. Under
[05-content-model](05-content-model.md) §7 an imported public item is doubly disqualified —
licensing and pool contamination.

The realistic figure: the research yields perhaps **300–400 reference questions** to calibrate
against, and **zero** items we can ship. Every shipped question is original work.

---

## 8. Inventory 6 — Sources whose reuse or licensing status is unclear

Both research documents flag this. `R1` states plainly that for Atlassian, Postman,
SoftwareTestingHelp, Guru99, Testlio and private course sites, **no explicit open licence
appeared on the pages checked**, and recommends treating them as personal or team study
material until site-level terms are verified.

### 8.1 Explicitly clear — safe to rely on

| Source | Licence |
| --- | --- |
| `SRC-BBST-FOUND` | CC Attribution, stated on the materials page |
| `SRC-GH-QAPORTFOLIO` | MIT |
| `SRC-GH-AWESOME` | CC0-1.0 |
| `SRC-ISTQB-*`, `SRC-ITCB-CTFL-HE` | explicit copyright notice; some use permitted with attribution, non-commercial, with specific clauses for Accredited Training Providers |
| `SRC-ASTQB-TAE` | explicit ASTQB rights stated in the files |
| `SRC-WORLDSKILLS-2026` | © WorldSkills International |

### 8.2 Unclear — assume no reuse rights

Commercial sites with no stated licence: `SRC-ATLASSIAN-BUG`, `SRC-POSTMAN-ECHO`,
`SRC-POSTMAN-WS`, `SRC-STH-*`, `SRC-GURU99-PDF`, `SRC-TESTLIO-CHECKLIST`,
`SRC-INFLECTRA-TC`, `SRC-MS-ADVENTUREWORKS`, `SRC-W3RESOURCE-SQL`, `SRC-MOT-HEURISTICS`,
`SRC-SWAGGER-PETSTORE`.

Certification-body pages without a stated licence: `SRC-ASTQB-CTFL-RES`, `SRC-ASTQB-TM`,
`SRC-ASTQB-GENAI`.

Hebrew course and vendor material: `SRC-SELA-QUESTIONS`, `SRC-QAONLINE`, `SRC-JOHNBRYCE-SYL`,
`SRC-ELEVIFY`, `SRC-QAEXPERTS-100`, `SRC-BRAUDE-INTRO`. These are commercial competitors'
marketing and course material. Reuse risk is both legal and reputational.

ITCB publications without a stated licence: `SRC-TW-40`, `SRC-TW-41`, `SRC-TW-42`,
`SRC-ITCB-GLOSSARY`.

Academic PDFs without a stated licence: `SRC-LTH-LAB2`, `SRC-POLITO-SQL2`.

Tooling docs without a stated licence on the page: `SRC-JMETER-MANUAL`, `SRC-JMETER-DIST`,
`SRC-K6-EXAMPLES`, `SRC-LOCUST-DOCS`, `SRC-ANDROID-CODELABS`, `SRC-APPIUM-QS` (project repo is
Apache-2.0, page silent — verify at repository level, not page level).

GitHub repositories where `R1` explicitly says *check the LICENSE file*, having found none in
the search result: `SRC-GH-QAGUIDE`, `SRC-GH-MANUALQATC`, `SRC-GH-QAFUND`, `SRC-GH-HYF`,
`SRC-GH-MFAISAL`, `SRC-GH-SQLEX`, `SRC-GH-JMETER`, `SRC-GH-APPIUM`, `SRC-GH-K6WOO`,
`SRC-GH-OPENCART`, `SRC-GH-ARTIFACTS`, `SRC-GH-INTERVIEWQ`. A public repository without a
licence file is **all rights reserved** — public visibility is not permission.

### 8.3 The commercial-use problem

Nearly every high-quality source is non-commercial. If this platform is ever monetised, the
`permitted-attribution` tier stops being available even for adaptation.

The operative conclusion, which shapes the whole content strategy: **content must be original
by default**, with sources recorded as provenance rather than as material. This is why
[05-content-model](05-content-model.md) §3 makes `source.derivation` mandatory and fails CI on
any `quoted` item lacking clearance. Two sources — `SRC-BBST-FOUND` and `SRC-GH-QAPORTFOLIO` —
are the only ones we may adapt closely, and both require attribution.

---

## 9. Inventory 7 — Recommended difficulty per source

Difficulty is in the registry (§2). Recorded here are the places where our assessment
**differs from the research's own level tag**, since those are the disagreements that would
otherwise silently mis-schedule a learner.

| Source | Research tag | Our tier | Why |
| --- | --- | --- | --- |
| `SRC-BBST-FOUND` | Mid–Senior (`R1`) | `applied`, entry-usable | Named "Foundations" and tagged senior. It is conceptually demanding but assumes no prior knowledge; usable from early `applied` for critical-thinking skills. |
| `SRC-ISTQB-CTAL-TA-EX` | Senior/Expert | `advanced` **only** | Requires technique selection with rationale. Scheduling it before `TD.SEL` produces uninterpretable evidence. |
| `SRC-K6-EXAMPLES`, `SRC-JMETER-*`, `SRC-LOCUST-DOCS` | Mid–Senior for QA | `advanced`, and **out of scope for manual practice** | Scripting tools. Relevant to M-09 only as background for interpreting results. |
| `SRC-APPIUM-QS`, `SRC-ANDROID-CODELABS`, `SRC-ASTQB-TAE` | Mid–Senior | out of scope | Automation engineering, a different role. Retained for M-08 literacy context only. |
| `SRC-W3RESOURCE-SQL` | Junior–Mid | `foundation` for syntax, `applied` for validation | 2,605 problems mostly drill query-writing. The QA skill (`TECH.SQLV`) is validating data against a requirement, which the source does not exercise. |
| `SRC-MOT-HEURISTICS` | not levelled | `applied`+ | A heuristics list is close to useless before a learner has techniques to contrast it with. |
| `SRC-GH-INTERVIEWQ`, `SRC-QAEXPERTS-100` | Junior–Mid | mixed, unverified | Interview banks mix trivia with genuine reasoning questions. Cannot be tiered until reviewed item by item. |
| `SRC-BK-EXPLORATORY` | Mid | `applied`, with a `foundation` on-ramp | Exploratory testing is teachable early if framed as structured charters rather than unstructured play. |

---

## 10. Inventory 8 — Duplicate or conflicting material

### 10.1 Duplicates across the two research documents

| Item | Appears as | Action |
| --- | --- | --- |
| CTFL syllabus | `R1` Hebrew 4.0 · `R2` English 4.0.1 + Hebrew | one registry entry per language — see the version conflict below |
| CTFL sample exams | `R1` Set C + ASTQB "1, 2, A, B, C" · `R2` Sets A–D | overlapping and inconsistently named — see below |
| TestingWorld magazine | `R1` #40, #41 · `R2` #40, #42 | union of three issues; #40 is a true duplicate |
| CT-MAT | `R1` resource page · `R2` sample exam | same certification, different artifacts — keep both |
| CTFL-AT | `R1` syllabus + sample · `R2` sample exam | same, keep both |
| Bug advocacy | `R1` BBST lecture + RIMGEN cards · `R2` Leanpub book | three distinct artifacts on one subject — see below |
| SQL practice | `SRC-W3RESOURCE-SQL`, `SRC-GH-SQLEX`, `SRC-POLITO-SQL2`, `SRC-MS-ADVENTUREWORKS`, plus Northwind named in `R1` prose | five overlapping sources — see dialect conflict |

### 10.2 Conflicts requiring a decision

**C-1 — CTFL version drift between languages.** `R2` lists the English syllabus as **v4.0.1**
(2024) while the official Hebrew translation is of **v4.0**. A Hebrew-first product teaching
from the Hebrew syllabus while calibrating against English v4.0.1 sample exams will diverge
wherever 4.0.1 amended 4.0. The delta must be identified before any exam-readiness claim.
**This is the highest-priority unresolved item in this document.**

**C-2 — sample exam set naming.** `R1` cites ISTQB "Set C" and separately ASTQB sets
"1, 2, A, B, C"; `R2` cites ISTQB "Sets A–D". Whether ASTQB "A/B/C" are the same papers as
ISTQB "A/B/C" is unresolved. Treating them as distinct risks double-counting the same
questions when inferring a blueprint.

**C-3 — `SRC-BK-TESTFOUND` vs `SRC-BBST-FOUND`.** Both are called "Foundations"; `R2` records
the Leanpub book as based on CC BY-SA material, which suggests derivation from BBST. Their
licences differ sharply (`open` vs paid/`proprietary`). Citing the wrong one as provenance for
an adapted item would misstate our reuse rights.

**C-4 — scope disagreement on performance and automation.** `R1` includes JMeter, k6, Locust,
Appium and Android codelabs at Mid–Senior; `R2`, scoped to manual QA, excludes them entirely.
`R2` is right for our target user; `R1`'s inclusion is why M-08 and M-09 are framed as
literacy skills rather than dropped.

**C-5 — SQL dialect divergence.** AdventureWorks is T-SQL, w3resource is largely MySQL-flavoured,
Politecnico and `XD-DENG/sql-exercise` use generic or unspecified SQL, and `R1` also names
Northwind. Answer keys for `sql_query` items are dialect-sensitive. One dialect must be fixed
for the fixture database — open question Q-06-2 in [06-question-model](06-question-model.md).

**C-6 — "Bug Advocacy" refers to three different artifacts.** A Leanpub book (paid), a BBST
lecture PDF (Altom rights), and the RIMGEN cards (licence unclear). Distinct `sourceId`s are
assigned in §2 precisely to stop these collapsing into one citation.

**C-7 — undated sources.** `SRC-MOT-HEURISTICS` is explicitly undated in `R2`; several `R1`
entries have no year. Since `R2`'s inclusion rule is "published or updated 2021–2026", an
undated source cannot be confirmed to meet it. Recorded as `n/s` rather than guessed.

---

## 11. Consequences for the product

1. **Content is authored, not assembled.** Original by default; sources are provenance. This
   is a licensing conclusion, not an editorial preference (§8.3).
2. **Hebrew practical content has no upstream.** Theory has `SRC-ITCB-CTFL-HE`; practice has
   essentially nothing in Hebrew. Plan production capacity accordingly (§3).
3. **Zero shippable questions exist.** The research calibrates a blueprint; it supplies no item
   bank (§7).
4. **Fourteen subjects need sources that do not yet exist**, led by accessibility and RTL
   testing (§4).
5. **`SRC-ITCB-CTFL-HE` and `SRC-ITCB-GLOSSARY` govern our Hebrew terminology.** Every
   `glossary_term` item should reconcile against them so learners meet consistent vocabulary.
6. **C-1 blocks exam-readiness claims** until the v4.0 → v4.0.1 delta is known.

---

## 12. Open questions

- **Q-14-1** — resolve C-1: obtain both syllabus versions and diff the learning objectives.
- **Q-14-2** — resolve C-2 by comparing ASTQB and ISTQB sample sets item by item.
- **Q-14-3** — verify the LICENSE file of all twelve GitHub repositories in §8.2 before any
  artifact is adapted, including `SRC-GH-QAPORTFOLIO`'s MIT claim.
- **Q-14-4** — confirm ITCB's position on reusing TestingWorld self-test questions as
  calibration references; they are the only Hebrew exam-style items in existence.
- **Q-14-5** — decide whether the platform will ever be monetised. The answer determines
  whether the `permitted-attribution` tier is usable at all (§8.3).
