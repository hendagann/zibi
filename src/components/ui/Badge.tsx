import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  readonly children: ReactNode;
  readonly tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  neutral: styles.neutral ?? '',
  info: styles.info ?? '',
  success: styles.success ?? '',
  warning: styles.warning ?? '',
  danger: styles.danger ?? '',
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`${styles.badge ?? ''} ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
