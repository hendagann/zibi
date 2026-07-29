# Scoring Examples

Status: `draft` · Owner: assessment · Depends on: [07](07-scoring-rubrics.md)

Eight fully worked evaluations. Every score here is computed by the formula in
[07](07-scoring-rubrics.md) §5 and is arithmetically verifiable without reference to any model.

Each example shows: the question, the learner's answer, deterministic check results, the score
per criterion, why each level was assigned, the raw score, the cap, the final score, the
confidence level, and the revision topics.

**These examples contain no feedback prose.** They stop where scoring stops. What the learner
would be told is produced separately, per [08](08-feedback-rules.md).

---

## Example 1 — Excellent test-design answer

**Rubric:** `RUB.TEST_DESIGN` v1 · **Item:** `TD-black-box.EX.001` v2 · **Family:** test design

### Question

> מערכת כניסה למשתמש. הדרישות: כתובת אימייל וסיסמה. אורך הסיסמה 8–20 תווים. לאחר 5 ניסיונות
> כושלים החשבון ננעל ל־15 דקות. סימון "זכור אותי" משאיר את החיבור פעיל 30 יום.
> תכנני את הבדיקות שלך למסך זה.

### Learner's answer (abridged)

> כניסה תקינה עם אימייל וסיסמה בני 8, 14 ו־20 תווים. כניסה עם סיסמה בת 7 ו־21 תווים — אמורה
> להיכשל. אימייל ללא @, אימייל עם רווח, שדות ריקים. חמישה ניסיונות כושלים ואז ניסיון שישי עם
> **סיסמה נכונה** — צריך להיחסם למרות שהסיסמה נכונה. בדיקה שאחרי 15 דקות אפשר להיכנס שוב, וגם
> בדיקה בדקה ה־14. "זכור אותי" — בדיקה שהחיבור קיים אחרי סגירת דפדפן, ובדיקה של יום 30 מול יום 31.
> נתונים: משתמש קיים, משתמש נעול, משתמש שנמחק. תלות: המסך תלוי בשירות האימות ובשעון השרת — אם
> השעון לא מסונכרן, בדיקת ה־15 דקות תיתן תוצאה שגויה. בעדיפות ראשונה הייתי בודקת את הנעילה, כי
> כשל בה הוא סיכון אבטחה, ורק אחר כך את "זכור אותי".

### Layer 1 — deterministic checks

| Check | Status | Cap | Note |
| --- | --- | --- | --- |
| `DC-GEN-01` answer submitted | `pass` | — | |
| `DC-GEN-03` on topic | `pass` | — | components detected across all criteria |
| `DC-GEN-06` no invented facts | `pass` | — | |
| `DC-TD-01` ≥ 1 scenario | `pass` | — | |
| `DC-TD-02` happy path only | `pass` | — | negative and boundary scenarios present |

