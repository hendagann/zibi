/**
 * The id of the main landmark.
 *
 * Shared because two things need it and neither owns the other: `AppShell`
 * renders it and the skip link targets it, while `AppNav` marks it inert while
 * the mobile drawer is open.
 */
export const MAIN_CONTENT_ID = 'main-content';

/**
 * Where the chosen theme is remembered.
 *
 * Shared because it is read in two places that run at different times and in
 * different environments: the blocking inline script in the layout, which runs
 * before React exists, and the toggle component, which writes it. A literal in
 * both would be a silent break the first time one of them changed.
 */
export const THEME_STORAGE_KEY = 'zibi-theme';
