# UI/UX Audit — before the glass re-skin

Status: `draft` · Owner: design + engineering · Depends on: [05](05-content-model.md) §2, [09](09-progress-model.md), [10](10-exam-rules.md)

Stage A of the re-skin. This records what exists **before** the design language
changes, so the work that follows can be checked against it rather than against
memory. Every line here was read from the repository or observed on a running
server, not assumed.

---

## 1. Routes that exist

From the production build (`ƒ` = server-rendered on demand, `○` = static):

| Route | Data | Primary action |
| --- | --- | --- |
| `/` → `/dashboard` | — | redirect |
| `/dashboard` ƒ | attempts + content + progress | continue learning |
| `/topics` ○ | content | open a topic |
| `/topics/[topicSlug]` ƒ | content | start an exercise |
| `/practice` ƒ | content | pick an exercise |
| `/practice/[itemId]` ƒ | content + attempts | submit an answer |
| `/exam` ƒ | blueprints + pool + attempts | start an exam |
| `/exam/[sessionId]` ƒ | session + attempts | answer / see result |
| `/progress` ƒ | attempts + progress | revise a weak skill |
| `/admin` ○, `/admin/content` ƒ, `/admin/content/[itemId]` ƒ, `/admin/review` ○, `/admin/rubrics` ○ | content | edit / approve / publish |
| `/_not-found` ○ | — | back to dashboard |

**Every data-bearing screen is connected to real data.** There is no mock data
anywhere: the loader returns empty collections when the library is empty and each
screen renders its empty state. This is a hard rule (CLAUDE.md) and the re-skin
must not weaken it.

## 2. Components that exist

- **Shell** — `AppShell`, `AppNav` (+ mobile drawer with focus trap), `SubNav`, `NavIcons`
- **UI** — `Card`, `Badge`, `PageHeader`, `Section`, `Skeleton`
- **States** — `LoadingState`, `EmptyState`, `ErrorState`, `NotFoundState`
- **Content** — `BlockRenderer` (typed blocks), `DefectReportView`
- **Practice** — `ExerciseForm`, `SqlExerciseForm`, `FeedbackView`, `SchemaView`
- **Progress** — `DimensionBars`, `SkillProgressCard`, `reviewReason`
- **Exam** — `StartExamButton`, `refusalText`
- **Admin** — `ItemEditor`

## 3. What the design brief asks for that does not exist yet

Two different kinds of gap, and they must not be treated the same way.

**(a) Missing components — safe to build.** `Tabs`, `Accordion`, `Modal`,
`Drawer` (a bespoke one exists inside `AppNav`), `Toast`, `Tooltip`,
`DataTable`, `Pagination`, `Breadcrumbs`, `SearchField`, `FilterBar`,
`CircularProgress`, `ScoreDisplay`, `Timer`, `ConfirmDialog`, `MetricCard`,
`GlassCard`. These are presentation only and have no product prerequisites.

**(b) Missing screens whose FEATURE does not exist.** Designing these would mean
shipping an interface over nothing:

| Screen group | Blocker |
| --- | --- |
| Login / register / reset / verify / session expired | **There is no authentication.** The whole app runs on one constant, `LOCAL_USER = 'local'`. |
| Onboarding | No profile, no stored preferences, no goal model. |
| Opening diagnostic | Needs a diagnostic blueprint and a placement rule; neither is specified. |
| Mistakes-to-revise screen | Now partly possible — the misconception registry exists — but no per-learner "marked for revision" store. |
| Help/summary pages, thinking frameworks | No such content type is authored; `checklist` and `glossary_term` are modelled but unused. |
| Personal area | Same as onboarding. |

**Recommendation:** build (a) now and design (b) only when its feature lands.
A login screen that authenticates nothing, or a diagnostic that scores against
no blueprint, is mock data wearing a UI — exactly what the product rules forbid.

## 4. Consistency, RTL, mobile, accessibility

**Good already:**
- RTL is structural, not a mirror layer: `globals.css` mandates logical
  properties (`inline-start`, `margin-inline`, `padding-block`) and no physical
  direction property appears in any module. Hebrew is the default, `dir="rtl"`
  on `<html>`.
- SQL input and result tables are already forced `dir="ltr"` inside an RTL page.
- Every data screen has Loading / Empty / Error / NotFound states, and they are
  tested.
- Design tokens were already centralised, which is why the re-skin could replace
  a palette rather than rewrite components.

**Gaps found:**
- The palette was a **light** wireframe kit; the brief is dark glass. (Addressed
  in this pass — see [design-system](design-system.md).)
- `--radius-*` topped out at 12px, flatter than the reference language.
- No `--color-info` token existed, though "information" is a required functional
  colour.
- No shared glass surface token, so a glass effect would have been re-authored
  per component — the exact duplication the brief warns against.
- Two components set inline `style={{ display: 'flex', ... }}` for layout
  (`progress/page.tsx`, `dashboard/page.tsx`) instead of a module class.
- `themeColor` advertised a light variant that no longer exists.
- No chart primitive; `DimensionBars` is bespoke and would not generalise to the
  exam-results breakdown the brief asks for.
- Only two viewports are covered by tests (`useMediaQuery`); the brief lists six.

## 5. Risks

1. **Contrast under glass.** A translucent surface over a gradient has a
   *variable* background, so a single computed contrast ratio is not proof. Long
   Hebrew prose must sit on the denser glass tier, and that must be verified per
   screen, not assumed from the token.
2. **Licensing.** The reference `.fig` is a paid template. It is gitignored and
   its raster assets are not shipped; the ambient glow is rebuilt with CSS
   gradients, and icons stay with the project's existing set. No IconScout asset
   is redistributed.
3. **Scope.** The brief covers 17 screen groups and 40+ components. Doing it in
   one pass would mean unverified screens; it is sequenced in
   [design-system](design-system.md) §Rollout instead.
4. **Regression surface.** The re-skin touches shared tokens, so a mistake is
   global rather than local. `npm run verify` plus a per-route live check is the
   guard, and both ran on this pass.
