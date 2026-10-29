import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Backend configuration is incomplete");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { confirmation } = await req.json().catch(() => ({ confirmation: null }));
    if (confirmation !== "DELETE") {
      return new Response(JSON.stringify({ error: "Confirmation text mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: partnerCleanupError } = await adminClient.rpc("cleanup_partner_personal_data", {
      _user_id: user.id, _email: user.email ?? null,
    });
    if (partnerCleanupError) throw new Error("Partner cleanup failed; account deletion stopped");

    const { data: ownedBriefs, error: briefLookupError } = await adminClient.from("shared_briefs").select("token").eq("user_id", user.id);
    if (briefLookupError) throw briefLookupError;
    for (const brief of ownedBriefs ?? []) {
      const { error } = await adminClient.from("share_brief_acceptances").delete().eq("token", brief.token);
      if (error) throw error;
    }
    const { error: auditError } = await adminClient.from("admin_actions")
      .update({ target_user_id: null, details_json: {} }).eq("target_user_id", user.id);
    if (auditError) throw auditError;
    // Admin actor FK cannot be anonymised without a separate reviewed retention migration.
    const { count: actorActions, error: actorLookupError } = await adminClient.from("admin_actions")
      .select("id", { count: "exact", head: true }).eq("admin_user_id", user.id);
    if (actorLookupError || actorActions) throw new Error("Admin audit retention review required before account deletion");
    const documentPaths = new Set<string>();

    const { data: documents, error: documentLookupError } = await adminClient
      .from("documents")
      .select("file_path")
      .eq("user_id", user.id);

    if (documentLookupError) throw documentLookupError;
    documents?.forEach((document) => {
      if (document.file_path) documentPaths.add(document.file_path);
    });

    const { data: mediaShares, error: mediaLookupError } = await adminClient
      .from("media_shares")
      .select("file_path")
      .eq("user_id", user.id);

    if (mediaLookupError) throw mediaLookupError;
    mediaShares?.forEach((item) => {
      if (item.file_path) documentPaths.add(item.file_path);
    });

    if (documentPaths.size > 0) {
      const { error } = await adminClient.storage.from("medical-documents").remove([...documentPaths].filter(path => path.startsWith(`${user.id}/`)));
      if (error) throw error;
    }

    const { data: avatarFiles, error: avatarListError } = await adminClient.storage.from("avatars").list(user.id);
    if (avatarListError) throw avatarListError;
    if (avatarFiles && avatarFiles.length > 0) {
      const { error } = await adminClient.storage.from("avatars").remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
      if (error) throw error;
    }


    const deletions = [
      adminClient.from("alerts").delete().eq("user_id", user.id),
      adminClient.from("allergies").delete().eq("user_id", user.id),
      adminClient.from("blood_results").delete().eq("user_id", user.id),
      adminClient.from("documents").delete().eq("user_id", user.id),
      adminClient.from("family_members").delete().eq("owner_id", user.id),
      adminClient.from("family_members").delete().eq("member_id", user.id),
      adminClient.from("imaging_results").delete().eq("user_id", user.id),
      adminClient.from("medications").delete().eq("user_id", user.id),
      adminClient.from("media_shares").delete().eq("user_id", user.id),


      adminClient.from("record_requests").delete().eq("user_id", user.id),

      adminClient.from("user_roles").delete().eq("user_id", user.id),
      adminClient.from("visits").delete().eq("user_id", user.id),
      adminClient.from("shared_briefs").delete().eq("user_id", user.id),
      adminClient.from("imaging_link_overrides").delete().eq("user_id", user.id),
      adminClient.from("export_translation_cache").delete().eq("user_id", user.id),
      adminClient.from("page_views").delete().eq("user_id", user.id),
      adminClient.from("admin_2fa_recovery").delete().eq("user_id", user.id),
    ];

    // Supabase query failures resolve with { error }; they do not reject promises.
    const results = await Promise.all(deletions);
    const failed = results.find(result => result.error);
    if (failed?.error) throw failed.error;
    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", user.id);
    if (profileError) throw profileError;

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserError) throw deleteUserError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-account error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});