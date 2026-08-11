import { useEffect, useRef, useState } from "react";

/** Retorna uma versão do valor que só muda após `delay` ms sem alterações. */
export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);

  return debounced;
}