### Layer 2 — criterion scores

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` הבנת הדרישה | 15 | 4 | 100 | 15.00 | all four requirements addressed, none invented |
| `c2` תרחישים חיוביים | 15 | 4 | 100 | 15.00 | valid lengths 8/14/20, successful login |
| `c3` תרחישים שליליים | 20 | 4 | 100 | 20.00 | 7 and 21 chars, malformed email, empty fields, locked-account path |
| `c4` מקרי קצה וגבולות | 15 | 4 | 100 | 15.00 | both sides of 8 and 20; minute 14 vs 15; day 30 vs 31 |
| `c5` נתוני בדיקה | 10 | 3 | 75 | 7.50 | three user states named; no mention of how data is reset between runs |
| `c6` תלויות ואינטגרציות | 10 | 3 | 75 | 7.50 | auth service and server clock identified; no session-store dependency |
| `c7` סיכונים ותעדוף | 10 | 4 | 100 | 10.00 | lockout prioritised with a stated security rationale |
| `c8` בהירות ומבנה | 5 | 4 | 100 | 5.00 | grouped, ordered, unambiguous |

The sixth-attempt-with-a-correct-password case is what carries `c3` to level 4. It tests the
lockout rule rather than the password rule, which is the distinction the requirement actually
contains.

### Result

| | |
| --- | ---: |
| Raw score | **95.00** |
| Penalties | 0 |
| Cap | 100 (none triggered) |
| **Final score** | **95** |

**Confidence:** `high` — every criterion has evidence spans; no ambiguity.

**Skills:** measured `DOC.REQ`, `TD.EP`, `TD.BVA`, `MGMT.DATA`, `LIFE.LEVEL`, `MGMT.RISK`,
`DOC.TC` · demonstrated all except `MGMT.DATA`, `LIFE.LEVEL` at full.

**Revision topics:** `MGMT/infrastructure` (test data lifecycle), `LIFE/levels-types`
(integration dependencies). No link for level-4 criteria.

---

## Example 2 — Partial test-design answer

**Rubric:** `RUB.TEST_DESIGN` v1 · same item.

### Learner's answer

> אבדוק כניסה עם אימייל וסיסמה נכונים. אבדוק סיסמה קצרה מדי וסיסמה ארוכה מדי. אבדוק שאחרי 5
> ניסיונות החשבון ננעל. אבדוק ש"זכור אותי" עובד. אבדוק שאי אפשר להיכנס בלי אימייל.

### Layer 1

All checks `pass`. `DC-TD-02` passes — negative scenarios are present, if thin.

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` הבנת הדרישה | 15 | 3 | 75 | 11.25 | all four requirements touched, none developed |
| `c2` תרחישים חיוביים | 15 | 3 | 75 | 11.25 | valid login present, no data variation |
| `c3` תרחישים שליליים | 20 | 2 | 50 | 10.00 | "too short"/"too long" stated without values; missing email covered |
| `c4` מקרי קצה וגבולות | 15 | 1 | 25 | 3.75 | no boundary value named; 8/20 never appear |
| `c5` נתוני בדיקה | 10 | 1 | 25 | 2.50 | implied only |
| `c6` תלויות ואינטגרציות | 10 | 0 | 0 | 0.00 | absent |
| `c7` סיכונים ותעדוף | 10 | 1 | 25 | 2.50 | ordering implied by sequence, no rationale |
| `c8` בהירות ומבנה | 5 | 2 | 50 | 2.50 | readable, flat list, no grouping |

`c4` at level 1 rather than 2 is the key judgement. "Too short" and "too long" show awareness
that bounds exist, which is not nothing — but no boundary value is named, so coverage over the
`must` components (`8`, `7`, `20`, `21`) is zero and only the `should` component "recognises
bounded input" is detected. Coverage lands below 0.30 → level 1.

### Result

| | |
| --- | ---: |
| Raw score | **43.75** |
| Penalties | 0 |
| Cap | 100 |
| **Final score** | **44** (`round_half_up(43.75)`) |

**Confidence:** `medium` — several criteria rest on brief statements where intent is inferable
but not explicit.

**Revision topics:** `TD/black-box` (boundary value analysis), `LIFE/levels-types`,
`MGMT/risk`.

---

## Example 3 — Weak test-design answer

**Rubric:** `RUB.TEST_DESIGN` v1 · same item.

### Learner's answer

> אכניס אימייל וסיסמה נכונים ואוודא שהמערכת מכניסה אותי. אסמן "זכור אותי" ואוודא שאני נשארת
> מחוברת. אבדוק שהמסך נראה טוב ושהכפתורים עובדים.

### Layer 1

| Check | Status | Cap | Note |
| --- | --- | --- | --- |
| `DC-GEN-01` | `pass` | — | |
| `DC-GEN-03` on topic | `pass` | — | positive-scenario components detected |
| `DC-TD-01` | `pass` | — | |
| **`DC-TD-02` happy path only** | **`fail`** | — | **forces `c3` and `c4` to level 0** |

