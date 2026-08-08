import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_visits",
  title: "List medical visits",
  description:
    "List the signed-in user's medical visits (facility, country, reason, diagnosis, findings and follow-up recommendations).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of visits to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("visits")
      .select(
        "id,visit_date,facility_name,facility_country,reason_for_visit,diagnosis,findings,investigations_performed,medications_prescribed,follow_up_recommendations",
      )
      .order("visit_date", { ascending: false, nullsFirst: false })
      .limit(limit ?? 25);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { visits: data ?? [] },
    };
  },
});
