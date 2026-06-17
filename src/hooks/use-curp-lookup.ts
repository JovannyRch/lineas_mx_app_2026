import { useCallback, useRef, useState } from 'react';

import { transformApiResponse } from '@/lib/lookup';
import type { DisplayLine, ProviderResponse } from '@/types';

const API_URL = 'https://www.mislineas.com.mx/api/lookup';
const QUERY_TIMEOUT_MS = 45000;

export function useCurpLookup(onSaveToHistory?: (curp: string) => void) {
  const [loading, setLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DisplayLine[] | null>(null);
  const [queryTime, setQueryTime] = useState<Date | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const lookup = useCallback(async (curp: string) => {
    abortRef.current?.abort();

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError(null);
    setResults([]);
    setTimedOut(false);
    setLoading(true);
    setQueryTime(null);
    setScannedCount(0);

    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
      if (requestIdRef.current !== requestId) return;
      setTimedOut(true);
      setLoading(false);
    }, QUERY_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp: curp.toUpperCase() }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error: ${response.status}`);
      }

      if (!response.body) throw new Error('Sin respuesta del servidor');

      if (requestIdRef.current !== requestId) {
        clearTimeout(timeoutId);
        return;
      }

      setQueryTime(new Date());

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const accumulated: ProviderResponse[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (requestIdRef.current !== requestId) {
          clearTimeout(timeoutId);
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';

        for (const line of parts) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as ProviderResponse;
            if (parsed.provider && parsed.result) {
              accumulated.push(parsed);
            }
          } catch {}
        }

        setScannedCount(accumulated.length);
        setResults(transformApiResponse([...accumulated]));
      }

      if (requestIdRef.current !== requestId) {
        clearTimeout(timeoutId);
        return;
      }

      onSaveToHistory?.(curp.toUpperCase());
      clearTimeout(timeoutId);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if ((err as Error)?.name === 'AbortError') return;
      if (requestIdRef.current !== requestId) return;

      const msg =
        err instanceof Error ? err.message : 'Error de conexion. Verifica tu red.';
      setError(msg);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    setResults(null);
    setQueryTime(null);
    setError(null);
    setTimedOut(false);
    setScannedCount(0);
    setLoading(false);
  }, []);

  return {
    loading,
    timedOut,
    error,
    results,
    queryTime,
    scannedCount,
    lookup,
    reset,
  };
}
