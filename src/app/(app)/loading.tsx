import { LoadingState } from '@/components/states/LoadingState';

/**
 * Shared loading UI for every route in the shell. Next renders this while a
 * segment's data resolves, so no page needs its own copy.
 */
export default function Loading() {
  return <LoadingState lines={4} />;
}
