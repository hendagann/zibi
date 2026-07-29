'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { adminApproveItem, adminPublishItem, adminSaveItem } from '@/app/actions';
import { t } from '@/i18n';
import styles from './ItemEditor.module.css';

interface ItemEditorProps {
  readonly itemId: string;
  readonly rawJson: string;
  readonly status: string;
}

/**
 * JSON editor for a content item. Saving bumps the version and resets the
 * item to needs_update (docs/05 §7); approval is a separate act that requires
 * a reviewer name. Both run through server actions that write the file — no
 * code change is involved in either.
 */
export function ItemEditor({ itemId, rawJson, status }: ItemEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(rawJson);
  const [reviewer, setReviewer] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adminSaveItem(itemId, draft);
      if (!result.ok) {
        setError(result.error ?? '—');
        return;
      }
      setMessage(t.adminEdit.saved);
      router.refresh();
    });
  }

  function publish() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adminPublishItem(itemId);
      if (!result.ok) {
        setError(result.error ?? '—');
        return;
      }
      setMessage(t.adminEdit.published);
      router.refresh();
    });
  }

  function approve() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adminApproveItem(itemId, reviewer);
      if (!result.ok) {
        setError(result.error ?? '—');
        return;
      }
      setMessage(t.adminEdit.approved);
      router.refresh();
    });
  }

  return (
    <div className={styles.editor}>
      <textarea
        className={styles.textarea}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        dir="ltr"
        aria-label={t.adminEdit.editTitle}
      />

      <p className={styles.note}>{t.adminEdit.saveNote}</p>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={save} disabled={pending}>
          {t.adminEdit.save}
        </button>
      </div>

      <div className={styles.approveRow}>
        <input
          className={styles.reviewerInput}
          placeholder={t.adminEdit.reviewerPlaceholder}
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          aria-label={t.adminEdit.reviewerPlaceholder}
        />
        <button
          type="button"
          className={styles.secondary}
          onClick={approve}
          disabled={pending || !reviewer.trim() || status === 'approved'}
        >
          {t.adminEdit.approve}
        </button>
      </div>
      <p className={styles.note}>{t.adminEdit.approveNote}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={publish}
          disabled={pending || status !== 'approved'}
        >
          {t.adminEdit.publish}
        </button>
      </div>
      <p className={styles.note}>{t.adminEdit.publishNote}</p>

      {message ? <p className={styles.success} role="status">{message}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}
