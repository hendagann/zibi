import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type Variant = 'default' | 'flush' | 'quiet' | 'dense' | 'solid' | 'code';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly variant?: Variant;
}

const variantClass: Record<Variant, string | undefined> = {
  default: undefined,
  flush: styles.flush,
  quiet: styles.quiet,
  dense: styles.dense,
  solid: styles.solid,
  code: styles.code,
};

export function Card({
  children,
  variant = 'default',
  className,
  ...rest
}: CardProps) {
  const classes = [styles.card, variantClass[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
