// זיבי — מודל תוכן משותף לכל המסכים. התוכן חי כאן, לא בתוך רכיבי הממשק.
export const USER = { name: 'נועה', initial: 'נ' };

export const FILES = {
  dashboard: '02 דשבורד.dc.html',
  topics: '03 מפת נושאים.dc.html',
  lesson: '04 דף נושא.dc.html',
  practice: '05 תרגול.dc.html',
  feedback: '06 משוב.dc.html',
  sql: '07 סביבת SQL.dc.html',
  exams: '08 מבחנים.dc.html',
  results: '09 תוצאות מבחן.dc.html',
  progress: '10 התקדמות.dc.html',
  tokens: '00 שפת עיצוב.dc.html',
  components: '01 רכיבים.dc.html',
};

export const NAV = [
  { group: 'ראשי', items: [
    { id: 'dashboard', label: 'דשבורד', icon: 'layout-grid', href: FILES.dashboard },
    { id: 'topics', label: 'מפת נושאים', icon: 'map', href: FILES.topics },
    { id: 'practice', label: 'תרגול', icon: 'pencil', href: FILES.practice },
    { id: 'exams', label: 'מבחנים', icon: 'clipboard-check', href: FILES.exams },
    { id: 'progress', label: 'התקדמות', icon: 'trending-up', href: FILES.progress },
  ]},
  { group: 'משאבים', items: [
    { id: 'mistakes', label: 'טעויות לחזרה', icon: 'rotate-ccw', href: '#' },
    { id: 'refs', label: 'דפי עזר', icon: 'file-text', href: '#' },
    { id: 'thinking', label: 'שיטות חשיבה', icon: 'lightbulb', href: '#' },
  ]},
];

// ── חמשת הממדים ─────────────────────────────────────────────
export const DIMENSIONS = [
  { id: 'knowledge', name: 'ידע', icon: 'book-open', score: 82, delta: 4, note: 'מושגים ועקרונות' },
  { id: 'application', name: 'יישום', icon: 'wrench', score: 74, delta: 6, note: 'ביצוע מוכח בתרגילים' },
  { id: 'thinking', name: 'חשיבה', icon: 'lightbulb', score: 68, delta: 2, note: 'ניתוח, תעדוף והנמקה' },
  { id: 'speed', name: 'מהירות', icon: 'zap', score: 61, delta: -3, note: 'עמידה בזמני יעד' },
  { id: 'stability', name: 'יציבות', icon: 'activity', score: null, delta: null, note: 'דרושים עוד 2 מבחנים מלאים למדידה' },
];

export const READINESS = {
  score: 72, target: 75, deltaWeek: 5, confidence: 'בינונית', completion: 58,
  nextStep: { label: 'חזרה ממוקדת: ניתוח דרישות', reason: '3 שבועות ללא תרגול · טעות חוזרת בזיהוי דרישות חסרות', href: FILES.lesson },
};

export const CONTINUE = [
  { icon: 'book-open', title: 'דיווח תקלה אפקטיבי', meta: 'שיעור · חלק 6 מתוך 9 · טעויות נפוצות', progress: 62, cta: 'המשך קריאה', href: FILES.lesson, unsaved: false },
  { icon: 'pencil', title: 'תרגיל: דיווח תקלה מלא', meta: 'טיוטה מאתמול · לא הוגשה', progress: null, cta: 'חזרה לטיוטה', href: FILES.practice, unsaved: true },
  { icon: 'clipboard-check', title: 'מבחן נושא: SQL לבודקי תוכנה', meta: 'מומלץ · 25 דק׳', progress: null, cta: 'לפרטים', href: FILES.exams, unsaved: false },
];

export const WEAKNESSES = [
  { topic: 'ניתוח דרישות', n: 4, score: 58, reason: 'טעות חוזרת: זיהוי דרישות חסרות — הופיעה ב־3 התרגילים האחרונים', action: 'תרגול ממוקד' },
  { topic: 'SQL · JOIN', n: 10, score: 62, reason: 'יציבות נמוכה: 84 ואז 52 בשני ניסיונות עוקבים', action: 'תרגיל מדורג' },
  { topic: 'תחקור תקלות', n: 16, score: 55, reason: 'חריגת זמן ממוצעת פי 2 מהיעד · מסקנה מוקדמת ללא ראיות', action: 'שיטת חשיבה + תרגיל' },
];

export const ACTIVITY = [
  { icon: 'check-circle', kind: 'success', title: 'תרגיל ״דיווח תקלה — שינוי כתובת״ הוגש', meta: 'היום · 09:40', value: '86' },
  { icon: 'clipboard-check', kind: 'default', title: 'מבחן נושא SQL הושלם', meta: 'אתמול · 21:40', value: '71' },
  { icon: 'book-open', kind: 'default', title: 'נקרא: לוגים וניטור — חלק 2', meta: 'אתמול · 20:15', value: '' },
  { icon: 'alert-triangle', kind: 'warn', title: 'טיוטת תרגיל בניתוח דרישות לא הוגשה', meta: 'לפני יומיים', value: '' },
  { icon: 'award', kind: 'accent', title: '״יסודות בדיקות תוכנה״ הגיע לרמת ״מוכן למבחן״', meta: 'לפני 3 ימים', value: '95' },
];

