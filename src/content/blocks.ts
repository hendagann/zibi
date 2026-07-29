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
