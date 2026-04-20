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

    const documentPaths = new Set<string>();

    const { data: documents } = await adminClient
      .from("documents")
      .select("file_path")
      .eq("user_id", user.id);

    documents?.forEach((document) => {
      if (document.file_path) documentPaths.add(document.file_path);
    });

    const { data: mediaShares } = await adminClient
      .from("media_shares")
      .select("file_path")
      .eq("user_id", user.id);

    mediaShares?.forEach((item) => {
      if (item.file_path) documentPaths.add(item.file_path);
    });

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
      adminClient.from("platform_events").delete().eq("user_id", user.id),
      adminClient.from("platform_events").delete().eq("actor_user_id", user.id),
      adminClient.from("record_requests").delete().eq("user_id", user.id),
      adminClient.from("profiles").delete().eq("id", user.id),
      adminClient.from("user_roles").delete().eq("user_id", user.id),
    ];

    const results = await Promise.allSettled(deletions);
    const failedDelete = results.find((result) => result.status === "rejected");
    if (failedDelete && failedDelete.status === "rejected") {
      throw failedDelete.reason;
    }

    if (documentPaths.size > 0) {
      await adminClient.storage.from("medical-documents").remove([...documentPaths]);
    }

    const { data: avatarFiles } = await adminClient.storage.from("avatars").list(user.id);
    if (avatarFiles && avatarFiles.length > 0) {
      await adminClient.storage.from("avatars").remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
    }

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