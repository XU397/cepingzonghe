import { useEffect, useRef, MutableRefObject } from 'react';
import { endpoints } from '@shared/services/api';

type Options = {
  flowId?: string | null;
  stepIndexRef: MutableRefObject<number>;
  modulePageNumRef: MutableRefObject<string | number>;
  examNo?: string | null;
  batchCode?: string | null;
  enabled?: boolean;
  intervalMs?: number; // 默认 15s
  onError?: (e: unknown) => void;
};

const MAX_QUEUE = 50;

let lastHeartbeat: any | null = null;

declare global {
  interface Window {
    __flowHeartbeatDebug?: {
      getQueue: (flowId: string) => any[];
      getLastHeartbeat: () => any | null;
      forceFlush: (flowId: string) => Promise<void>;
    };
  }
}

function getQueueKey(flowId: string) {
  return `flow.${flowId}.heartbeatQueue`;
}

function loadQueue(flowId: string): any[] {
  try {
    const raw = localStorage.getItem(getQueueKey(flowId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(flowId: string, queue: any[]) {
  try {
    localStorage.setItem(getQueueKey(flowId), JSON.stringify(queue.slice(-MAX_QUEUE)));
  } catch {
    // ignore
  }
}

async function flushQueue(flowId: string, onError?: (e: unknown) => void) {
  const progressEndpoint = endpoints.flow.updateProgress(flowId);
  const queue = loadQueue(flowId);
  if (!queue.length) return;
  const remain: any[] = [];
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseURL + progressEndpoint;

  for (const item of queue) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
      }
      console.log('[useHeartbeat] Flush success', { flowId, status: res.status, ts: item?.ts });
    } catch (e) {
      remain.push(item);
      console.error('[useHeartbeat] Flush failed', e, { flowId, queueLength: queue.length });
      onError?.(e);
    }
  }
  saveQueue(flowId, remain);
}

async function writeNow(payload: any, onError?: (e: unknown) => void) {
  const progressEndpoint = endpoints.flow.updateProgress(payload.flowId);
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseURL + progressEndpoint;
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
    }
    console.log('[useHeartbeat] Heartbeat success', { flowId: payload.flowId, status: res.status });
  } catch (e) {
    // 入队等待下次 flush
    const queue = loadQueue(payload.flowId);
    queue.push(payload);
    saveQueue(payload.flowId, queue);
    console.error('[useHeartbeat] Heartbeat failed', e, { flowId: payload.flowId, queueLength: queue.length });
    onError?.(e);
  }
}

export default function useHeartbeat({
  flowId,
  stepIndexRef,
  modulePageNumRef,
  examNo,
  batchCode,
  enabled = false,
  intervalMs = 15000,
  onError,
}: Options) {
  const timerRef = useRef<number | null>(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled || !flowId) {
      console.debug('[useHeartbeat] Disabled or missing flowId', {
        enabled,
        flowId,
        hasExamNo: !!examNo,
        hasBatchCode: !!batchCode,
      });
      return;
    }

    console.log('[useHeartbeat] Starting heartbeat', { flowId });

    const sendHeartbeat = () => {
      const payload = {
        flowId,
        examNo: examNo ?? null,
        batchCode: batchCode ?? null,
        stepIndex: stepIndexRef.current ?? 0,
        modulePageNum: modulePageNumRef.current ?? '1',
        ts: Date.now(),
      };

      lastHeartbeat = payload;
      console.log('[useHeartbeat] Sending heartbeat', payload);
      writeNow(payload, onErrorRef.current);
    };

    flushQueue(flowId, onErrorRef.current).finally(() => {
      sendHeartbeat();
    });

    timerRef.current = window.setInterval(() => {
      sendHeartbeat();
    }, Math.max(3000, intervalMs));

    return () => {
      console.log('[useHeartbeat] Cleaning up heartbeat', { flowId });
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, flowId, intervalMs]);

  // DEV-only global debug helpers
  if (import.meta.env.DEV) {
    try {
      window.__flowHeartbeatDebug = {
        getQueue: (fid: string) => loadQueue(fid),
        getLastHeartbeat: () => lastHeartbeat,
        forceFlush: async (fid: string) => {
          await flushQueue(fid);
        },
      };
    } catch {
      // noop
    }
  }
}
