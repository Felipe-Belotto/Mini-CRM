"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { Tables } from "@/shared/types/supabase";

export type Profile = Tables<"profiles">;

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
