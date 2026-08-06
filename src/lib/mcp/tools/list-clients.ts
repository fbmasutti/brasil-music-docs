import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_clients",
  title: "List contractors",
  description:
    "List the artist's contractors (contratantes): bars, venues, producers, with contact and document data.",
  inputSchema: {
    search: z.string().optional().describe("Filter by name (case-insensitive contains)."),
    limit: z.number().int().optional().describe("Max rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 25, 1), 100);
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("clients")
      .select("id, name, legal_name, doc, contact_name, email, phone, city, state, address")
      .order("name", { ascending: true })
      .limit(take);
    if (search?.trim()) query = query.ilike("name", `%${search.trim()}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { clients: (data ?? []) as unknown as Record<string, unknown>[] },
    };
  },
});
