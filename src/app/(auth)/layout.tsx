import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/supabase/utils";

/**
 * Layout para páginas de autenticação (login/signup)
 * Redireciona para home se o usuário já estiver autenticado
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Força renderização dinâmica pois usa cookies
  await connection();
  
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <>{children}</>;
}
