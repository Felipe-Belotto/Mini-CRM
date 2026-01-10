"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Suporta tanto a chave publishable (nova) quanto a anon key (antiga)
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file. You need either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split("; ").map((cookie) => {
          const [name, ...rest] = cookie.split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=/; ${
            options?.maxAge
              ? `max-age=${options.maxAge}; `
              : ""
          }${options?.domain ? `domain=${options.domain}; ` : ""}${
            options?.secure ? "secure; " : ""
          }${options?.sameSite ? `samesite=${options.sameSite}; ` : ""}`;
        });
      },
    },
  });
}
