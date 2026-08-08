import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_blood_results",
  title: "List blood results",
  description:
    "List the signed-in user's blood test markers with value, unit, reference range and in/out-of-range status.",
  inputSchema: {
    marker: z.string().trim().min(1).optional().describe("Optional marker name filter, e.g. 'Haemoglobin'."),
    abnormal_only: z.boolean().default(false).describe("Only return markers whose status is not 'normal'."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum number of rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ marker, abnormal_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("blood_results")
      .select("id,marker,value,unit,range,status,date,source")
      .order("date", { ascending: false, nullsFirst: false })
      .limit(limit ?? 50);
    if (marker) query = query.ilike("marker", `%${marker}%`);
    if (abnormal_only) query = query.neq("status", "normal");
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { blood_results: data ?? [] },
    };
  },
});
