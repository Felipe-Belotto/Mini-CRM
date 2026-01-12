"use server";

import { createClient } from "./server";

/**
 * Verifica se o usuário completou o onboarding
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const supabase = await createClient();
    let authUser = null;
    
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      
      // Ignorar erro de refresh token inválido (comportamento esperado quando sessão expira)
      if (!error) {
        authUser = user;
      }
    } catch (error: unknown) {
      // Ignorar erros de refresh token silenciosamente
      return false;
    }

    if (!authUser) {
      return false;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("on_completed")
      .eq("id", authUser.id)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.on_completed === true;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
}