`DC-TD-02` imposes no numeric cap. It sets the two criteria to level 0, which states the
finding precisely rather than hiding it behind a ceiling ([07](07-scoring-rubrics.md) §3.5).

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` הבנת הדרישה | 15 | 2 | 50 | 7.50 | login and "remember me" understood; length and lockout rules untouched |
| `c2` תרחישים חיוביים | 15 | 3 | 75 | 11.25 | valid login and remember-me both covered |
| `c3` תרחישים שליליים | 20 | **0** | 0 | 0.00 | forced by `DC-TD-02` |
| `c4` מקרי קצה וגבולות | 15 | **0** | 0 | 0.00 | forced by `DC-TD-02` |
| `c5` נתוני בדיקה | 10 | 1 | 25 | 2.50 | "correct password" implies a valid user only |
| `c6` תלויות ואינטגרציות | 10 | 0 | 0 | 0.00 | absent |
| `c7` סיכונים ותעדוף | 10 | 0 | 0 | 0.00 | absent |
| `c8` בהירות ומבנה | 5 | 2 | 50 | 2.50 | clear but unstructured |

"אבדוק שהמסך נראה טוב ושהכפתורים עובדים" is a `non_scoring` component: not wrong, not a test,
and it earns nothing ([07](07-scoring-rubrics.md) §4.2).

### Result

| | |
| --- | ---: |
| Raw score | **23.75** |
| **Final score** | **24** |

**Confidence:** `high` — the omission is unambiguous, not a matter of reading.

**Revision topics:** `TD/black-box`, `TD/experience-based`, `MGMT/risk`.

---

## Example 4 — Complete bug report

**Rubric:** `RUB.BUG_REPORT` v1 · **Item:** `DOC-defects.EX.004` v1

### Question

> באתר מסחר: בעגלת קניות עם 3 פריטים, לחיצה על "עדכן כמות" של הפריט השני מעדכנת את הכמות של
> הפריט הראשון. כתבי דיווח באג.

### Learner's answer

> **כותרת:** עדכון כמות בעגלה מעדכן את הפריט השגוי כאשר בעגלה יותר מפריט אחד
> **סביבה:** Chrome 141, Windows 11, סביבת Staging, גרסה 4.2.1
> **תנאים מקדימים:** משתמש מחובר, בעגלה 3 פריטים שונים
> **צעדי שחזור:** 1. להיכנס לעגלה. 2. לשנות את שדה הכמות של הפריט השני מ־1 ל־3. 3. ללחוץ "עדכן כמות".
> **תוצאה בפועל:** הכמות של הפריט הראשון השתנתה ל־3. הכמות של הפריט השני נשארה 1.
> **תוצאה מצופה:** הכמות של הפריט השני משתנה ל־3, שאר הפריטים ללא שינוי.
> **ראיות:** צילום מסך לפני ואחרי, מצורף.
> **חומרה:** גבוהה — הלקוח מחויב על כמות שלא הזמין, וזו פגיעה ישירה בכסף ובאמון. קורה בכל
> עגלה עם יותר מפריט אחד, כלומר ברוב ההזמנות.

### Layer 1

| Check | Status | Cap |
| --- | --- | --- |
| `DC-BUG-01` reproduction steps | `pass` | — |
| `DC-BUG-02` Actual Result | `pass` | — |
| `DC-BUG-03` Expected Result | `pass` | — |
| `DC-BUG-04` defect identifiable | `pass` | — |
| `DC-BUG-05` environment | `pass` | — |
| `DC-BUG-06` severity | `pass` | — |
| `DC-BUG-07` steps ordered | `pass` | — |

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` כותרת | 8 | 4 | 100 | 8.00 | states the fault and its condition, not just "bug in cart" |
| `c2` סביבת בדיקה | 8 | 4 | 100 | 8.00 | browser, OS, environment and build all present |
| `c3` תנאים מקדימים | 7 | 3 | 75 | 5.25 | user and cart state given; item types not specified |
| `c4` צעדי שחזור | 22 | 4 | 100 | 22.00 | numbered, specific, independently executable |
| `c5` Actual Result | 12 | 4 | 100 | 12.00 | states what happened to *both* items |
| `c6` Expected Result | 12 | 4 | 100 | 12.00 | observable and complete |
| `c7` ראיות | 8 | 3 | 75 | 6.00 | before/after screenshots; no console or network capture |
| `c8` חומרה והנמקתה | 13 | 4 | 100 | 13.00 | severity justified by financial impact *and* frequency |
| `c9` ניסוח ניטרלי | 10 | 4 | 100 | 10.00 | factual throughout; no cause asserted, no blame |