export const EXAM_BLUEPRINT = [
  { name: 'ניתוח דרישה', minutes: 4 }, { name: 'דיווח תקלה', minutes: 3 },
  { name: 'SQL', minutes: 4 }, { name: 'תחקור תקלה', minutes: 4 },
  { name: 'תעדוף', minutes: 2 }, { name: 'החלטה מקצועית', minutes: 3 },
];

export const NEXT_EXAM = {
  title: 'מבחן מתכונת מלא', minutes: 20, sections: 6, status: 'זמין',
  hint: 'מומלץ לאחר חזרה על ניתוח דרישות', blueprint: EXAM_BLUEPRINT,
};

// ── מפת נושאים ──────────────────────────────────────────────
export const STATUS = {
  not_started: { label: 'לא התחיל', icon: 'circle', color: '#7C86AC', soft: 'rgba(124,134,172,0.14)' },
  started: { label: 'התחיל', icon: 'circle-dot', color: '#12808E', soft: 'rgba(18,128,142,0.12)' },
  needs_review: { label: 'דורש חזרה', icon: 'rotate-ccw', color: '#A16A0B', soft: 'rgba(161,106,11,0.12)' },
  partial: { label: 'שליטה חלקית', icon: 'gauge', color: '#55608F', soft: 'rgba(85,96,143,0.12)' },
  solid: { label: 'בשליטה', icon: 'check-circle', color: '#237A4B', soft: 'rgba(35,122,75,0.12)' },
  exam_ready: { label: 'מוכן למבחן', icon: 'award', color: '#243B8F', soft: 'rgba(36,59,143,0.12)' },
};

export const CLUSTERS = [
  'יסודות ותהליכים', 'דרישות, תכנון ותיעוד', 'תקלות, לוגים ותחקור',
  'טכני: SQL, API ופלטפורמות', 'רגרסיה, סיכונים ושחרור', 'חשיבה, תקשורת והכנה',
];

const T = (n, name, cluster, icon, status, mastery, lastScore, stability, prereq, last) =>
  ({ n, name, cluster, icon, status, mastery, lastScore, stability, prereq, last });

export const TOPICS = [
  T(1, 'יסודות בדיקות תוכנה', 0, 'book-open', 'exam_ready', 95, 95, 'יציבה', null, 'לפני 3 ימים'),
  T(2, 'תהליכי פיתוח ובדיקות', 0, 'layers', 'solid', 88, 90, 'יציבה', null, 'לפני שבוע'),
  T(3, 'סוגי ורמות בדיקה', 0, 'target', 'partial', 71, 74, 'משתפרת', null, 'לפני 5 ימים'),
  T(4, 'ניתוח דרישות', 1, 'search', 'needs_review', 58, 58, 'נסוגה', null, 'לפני 3 שבועות'),
  T(5, 'טכניקות לתכנון בדיקות', 1, 'list-checks', 'partial', 66, 70, 'יציבה', null, 'לפני שבוע'),
  T(6, 'כתיבת Test Scenarios', 1, 'list', 'started', 34, 61, null, null, 'לפני 4 ימים'),
  T(7, 'כתיבת Test Cases', 1, 'file-text', 'solid', 84, 82, 'יציבה', null, 'לפני 6 ימים'),
  T(8, 'מסמכי בדיקות', 1, 'copy', 'started', 22, null, null, null, 'לפני יומיים'),
  T(9, 'דיווח וניהול תקלות', 2, 'flag', 'partial', 76, 86, 'משתפרת', null, 'היום'),
  T(10, 'SQL לבודקי תוכנה', 3, 'database', 'needs_review', 62, 52, 'נסוגה', null, 'אתמול'),
  T(11, 'בדיקות API', 3, 'terminal', 'started', 41, 64, null, null, 'לפני שבוע'),
  T(12, 'בדיקות Web', 3, 'globe', 'partial', 69, 72, 'יציבה', null, 'לפני שבועיים'),
  T(13, 'בדיקות Mobile', 3, 'smartphone', 'not_started', 0, null, null, null, null),
  T(14, 'אינטגרציות ותהליכים חוצי מערכות', 3, 'git-merge', 'not_started', 0, null, null, { n: 11, name: 'בדיקות API', met: false }, null),
  T(15, 'לוגים וניטור', 2, 'align-list', 'started', 28, null, null, null, 'אתמול'),
  T(16, 'תחקור תקלות', 2, 'search-code', 'needs_review', 55, 55, 'נסוגה', { n: 15, name: 'לוגים וניטור', met: false }, 'לפני שבועיים'),
  T(17, 'Regression ו־Impact Analysis', 4, 'refresh-cw', 'partial', 64, 68, 'יציבה', null, 'לפני 10 ימים'),
  T(18, 'סיכונים ותעדוף', 4, 'shield-check', 'solid', 81, 90, 'יציבה', null, 'לפני 5 ימים'),
  T(19, 'Release ו־Production', 4, 'package', 'not_started', 0, null, null, { n: 17, name: 'Regression ו־Impact Analysis', met: false }, null),
  T(20, 'חשיבה מערכתית של בודק מנוסה', 5, 'lightbulb', 'started', 37, null, null, null, 'לפני שבוע'),
  T(21, 'תקשורת מקצועית ועבודה בצוות', 5, 'message-square', 'partial', 72, 75, 'יציבה', null, 'לפני שבועיים'),
  T(22, 'הכנה למבחנים מקצועיים', 5, 'graduation-cap', 'started', 45, 68, 'משתפרת', null, 'לפני 3 ימים'),
  T(23, 'הכנה לראיונות QA', 5, 'briefcase', 'not_started', 0, null, null, { n: 22, name: 'הכנה למבחנים מקצועיים', met: false }, null),
];

