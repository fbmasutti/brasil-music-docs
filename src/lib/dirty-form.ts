/** Detecta se `form` divergiu do `baseline` e oferece reset de volta a ele. */
export function useDirtyForm<T>(
  form: T,
  baseline: T,
  setForm: (v: T) => void,
): { isDirty: boolean; reset: () => void } {
  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);
  return { isDirty, reset: () => setForm(baseline) };
}
