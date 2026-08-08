import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_documents",
  title: "List medical documents",
  description:
    "List the signed-in user's uploaded medical documents (name, type, date, facility, country, language and processing status).",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Optional text to match against the document name."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of documents to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("documents")
      .select(
        "id,name,type,date,facility,country,original_language,translated_language_code,pages,processing_status,created_at",
      )
      .order("date", { ascending: false, nullsFirst: false })
      .limit(limit ?? 25);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { documents: data ?? [] },
    };
  },
});
