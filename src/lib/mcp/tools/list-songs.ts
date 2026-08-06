import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_songs",
  title: "List repertoire",
  description:
    "List the artist's songs used for ECAD / copyright reporting, including ISRC, ISWC and duration.",
  inputSchema: {
    search: z.string().optional().describe("Filter by title (case-insensitive contains)."),
    limit: z.number().int().optional().describe("Max rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 50, 1), 200);
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("songs")
      .select(
        "id, title, genre, duration_seconds, isrc, iswc, performers, producer, publisher, studio",
      )
      .order("title", { ascending: true })
      .limit(take);
    if (search?.trim()) query = query.ilike("title", `%${search.trim()}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { songs: (data ?? []) as unknown as Record<string, unknown>[] },
    };
  },
});
