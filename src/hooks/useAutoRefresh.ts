import { useEffect, useRef } from "react";

type UseAutoRefreshOptions = {
  enabled: boolean;
  intervalMs?: number;
  refreshOnFocus?: boolean;
  skipWhenHidden?: boolean;
};

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  {
    enabled,
    intervalMs = 8000,
    refreshOnFocus = true,
    skipWhenHidden = true,
  }: UseAutoRefreshOptions
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      if (skipWhenHidden && document.hidden) return;
      void callbackRef.current();
    };

    const intervalId = window.setInterval(run, intervalMs);

    const onFocus = () => {
      run();
    };

    if (refreshOnFocus) {
      window.addEventListener("focus", onFocus);
    }

    return () => {
      window.clearInterval(intervalId);
      if (refreshOnFocus) {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [enabled, intervalMs, refreshOnFocus, skipWhenHidden]);
}
