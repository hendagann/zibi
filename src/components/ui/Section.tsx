import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  readonly title: string;
  readonly description?: string;
  readonly aside?: ReactNode;
  readonly children: ReactNode;
  readonly headingLevel?: 2 | 3;
}

export function Section({
  title,
  description,
  aside,
  children,
  headingLevel = 2,
}: SectionProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <Heading className={styles.title}>{title}</Heading>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}
