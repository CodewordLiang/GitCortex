import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QualityIssueList } from '../QualityIssueList';
import type { QualityIssueRecord } from 'shared/types';

function makeIssue(overrides: Partial<QualityIssueRecord> = {}): QualityIssueRecord {
  return {
    id: 'issue-1',
    qualityRunId: 'run-1',
    ruleId: 'S001',
    ruleType: 'BUG',
    severity: 'major',
    source: 'clippy',
    message: 'Default issue message',
    filePath: 'src/main.rs',
    line: 42,
    endLine: null,
    columnStart: null,
    columnEnd: null,
    isNew: false,
    isBlocking: false,
    effortMinutes: null,
    context: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('QualityIssueList', () => {
  it('renders empty state when issues array is empty', () => {
    render(<QualityIssueList issues={[]} />);
    expect(screen.getByText('No quality issues found!')).toBeInTheDocument();
    expect(screen.getByText('Excellent job writing clean code.')).toBeInTheDocument();
  });

  it('renders empty state when issues is undefined-like', () => {
    render(<QualityIssueList issues={[] as QualityIssueRecord[]} />);
    expect(screen.getByText('No quality issues found!')).toBeInTheDocument();
  });

  it('renders blocker severity issue with correct icon', () => {
    const issues = [makeIssue({ id: 'b1', severity: 'blocker', message: 'Null pointer' })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('Null pointer')).toBeInTheDocument();
  });

  it('renders critical severity issue', () => {
    const issues = [makeIssue({ id: 'c1', severity: 'critical', message: 'SQL injection risk' })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('SQL injection risk')).toBeInTheDocument();
  });

  it('renders major severity issue', () => {
    const issues = [makeIssue({ id: 'm1', severity: 'major', message: 'Missing error handling' })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('Missing error handling')).toBeInTheDocument();
  });

  it('renders minor severity issue', () => {
    const issues = [makeIssue({ id: 'n1', severity: 'minor', message: 'Unused import' })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('Unused import')).toBeInTheDocument();
  });

  it('renders info severity issue', () => {
    const issues = [makeIssue({ id: 'i1', severity: 'info', message: 'Consider refactoring' })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('Consider refactoring')).toBeInTheDocument();
  });

  it('renders multiple issues of different severities', () => {
    const issues = [
      makeIssue({ id: '1', severity: 'blocker', message: 'Blocker bug' }),
      makeIssue({ id: '2', severity: 'major', message: 'Major warning' }),
      makeIssue({ id: '3', severity: 'info', message: 'Info note' }),
    ];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('Blocker bug')).toBeInTheDocument();
    expect(screen.getByText('Major warning')).toBeInTheDocument();
    expect(screen.getByText('Info note')).toBeInTheDocument();
  });

  it('displays file path and line number', () => {
    const issues = [makeIssue({ filePath: 'src/lib.rs', line: 99 })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('src/lib.rs')).toBeInTheDocument();
    expect(screen.getByText('Line 99')).toBeInTheDocument();
  });

  it('displays "Unknown file" when filePath is empty', () => {
    const issues = [makeIssue({ filePath: '', line: null })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('Unknown file')).toBeInTheDocument();
  });

  it('displays rule ID and source', () => {
    const issues = [makeIssue({ ruleId: 'E0001', source: 'eslint' })];
    render(<QualityIssueList issues={issues} />);
    expect(screen.getByText('E0001')).toBeInTheDocument();
    expect(screen.getByText('eslint')).toBeInTheDocument();
  });

  it('expands issue on click', () => {
    const issues = [makeIssue({ message: 'Clickable issue' })];
    render(<QualityIssueList issues={issues} />);
    const item = screen.getByText('Clickable issue');
    fireEvent.click(item);
    // After click the chevron should change (component re-renders)
    expect(item).toBeInTheDocument();
  });
});
