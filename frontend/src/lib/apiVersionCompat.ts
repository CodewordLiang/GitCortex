import { ApiError } from '@/lib/api';

/**
 * Returns `true` when the quality-gate backend endpoints are available.
 * A 404 response indicates the backend predates the quality-gate feature,
 * so we degrade gracefully instead of surfacing an error.
 */
export function isQualityGateAvailable(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 404) return false;
  if (error instanceof Response && error.status === 404) return false;
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status: unknown }).status === 404
  )
    return false;
  return true;
}
