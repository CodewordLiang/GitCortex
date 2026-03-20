import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Warning,
  ArrowsClockwise,
  Package,
  FolderOpen,
  Globe,
} from '@phosphor-icons/react';
import { handleApiResponse } from '@/lib/api';
import { cliTypesKeys } from '@/hooks/useCliTypes';

// ============================================================================
// Types
// ============================================================================

interface CliRuntimeInfo {
  name: string;
  display_name: string;
  installed: boolean;
  version?: string;
  latest_version?: string;
  has_update?: boolean;
}

// ============================================================================
// Data
// ============================================================================

function useRuntimeCliStatus() {
  return useQuery<CliRuntimeInfo[]>({
    queryKey: ['runtime', 'cli-status'],
    queryFn: async () => {
      const response = await fetch('/api/cli-types/detect');
      const data = await handleApiResponse<Record<string, unknown>[]>(response);
      return (data || []).map((item: Record<string, unknown>) => ({
        name: (item.name as string) || '',
        display_name: (item.display_name as string) || (item.name as string) || '',
        installed: Boolean(item.detected),
        version: item.version as string | undefined,
      }));
    },
    staleTime: 60_000,
  });
}

// ============================================================================
// Component
// ============================================================================

export function RuntimeSettingsNew() {
  const { t } = useTranslation(['settings']);
  const queryClient = useQueryClient();
  const { data: cliStatuses, isLoading } = useRuntimeCliStatus();

  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Re-detect all CLIs
      const response = await fetch('/api/cli-types/detect', { method: 'GET' });
      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime'] });
      queryClient.invalidateQueries({ queryKey: cliTypesKeys.detection });
    },
  });

  return (
    <div className="space-y-double">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-high">
          {t('settings:runtime.title', 'Runtime Environment')}
        </h2>
        <p className="mt-half text-sm text-normal">
          {t(
            'settings:runtime.description',
            'Manage bundled tools, npm mirror settings, and CLI versions.',
          )}
        </p>
      </div>

      {/* CLI Tools Section */}
      <div className="rounded border p-base">
        <div className="mb-base flex items-center justify-between">
          <div className="flex items-center gap-half">
            <Package className="size-icon-md text-brand" weight="duotone" />
            <h3 className="text-base font-medium text-high">
              {t('settings:runtime.cliTools', 'CLI Tools')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="flex items-center gap-half rounded border px-half py-1 text-xs text-low hover:text-normal disabled:opacity-50"
          >
            <ArrowsClockwise
              className={`size-icon-xs ${refreshMutation.isPending ? 'animate-spin' : ''}`}
            />
            {t('settings:runtime.refresh', 'Refresh')}
          </button>
        </div>

        {isLoading ? (
          <div className="py-base text-center text-sm text-low">
            {t('settings:runtime.loading', 'Detecting CLI tools...')}
          </div>
        ) : (
          <div className="space-y-half">
            {cliStatuses?.map((cli) => (
              <div
                key={cli.name}
                className="flex items-center justify-between rounded bg-panel px-base py-half"
              >
                <div className="flex items-center gap-half">
                  {cli.installed ? (
                    <CheckCircle className="size-icon-sm text-success" weight="fill" />
                  ) : (
                    <Warning className="size-icon-sm text-low" />
                  )}
                  <span className="text-sm text-high">{cli.display_name}</span>
                </div>
                <div className="flex items-center gap-base">
                  {cli.version && (
                    <span className="text-xs text-low">{cli.version}</span>
                  )}
                  {cli.has_update && (
                    <span className="rounded bg-brand/10 px-half text-xs text-brand">
                      {t('settings:runtime.updateAvailable', 'Update available')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Install Path Info */}
      <div className="rounded border p-base">
        <div className="flex items-center gap-half">
          <FolderOpen className="size-icon-md text-brand" weight="duotone" />
          <h3 className="text-base font-medium text-high">
            {t('settings:runtime.paths', 'Installation Paths')}
          </h3>
        </div>
        <div className="mt-base space-y-half text-sm">
          <div className="flex justify-between">
            <span className="text-normal">
              {t('settings:runtime.installDir', 'Install Directory')}
            </span>
            <span className="font-ibm-plex-mono text-xs text-low">
              {t('settings:runtime.detectAtStartup', 'Detected at startup')}
            </span>
          </div>
        </div>
      </div>

      {/* npm Mirror Section */}
      <div className="rounded border p-base">
        <div className="flex items-center gap-half">
          <Globe className="size-icon-md text-brand" weight="duotone" />
          <h3 className="text-base font-medium text-high">
            {t('settings:runtime.npmMirror', 'npm Registry')}
          </h3>
        </div>
        <p className="mt-half text-xs text-low">
          {t(
            'settings:runtime.npmMirrorHint',
            'The npm registry mirror is configured in the bundled Node.js installation. Change it via Settings > Agents or reinstall with a different mirror option.',
          )}
        </p>
      </div>
    </div>
  );
}
