import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useList, useProfile, useUpdate } from "@/lib/queries";
import type { Tables } from "@/integrations/supabase/types";

type Formation = Tables<"formations">;

type ActiveFormationContextValue = {
  formations: Formation[];
  activeFormation: Formation | null;
  activeFormationId: string | null;
  setActiveFormationId: (id: string | null) => void;
};

const ActiveFormationContext = createContext<ActiveFormationContextValue | null>(null);

export function ActiveFormationProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const updateProfile = useUpdate("profiles", "");

  const activeFormationId = profile?.active_formation_id ?? null;
  const activeFormation = formations.find((f) => f.id === activeFormationId) ?? null;

  function setActiveFormationId(id: string | null) {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, values: { active_formation_id: id } });
  }

  const value = useMemo(
    () => ({ formations, activeFormation, activeFormationId, setActiveFormationId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formations, activeFormation, activeFormationId, profile?.id],
  );

  return (
    <ActiveFormationContext.Provider value={value}>{children}</ActiveFormationContext.Provider>
  );
}

export function useActiveFormation() {
  const ctx = useContext(ActiveFormationContext);
  if (!ctx) throw new Error("useActiveFormation deve estar dentro de ActiveFormationProvider");
  return ctx;
}