`c5` reaching level 4 depends on recording that the second item stayed at 1. Stating only that
the first item changed would leave a developer unsure whether the update was duplicated or
misrouted.

### Result

| | |
| --- | ---: |
| Raw score | **96.25** |
| Cap | 100 |
| **Final score** | **96** |

**Confidence:** `high`.

**Revision topics:** `DOC/defects` (evidence depth). None for the level-4 criteria.

---

## Example 5 — Bug report without an Expected Result

**Rubric:** `RUB.BUG_REPORT` v1 · same item.

### Learner's answer

> **כותרת:** עדכון כמות בעגלה מעדכן את הפריט השגוי
> **סביבה:** Chrome 141, Windows 11, סביבת Staging, גרסה 4.2.1
> **תנאים מקדימים:** משתמש מחובר, בעגלה 3 פריטים
> **צעדי שחזור:** 1. להיכנס לעגלה. 2. לשנות את שדה הכמות של הפריט השני מ־1 ל־3. 3. ללחוץ "עדכן כמות".
> **תוצאה בפועל:** הכמות של הפריט הראשון השתנתה ל־3. הכמות של הפריט השני נשארה 1.
> **ראיות:** צילום מסך לפני ואחרי, מצורף.
> **חומרה:** גבוהה — הלקוח מחויב על כמות שלא הזמין.

Everything a strong report needs is here **except** a stated Expected Result.

### Layer 1

| Check | Status | Cap | Error |
| --- | --- | --- | --- |
| `DC-BUG-01` reproduction steps | `pass` | — | |
| `DC-BUG-02` Actual Result | `pass` | — | |
| **`DC-BUG-03` Expected Result** | **`fail`** | **60** | `E-BUG-003` |
| `DC-BUG-04` defect identifiable | `pass` | — | |
| `DC-BUG-05` environment | `pass` | — | |
| `DC-BUG-06` severity | `pass` | — | |
| `DC-BUG-07` steps ordered | `pass` | — | |

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` כותרת | 8 | 3 | 75 | 6.00 | names the fault, omits the condition that triggers it |
| `c2` סביבת בדיקה | 8 | 4 | 100 | 8.00 | browser, OS, environment and build all present |
| `c3` תנאים מקדימים | 7 | 3 | 75 | 5.25 | user and cart state given; item types not specified |
| `c4` צעדי שחזור | 22 | 4 | 100 | 22.00 | numbered, specific, independently executable |
| `c5` Actual Result | 12 | 4 | 100 | 12.00 | states what happened to both items |
| `c6` Expected Result | 12 | **0** | 0 | 0.00 | **absent** |
| `c7` ראיות | 8 | 3 | 75 | 6.00 | before/after screenshots; no console or network capture |
| `c8` חומרה והנמקתה | 13 | 3 | 75 | 9.75 | justified by financial impact; frequency not considered |
| `c9` ניסוח ניטרלי | 10 | 4 | 100 | 10.00 | factual throughout; no cause asserted |

### Result

| | |
| --- | ---: |
| Raw score | **79.00** |
| Penalties | 0 |
| **Cap** | **60** (`DC-BUG-03`, `cap_source: E-BUG-003`) |
| Capped score | 60.00 |
| **Final score** | **60** |

The cap is the whole point of this example. The report earns **79** on its merits — the steps
are reproducible, the environment is complete, the severity is justified — and one missing
field reduces it to **60**. That is the intended behaviour, not a harsh one: without a stated
expectation, a developer cannot know what "fixed" means, and a reader cannot tell whether the
reporter understood the requirement or merely noticed something odd. No amount of quality
elsewhere substitutes for it.

Note also that `c6` scoring 0 and the cap are **not** double punishment for the same fault.
`c6` records that the criterion earned nothing; the cap records that the report as a whole is
structurally incomplete. Removing either would misstate the result — without the cap an
otherwise strong report would pass at 79 while being unusable, and without the zero the
criterion table would not show which field was missing.

**Confidence:** `high` — the missing field is a deterministic finding, and every other
criterion has clear evidence.

**Revision topics:** `DOC/defects` (Expected Result; severity justification).

---

## Example 6 — Correct SQL, written differently from the model answer

**Rubric:** `RUB.SQL` v1 (all criteria applicable) · **Item:** `TECH-data.EX.012` v1

### Question

> החזירי את כתובת האימייל של כל לקוח שביצע הזמנה בסכום העולה על 500 ₪ במהלך 2025, יחד עם תאריך
> ההזמנה. ללא כפילויות.

### Reference solution (one of several)

```sql
SELECT DISTINCT c.email, o.order_date
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.total > 500 AND o.order_date >= '2025-01-01' AND o.order_date < '2026-01-01';
```

### Learner's answer

```sql
SELECT c.email, o.order_date
FROM orders o, customers c
WHERE c.id = o.customer_id
  AND o.total > 500
  AND YEAR(o.order_date) = 2025
