import { useCallback, useMemo, useState } from "react";

/**
 * Seleção múltipla para listas — a base do "remover vários de uma vez".
 *
 * Guarda ids, não índices: a lista é reordenada e refiltrada o tempo todo
 * (por status, por mês), e índice viraria seleção errada na primeira
 * mudança.
 *
 * `visibleIds` é o conjunto atualmente na tela. "Selecionar todos" marca só
 * o que está visível — marcar registros que o usuário filtrou para fora e
 * depois apagá-los seria uma armadilha.
 */
export function useBulkSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Item removido ou filtrado para fora não pode continuar contando: sem
  // isto a barra anunciaria "3 selecionados" com 1 visível na lista.
  const active = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allVisibleSelected = visibleIds.length > 0 && active.length === visibleIds.length;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const everySelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      if (everySelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...visibleIds]);
    });
  }, [visibleIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    /** Ids selecionados que ainda estão visíveis. */
    ids: active,
    count: active.length,
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAll,
    allVisibleSelected,
    clear,
  };
}
