import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useQualityRuns,
  useQualityRunDetail,
  useQualityIssues,
  useTerminalLatestQuality,
} from '@/hooks/useQualityGate';

// ---------- helpers ----------

let fetchMock: ReturnType<typeof vi.fn>;

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

/** Mock a fetch that returns an ApiResponse envelope */
function mockFetchOk(data: unknown) {
  const body = { success: true, data };
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    url: '/api/test',
    statusText: 'OK',
  });
}

function mockFetchError(status: number, message: string) {
  fetchMock.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(JSON.stringify({ message })),
    url: '/api/test',
    statusText: message,
  });
}

function mockFetchReject(error: Error) {
  fetchMock.mockImplementation(() => Promise.reject(error));
}

// ---------- setup / teardown ----------

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------- tests ----------

describe('useQualityGate hooks - exception scenarios', () => {
  describe('API 404 handling (backend does not support quality gate)', () => {
    it('useQualityRuns returns empty fallback on 404', async () => {
      mockFetchError(404, 'Not Found');
      const { result } = renderHook(() => useQualityRuns('wf-1'), {
        wrapper: createWrapper(),
      });
      // qualityFetchSafe catches 404 and returns fallback (empty array)
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
    });

    it('useTerminalLatestQuality returns null fallback on 404', async () => {
      mockFetchError(404, 'Not Found');
      const { result } = renderHook(
        () => useTerminalLatestQuality('term-1'),
        { wrapper: createWrapper() }
      );
      // qualityFetchSafe catches 404 and returns null fallback
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });

  describe('API 500 handling (server error)', () => {
    it('useQualityRuns surfaces server error', async () => {
      mockFetchError(500, 'Internal Server Error');
      const { result } = renderHook(() => useQualityRuns('wf-1'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });

    it('useQualityRunDetail surfaces server error', async () => {
      mockFetchError(500, 'Internal Server Error');
      const { result } = renderHook(
        () => useQualityRunDetail('run-1'),
        { wrapper: createWrapper() }
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('useQualityIssues surfaces server error', async () => {
      mockFetchError(500, 'Internal Server Error');
      const { result } = renderHook(() => useQualityIssues('run-1'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('timeout handling', () => {
    it('useQualityRuns treats network error as error state', async () => {
      mockFetchReject(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useQualityRuns('wf-1'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(TypeError);
    });

    it('useTerminalLatestQuality treats AbortError as error', async () => {
      const abortErr = new DOMException('The operation was aborted', 'AbortError');
      mockFetchReject(abortErr);
      const { result } = renderHook(
        () => useTerminalLatestQuality('term-1'),
        { wrapper: createWrapper() }
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('partial / malformed response handling', () => {
    it('useQualityRuns errors on non-JSON response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
        text: () => Promise.resolve('not json'),
        url: '/api/test',
        statusText: 'OK',
      });
      const { result } = renderHook(() => useQualityRuns('wf-1'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('useQualityRunDetail handles null data gracefully', async () => {
      mockFetchOk(null);
      const { result } = renderHook(
        () => useQualityRunDetail('run-1'),
        { wrapper: createWrapper() }
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });

  describe('duplicate submission (same terminal, same checkpoint)', () => {
    it('returns same cached data for repeated calls with same terminal ID', async () => {
      const summary = {
        id: 'run-1',
        workflowId: 'wf-1',
        terminalId: 'term-1',
        gateStatus: 'ok',
        totalIssues: 0,
        blockingIssues: 0,
      };
      mockFetchOk(summary);

      const wrapper = createWrapper();
      const { result: r1 } = renderHook(
        () => useTerminalLatestQuality('term-1'),
        { wrapper }
      );
      await waitFor(() => expect(r1.current.isSuccess).toBe(true));
      expect(r1.current.data).toEqual(summary);

      // Second render with same ID reuses cache
      const callCountAfterFirst = fetchMock.mock.calls.length;
      const { result: r2 } = renderHook(
        () => useTerminalLatestQuality('term-1'),
        { wrapper }
      );
      await waitFor(() => expect(r2.current.isSuccess).toBe(true));
      expect(r2.current.data).toEqual(summary);
      expect(fetchMock.mock.calls.length).toBe(callCountAfterFirst);
    });

    it('does not fire query when terminalId is undefined', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useTerminalLatestQuality(undefined),
        { wrapper }
      );
      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
