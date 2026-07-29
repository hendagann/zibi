import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type Variant = 'default' | 'flush' | 'quiet';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly variant?: Variant;
}

const variantClass: Record<Variant, string | undefined> = {
  default: undefined,
  flush: styles.flush,
  quiet: styles.quiet,
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
