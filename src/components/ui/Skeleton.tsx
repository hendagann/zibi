import styles from './Skeleton.module.css';

type Shape = 'text' | 'title' | 'block';

interface SkeletonProps {
  readonly shape?: Shape;
  /** CSS length for the inline size, e.g. `'60%'`. */
  readonly width?: string;
}

const shapeClass: Record<Shape, string | undefined> = {
  text: styles.text,
  title: styles.title,
  block: styles.block,
};

export function Skeleton({ shape = 'text', width }: SkeletonProps) {
  const classes = [styles.skeleton, shapeClass[shape]].filter(Boolean).join(' ');
  return (
    <span
      className={classes}
      style={width ? { inlineSize: width } : undefined}
      aria-hidden="true"
    />
  );
}

interface SkeletonStackProps {
  readonly lines?: number;
}

/**
 * A run of placeholder lines. Decorative only — it is `aria-hidden`, and the
 * accessible loading announcement comes from `LoadingState`, so a screen
 * reader hears one message rather than a stream of empty boxes.
 */
export function SkeletonStack({ lines = 3 }: SkeletonStackProps) {
  const widths = ['100%', '92%', '78%', '85%', '70%'];
  return (
    <span className={styles.stack} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          shape="text"
          width={widths[index % widths.length] ?? '100%'}
        />
      ))}
    </span>
  );
}
