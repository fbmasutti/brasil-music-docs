import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useList, useProfile, useUpdate } from "@/lib/queries";
import { paletteOf } from "@/lib/brand-presets";
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

/**
 * Cor de destaque pro cabeçalho do PDF: usa o brand kit da formação
 * explícita (rider, show específico) quando houver, senão herda "tocando
 * como" do header — mesma lógica de herança do Gerador de Posts.
 */
export function useDocumentAccent(explicitFormationId?: string | null): string | undefined {
  const { formations, activeFormation } = useActiveFormation();
  const { data: brandKits = [] } = useList("brand_kits");
  const formation = explicitFormationId
    ? (formations.find((f) => f.id === explicitFormationId) ?? null)
    : activeFormation;
  const brandKit = brandKits.find((k) => k.id === formation?.brand_kit_id);
  return brandKit ? paletteOf(brandKit).accent : undefined;
}
