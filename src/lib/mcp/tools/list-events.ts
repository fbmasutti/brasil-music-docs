import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "List shows",
  description:
    "List the artist's shows (gigs) with date, venue, city, status and fees. Optionally only upcoming shows.",
  inputSchema: {
    upcoming_only: z.boolean().optional().describe("Only shows dated today or later."),
    limit: z.number().int().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ upcoming_only, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("events")
      .select(
        "id, title, event_type, status, event_date, start_time, soundcheck_time, venue, city, state, fee_total, fee_deposit, ecad_sent, client_id",
      )
      .order("event_date", { ascending: true })
      .limit(take);
    if (upcoming_only) {
      query = query.gte("event_date", new Date().toISOString().slice(0, 10));
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: (data ?? []) as unknown as Record<string, unknown>[] },
    };
  },
});
