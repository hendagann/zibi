import { he, type Dictionary } from './he';

/**
 * The active UI dictionary.
 *
 * v1 ships Hebrew only (docs/05 §5, `lang: he`). The indirection exists so
 * that components never import a language file directly, which is what will
 * make a second locale a configuration change rather than a rewrite.
 */
export const t: Dictionary = he;

export type { Dictionary };
