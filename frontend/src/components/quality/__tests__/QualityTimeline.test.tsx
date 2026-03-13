import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QualityTimeline } from '../QualityTimeline';
import type { QualityRun } from 'shared/types';

function makeRun(overrides: Partial<QualityRun> = {}): QualityRun {
  return {
    id: 'run-1',
    workflowId: 'wf-1',
    taskId: null,
    terminalId: null,
    commitHash: null,
    gateLevel: 'terminal',
    gateStatus: 'pending',
    mode: 'enforce',
    totalIssues: 0,
    blockingIssues: 0,
    newIssues: 0,
    durationMs: 0,
    providersRun: null,
    reportJson: null,
    decisionJson: null,
    errorMessage: null,
    createdAt: '2026-01-01T00:00:00Z',
    completedAt: null,
    ...overrides,
  };
}

describe('QualityTimeline', () => {
  it('renders all four step labels', () => {
    render(<QualityTimeline />);
    expect(screen.getByText('Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('renders empty state (no runs) at checkpoint step', () => {
    render(<QualityTimeline runs={[]} />);
    // All four labels should still render
    expect(screen.getByText('Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('shows analysis step as current when run is pending', () => {
    const runs = [makeRun({ gateStatus: 'pending' })];
    const { container } = render(<QualityTimeline runs={runs} />);
    // Analysis step should have the animate-pulse class (current + not feedback)
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('shows analysis step as current when run is running', () => {
    const runs = [makeRun({ gateStatus: 'running' })];
    const { container } = render(<QualityTimeline runs={runs} />);
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('shows feedback step as current when run has errors', () => {
    const runs = [makeRun({ gateStatus: 'error', totalIssues: 3 })];
    const { container } = render(<QualityTimeline runs={runs} />);
    // Feedback step uses amber border, no animate-pulse
    const amberElements = container.querySelectorAll('.border-amber-500');
    expect(amberElements.length).toBeGreaterThan(0);
  });

  it('shows feedback step as current when run has warnings', () => {
    const runs = [makeRun({ gateStatus: 'warn', totalIssues: 1 })];
    const { container } = render(<QualityTimeline runs={runs} />);
    const amberElements = container.querySelectorAll('.border-amber-500');
    expect(amberElements.length).toBeGreaterThan(0);
  });

  it('shows passed step as current when run is ok', () => {
    const runs = [makeRun({ gateStatus: 'ok' })];
    const { container } = render(<QualityTimeline runs={runs} />);
    // All prior steps should be completed (green border)
    const greenElements = container.querySelectorAll('.border-green-500');
    expect(greenElements.length).toBe(3); // checkpoint, analysis, feedback
  });

  it('handles multiple checkpoint cycles (uses first run)', () => {
    const runs = [
      makeRun({ id: 'run-2', gateStatus: 'ok' }),
      makeRun({ id: 'run-1', gateStatus: 'error' }),
    ];
    const { container } = render(<QualityTimeline runs={runs} />);
    // Latest run (index 0) is ok, so 3 completed steps
    const greenElements = container.querySelectorAll('.border-green-500');
    expect(greenElements.length).toBe(3);
  });
});
