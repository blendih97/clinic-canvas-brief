import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_document",
  title: "Get a medical document",
  description:
    "Fetch one of the signed-in user's documents by id, including the AI summary, original text and translated text.",
  inputSchema: {
    document_id: z.string().uuid().describe("The document id returned by list_documents."),
    include_full_text: z
      .boolean()
      .default(false)
      .describe("Include the full original and translated document text (can be long)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ document_id, include_full_text }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const columns = include_full_text
      ? "id,name,type,date,facility,country,original_language,summary,ai_note,content_original,content_translated,processing_status"
      : "id,name,type,date,facility,country,original_language,summary,ai_note,processing_status";
    const { data, error } = await supabaseForUser(ctx)
      .from("documents")
      .select(columns)
      .eq("id", document_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Document not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { document: data },
    };
  },
});
