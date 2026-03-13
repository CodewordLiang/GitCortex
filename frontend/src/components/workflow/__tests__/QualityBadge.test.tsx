import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'status.ok': 'Passed',
        'status.warn': 'Warnings',
        'status.error': 'Failed',
        'status.running': 'Running',
        'status.pending': 'Pending',
        'status.skipped': 'Skipped',
      };
      if (key === 'status.warnCount' && opts?.count !== undefined) {
        return `${Number(opts.count)} warnings`;
      }
      if (key === 'status.errorCount' && opts?.count !== undefined) {
        return `${Number(opts.count)} blocking`;
      }
      return translations[key] ?? key;
    },
  }),
}));

import { QualityBadge } from '../../workflow/QualityBadge';

describe('QualityBadge', () => {
  it('renders ok status with Passed label', () => {
    render(<QualityBadge gateStatus="ok" />);
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('renders error status with Failed label', () => {
    render(<QualityBadge gateStatus="error" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders error status with blocking count', () => {
    render(<QualityBadge gateStatus="error" blockingIssues={5} />);
    expect(screen.getByText('5 blocking')).toBeInTheDocument();
  });

  it('renders warn status with Warnings label', () => {
    render(<QualityBadge gateStatus="warn" />);
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('renders warn status with warning count', () => {
    render(<QualityBadge gateStatus="warn" blockingIssues={3} />);
    expect(screen.getByText('3 warnings')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<QualityBadge gateStatus="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders running status', () => {
    render(<QualityBadge gateStatus="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders skipped status', () => {
    render(<QualityBadge gateStatus="skipped" />);
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    render(<QualityBadge gateStatus="custom_status" />);
    expect(screen.getByText('custom_status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <QualityBadge gateStatus="ok" className="my-custom-class" />
    );
    const pill = container.firstElementChild;
    expect(pill?.className).toContain('my-custom-class');
  });
});
