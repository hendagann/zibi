import type { ExamType, RefusalReason } from '@/exam/types';
import { t } from '@/i18n';

/**
 * A refusal reason as a Hebrew sentence — docs/10 §4.
 *
 * The planner reports a language-neutral `code` plus numeric `values`; the
 * wording lives here in the i18n layer, so `src/exam` stays free of interface
 * strings (CM-20). A refusal is a product state, not an error, so it has to
 * read as an explanation the learner can act on.
 */
export function refusalText(reason: RefusalReason): string {
  const r = t.examPlan.refusal;
  const v = reason.values ?? {};
  switch (reason.code) {
    case 'no_item_for_family':
      return r.noItemForFamily(String(v.questionFamily ?? ''));
    case 'all_candidates_seen':
      return r.allCandidatesSeen(Number(v.found ?? 0));
    case 'segment_over_budget':
      return r.segmentOverBudget(
        Number(v.budgetSeconds ?? 0),
        Number(v.shortestCandidateSeconds ?? 0),
      );
    case 'over_total_budget':
      return r.overTotalBudget(Number(v.totalSeconds ?? 0), Number(v.budgetSeconds ?? 0));
    case 'too_few_open_questions':
      return r.tooFewOpenQuestions(Number(v.required ?? 0), Number(v.found ?? 0));
    case 'no_judgement_item':
      return r.noJudgementItem;
    case 'blueprint_invalid':
      return r.blueprintInvalid(String(v.rule ?? ''));
  }
}

export function examTypeLabel(examType: ExamType): string {
  const labels: Record<ExamType, string> = {
    topic: t.examPlan.typeTopic,
    random: t.examPlan.typeRandom,
    weakness: t.examPlan.typeWeakness,
    senior: t.examPlan.typeSenior,
    readiness: t.examPlan.typeReadiness,
  };
  return labels[examType];
}
