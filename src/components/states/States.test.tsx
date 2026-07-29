import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { t } from '@/i18n';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

describe('EmptyState', () => {
  it('falls back to the dictionary copy', () => {
    render(<EmptyState />);
    expect(screen.getByText(t.states.empty.title)).toBeInTheDocument();
    expect(screen.getByText(t.states.empty.body)).toBeInTheDocument();
  });

  it('accepts a caller-supplied body', () => {
    render(<EmptyState body={t.practice.queueEmpty} />);
    expect(screen.getByText(t.practice.queueEmpty)).toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  it('announces once through a live region', () => {
    render(<LoadingState />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(t.states.loading.announce);
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('hides the skeleton from assistive technology', () => {
    const { container } = render(<LoadingState lines={3} />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
  });
});

describe('ErrorState', () => {
  it('is announced as an alert', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls the retry handler', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(
      screen.getByRole('button', { name: t.states.error.retry }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('omits the retry control when no handler is given', () => {
    render(<ErrorState />);
    expect(
      screen.queryByRole('button', { name: t.states.error.retry }),
    ).toBeNull();
  });

  it('keeps technical details collapsed', () => {
    render(<ErrorState details="digest-abc123" />);
    const details = screen.getByText(t.states.error.detailsLabel).closest('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
  });
});