GROUP BY c.email, o.order_date;
```

An implicit join, `GROUP BY` instead of `DISTINCT`, and a function on the date column.

### Layer 1

| Check | Status | Note |
| --- | --- | --- |
| `DC-SQL-01` parses | `pass` | |
| `DC-SQL-02` read-only | `pass` | |
| `DC-SQL-03` single statement | `pass` | |
| `DC-SQL-04` within timeout | `pass` | |
| `DC-SQL-05` result shape | `pass` | two columns, correct semantics |
| `DC-SQL-06` visible fixture | `pass` | identical result set |
| `DC-SQL-07` hidden fixture | `pass` | identical result set |
| `DC-SQL-08` banned constructs | `pass` | none declared |

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` הבנת המשימה | 10 | 4 | 100 | 10.00 | all three conditions addressed |
| `c2` בחירת טבלאות ושדות | 15 | 4 | 100 | 15.00 | correct tables, exactly the required columns |
| `c3` חיבור בין טבלאות | 20 | 4 | 100 | 20.00 | tables correctly related on the right key |
| `c4` תנאי סינון | 15 | 4 | 100 | 15.00 | amount and year both correct |
| `c5` נכונות התוצאה | 25 | 4 | 100 | 25.00 | matches on visible **and** hidden fixtures |
| `c6` טיפול במקרי קצה | 10 | 3 | 75 | 7.50 | duplicates handled via `GROUP BY`; NULL emails not considered |
| `c7` בהירות השאילתה | 5 | 3 | 75 | 3.75 | correct and readable; implicit join is dated style |

**No penalty is applied for differing from the reference.** `c3` scores level 4 on an implicit
join because the criterion measures whether the tables are correctly related on the right key,
which this does. `YEAR(o.order_date) = 2025` is not index-friendly, but efficiency is scored
only when the item declares it as a goal ([07](07-scoring-rubrics.md) §9.1), and this item does
not. It costs a quarter of `c7`, not correctness.

### Result

| | |
| --- | ---: |
| Raw score | **96.25** |
| **Final score** | **96** |

**Confidence:** `high` — result-set equality on both fixtures is deterministic.

**Revision topics:** `TECH/data` (NULL handling). Style is noted, never penalised as an error.

---

## Example 7 — Partial SQL

**Rubric:** `RUB.SQL` v1 · same item.

### Learner's answer

```sql
SELECT c.email, o.order_date
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.total >= 500
  AND o.order_date BETWEEN '2025-01-01' AND '2025-12-31';
```

