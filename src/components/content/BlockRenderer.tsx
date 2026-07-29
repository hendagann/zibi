import type { Block } from '@/content/blocks';
import { DefectReportView } from './DefectReportView';
import styles from './BlockRenderer.module.css';

/**
 * Renders authored block content — docs/05 §15.
 *
 * A pure function of the blocks it receives: no fetching, no inference, no
 * content-specific behaviour. `bid` becomes an `id`, which is what makes
 * remediation links land on the exact part of a lesson.
 */
export function BlockRenderer({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className={styles.blocks}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'paragraph':
      return <p id={block.bid}>{block.text}</p>;
    case 'list': {
      const items = block.items.map((item, i) => <li key={i}>{item}</li>);
      return block.ordered ? (
        <ol id={block.bid}>{items}</ol>
      ) : (
        <ul id={block.bid}>{items}</ul>
      );
    }
    case 'callout': {
      const toneClass =
        block.tone === 'warning'
          ? styles.calloutWarning
          : block.tone === 'pitfall'
            ? styles.calloutPitfall
            : undefined;
      return (
        <div id={block.bid} className={[styles.callout, toneClass].filter(Boolean).join(' ')}>
          {block.title ? <span className={styles.calloutTitle}>{block.title}</span> : null}
          <span>{block.text}</span>
        </div>
      );
    }
    case 'table':
      return (
        <div className={styles.tableWrap} id={block.bid}>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
      return (
        <pre id={block.bid}>
          <code>{block.text}</code>
        </pre>
      );
    case 'term':
      return (
        <span className={styles.term}>
          <span>{block.he}</span>
          <span className={styles.termEn}>{block.en}</span>
        </span>
      );
    case 'artifactSample':
      return <DefectReportView report={block.value} />;
    case 'itemRef':
      return <a href={`#${block.anchor ?? ''}`}>{block.label}</a>;
  }
}