// ── דף נושא: דיווח תקלה אפקטיבי ─────────────────────────────
export const LESSON = {
  topicN: 9, topic: 'דיווח וניהול תקלות', title: 'דיווח תקלה אפקטיבי',
  minutes: 35, progress: 62, currentPart: 6,
  parts: [
    { n: 1, label: 'מטרת הלמידה', done: true }, { n: 2, label: 'מהו דיווח אפקטיבי', done: true },
    { n: 3, label: 'מבנה הדיווח', done: true }, { n: 4, label: 'דרך החשיבה ושיטת עבודה', done: true },
    { n: 5, label: 'דוגמאות פתורות', done: true }, { n: 6, label: 'טעויות נפוצות', done: false },
    { n: 7, label: 'Checklist לפני הגשה', done: false }, { n: 8, label: 'תרגילים', done: false },
    { n: 9, label: 'מבחן נושא', done: false },
  ],
  goal: 'בסיום הנושא תוכלו לכתוב דיווח תקלה ברור, מקצועי וניתן לשחזור, כך שמפתח או בודק אחר יוכלו להבין מה קרה, לשחזר את הבעיה ולהתחיל לחקור אותה — ללא שאלות בסיסיות נוספות.',
  whatIntro: 'דיווח תקלה הוא תיעוד מסודר של פער בין ההתנהגות הצפויה של המערכת לבין ההתנהגות שהתרחשה בפועל. דיווח טוב אינו רק אומר שקיימת בעיה — הוא מספק את כל המידע הנדרש כדי:',
  whatGoals: ['להבין מה השתבש', 'לשחזר את התקלה', 'להעריך את חומרת ההשפעה', 'לזהות את האזור שנפגע', 'להתחיל את תהליך התחקור והתיקון'],
  structure: [
    { name: 'כותרת', desc: 'תיאור קצר ומדויק של התקלה' },
    { name: 'סביבת בדיקה', desc: 'מערכת הפעלה, דפדפן, גרסה, מכשיר וסביבה' },
    { name: 'תנאים מקדימים', desc: 'מצב המערכת לפני תחילת הבדיקה' },
    { name: 'צעדים לשחזור', desc: 'פעולות ברורות וממוספרות' },
    { name: 'תוצאה בפועל', desc: 'מה קרה במערכת' },
    { name: 'תוצאה צפויה', desc: 'מה היה אמור לקרות' },
    { name: 'ראיות', desc: 'צילום מסך, וידאו, לוגים, מזהה בקשה או נתוני בדיקה' },
    { name: 'חומרה', desc: 'מידת הפגיעה הטכנית או העסקית' },
    { name: 'עדיפות', desc: 'מידת הדחיפות בטיפול, כאשר היא רלוונטית' },
    { name: 'השפעה עסקית', desc: 'מי נפגע ומה המשתמש אינו יכול לבצע' },
  ],
  thinking: [
    'האם הצלחתי לשחזר את התקלה?', 'באילו תנאים היא מופיעה?', 'האם היא מופיעה לכל המשתמשים?',
    'האם היא תלויה בנתונים, בהרשאות או בסביבה?', 'מהו השלב המדויק שבו התהליך נכשל?',
    'האם מדובר בסימפטום או בגורם?', 'אילו ראיות יעזרו למפתח?', 'מהי ההשפעה על המשתמש ועל העסק?',
  ],
  method: [
    'שחזרו את התקלה', 'נסו לבודד את התנאי שגורם לה', 'השוו למצב תקין', 'אספו ראיות',
    'כתבו כותרת שמתארת פעולה, תנאי ותוצאה', 'כתבו צעדים שאדם אחר יכול לבצע',
    'הפרידו בין Actual Result ל־Expected Result', 'ציינו השפעה ללא הנחות לא מבוססות',
    'קבעו Severity לפי ההשפעה', 'קראו מחדש את הדיווח כאילו אינכם מכירים את התקלה',
  ],
  titles: {
    weak: '״התשלום לא עובד״',
    improved: '״לאחר אישור תשלום בכרטיס אשראי, מוצגת הודעת הצלחה אך ההזמנה נשארת בסטטוס Pending״',
  },
  examples: [
    {
      n: 1, scenario: 'משתמש מבצע תשלום, מקבל הודעת הצלחה, אך ההזמנה אינה מתעדכנת.',
      title: 'לאחר תשלום מוצלח, ההזמנה נשארת בסטטוס Pending',
      env: 'Chrome 150 · Windows 11 · סביבת Staging',
      pre: 'משתמש מחובר עם מוצר אחד בסל וכרטיס תקין',
      steps: ['היכנסו למערכת', 'הוסיפו מוצר לסל', 'עברו למסך התשלום', 'הזינו פרטי כרטיס תקינים', 'אשרו את התשלום', 'פתחו את מסך ההזמנות'],
      actual: 'מוצגת הודעת תשלום מוצלח, אך ההזמנה נשארת בסטטוס Pending.',
      expected: 'לאחר אישור התשלום ההזמנה צריכה לעבור לסטטוס Paid.',
      evidence: null,
      impact: 'המשתמש אינו יודע אם התשלום וההזמנה הושלמו, וקיים סיכון לתשלום חוזר.',
      severity: 'High',
    },
    {
      n: 2, scenario: 'משתמש ללא הרשאת מנהל מצליח לפתוח מסך ניהול באמצעות כתובת ישירה.',
      title: 'משתמש בתפקיד Viewer מקבל גישה מלאה למסך ניהול המשתמשים בניווט ישיר ל־URL',
      env: 'Chrome 150 · Windows 11 · סביבת Staging · גרסה 4.2.1',
      pre: 'משתמש פעיל בתפקיד Viewer בלבד; תפריט הניהול אינו מוצג לו',
      steps: ['התחברו כמשתמש Viewer', 'ודאו שתפריט הניהול אינו מוצג', 'הדביקו בשורת הכתובת: /admin/users', 'אשרו את המעבר'],
      actual: 'מסך ניהול המשתמשים נטען במלואו; ניתן לצפות, לערוך ולמחוק משתמשים.',
      expected: 'הפניה לעמוד 403 או לדשבורד, ללא גישה לנתוני ניהול.',
      evidence: ['צילום מסך של מסך הניהול תחת Viewer', 'תיעוד הבקשה: GET /admin/users → 200 (מצופה 403)', 'לוג הרשאות עם מזהה המשתמש', 'משתמש בדיקה: viewer.qa@staging'],
      impact: 'כל משתמש מחובר יכול לצפות ולשנות נתוני משתמשים; חשיפת מידע אישי וסיכון רגולטורי.',
      severity: 'Critical',
    },
  ],
  mistakes: [
    'כותרת כללית מדי', 'צעדי שחזור חסרים', 'ערבוב בין Actual ל־Expected',
    'כתיבת מסקנה על גורם התקלה ללא ראיות', 'חוסר בציון סביבה', 'שימוש בטון מאשים',
    'קביעת Severity לפי רמת התסכול האישית', 'הוספת מידע שאינו קשור לתקלה',
    'שימוש במשפטים כמו ״לא עובד״ ללא פירוט', 'אי־ציון נתוני הבדיקה שבהם התקלה הופיעה',
  ],
  checklist: [
    'האם הכותרת מתארת את התקלה?', 'האם אדם אחר יכול לשחזר אותה?', 'האם ה־Actual ברור?',
    'האם ה־Expected ברור?', 'האם ציינתי סביבה?', 'האם צירפתי ראיות?', 'האם נמנעתי מהנחות?',
    'האם ה־Severity מנומק?', 'האם ציינתי את ההשפעה?',
  ],
  exercises: [
    { n: 1, type: 'שיפור דיווח קיים', minutes: 10, text: '״כפתור שמירה לא עובד. ניסיתי כמה פעמים וזה לא נשמר. דחוף לתקן.״ — זהו מה חסר וכתבו גרסה משופרת.' },
    { n: 2, type: 'כתיבת דיווח מלא', minutes: 20, text: 'משתמש משנה כתובת, מקבל הודעת הצלחה, אך לאחר רענון הכתובת הישנה חוזרת. כתבו דיווח תקלה מלא.' },
  ],
  rubric: [
    { name: 'כותרת', pct: 10 }, { name: 'סביבת בדיקה', pct: 5 }, { name: 'תנאים מקדימים', pct: 5 },
    { name: 'צעדים לשחזור', pct: 20 }, { name: 'Actual Result', pct: 15 }, { name: 'Expected Result', pct: 15 },
    { name: 'ראיות ונתוני בדיקה', pct: 10 }, { name: 'Severity והשפעה עסקית', pct: 10 },
    { name: 'בהירות, דיוק וטון מקצועי', pct: 10 },
  ],
  glossary: [
    { term: 'Severity', desc: 'חומרה — מידת הפגיעה הטכנית או העסקית של התקלה' },
    { term: 'Priority', desc: 'עדיפות — מידת הדחיפות בטיפול; נקבעת לרוב על ידי הצוות, לא רק הבודק' },
    { term: 'Steps to Reproduce', desc: 'צעדים ממוספרים שמאפשרים לכל אדם לשחזר את התקלה' },
    { term: 'Actual / Expected', desc: 'מה קרה בפועל מול מה שהיה אמור לקרות — תמיד בנפרד' },
    { term: 'Workaround', desc: 'דרך עקיפה זמנית להשלים את הפעולה למרות התקלה' },
    { term: 'Root Cause / Symptom', desc: 'הגורם האמיתי מול הביטוי הנראה — הבודק מדווח סימפטום מבוסס ראיות' },
    { term: 'RIMGEN', desc: 'שיטה לבניית דיווח: Reproduce, Isolate, Maximize, Generalize, Externalize, Neutral tone' },
  ],
};

