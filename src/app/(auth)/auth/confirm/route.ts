import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Rota para processar a confirmação de email do Supabase
 * O Supabase redireciona para esta rota após o usuário clicar no link de confirmação
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Email confirmado com sucesso
      // Redirecionar para a página inicial ou a página especificada
      const redirectUrl = new URL(next, requestUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Se houver erro ou parâmetros inválidos, redirecionar para login com mensagem
  const redirectUrl = new URL("/login", requestUrl.origin);
  redirectUrl.searchParams.set(
    "error",
    "Não foi possível confirmar o email. Por favor, tente novamente ou solicite um novo link de confirmação.",
  );
  return NextResponse.redirect(redirectUrl);
}
