import { useCallback, useEffect, useRef } from 'react';

/** Delays invoking `fn` until `delayMs` has passed since the last call — used to avoid firing a network write on every keystroke. */
export function useDebouncedCallback<Args extends unknown[]>(fn: (...args: Args) => void, delayMs = 500) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return useCallback(
    (...args: Args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs]
  );
}