// ── תרגול ───────────────────────────────────────────────────
export const PRACTICE = {
  topic: 'דיווח וניהול תקלות', title: 'תרגיל 2 · כתיבת דיווח תקלה מלא',
  difficulty: 'בינוני', minutes: 20, elapsed: '07:12',
  scenario: 'משתמש נכנס לאזור האישי ומעדכן את כתובת המשלוח שלו. המערכת מציגה הודעת הצלחה. לאחר רענון הדף מוצגת שוב הכתובת הישנה, וההזמנה הפתוחה שלו משויכת לכתובת הישנה.',
  task: 'כתבו דיווח תקלה מלא, כזה שמפתח יכול לקחת ולהתחיל לעבוד איתו מיד — כולל חומרה מנומקת.',
  aids: [
    { k: 'סביבה', v: 'Chrome 150 · Windows 11 · Staging · v4.2.1', ltr: true },
    { k: 'משתמש בדיקה', v: 'qa.noa@staging.zibi', ltr: true },
    { k: 'כתובת קיימת', v: 'הרצל 12, חיפה', ltr: false },
    { k: 'כתובת שהוזנה', v: 'העצמאות 45, חיפה', ltr: false },
    { k: 'תגובת השרת', v: 'PUT /api/customers/512/address → 200', ltr: true },
    { k: 'מועד הבדיקה', v: 'אתמול · 14:32', ltr: false },
  ],
  severities: ['Low', 'Medium', 'High', 'Critical'],
  draft: {
    title: 'לאחר עדכון כתובת משלוח והודעת הצלחה, הכתובת הישנה חוזרת אחרי רענון',
    env: 'Chrome 150, Windows 11, Staging v4.2.1',
    pre: 'משתמש מחובר עם הזמנה פתוחה וכתובת קיימת ברשומה',
    steps: ['היכנסו לאזור האישי', 'פתחו את מסך ״כתובות למשלוח״', 'עדכנו את הכתובת ל״העצמאות 45, חיפה״ ושמרו', 'המתינו להודעת ההצלחה', 'רעננו את הדף'],
    actual: '', expected: '', evidence: '', severity: null, severityWhy: '',
  },
};

