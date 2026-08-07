import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_client",
  title: "Create contractor",
  description:
    "Create a new contractor (contratante) so it can be used in shows, contracts and receipts.",
  inputSchema: {
    name: z.string().describe("Display name of the venue, bar or producer."),
    legal_name: z.string().optional().describe("Razão social."),
    doc: z.string().optional().describe("CPF or CNPJ."),
    contact_name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const name = input.name.trim();
    if (!name) throw new ToolError("name cannot be empty");

    const supabase = supabaseForUser(ctx);
    const row: Record<string, unknown> = { user_id: ctx.getUserId(), name };
    for (const key of [
      "legal_name",
      "doc",
      "contact_name",
      "email",
      "phone",
      "city",
      "state",
      "address",
      "notes",
    ] as const) {
      const value = input[key];
      if (value !== undefined && value !== "") row[key] = value;
    }

    const { data, error } = await supabase.from("clients").insert(row).select().maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { client: data as unknown as Record<string, unknown> },
    };
  },
});
