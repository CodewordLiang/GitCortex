import type { WizardConfig } from '../types';

/**
 * Validates project selection fields for step 0.
 */
export function validateStep0Project(config: WizardConfig): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!config.project.workingDirectory.trim()) {
    errors.workingDirectory = 'validation.project.workingDirectoryRequired';
  } else if (!config.project.gitStatus.isGitRepo) {
    errors.workingDirectory = 'validation.project.notGitRepo';
  }

  return errors;
}
