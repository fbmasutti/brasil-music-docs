import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getArtistProfileTool from "./tools/get-artist-profile";
import listEventsTool from "./tools/list-events";
import createEventTool from "./tools/create-event";
import listClientsTool from "./tools/list-clients";
import createClientTool from "./tools/create-client";
import listSongsTool from "./tools/list-songs";

// The OAuth issuer must be the direct Supabase host: the project ref is the only
// value that survives publish unchanged, and Vite inlines this literal at build time.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "stagekit",
  title: "StageKit",
  version: "0.1.0",
  instructions:
    "Tools for StageKit, the management toolkit for Brazilian independent musicians. Read and create shows (events) and contractors (clientes/contratantes), read the artist's legal/fiscal profile, and read the repertoire used for ECAD reporting. All data is scoped to the signed-in artist.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getArtistProfileTool,
    listEventsTool,
    createEventTool,
    listClientsTool,
    createClientTool,
    listSongsTool,
  ],
});