// ── משוב ────────────────────────────────────────────────────
export const FEEDBACK = {
  exercise: 'דיווח תקלה — שינוי כתובת', topic: 'דיווח וניהול תקלות',
  score: 78, prev: 66, delta: 12, confidence: 'גבוהה',
  confNote: 'הערכה על בסיס מחוון מלא; כל הקריטריונים נמדדו',
  right: [
    { t: 'צעדי שחזור ממוספרים וברורים', d: 'כל צעד מכיל פעולה אחת — אדם אחר יכול לבצע אותם כלשונם' },
    { t: 'הפרדה נכונה בין Actual ל־Expected', d: 'שתי התוצאות נוסחו כעובדות, בלי פרשנות' },
    { t: 'סביבת בדיקה מלאה', d: 'דפדפן, מערכת הפעלה, סביבה וגרסה צוינו' },
  ],
  missing: [
    { t: 'ראיות', d: 'לא צורפה אף ראיה. צרפו לפחות צילום מסך ותיעוד הבקשה (PUT → 200)' },
    { t: 'נתוני הבדיקה', d: 'הכתובת החדשה שהוזנה לא צוינה — בלעדיה קשה לאתר את הרשומה' },
  ],
  wrong: [
    { t: 'Severity ללא נימוק', d: 'נקבע High בלי הסבר השפעה. נמקו: הזמנה פעילה עלולה להישלח לכתובת שגויה' },
    { t: 'מסקנה על הגורם', d: '״כנראה בעיית קאש״ — הנחה ללא ראיות. דווחו את הסימפטום; השאירו את הגורם לתחקור' },
  ],
  rubric: [
    { name: 'כותרת', lvl: 4, pts: 10, max: 10, link: 'כתיבת כותרת אפקטיבית' },
    { name: 'סביבת בדיקה', lvl: 4, pts: 5, max: 5, link: 'מבנה הדיווח' },
    { name: 'תנאים מקדימים', lvl: 3, pts: 4, max: 5, link: 'מבנה הדיווח' },
    { name: 'צעדים לשחזור', lvl: 4, pts: 18, max: 20, link: 'כתיבת צעדים ברורים' },
    { name: 'Actual Result', lvl: 3, pts: 12, max: 15, link: 'Actual מול Expected' },
    { name: 'Expected Result', lvl: 4, pts: 13, max: 15, link: 'Actual מול Expected' },
    { name: 'ראיות ונתוני בדיקה', lvl: 1, pts: 3, max: 10, link: 'איסוף ראיות' },
    { name: 'Severity והשפעה עסקית', lvl: 2, pts: 5, max: 10, link: 'קביעת חומרה מנומקת' },
    { name: 'בהירות, דיוק וטון מקצועי', lvl: 3, pts: 8, max: 10, link: 'כתיבה ניטרלית' },
  ],
  common: [
    { what: 'דיווח הגורם במקום הסימפטום', why: 'הודעת הצלחה ואז חזרה לערך ישן ״מריחה״ כמו קאש — אבל בלי ראיות זו הנחה, לא ממצא', link: 'Root Cause לעומת Symptom' },
    { what: 'צעד שחזור אחד שמכיל שלוש פעולות', why: 'חיסכון בשורות מרגיש יעיל, אבל שובר את יכולת השחזור של מי שלא ראה את התקלה', link: 'כתיבת צעדים ברורים' },
    { what: 'השמטת הרענון מצעדי השחזור', why: 'הרענון מרגיש טריוויאלי — אבל הוא בדיוק התנאי שחושף את התקלה', link: 'תנאים מקדימים וצעדים' },
  ],
};

