const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { providerName, providerEmail, patientName, requestDescription, uploadLink } = await req.json();

    if (!providerEmail || !patientName || !uploadLink) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 2px solid #b8860b; padding-bottom: 15px; margin-bottom: 25px;">
    <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 300; letter-spacing: 0.15em; color: #b8860b; margin: 0;">VAULT</h1>
    <p style="font-size: 10px; letter-spacing: 0.2em; color: #888; text-transform: uppercase; margin: 2px 0 0;">Health Intelligence</p>
  </div>

  <p>Dear ${providerName || "Healthcare Provider"} team,</p>

  <p>Your patient <strong>${patientName}</strong> has requested access to their medical records through Vault Health Intelligence, a secure health record platform.</p>

  <p><strong>They are requesting:</strong></p>
  <div style="background: #f5f5f0; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #b8860b;">
    ${requestDescription}
  </div>

  <p>Please use the secure link below to upload the requested documents directly to their health vault. No login is required — simply click the link and upload the files.</p>

  <div style="text-align: center; margin: 25px 0;">
    <a href="${uploadLink}" style="display: inline-block; background: #b8860b; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Upload Records</a>
  </div>

  <p style="font-size: 13px; color: #666;">This link expires in 30 days. All files are transmitted securely and encrypted.</p>

  <p style="font-size: 13px; color: #666;">If you have any questions please contact <a href="mailto:support@vault.health" style="color: #b8860b;">support@vault.health</a></p>

  <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 15px;">
    <p style="font-family: Georgia, serif; font-size: 14px; color: #b8860b; letter-spacing: 0.1em; margin: 0;">VAULT</p>
    <p style="font-size: 11px; color: #999; margin: 2px 0 0;">Health Intelligence</p>
  </div>
</body>
</html>`;

    // For now, log the email content (email sending would require email infrastructure)
    console.log(`Record request email to: ${providerEmail}`);
    console.log(`Subject: Medical Records Request from ${patientName}`);
    console.log(`Upload link: ${uploadLink}`);

    return new Response(JSON.stringify({ success: true, message: "Request recorded. Email delivery requires email domain setup." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
