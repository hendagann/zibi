import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

/**
 * The root path has no content of its own. The dashboard is the entry point,
 * and giving it a real URL keeps it linkable and bookmarkable rather than
 * hiding it behind `/`.
 */
export default function RootPage() {
  redirect(routes.dashboard);
}
