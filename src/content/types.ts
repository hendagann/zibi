/**
 * Content types.
 *
 * These mirror the canonical model in docs/05-content-model.md. They describe
 * *authored data*, not UI state. Nothing in `src/components` may construct a
 * value of these types from literals — content is loaded, never written in
 * code (docs/05 §2).
 *
 * Phase 1 defines the shape only. Validation (`CM-01`..`CM-27`) is a later
 * phase; the loader in `./loader.ts` performs structural checks only.
 */

export type DomainId = string;
export type TopicId = string;
export type SkillId = string;
export type ContentItemId = string;

/**
 * The content pipeline statuses. Order of travel:
 * draft / ai_generated → needs_professional_review → approved → published
 * needs_update re-enters after an edit; archived is the end state.
 * Only approved and published content is ever served to a learner.
 */
export type ReviewStatus =
  | 'draft'
  | 'ai_generated'
  | 'needs_professional_review'
  | 'needs_update'
  | 'approved'
  | 'published'
  | 'archived';

export type Tier = 'foundation' | 'applied' | 'advanced';
export type CognitiveLevel = 'K1' | 'K2' | 'K3' | 'K4';
export type ExperienceBand = 'junior' | 'mid' | 'senior';
export type Pool = 'practice' | 'exam';

export type ContentItemType =
  | 'summary'
  | 'lesson'
  | 'guided_example'
  | 'exercise'
  | 'exam_item'
  | 'checklist'
  | 'glossary_term';

export interface Review {
  readonly status: ReviewStatus;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly reviewNote?: string;
}

export interface SourceCitation {
  readonly sourceId: string;
  readonly locator?: string;
  readonly derivation: 'original' | 'adapted' | 'quoted';
  readonly licenceCleared?: boolean;
  readonly note?: string;
}

export interface Domain {
  readonly id: DomainId;
  readonly nameHe: string;
  readonly nameEn: string;
  readonly description: string;
  readonly order: number;
  readonly status: 'active' | 'retired';
}

export interface Skill {
  readonly id: SkillId;
  readonly topic: TopicId;
  readonly titleHe: string;
  readonly titleEn: string;
  readonly tier: Tier;
  readonly cognitiveLevel: CognitiveLevel;
  readonly behaviour: string;
  readonly prerequisites: readonly SkillId[];
  readonly sourceCoverage: 'strong' | 'adequate' | 'partial' | 'none';
  readonly status: 'active' | 'retired';
}

export interface Topic {
  readonly id: TopicId;
  readonly nameHe: string;
  readonly nameEn: string;
  readonly domain: DomainId;
  readonly description: string;
  readonly learningObjectives: readonly string[];
  readonly prerequisites: readonly TopicId[];
  readonly difficulty: number;
  readonly estimatedMinutes: number;
  readonly measuredSkills: readonly SkillId[];
  readonly summaryRef: ContentItemId | null;
  readonly lessonRefs: readonly ContentItemId[];
  readonly exerciseRefs: readonly ContentItemId[];
  readonly topicExamRef: string | null;
  readonly review: Review;
}

/** The common envelope every content item carries — docs/05 §5. */
export interface ContentItem {
  readonly id: ContentItemId;
  readonly type: ContentItemType;
  readonly schemaVersion: number;
  readonly topic?: TopicId;
  readonly skills?: {
    readonly primary: SkillId;
    readonly secondary?: readonly SkillId[];
  };
  readonly cognitiveLevel?: CognitiveLevel;
  readonly title: string;
  readonly lang: 'he';
  readonly dir: 'rtl';
  readonly difficulty?: number;
  readonly experienceBand?: ExperienceBand;
  readonly estimatedSeconds: number;
  readonly pool?: Pool;
  readonly source: readonly SourceCitation[];
  readonly review: Review;
  readonly version: number;
  readonly status: 'active' | 'retired';
}

/**
 * The misconception registry — docs/05 §4, referenced by docs/06 §6.3.
 *
 * A misconception is a *named*, reusable wrong belief. It lives at product level
 * rather than on an item because the same misconception recurs across topics: a
 * report whose steps cannot be reproduced is the same error whether it appears
 * in defect reporting or in failure investigation. Registering it once is what
 * lets feedback name it consistently and lets `QM-07` verify that feedback can
 * never cite a misconception that does not exist.
 */
export interface Misconception {
  readonly id: string;
  readonly titleHe: string;
  readonly descriptionHe: string;
  readonly whyTempting: string;
  readonly skillIds: readonly SkillId[];
  /** Where it is addressed; must resolve to a servable item (QM-16). */
  readonly remediationRef: ContentItemId;
  readonly anchor?: string;
  readonly status: 'active' | 'retired';
}

/** A topic joined with the domain it belongs to, for map rendering. */
export interface TopicWithDomain extends Topic {
  readonly domainRef: Domain;
}
