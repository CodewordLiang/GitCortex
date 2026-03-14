import type { WizardConfig } from '../types';

/**
 * Validates command preset selection for step 5.
 */
export function validateStep5Commands(config: WizardConfig): Record<string, string> {
  const errors: Record<string, string> = {};

  if (config.commands.enabled && config.commands.presetIds.length === 0) {
    errors.commands = 'validation.commands.presetsRequired';
  }

  return errors;
}
