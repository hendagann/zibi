# Project instructions

This repository contains an adaptive learning platform for manual QA exam preparation.

## Source of truth

Before planning or implementing any feature, read:

- @docs/01-product-vision.md
- @docs/03-skill-map.md
- @docs/04-learning-path.md
- @docs/05-content-model.md
- @docs/06-question-model.md
- @docs/07-scoring-rubrics.md
- @docs/08-feedback-rules.md
- @docs/09-progress-model.md
- @docs/10-exam-rules.md
- @docs/11-user-flows.md
- @docs/13-acceptance-tests.md

## Mandatory workflow

1. Inspect the existing implementation.
2. Produce a written implementation plan.
3. State assumptions and risks.
4. Implement only the requested phase.
5. Validate all data structures.
6. Run tests, lint and production build.
7. Compare the result against the acceptance criteria.
8. Do not mark a task complete when tests fail.
9. Do not use mock data in completed production flows.
10. Do not change unrelated features.

## Product rules

- Learning content must never be hardcoded inside UI components.
- Every exercise must have a rubric.
- Every scored answer must produce structured feedback.
- Progress must represent demonstrated ability, not page completion.
- Every content item must include source and review status.
- AI-generated feedback must not replace deterministic validation where a deterministic answer exists.
