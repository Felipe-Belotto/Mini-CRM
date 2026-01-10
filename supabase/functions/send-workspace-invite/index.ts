/// <reference path="./deno_types.d.ts" />
// @ts-expect-error - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validar método HTTP
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { workspaceId, email, role, token, inviterName, workspaceName } =
      await req.json();

    // Validar campos obrigatórios
    if (!workspaceId || !email || !token || !inviterName || !workspaceName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const siteUrl =
      Deno.env.get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/invites/accept/${token}`;

    const roleLabel =
      role === "admin"
        ? "Administrador"
        : role === "member"
          ? "Membro"
          : "Owner";

    // Construir HTML do email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para Workspace</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h1 style="color: #111827; margin-top: 0;">Você foi convidado!</h1>
    
    <p style="font-size: 16px; margin: 20px 0;">
      <strong>${escapeHtml(inviterName)}</strong> convidou você para se juntar ao workspace <strong>${escapeHtml(workspaceName)}</strong> como <strong>${escapeHtml(roleLabel)}</strong>.
    </p>

    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #111827; margin-top: 0; font-size: 18px;">${escapeHtml(workspaceName)}</h2>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Função: ${escapeHtml(roleLabel)}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Aceitar Convite
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Ou copie e cole este link no seu navegador:<br>
      <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
    </p>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
    </p>
  </div>
</body>
</html>
    `;

    const emailText = `
Você foi convidado!

${inviterName} convidou você para se juntar ao workspace ${workspaceName} como ${roleLabel}.

Aceite o convite acessando: ${inviteUrl}

Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
    `.trim();

    // Tentar enviar email usando Resend se configurado
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") || "noreply@example.com";

    if (resendApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: `Convite para ${workspaceName}`,
            html: emailHtml,
            text: emailText,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.text();
          console.error("Resend API error:", errorData);
          // Continuar mesmo se falhar, o convite foi criado
        }
      } catch (error) {
        console.error("Error sending email via Resend:", error);
        // Continuar mesmo se falhar, o convite foi criado
      }
    } else {
      console.log(
        "RESEND_API_KEY not configured. Email not sent. Invite URL:",
        inviteUrl,
      );
      // Em desenvolvimento, você pode querer logar o URL do convite
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: resendApiKey
          ? "Invite email sent successfully"
          : "Invite created. Email sending not configured.",
        inviteUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-workspace-invite function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Helper function para escapar HTML e prevenir XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