// ── סביבת SQL ───────────────────────────────────────────────
export const SQL_ENV = {
  task: {
    title: 'איתור הזמנות ששולמו אך נותרו Pending',
    desc: 'לקוחות מדווחים שהתשלום הצליח אך ההזמנה לא התעדכנה. כתבו שאילתה שמאתרת את כל ההזמנות מ־7 הימים האחרונים שהתשלום עליהן הושלם אך הסטטוס שלהן עדיין Pending.',
    expect: 'עמודות מצופות: order_id, customer_name, paid_at, amount',
    topic: 'SQL לבודקי תוכנה · רמה מתקדמת', minutes: 15,
  },
  schema: [
    { table: 'customers', rows: 1240, cols: [
      { n: 'id', t: 'INT', k: 'PK' }, { n: 'full_name', t: 'VARCHAR(80)', k: '' },
      { n: 'email', t: 'VARCHAR(120)', k: '' }, { n: 'created_at', t: 'DATETIME', k: '' } ] },
    { table: 'orders', rows: 5817, cols: [
      { n: 'id', t: 'INT', k: 'PK' }, { n: 'customer_id', t: 'INT', k: 'FK → customers.id' },
      { n: 'status', t: "ENUM('Pending','Paid','Shipped','Cancelled')", k: '' },
      { n: 'total', t: 'DECIMAL(10,2)', k: '' }, { n: 'created_at', t: 'DATETIME', k: '' },
      { n: 'updated_at', t: 'DATETIME', k: '' } ] },
    { table: 'payments', rows: 5533, cols: [
      { n: 'id', t: 'INT', k: 'PK' }, { n: 'order_id', t: 'INT', k: 'FK → orders.id' },
      { n: 'amount', t: 'DECIMAL(10,2)', k: '' }, { n: 'status', t: "ENUM('completed','failed','refunded')", k: '' },
      { n: 'paid_at', t: 'DATETIME', k: '' } ] },
  ],
  query: "SELECT o.id AS order_id,\n       c.full_name AS customer_name,\n       p.paid_at,\n       p.amount\nFROM orders o\nJOIN payments p  ON p.order_id = o.id\nJOIN customers c ON c.id = o.customer_id\nWHERE p.status = 'completed'\n  AND o.status = 'Pending'\n  AND p.paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)\nORDER BY p.paid_at DESC;",
  results: {
    cols: ['order_id', 'customer_name', 'paid_at', 'amount'],
    rows: [
      ['4821', 'נועה ברק', '2026-07-28 14:31', '249.90'],
      ['4783', 'אבי כהן', '2026-07-26 09:12', '1,200.00'],
      ['4711', 'דנה לוי', '2026-07-23 18:47', '89.90'],
    ],
    time: '0.08s', count: 3,
  },
  attempts: [
    { n: 3, status: 'success', label: '3 שורות · 0.08s', at: 'עכשיו' },
    { n: 2, status: 'empty', label: '0 שורות — תנאי התאריך היה הפוך', at: 'לפני 2 דק׳' },
    { n: 1, status: 'error', label: "Unknown column 'payment.status' — הכוונה ל־p.status?", at: 'לפני 5 דק׳' },
  ],
  errorExample: "ERROR 1054 (42S22): Unknown column 'payment.status' in 'where clause'",
};

