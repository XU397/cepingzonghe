import { useEffect, useMemo, useRef } from 'react'

/**
 * useRenderCounter
 * DEV-only sliding window render counter for debugging render/mount churn.
 *
 * Logs with a stable, parseable format when a threshold is exceeded:
 * [RenderCounter] component=<name> window=<Ns> renders=<X> mounts=<Y> threshold=<T>
 */
export function useRenderCounter(options) {
  const opts = options || {}
  const componentName = String(opts.component || opts.name || 'Unknown')
  const windows = Array.isArray(opts.windows) && opts.windows.length > 0 ? opts.windows : [5, 10, 15]
  const thresholds = opts.thresholds || {}
  const defaultThreshold = typeof opts.threshold === 'number' ? opts.threshold : undefined

  const envEnabledRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RENDER_COUNTER_ENABLED)
    || (typeof process !== 'undefined' && process.env && process.env.VITE_RENDER_COUNTER_ENABLED)
  const logLevelRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RENDER_COUNTER_LOG_LEVEL)
    || (typeof process !== 'undefined' && process.env && process.env.VITE_RENDER_COUNTER_LOG_LEVEL) || 'warn'

  const isDev = (
    (typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.DEV) ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production')
  )

  // enabled default: true in DEV
  const enabledByEnv = (() => {
    if (!isDev) return false
    if (envEnabledRaw == null) return true
    const v = String(envEnabledRaw).toLowerCase().trim()
    return !(v === '0' || v === 'false' || v === 'off' || v === 'no')
  })()

  const enabled = opts.enabled == null ? enabledByEnv : !!opts.enabled
  const logLevel = String(logLevelRaw || 'warn').toLowerCase()

  const renderEventsRef = useRef([]) // timestamps (ms)
  const mountEventsRef = useRef([])
  const unmountEventsRef = useRef([])
  const lastWarnAtRef = useRef(new Map()) // windowSec -> timestamp

  const maxWindowMs = useMemo(() => Math.max(...windows) * 1000, [windows])

  // Mount / unmount bookkeeping
  useEffect(() => {
    if (!enabled) return
    const now = Date.now()
    mountEventsRef.current.push(now)
    return () => {
      unmountEventsRef.current.push(Date.now())
    }
  }, [enabled])

  // Record each commit as one render event
  useEffect(() => {
    if (!enabled) return
    const now = Date.now()
    renderEventsRef.current.push(now)

    // Prune old events to keep memory bounded
    const cutoff = now - maxWindowMs
    const prune = (arr) => {
      if (!arr || arr.length === 0) return
      // Find first index within window
      let i = 0
      while (i < arr.length && arr[i] < cutoff) i++
      if (i > 0) arr.splice(0, i)
    }
    prune(renderEventsRef.current)
    prune(mountEventsRef.current)
    prune(unmountEventsRef.current)

    // Evaluate windows and possibly log
    for (const winSec of windows) {
      const windowMs = winSec * 1000
      const floorTs = now - windowMs
      const renders = countSince(renderEventsRef.current, floorTs)
      const mounts = countSince(mountEventsRef.current, floorTs)

      const threshold = (typeof thresholds[winSec] === 'number') ? thresholds[winSec] : defaultThreshold

      if (typeof threshold === 'number' && renders > threshold) {
        const lastWarnAt = lastWarnAtRef.current.get(winSec) || 0
        // Cooldown to reduce log spam while keeping signal (1s)
        if (now - lastWarnAt >= 1000) {
          // Always use warn for the unified parseable format
          // Do NOT include extra fields to keep the format strict.
          // Example: [RenderCounter] component=FlowModule window=5s renders=XX mounts=YY threshold=100
           
          console.warn(
            `[RenderCounter] component=${componentName} window=${winSec}s renders=${renders} mounts=${mounts} threshold=${threshold}`
          )
          lastWarnAtRef.current.set(winSec, now)
        }
      } else if (logLevel === 'debug') {
        // Optional, lightweight debug log (different prefix to avoid parser confusion)
         
        console.debug(
          `[RenderCounter:debug] component=${componentName} window=${winSec}s renders=${renders} mounts=${mounts}`
        )
      }
    }
  }) // run after every commit
}

function countSince(arr, sinceTs) {
  if (!arr || arr.length === 0) return 0
  // arr is sorted ascending; binary search for first >= sinceTs
  let lo = 0
  let hi = arr.length - 1
  let idx = arr.length
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] >= sinceTs) {
      idx = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }
  return arr.length - idx
}

/**
 * RenderCounter component variant – convenient drop-in.
 */
export function RenderCounter(props) {
  useRenderCounter(props)
  return null
}

export default useRenderCounter

