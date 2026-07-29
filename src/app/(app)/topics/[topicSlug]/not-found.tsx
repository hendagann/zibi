import { NotFoundState } from '@/components/states/NotFoundState';
import { t } from '@/i18n';

export default function TopicNotFound() {
  return <NotFoundState body={t.topic.notFound} />;
}