// ── מבחנים ──────────────────────────────────────────────────
export const EXAMS = {
  available: [
    { id: 'full', title: 'מבחן מתכונת מלא', desc: 'מדמה את מבנה המבחן המקצועי — 6 מקטעים, ציון מוכנות מלא', minutes: 20, sections: 6, attempts: 2, best: 68, status: 'ready' },
    { id: 'sql', title: 'מבחן נושא · SQL לבודקי תוכנה', desc: 'שאילתות, ולידציה של נתונים ותחקור', minutes: 25, sections: 1, attempts: 1, best: 71, status: 'ready' },
    { id: 'bug', title: 'מבחן נושא · דיווח וניהול תקלות', desc: 'כתיבת דיווח מלא + שאלות תרחיש', minutes: 15, sections: 1, attempts: 0, best: null, status: 'ready' },
    { id: 'custom', title: 'מבחן מותאם אישית', desc: 'בחרו מקטעים, רמת קושי ומשך — המערכת תרכיב מתווה', minutes: null, sections: null, attempts: null, best: null, status: 'builder' },
  ],
  history: [
    { date: '28.07.2026', title: 'מבחן נושא · SQL', score: 71, pass: true, time: '23:12' },
    { date: '21.07.2026', title: 'מבחן מתכונת מלא', score: 68, pass: false, time: '19:58' },
    { date: '14.07.2026', title: 'מבחן נושא · דיווח תקלות', score: 86, pass: true, time: '13:44' },
    { date: '02.07.2026', title: 'מבחן מתכונת מלא', score: 54, pass: false, time: '20:03' },
  ],
  instructions: [
    'המבחן נמשך 20 דקות ברצף אחד — ודאו סביבה שקטה לפני התחלה',
    'אין משוב במהלך המבחן; כל המשוב מוצג בסיום',
    'אפשר לסמן שאלה לחזרה ולשוב אליה בתוך המקטע',
    'יציאה באמצע שומרת טיוטה, אך הטיימר ממשיך לרוץ',
  ],
  active: {
    title: 'מבחן מתכונת מלא', section: 'תחקור תקלה', sectionN: 4, sectionsTotal: 6,
    q: 9, qTotal: 14, remaining: '07:42', flagged: 1,
    question: 'משתמש מדווח שקובץ שהעלה אינו מופיע ברשימת הקבצים, למרות שה־UI הציג הודעת הצלחה. מהו הצעד הראשון הנכון בתחקור?',
    options: [
      'לפתוח באג על רכיב ההעלאה ולצרף את עדות המשתמש',
      'לבדוק ב־Network מה החזירה בקשת ההעלאה בפועל',
      'לבקש מהמשתמש לנסות שוב מדפדפן אחר',
      'לחפש את הקובץ ישירות בבסיס הנתונים',
    ],
    selected: 1,
  },
  cannotBuild: {
    requested: 'מבחן מתכונת מלא · 20 דק׳ · 6 מקטעים',
    reasons: [
      { icon: 'target', t: 'חסרים פריטים מסוג ״ניתוח דרישה״', d: 'המתווה דורש 4 פריטים ברמת ביניים; במאגר קיימים כרגע 2' },
      { icon: 'clock', t: 'משך מינימלי חורג במקטע ״תעדוף״', d: 'הפריט הקצר ביותר במאגר אורך 10 דק׳, אך למקטע הוקצו 2 דק׳' },
    ],
    meanwhile: [
      { t: 'מבחן נושא · SQL', d: 'זמין במלואו · 25 דק׳', href: '#' },
      { t: 'תרגול מקטע ״דיווח תקלה״', d: '3 פריטים זמינים במאגר', href: '#' },
    ],
    note: 'זיבי לא מריצה מבחן חלקי: ציון שנמדד על מתווה חסר אינו ציון מוכנות אמין.',
  },
};

