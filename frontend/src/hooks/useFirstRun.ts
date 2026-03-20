import { useCallback } from 'react';
import { useUserSystem } from '@/components/ConfigProvider';

/**
 * Hook for detecting and managing first-run state.
 *
 * Checks whether the application is running in "installer mode" (standalone
 * Windows installation) and whether the first-run wizard has been completed.
 */
export function useFirstRun() {
  const { config, updateAndSaveConfig } = useUserSystem();

  const isFirstRun = !(config as Record<string, unknown>)?.first_run_completed;

  const completeFirstRun = useCallback(async () => {
    await updateAndSaveConfig({
      first_run_completed: true,
    } as Record<string, unknown>);
  }, [updateAndSaveConfig]);

  return { isFirstRun, completeFirstRun };
}
