import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_artist_profile",
  title: "Get artist profile",
  description:
    "Read the signed-in artist's StageKit profile: stage name, entity type, city, document and ECAD registration data.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "stage_name, legal_name, entity_type, doc_type, city, state, email, phone, ecad_association, ecad_client_number, onboarded",
      )
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return { content: [{ type: "text", text: "No profile found for this user yet." }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { profile: data as unknown as Record<string, unknown> },
    };
  },
});

export const _unused = z;
