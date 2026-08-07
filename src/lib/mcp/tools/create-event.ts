import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_event",
  title: "Create show",
  description:
    "Create a new show (gig) in the artist's agenda. Dates use YYYY-MM-DD and times use HH:MM.",
  inputSchema: {
    title: z.string().describe("Show title, e.g. 'Bar do Zé - Sábado'."),
    event_date: z.string().optional().describe("Show date as YYYY-MM-DD."),
    start_time: z.string().optional().describe("Start time as HH:MM."),
    soundcheck_time: z.string().optional().describe("Soundcheck time as HH:MM."),
    venue: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional().describe("Two-letter Brazilian state code, e.g. SP."),
    event_type: z.string().optional().describe("Type of gig, e.g. show, casamento, aula."),
    fee_total: z.number().optional().describe("Total fee in BRL."),
    fee_deposit: z.number().optional().describe("Deposit (sinal) in BRL."),
    client_id: z.string().optional().describe("Existing contractor id from list_clients."),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const title = input.title.trim();
    if (!title) throw new ToolError("title cannot be empty");

    const supabase = supabaseForUser(ctx);
    const row: Record<string, unknown> = { user_id: ctx.getUserId(), title };
    for (const key of [
      "event_date",
      "start_time",
      "soundcheck_time",
      "venue",
      "city",
      "state",
      "event_type",
      "fee_total",
      "fee_deposit",
      "client_id",
      "notes",
    ] as const) {
      const value = input[key];
      if (value !== undefined && value !== "") row[key] = value;
    }

    const { data, error } = await supabase.from("events").insert(row).select().maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { event: data as unknown as Record<string, unknown> },
    };
  },
});
