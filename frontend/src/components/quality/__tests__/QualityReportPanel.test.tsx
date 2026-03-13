import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useQualityGate', () => ({
  useTerminalLatestQuality: vi.fn(),
  useQualityIssues: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'panel.loading': 'Loading quality report...',
        'panel.error': 'Failed to load quality report.',
        'panel.empty': 'No quality data available.',
        'panel.title': 'Quality Report',
        'panel.runId': 'Run ID',
        'panel.refresh': 'Refresh',
        'panel.detectedIssues': 'Detected Issues',
        'metrics.totalIssues': 'Total Issues',
        'metrics.blockers': 'Blockers',
        'metrics.criticalMajor': 'Critical / Major',
        'metrics.minorInfo': 'Minor / Info',
      };
      return translations[key] ?? key;
    },
  }),
}));

import { useTerminalLatestQuality, useQualityIssues } from '@/hooks/useQualityGate';
import { QualityReportPanel } from '../QualityReportPanel';

const mockRefetch = vi.fn();

function setupMocks(opts: {
  latestRun?: Record<string, unknown> | null;
  isLoading?: boolean;
  error?: Error | null;
  issues?: Record<string, unknown>[];
  issuesLoading?: boolean;
}) {
  vi.mocked(useTerminalLatestQuality).mockReturnValue({
    data: opts.latestRun as any,
    isLoading: opts.isLoading ?? false,
    error: opts.error ?? null,
    refetch: mockRefetch,
  } as any);

  vi.mocked(useQualityIssues).mockReturnValue({
    data: (opts.issues ?? []) as any,
    isLoading: opts.issuesLoading ?? false,
    error: null,
  } as any);
}

describe('QualityReportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    setupMocks({ isLoading: true });
    render(<QualityReportPanel terminalId="t-1" />);
    expect(screen.getByText('Loading quality report...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    setupMocks({ error: new Error('Server error') });
    render(<QualityReportPanel terminalId="t-1" />);
    expect(screen.getByText('Failed to load quality report.')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    setupMocks({ latestRun: null });
    render(<QualityReportPanel terminalId="t-1" />);
    expect(screen.getByText('No quality data available.')).toBeInTheDocument();
  });

  it('renders passed report with metrics', () => {
    setupMocks({
      latestRun: {
        id: 'run-abcd1234-0000',
        gateStatus: 'ok',
        totalIssues: 0,
        blockingIssues: 0,
      },
      issues: [],
    });
    render(<QualityReportPanel terminalId="t-1" />);
    expect(screen.getByText('Quality Report')).toBeInTheDocument();
    expect(screen.getByText('run-abcd')).toBeInTheDocument();
    expect(screen.getByText('Total Issues')).toBeInTheDocument();
  });

  it('renders failed report with issue counts', () => {
    const issues = [
      { id: 'i1', severity: 'blocker', message: 'Null deref', ruleId: 'S001', filePath: 'main.rs', line: 10, source: 'clippy' },
      { id: 'i2', severity: 'critical', message: 'SQL injection', ruleId: 'S002', filePath: 'db.rs', line: 20, source: 'clippy' },
      { id: 'i3', severity: 'minor', message: 'Unused var', ruleId: 'S003', filePath: 'lib.rs', line: 5, source: 'clippy' },
    ];
    setupMocks({
      latestRun: {
        id: 'run-fail5678-0000',
        gateStatus: 'error',
        totalIssues: 3,
        blockingIssues: 2,
      },
      issues,
    });
    render(<QualityReportPanel terminalId="t-1" />);
    expect(screen.getByText('Null deref')).toBeInTheDocument();
    expect(screen.getByText('SQL injection')).toBeInTheDocument();
    expect(screen.getByText('Unused var')).toBeInTheDocument();
  });

  it('displays issue list section', () => {
    setupMocks({
      latestRun: {
        id: 'run-12345678-0000',
        gateStatus: 'warn',
        totalIssues: 1,
        blockingIssues: 0,
      },
      issues: [
        { id: 'i1', severity: 'info', message: 'Consider refactoring', ruleId: 'R1', filePath: 'a.ts', line: 1, source: 'eslint' },
      ],
    });
    render(<QualityReportPanel terminalId="t-1" />);
    expect(screen.getByText('Detected Issues')).toBeInTheDocument();
    expect(screen.getByText('Consider refactoring')).toBeInTheDocument();
  });
});
