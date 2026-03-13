/**
 * Human-readable labels for quality run statuses and gate modes.
 * Used by quality-gate UI components to display consistent text.
 */

export const qualityStatusLabels: Record<string, string> = {
  pending: 'Quality Pending',
  running: 'Analyzing...',
  passed: 'Quality Passed',
  failed: 'Quality Failed',
  skipped: 'Quality Skipped',
  error: 'Analysis Error',
};

export const qualityModeLabels: Record<string, string> = {
  off: 'Off',
  shadow: 'Shadow',
  warn: 'Warning',
  enforce: 'Enforcing',
};
