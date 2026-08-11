import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { friendlyErrorMessage } from "@/lib/friendly-error";

// Generic table helpers: the generated Supabase types cannot express a
// table-name generic, so use a loose client inside these helpers only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type TableName =
  | "profiles"
  | "team_members"
  | "clients"
  | "songs"
  | "song_writers"
  | "events"
  | "setlists"
  | "setlist_songs"
  | "technical_riders"
  | "generated_documents"
  | "portfolio_clippings"
  | "event_checklists"
  | "formations"
  | "formation_members"
  | "formation_songs"
  | "brand_kits"
  | "gear_checklist_items"
  | "event_expenses"
  | "gear_assets"
  | "maintenance_fund_entries";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
    staleTime: 30_000,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          stage_name: (user.user_metadata?.["full_name"] as string) || "Meu projeto musical",
          email: user.email ?? null,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return created;
    },
  });
}

type ListOptions = {
  order?: { column: string; ascending?: boolean };
  eq?: Record<string, string | number | boolean | null>;
  enabled?: boolean;
};

export function useList<T extends TableName>(table: T, options: ListOptions = {}) {
  const { order, eq, enabled = true } = options;
  return useQuery({
    queryKey: [table, eq ?? null, order ?? null],
    enabled,
    queryFn: async () => {
      let query = db.from(table).select("*");
      if (eq) {
        for (const [key, value] of Object.entries(eq)) {
          query = value === null ? query.is(key, null) : query.eq(key, value);
        }
      }
      if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Tables<T>[];
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, table: TableName) {
  qc.invalidateQueries({ queryKey: [table] });
  if (table === "profiles") qc.invalidateQueries({ queryKey: ["profile"] });
}

export function useInsert<T extends TableName>(table: T, successMessage = "Salvo com sucesso") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<T>, "user_id"> & { user_id?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente.");
      const { data, error } = await db
        .from(table)
        .insert({ ...values, user_id: userId })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Tables<T>;
    },
    onSuccess: () => {
      invalidate(qc, table);
      toast.success(successMessage);
    },
    onError: (error: Error) => toast.error(friendlyErrorMessage(error)),
  });
}

export function useUpdate<T extends TableName>(table: T, successMessage = "Atualizado") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<T> }) => {
      const { data, error } = await db.from(table).update(values).eq("id", id).select("*").single();
      if (error) throw error;
      return data as unknown as Tables<T>;
    },
    onSuccess: () => {
      invalidate(qc, table);
      if (successMessage) toast.success(successMessage);
    },
    onError: (error: Error) => toast.error(friendlyErrorMessage(error)),
  });
}

export function useRemove<T extends TableName>(table: T, successMessage = "Removido") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidate(qc, table);
      toast.success(successMessage);
    },
    onError: (error: Error) => toast.error(friendlyErrorMessage(error)),
  });
}

/** Define uma formação como padrão, removendo o flag de todas as outras do usuário. */
export function useSetDefaultFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente.");
      // Desativa todas e depois ativa a escolhida em sequência para garantir exclusividade.
      const { error: clearError } = await db
        .from("formations")
        .update({ is_default: false })
        .eq("user_id", userId);
      if (clearError) throw clearError;
      const { error: setError } = await db
        .from("formations")
        .update({ is_default: true })
        .eq("id", id);
      if (setError) throw setError;
    },
    onSuccess: () => {
      invalidate(qc, "formations");
      toast.success("Formação padrão atualizada");
    },
    onError: (error: Error) => toast.error(friendlyErrorMessage(error)),
  });
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
