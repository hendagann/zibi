# content/

Authored learning data. **Not code.**

Everything the learner reads or answers lives here as JSON, loaded by
`src/content/loader.ts` and passed into components as props. No component may
contain learning content, and nothing here may contain UI logic — the boundary
and its rationale are in [docs/05-content-model.md](../docs/05-content-model.md) §2.

## Layout

```
content/
  domains/    one file per domain      (docs/03 §7)
  topics/     one file per topic       (docs/05 §9)
  skills/     one file per skill       (docs/03 §7)
  items/      summaries, lessons, guided examples, exercises, exam items
  rubrics/    scoring rubrics          (docs/07 §15)
  sources/    the source registry      (docs/14 §2)
```

## Status

Empty. No content has been authored yet, so every surface in the application
renders its empty state. That is the correct behaviour, not a gap to be filled
with sample data — `CLAUDE.md` forbids mock data in production flows, and
`docs/05` §7 serves only `approved` items.

Directories are created as the first file in each is authored; the loader
treats a missing directory as an empty collection.