Two faults: `>= 500` includes exactly 500, which the requirement excludes; and no de-duplication,
so a customer with two qualifying orders on the same date appears twice.

### Layer 1

| Check | Status | Cap | Error |
| --- | --- | --- | --- |
| `DC-SQL-01` parses | `pass` | — | |
| `DC-SQL-02` read-only | `pass` | — | |
| `DC-SQL-04` timeout | `pass` | — | |
| `DC-SQL-05` result shape | `pass` | — | correct columns |
| **`DC-SQL-06` visible fixture** | **`fail`** | 100 | `E-SQL-006` |
| **`DC-SQL-07` hidden fixture** | **`fail`** | 100 | `E-SQL-007` |

Per [07](07-scoring-rubrics.md) §9.3, a query that runs but returns the wrong result sets `c5`
to level 0 and imposes **no cap** — the structural criteria stand on their own merits.

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` הבנת המשימה | 10 | 3 | 75 | 7.50 | all three conditions attempted; boundary misread |
| `c2` בחירת טבלאות ושדות | 15 | 4 | 100 | 15.00 | correct throughout |
| `c3` חיבור בין טבלאות | 20 | 3 | 75 | 15.00 | correct join; no consideration of the duplication it creates |
| `c4` תנאי סינון | 15 | 2 | 50 | 7.50 | date range correct; amount boundary wrong |
| `c5` נכונות התוצאה | 25 | **0** | 0 | 0.00 | fails on both fixtures |
| `c6` טיפול במקרי קצה | 10 | 1 | 25 | 2.50 | `BETWEEN` shows date-boundary awareness; duplicates unaddressed |
| `c7` בהירות השאילתה | 5 | 3 | 75 | 3.75 | clean and readable |

The learner is not zeroed for one boundary error. `c4` at level 2 and `c5` at level 0 record
precisely what went wrong, and the join and column work still earn what it is worth — which is
the behaviour that lets the next attempt be targeted rather than repeated wholesale.

### Result

| | |
| --- | ---: |
| Raw score | **51.25** |
| Cap | 100 (none) |
| **Final score** | **51** |

**Confidence:** `high` — result comparison is deterministic.

**Revision topics:** `TECH/data` (exclusive vs inclusive bounds; duplicate handling),
`TD/black-box` (boundary value analysis — the same misreading as `>` vs `>=` in test design).

---

## Example 8 — Prioritisation with a different decision and valid reasoning

**Rubric:** `RUB.PRIORITISATION` v1 · **Item:** `MGMT-risk.EX.003` v1

### Question

> נותרו יומיים לשחרור. שני פגמים פתוחים:
> **א.** תשלום בכרטיס Amex נכשל בקופה. 3% מהמשתמשים. אין פתרון עוקף.
> **ב.** העלאת תמונת פרופיל נכשלת ב־Android 12. 18% מהמשתמשים. קיים פתרון עוקף — העלאה דרך האתר.
> במה תטפלי קודם ולמה?

### Reference decision

Defect **א** first — revenue-blocking with no workaround.

### Learner's answer

> אני מתחילה מ־ב', אבל לא לפני שאני עוצרת את א'. א' הוא חמור יותר לכל משתמש שנתקל בו — הוא לא
> יכול לשלם, אין לו מה לעשות, וזו פגיעה ישירה בהכנסה. אבל תיקון בקופה יומיים לפני שחרור הוא
> שינוי מסוכן בדיוק ברכיב שהכי יקר להישבר. לכן ההמלצה שלי היא **להסתיר את Amex כאמצעי תשלום עד
> שהתיקון ייבדק כמו שצריך** — זה מוריד את 3% מהסיכון בלי לגעת בקוד הקופה, והמשתמשים האלה יכולים
> לשלם באמצעי אחר. אחרי שזה נסגר, ב' הוא מה שנשאר: הוא נוגע ב־18% מהמשתמשים, ולמרות שיש פתרון
> עוקף, פתרון עוקף שדורש לעבור למכשיר אחר הוא לא באמת פתרון עבור משתמש מובייל. הייתי בודקת אם
> הכשל ב־Android 12 הוא בהרשאות או בגודל הקובץ, כי זה משנה כמה התיקון מסוכן.
> מה שהייתי צריכה כדי להחליט בוודאות: כמה מההכנסה מגיעה דרך Amex, ומתי נסגר חלון הבדיקות.

### Layer 1

| Check | Status |
| --- | --- |
| `DC-GEN-01` submitted | `pass` |
| `DC-GEN-03` on topic | `pass` |
| `DC-GEN-06` no invented facts | `pass` — the Amex-disable proposal is a recommendation, not an asserted fact |

### Layer 2

| Criterion | Wt | Level | % | Points | Why |
| --- | ---: | :-: | ---: | ---: | --- |
| `c1` זיהוי הסיכון | 15 | 4 | 100 | 15.00 | both defects named with their actual risk, plus the risk of the fix itself |
| `c2` חומרת ההשפעה | 15 | 4 | 100 | 15.00 | per-user severity separated from population size |
| `c3` הסתברות | 10 | 3 | 75 | 7.50 | implied from the stated percentages; not reasoned independently |
| `c4` היקף המשתמשים | 10 | 4 | 100 | 10.00 | 3% and 18% both used, and weighed against severity |
| `c5` השפעה עסקית | 10 | 4 | 100 | 10.00 | revenue impact identified as the deciding axis |
| `c6` פתרון עוקף והתאוששות | 10 | 4 | 100 | 10.00 | challenges the stated workaround on its merits |
| `c7` תלויות וזמן שנותר | 10 | 3 | 75 | 7.50 | fix risk near release recognised; test window named as unknown |
| `c8` איכות ההנמקה | 12 | 4 | 100 | 12.00 | every step justified; a third option constructed rather than chosen from two |
| `c9` עקביות עם התרחיש | 8 | 4 | 100 | 8.00 | no stated fact contradicted |

**The decision differs from the reference and this costs nothing.** Under
[07](07-scoring-rubrics.md) §12 no points are awarded or withheld for agreement. What earns
`c8` at level 4 is that the learner recognised the choice was not binary and proposed a
risk-reducing action that does not require touching checkout code two days before release.

Naming what they would need in order to be certain — Amex revenue share, test window — earns
`c7` rather than costing anything. Identifying a genuine information gap is professional
behaviour, not evasion.

### Result

| | |
| --- | ---: |
| Raw score | **95.00** |
| **Final score** | **95** |

**Confidence:** `high`. Note that a *disagreeing* human reviewer would not lower this — §12
scores the reasoning, and disagreement with a well-reasoned decision is not an error signal.

**Revision topics:** `MGMT/risk` (likelihood as an independent factor). Nothing else — this is
a strong answer that happens not to match the reference.

---

## Arithmetic summary

Every final score above is reproducible from its criterion table alone.

| # | Example | Raw | Cap | Final | Confidence |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Test design — excellent | 95.00 | — | **95** | `high` |
| 2 | Test design — partial | 43.75 | — | **44** | `medium` |
| 3 | Test design — weak | 23.75 | — | **24** | `high` |
| 4 | Bug report — complete | 96.25 | — | **96** | `high` |
| 5 | Bug report — no Expected Result | 79.00 | **60** | **60** | `high` |
| 6 | SQL — correct, different form | 96.25 | — | **96** | `high` |
| 7 | SQL — partial | 51.25 | — | **51** | `high` |
| 8 | Prioritisation — different decision | 95.00 | — | **95** | `high` |

Three properties are visible across the set, and each is a requirement rather than a
coincidence. Examples 2 and 3 show a partial answer scoring above a weak one and both scoring
above zero. Example 5 shows a cap overriding earned points. Examples 6 and 8 show answers that
diverge from the reference solution scoring at the top of the range.
