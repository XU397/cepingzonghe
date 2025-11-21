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
const flushingFlows = new Set<string>();

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
  // 防止并发 flush 同一个 flowId
  if (flushingFlows.has(flowId)) {
    console.debug('[useHeartbeat] Flush already in progress, skipping', { flowId });
    return;
  }

  const queue = loadQueue(flowId);
  if (!queue.length) return;

  flushingFlows.add(flowId);

  try {
    const progressEndpoint = endpoints.flow.updateProgress(flowId);
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
  } finally {
    flushingFlows.delete(flowId);
  }
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
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // 只依赖 flowId，在内部检查 enabled 状态
  useEffect(() => {
    if (!flowId) {
      return;
    }

    // 延迟检查 enabled 状态，避免在 loading 状态变化时频繁触发
    const startupDelay = setTimeout(() => {
      if (!enabledRef.current) {
        console.debug('[useHeartbeat] Not enabled, skipping startup', { flowId });
        return;
      }

      // 如果已经有定时器在运行，不要重复初始化
      if (timerRef.current) {
        console.debug('[useHeartbeat] Timer already running, skipping', { flowId });
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
        if (timerRef.current === null) {
          sendHeartbeat();
          timerRef.current = window.setInterval(() => {
            sendHeartbeat();
          }, Math.max(3000, intervalMs));
        }
      });
    }, 500); // 500ms 延迟，等待 loading 状态稳定

    return () => {
      clearTimeout(startupDelay);
      console.log('[useHeartbeat] Cleaning up heartbeat', { flowId });
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [flowId, intervalMs]); // 不依赖 enabled，避免频繁触发

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
