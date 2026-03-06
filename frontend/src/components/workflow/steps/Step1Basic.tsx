import React from 'react';
import { Field, FieldLabel, FieldError } from '../../ui-new/primitives/Field';
import { cn } from '@/lib/utils';
import type { BasicConfig, WorkflowExecutionMode } from '../types';
import { useTranslation } from 'react-i18next';

const TASK_COUNT_OPTIONS = [1, 2, 3, 4];

interface Step1BasicProps {
  config: BasicConfig;
  onChange: (updates: Partial<BasicConfig>) => void;
  errors: Record<string, string>;
}

/**
 * Step 1: Captures basic workflow metadata and task count.
 */
export const Step1Basic: React.FC<Step1BasicProps> = ({
  config,
  onChange,
  errors,
}) => {
  const { t } = useTranslation('workflow');
  const isAgentPlanned = config.executionMode === 'agent_planned';

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ description: e.target.value });
  };

  const handleTaskCountSelect = (count: number) => {
    onChange({ taskCount: count });
  };

  const handleCustomTaskCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(value) && value >= 5 && value <= 10) {
      onChange({ taskCount: value });
    }
  };

  const handleImportModeChange = (importFromKanban: boolean) => {
    onChange({ importFromKanban });
  };

  const handleExecutionModeChange = (executionMode: WorkflowExecutionMode) => {
    onChange({ executionMode });
  };

  const handleInitialGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ initialGoal: e.target.value });
  };

  const descriptionLabel = isAgentPlanned
    ? t('step1.planningHintsLabel')
    : t('step1.descriptionLabel');
  const descriptionPlaceholder = isAgentPlanned
    ? t('step1.planningHintsPlaceholder')
    : t('step1.descriptionPlaceholder');

  return (
    <div className="flex flex-col gap-base">
      {/* Workflow Name */}
      <Field>
        <FieldLabel>{t('step1.nameLabel')}</FieldLabel>
        <input
          type="text"
          value={config.name}
          onChange={handleNameChange}
          placeholder={t('step1.namePlaceholder')}
          className={cn(
            'w-full bg-secondary rounded-sm border px-base py-half text-base text-high',
            'placeholder:text-low placeholder:opacity-80',
            'focus:outline-none focus:ring-1 focus:ring-brand',
            errors.name && 'border-error'
          )}
        />
        {errors.name && <FieldError>{t(errors.name)}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>{t('step1.modeLabel')}</FieldLabel>
        <p className="text-sm text-low">{t('step1.modeHint')}</p>
        <div className="mt-base grid gap-base md:grid-cols-2">
          {(
            [
              {
                id: 'diy' as const,
                titleKey: 'step1.diyTitle',
                descriptionKey: 'step1.diyDescription',
              },
              {
                id: 'agent_planned' as const,
                titleKey: 'step1.agentPlannedTitle',
                descriptionKey: 'step1.agentPlannedDescription',
              },
            ] satisfies Array<{
              id: WorkflowExecutionMode;
              titleKey: string;
              descriptionKey: string;
            }>
          ).map((mode) => {
            const isSelected = config.executionMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  handleExecutionModeChange(mode.id);
                }}
                className={cn(
                  'cursor-pointer rounded-sm border p-base text-left transition-colors',
                  'focus:outline-none focus:ring-1 focus:ring-brand hover:border-brand',
                  isSelected
                    ? 'border-brand bg-brand/10 text-high'
                    : 'border-border bg-secondary text-normal'
                )}
              >
                <div className="text-base font-medium">{t(mode.titleKey)}</div>
                <div className="mt-half text-sm text-low">
                  {t(mode.descriptionKey)}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      {isAgentPlanned && (
        <Field>
          <FieldLabel>{t('step1.initialGoalLabel')}</FieldLabel>
          <textarea
            value={config.initialGoal ?? ''}
            onChange={handleInitialGoalChange}
            placeholder={t('step1.initialGoalPlaceholder')}
            rows={4}
            className={cn(
              'w-full bg-secondary rounded-sm border px-base py-half text-base text-high',
              'placeholder:text-low placeholder:opacity-80',
              'focus:outline-none focus:ring-1 focus:ring-brand',
              'resize-none',
              errors.initialGoal && 'border-error'
            )}
          />
          <p className="text-sm text-low">{t('step1.initialGoalHint')}</p>
          {errors.initialGoal && <FieldError>{t(errors.initialGoal)}</FieldError>}
        </Field>
      )}

      {/* Description / planning hints */}
      <Field>
        <FieldLabel>{descriptionLabel}</FieldLabel>
        <textarea
          value={config.description ?? ''}
          onChange={handleDescriptionChange}
          placeholder={descriptionPlaceholder}
          rows={3}
          className={cn(
            'w-full bg-secondary rounded-sm border px-base py-half text-base text-normal',
            'placeholder:text-low placeholder:opacity-80',
            'focus:outline-none focus:ring-1 focus:ring-brand',
            'resize-none'
          )}
        />
      </Field>

      {!isAgentPlanned && (
        <>
          {/* Task Count Selection */}
          <Field>
            <FieldLabel>{t('step1.taskCountLabel')}</FieldLabel>
            <div className="flex flex-wrap gap-base">
              {TASK_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    handleTaskCountSelect(count);
                  }}
                  className={cn(
                    'cursor-pointer px-base py-half rounded-sm border text-base transition-colors',
                    'hover:border-brand hover:text-high',
                    config.taskCount === count
                      ? 'border-brand bg-brand/10 text-high'
                      : 'border-border text-normal bg-secondary'
                  )}
                >
                  {t('step1.taskCountOption', { count })}
                </button>
              ))}
            </div>
            <div className="mt-base flex items-center gap-base">
              <span className="text-base text-low">{t('step1.customCountLabel')}</span>
              <input
                type="number"
                min={5}
                max={10}
                value={
                  config.taskCount >= 5 && config.taskCount <= 10
                    ? config.taskCount
                    : ''
                }
                onChange={handleCustomTaskCountChange}
                placeholder={t('step1.customCountPlaceholder')}
                className={cn(
                  'w-20 bg-secondary rounded-sm border px-base py-half text-base text-normal',
                  'placeholder:text-low placeholder:opacity-80',
                  'focus:outline-none focus:ring-1 focus:ring-brand'
                )}
              />
            </div>
            {errors.taskCount && <FieldError>{t(errors.taskCount)}</FieldError>}
          </Field>

          {/* Import Mode */}
          <Field>
            <FieldLabel>{t('step1.importLabel')}</FieldLabel>
            <div className="flex flex-col gap-base">
              <label className="flex items-center gap-base cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={!config.importFromKanban}
                  onChange={() => {
                    handleImportModeChange(false);
                  }}
                  className="size-icon-sm accent-brand"
                />
                <span className="text-base text-normal">{t('step1.importNew')}</span>
              </label>
              <label className="flex items-center gap-base cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={config.importFromKanban}
                  onChange={() => {
                    handleImportModeChange(true);
                  }}
                  className="size-icon-sm accent-brand"
                />
                <span className="text-base text-normal">{t('step1.importKanban')}</span>
              </label>
            </div>
          </Field>
        </>
      )}
    </div>
  );
};
