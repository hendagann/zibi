/**
 * The id of the main landmark.
 *
 * Shared because two things need it and neither owns the other: `AppShell`
 * renders it and the skip link targets it, while `AppNav` marks it inert while
 * the mobile drawer is open.
 */
export const MAIN_CONTENT_ID = 'main-content';