// ── תוצאות מבחן ─────────────────────────────────────────────
export const RESULTS = {
  exam: 'מבחן מתכונת מלא', date: '21.07.2026', duration: '19:58 מתוך 20:00',
  score: 68, pass: false, threshold: 75, prev: 54, delta: 14, confidence: 'גבוהה',
  sections: [
    { name: 'ניתוח דרישה', score: 58, alloc: 4, used: '5:10', over: true, verdict: 'warn' },
    { name: 'דיווח תקלה', score: 86, alloc: 3, used: '2:40', over: false, verdict: 'good' },
    { name: 'SQL', score: 64, alloc: 4, used: '4:55', over: true, verdict: 'warn' },
    { name: 'תחקור תקלה', score: 55, alloc: 4, used: '4:20', over: true, verdict: 'bad' },
    { name: 'תעדוף', score: 90, alloc: 2, used: '1:30', over: false, verdict: 'good' },
    { name: 'החלטה מקצועית', score: 75, alloc: 3, used: '2:05', over: false, verdict: 'good' },
  ],
  strengths: [
    { t: 'דיווח תקלה', d: 'מבנה מלא, צעדים ברורים וראיות מתאימות' },
    { t: 'תעדוף', d: 'שיקולים עסקיים מנומקים ובחירה עקבית' },
  ],
  weaknesses: [
    { t: 'תחקור תקלה', d: 'מסקנה נקבעה לפני איסוף ראיות — פעמיים' },
    { t: 'ניתוח דרישה', d: 'הוחמצו 2 דרישות חסרות מתוך 3' },
    { t: 'SQL', d: 'תנאי JOIN שגוי בשאלה 2 — חיבור על עמודה לא נכונה' },
  ],
  repeated: [
    { t: 'זיהוי דרישות חסרות', n: 3, link: 'ניתוח דרישות' },
    { t: 'מסקנה לפני ראיות', n: 2, link: 'תחקור תקלות' },
  ],
  recommendation: [
    { day: 'ימים 1–2', t: 'חזרה ממוקדת: ניתוח דרישות', d: 'שיטת חשיבה + 2 תרגילים מודרכים' },
    { day: 'ימים 3–5', t: 'תרגול מדורג: JOIN ותחקור', d: 'סדרת תרגילים בקושי עולה' },
    { day: 'מ־04.08', t: 'מבחן חוזר', d: 'אותו מתווה, פריטים שונים' },
  ],
  retake: { available: '04.08.2026', note: 'מבחן חוזר משתמש בפריטים שונים באותו מתווה' },
};

// ── התקדמות ─────────────────────────────────────────────────
export const PROGRESS = {
  dims: [
    { id: 'knowledge', name: 'ידע', icon: 'book-open', ability: 82, avg: 88, trend: 'up', trendLabel: 'משתפרת', note: '12 מדידות' },
    { id: 'application', name: 'יישום', icon: 'wrench', ability: 74, avg: 79, trend: 'up', trendLabel: 'משתפרת', note: '9 מדידות' },
    { id: 'thinking', name: 'חשיבה', icon: 'lightbulb', ability: 68, avg: 75, trend: 'flat', trendLabel: 'יציבה', note: '7 מדידות' },
    { id: 'speed', name: 'מהירות', icon: 'zap', ability: 61, avg: 70, trend: 'down', trendLabel: 'נסוגה', note: '9 מדידות' },
    { id: 'stability', name: 'יציבות', icon: 'activity', ability: null, avg: null, trend: null, trendLabel: 'אין עדיין מדידה', note: 'דרושים עוד 2 מבחנים מלאים' },
  ],
  abilityExplain: '״רמת יכולת״ משקללת קושי, זמן מענה ויציבות בין ניסיונות. ״ממוצע פשוט״ סוכם נקודות בלבד — ולכן כמעט תמיד גבוה יותר. המוכנות נקבעת לפי היכולת.',
  firstTry: 64,
  readVsProven: [
    { topic: 'מסמכי בדיקות', read: 100, proven: 22 },
    { topic: 'דיווח וניהול תקלות', read: 100, proven: 76 },
    { topic: 'ניתוח דרישות', read: 90, proven: 58 },
    { topic: 'SQL לבודקי תוכנה', read: 85, proven: 62 },
  ],
  needsReview: [
    { topic: 'ניתוח דרישות', reason: '3 שבועות ללא תרגול + טעות חוזרת בזיהוי דרישות חסרות' },
    { topic: 'SQL · JOIN', reason: 'פער של 32 נקודות בין שני ניסיונות עוקבים' },
    { topic: 'תחקור תקלות', reason: 'חריגת זמן קבועה ומסקנות ללא ראיות' },
    { topic: 'מסמכי בדיקות', reason: 'נקרא במלואו אך ללא תרגול מוכיח — קריאה אינה שליטה' },
  ],
  repeatedMistakes: [
    { t: 'זיהוי דרישות חסרות', n: 5, last: 'לפני יומיים', topic: 'ניתוח דרישות' },
    { t: 'בלבול בין Severity ל־Priority', n: 3, last: 'לפני שבוע', topic: 'דיווח וניהול תקלות' },
    { t: 'JOIN על עמודה שגויה', n: 2, last: 'לפני 3 ימים', topic: 'SQL לבודקי תוכנה' },
  ],
  lastPracticed: [
    { topic: 'דיווח וניהול תקלות', when: 'היום' },
    { topic: 'SQL לבודקי תוכנה', when: 'אתמול' },
    { topic: 'ניתוח דרישות', when: 'לפני 3 שבועות', stale: true },
    { topic: 'תחקור תקלות', when: 'לפני שבועיים', stale: true },
  ],
};
