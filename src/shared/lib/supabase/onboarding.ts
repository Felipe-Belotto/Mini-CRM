"use server";

import { createClient } from "./server";

/**
 * Verifica se o usuário completou o onboarding
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

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