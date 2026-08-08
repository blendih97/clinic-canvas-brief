import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_medications",
  title: "List medications",
  description: "List the signed-in user's medications with dose, frequency, prescriber and active status.",
  inputSchema: {
    active_only: z.boolean().default(true).describe("Only return medications currently marked as active."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ active_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("medications")
      .select("id,name,dose,frequency,prescriber,facility,date,active,source")
      .order("date", { ascending: false, nullsFirst: false });
    if (active_only !== false) query = query.eq("active", true);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { medications: data ?? [] },
    };
  },
});
