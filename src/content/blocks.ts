/**
 * Typed block content — docs/05 §15.
 *
 * `bid` is an optional stable block id used as a link anchor, so that
 * remediation links can point at the exact part of a lesson rather than its
 * top ("קישורי החזרה מובילים לחלק הנכון בחומר"). It is additive to the
 * documented schema and ignored by anything that does not use it.
 */

export interface ParagraphBlock {
  readonly kind: 'paragraph';
  readonly text: string;
  readonly bid?: string;
}

export interface ListBlock {
  readonly kind: 'list';
  readonly ordered: boolean;
  readonly items: readonly string[];
  readonly bid?: string;
}

export interface TermBlock {
  readonly kind: 'term';
  readonly he: string;
  readonly en: string;
  readonly definitionRef?: string;
}

export interface CalloutBlock {
  readonly kind: 'callout';
  readonly tone: 'info' | 'warning' | 'pitfall';
  readonly title?: string;
  readonly text: string;
  readonly bid?: string;
}

export interface TableBlock {
  readonly kind: 'table';
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly bid?: string;
}

export interface CodeBlock {
  readonly kind: 'code';
  readonly lang: string;
  readonly text: string;
  readonly bid?: string;
}

/** A worked artifact rendered through the same component as learner answers. */
export interface ArtifactSampleBlock {
  readonly kind: 'artifactSample';
  readonly artifact: 'defect_report';
  readonly value: DefectReportAnswer;
  readonly bid?: string;
}

export interface ItemRefBlock {
  readonly kind: 'itemRef';
  readonly ref: string;
  readonly label: string;
  readonly anchor?: string;
}

export type Block =
  | ParagraphBlock
  | ListBlock
  | TermBlock
  | CalloutBlock
  | TableBlock
  | CodeBlock
  | ArtifactSampleBlock
  | ItemRefBlock;

/**
 * The structured answer shape for `author_defect_report` — docs/06 lists the
 * type as producing "a structured defect report", and a structured form is
 * what makes layer-1 checks and component detection deterministic in this
 * phase (no model participates anywhere in scoring).
 */
export interface DefectReportAnswer {
  readonly title: string;
  readonly environment: string;
  readonly preconditions: string;
  readonly steps: readonly string[];
  readonly actual: string;
  readonly expected: string;
  readonly evidence: string;
  readonly severity: '' | 'low' | 'medium' | 'high' | 'critical';
  readonly severityJustification: string;
  /** Repair exercises only: flaw option ids the learner identified. */
  readonly diagnosis?: readonly string[];
}

/**
 * The answer to a `structured_answer` item — the open families beyond the
 * defect report (requirement analysis, investigation, prioritisation,
 * professional decision).
 *
 * A flat map of field id → text, whose fields the item declares in `essaySpec`.
 * Flat rather than nested so the scoring engine's field access (docs/07 §4.2
 * detection rules) reads it exactly as it reads a defect report — the two
 * families share one detection layer and one level-derivation function, which
 * is what keeps a new family a content change rather than an engine change.
 */
export type StructuredAnswer = Readonly<Record<string, string>>;

/** A field of a `structured_answer` item, declared on the item. */
export interface EssayField {
  readonly id: string;
  readonly labelHe: string;
  readonly hintHe?: string;
  readonly rows?: number;
}

export interface EssaySpec {
  readonly fields: readonly EssayField[];
}

export function emptyStructuredAnswer(spec: EssaySpec): StructuredAnswer {
  return Object.fromEntries(spec.fields.map((f) => [f.id, '']));
}

export function emptyDefectReport(): DefectReportAnswer {
  return {
    title: '',
    environment: '',
    preconditions: '',
    steps: ['', '', ''],
    actual: '',
    expected: '',
    evidence: '',
    severity: '',
    severityJustification: '',
  };
}
