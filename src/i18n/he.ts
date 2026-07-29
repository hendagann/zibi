/**
 * UI chrome strings — Hebrew.
 *
 * This file holds interface text only: navigation labels, button labels,
 * page titles, and the wording of loading, error and empty states.
 *
 * It must never hold learning content. Lessons, guided examples, questions,
 * rubric criteria and glossary terms are authored data and are loaded from
 * `content/` through `src/content` (docs/05 §2). The test that separates the
 * two: would a content author want to change this without a developer? If
 * yes, it belongs in `content/`, not here.
 */

export const he = {
  app: {
    name: 'זיבי',
    description: 'פלטפורמת למידה להכנה למבחני QA ידני',
    locale: 'he-IL',
    dir: 'rtl',
  },

  nav: {
    primaryLabel: 'ניווט ראשי',
    skipToContent: 'דילוג לתוכן הראשי',
    openMenu: 'פתיחת תפריט',
    closeMenu: 'סגירת תפריט',
    menu: 'תפריט',
    dashboard: 'לוח בקרה',
    topics: 'מפת נושאים',
    practice: 'תרגול',
    exam: 'מבחן',
    progress: 'התקדמות',
    admin: 'ניהול',
    breadcrumbLabel: 'מיקום נוכחי',
  },

  account: {
    label: 'חשבון',
    signedOut: 'לא מחוברת',
    signIn: 'כניסה',
    placeholderName: 'אורחת',
  },

  states: {
    loading: {
      label: 'טוען',
      announce: 'הדף נטען',
    },
    error: {
      title: 'משהו השתבש',
      body: 'לא הצלחנו לטעון את התוכן הזה. אפשר לנסות שוב.',
      retry: 'נסי שוב',
      detailsLabel: 'פרטים טכניים',
    },
    notFound: {
      title: 'הדף לא נמצא',
      body: 'הכתובת שביקשת אינה קיימת, או שהתוכן הוסר.',
      backToDashboard: 'חזרה ללוח הבקרה',
    },
    empty: {
      title: 'אין כאן תוכן עדיין',
      body: 'התוכן ייווצר בשלב הבא של הפיתוח.',
    },
  },

  phase: {
    noticeTitle: 'שלד בלבד',
    noticeBody:
      'זהו שלד ממשק. הלוגיקה, התוכן והבדיקות ייבנו בשלבים הבאים.',
  },

  dashboard: {
    title: 'לוח בקרה',
    subtitle: 'תמונת מצב של הלמידה שלך',
    continueLearning: 'המשך למידה',
    continueLearningEmpty: 'לא התחלת ללמוד עדיין.',
    dueForReview: 'לחזרה',
    dueForReviewEmpty: 'אין נושאים שממתינים לחזרה.',
    recentActivity: 'פעילות אחרונה',
    recentActivityEmpty: 'אין פעילות להצגה.',
    readiness: 'מוכנות למבחן',
    readinessEmpty: 'נדרשים נתוני תרגול כדי להעריך מוכנות.',
  },

  topics: {
    title: 'מפת נושאים',
    subtitle: 'כל תחומי הידע והמיומנויות שנמדדות בהם',
    empty: 'טרם נוספו נושאים.',
    domainsLabel: 'תחומים',
    topicsLabel: 'נושאים',
    skillsLabel: 'מיומנויות',
    openTopic: 'פתיחת נושא',
  },

  topic: {
    summary: 'דף סיכום',
    summaryEmpty: 'טרם נכתב דף סיכום לנושא זה.',
    lessons: 'שיעורים',
    lessonsEmpty: 'טרם נוספו שיעורים.',
    guidedExamples: 'דוגמאות מודרכות',
    guidedExamplesEmpty: 'טרם נוספו דוגמאות מודרכות.',
    exercises: 'תרגילים',
    exercisesEmpty: 'טרם נוספו תרגילים.',
    topicExam: 'מבחן נושא',
    topicExamEmpty: 'טרם הוגדר מבחן לנושא זה.',
    measuredSkills: 'מיומנויות נמדדות',
    prerequisites: 'דרישות מקדימות',
    estimatedTime: 'זמן לימוד משוער',
    notFound: 'הנושא המבוקש לא נמצא.',
  },

  practice: {
    title: 'תרגול',
    subtitle: 'תרגול מותאם לפי המיומנויות שלך',
    empty: 'אין תרגילים זמינים כרגע.',
    start: 'התחלת תרגול',
    sessionTitle: 'מפגש תרגול',
    queueLabel: 'תור התרגול',
    queueEmpty: 'התור ריק.',
  },

  exam: {
    title: 'מבחן',
    subtitle: 'מבחני דמה לפי מתווה הבחינה',
    empty: 'אין מבחנים זמינים כרגע.',
    blueprintsLabel: 'מתווי מבחן',
    historyLabel: 'מבחנים קודמים',
    historyEmpty: 'לא ניגשת למבחן עדיין.',
    start: 'התחלת מבחן',
  },

  progress: {
    title: 'התקדמות',
    subtitle: 'יכולת שהוכחה, לא עמודים שנקראו',
    empty: 'אין עדיין נתוני התקדמות.',
    bySkill: 'לפי מיומנות',
    byDomain: 'לפי תחום',
    history: 'היסטוריית ניסיונות',
    historyEmpty: 'לא נרשמו ניסיונות.',
  },

  admin: {
    title: 'ניהול',
    subtitle: 'תוכן, מחוונים ובקרת איכות',
    overview: 'סקירה',
    content: 'תוכן',
    contentEmpty: 'אין פריטי תוכן במאגר.',
    rubrics: 'מחוונים',
    rubricsEmpty: 'אין מחוונים במאגר.',
    reviewQueue: 'תור בדיקה אנושית',
    reviewQueueEmpty: 'אין פריטים הממתינים לבדיקה.',
    sectionLabel: 'אזורי ניהול',
  },

  common: {
    back: 'חזרה',
    close: 'סגירה',
    count: 'סך הכול',
    comingSoon: 'בפיתוח',
  },

  content: {
    keyPointsLabel: 'עיקרי הדברים',
    scenarioLabel: 'תרחיש',
    stepsLabel: 'שלבי העבודה',
    reasoningLabel: 'למה כך',
    outcomeLabel: 'התוצר',
    commonMistakesLabel: 'טעויות נפוצות',
    whyTemptingLabel: 'למה זה מפתה',
    attributionLabel: 'מקורות',
  },

  report: {
    formTitle: 'דוח הפגם שלך',
    title: 'כותרת',
    environment: 'סביבת בדיקה',
    preconditions: 'תנאים מקדימים',
    steps: 'צעדי שחזור',
    stepPlaceholder: 'צעד',
    addStep: 'הוספת צעד',
    removeStep: 'הסרת צעד',
    actual: 'תוצאה בפועל',
    expected: 'תוצאה מצופה',
    evidence: 'ראיות',
    severity: 'חומרה',
    severityJustification: 'נימוק החומרה',
    severityNone: 'בחרי חומרה',
    severityLow: 'נמוכה',
    severityMedium: 'בינונית',
    severityHigh: 'גבוהה',
    severityCritical: 'קריטית',
    diagnosisLabel: 'שלב א — אילו ליקויים קיימים בדיווח המקורי?',
    submit: 'הגשה להערכה',
    submitting: 'מעריך…',
    revise: 'שיפור התשובה',
    submitError: 'ההגשה נכשלה. נסי שוב.',
  },

  sqlModule: {
    schemaLabel: 'מבנה הטבלאות',
    sampleDataLabel: 'נתונים לדוגמה',
    moreRows: 'שורות נוספות…',
    columnLabel: 'עמודה',
    typeLabel: 'סוג',
    queryLabel: 'השאילתה שלך',
    queryPlaceholder: 'SELECT ...',
    run: 'הרצת השאילתה',
    running: 'מריץ…',
    submitForGrade: 'הגשה להערכה',
    resultLabel: 'תוצאת ההרצה',
    emptyResult: 'השאילתה רצה והחזירה 0 שורות.',
    truncatedNote: 'מוצגות 200 השורות הראשונות בלבד.',
    rowsCount: 'שורות',
    runFirstHint: 'אפשר להריץ כמה פעמים שרוצים לפני ההגשה — ההרצה אינה נשמרת ואינה משפיעה על הציון.',
    hiddenNote: 'ההערכה בודקת את השאילתה גם על נתונים מוסתרים שאינם מוצגים כאן.',
  },

  feedback: {
    title: 'משוב',
    scoreLabel: 'ציון',
    outOf: 'מתוך 100',
    attemptLabel: 'ניסיון',
    capNote: 'הציון הוגבל בגלל בדיקת סף שנכשלה',
    checksLabel: 'בדיקות סף',
    criteriaLabel: 'ציון לפי קריטריון',
    criterionLabel: 'קריטריון',
    levelLabel: 'רמה',
    pointsLabel: 'נקודות',
    whatWasGood: 'מה נעשה נכון',
    whatIsMissing: 'מה חסר',
    whatIsWrong: 'מה שגוי',
    reviseLink: 'לחזרה על החומר',
    improvementTitle: 'מה השתפר מהניסיון הקודם',
    improvementCriterion: 'קריטריון',
    prevLabel: 'קודם',
    currentLabel: 'עכשיו',
    noChange: 'ללא שינוי',
    unevaluable: 'לא ניתן להעריך את השאלה — היא הועברה לבדיקה. הציון אינו 0 ואינו נספר.',
    gateFailed: 'התשובה לא עברה בדיקת סף בסיסית',
    confidenceLabel: 'רמת ביטחון בהערכה',
    confidenceHigh: 'גבוהה',
    confidenceMedium: 'בינונית',
    confidenceLow: 'נמוכה',
    confidenceReview: 'דורש בדיקה אנושית',
    historyLabel: 'ניסיונות קודמים',
  },

  progressReport: {
    skillLabel: 'מיומנות',
    attemptsLabel: 'ניסיונות',
    bestLabel: 'הטוב ביותר',
    latestLabel: 'אחרון',
    trendLabel: 'מגמה',
    trendUp: 'שיפור',
    trendDown: 'ירידה',
    trendFlat: 'יציב',
    evidenceNote: 'ההתקדמות משקפת יכולת שהוכחה בניסיונות מוערכים — לא עמודים שנקראו.',
    perTopicLabel: 'לפי נושא',
  },

  adminEdit: {
    editTitle: 'עריכת פריט',
    statusLabel: 'סטטוס',
    versionLabel: 'גרסה',
    save: 'שמירה',
    saveNote: 'שמירה מעלה גרסה ומחזירה את הפריט ל-needs_update עד לאישור מחודש.',
    approve: 'אישור',
    reviewerPlaceholder: 'שם הבודקת המאשרת',
    approveNote: 'אישור דורש שם בודקת. פריט לא מאושר אינו מוצג ללומדים.',
    saved: 'נשמר. הפריט ממתין לאישור מחודש.',
    approved: 'אושר. הפריט מוצג ללומדים.',
    publish: 'פרסום',
    publishNote: 'פרסום דורש אישור מקצועי קודם, ומריץ בדיקת מבנה על הספרייה כולה.',
    published: 'פורסם. הפריט עבר את בדיקת המבנה.',
    backToList: 'חזרה לרשימת התוכן',
    openItem: 'עריכה',
  },
} as const;

export type Dictionary = typeof he;
