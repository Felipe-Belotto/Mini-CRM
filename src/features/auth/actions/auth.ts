"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import type { User } from "@/shared/types/crm";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  needsEmailConfirmation?: boolean;
  pendingInvites?: Array<{
    id: string;
    workspaceId: string;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    invitedBy: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

export async function loginAction(
  input: LoginInput,
): Promise<AuthResult> {
  try {
    if (!input.email || !input.password) {
      return {
        success: false,
        error: "Email e senha são obrigatórios",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Credenciais inválidas",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Não foi possível fazer login",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Perfil do usuário não encontrado",
      };
    }

    // Construir fullName a partir de first_name e last_name
    const fullName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || profile.last_name || "";

    // Sempre usar fallback-avatar.webp se não houver avatar_url definido
    const avatarUrl = profile.avatar_url || "/fallback-avatar.webp";

    const user: User = {
      id: profile.id,
      email: data.user.email ?? "",
      fullName,
      avatarUrl,
      phone: profile.phone ?? undefined,
      bio: profile.bio ?? undefined,
      createdAt: new Date(profile.created_at),
    };

    // Verificar se há convites pendentes para este email
    const { checkPendingInvitesAction } = await import(
      "@/features/workspaces/actions/invites"
    );
    const pendingInvites = await checkPendingInvitesAction();

    return {
      success: true,
      user,
      pendingInvites: pendingInvites.length > 0 ? pendingInvites : undefined,
    };
  } catch (error) {
    console.error("Error in loginAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao fazer login",
    };
  }
}

export async function signupAction(
  input: SignupInput,
): Promise<AuthResult> {
  try {
    if (!input.email || !input.password) {
      return {
        success: false,
        error: "Email e senha são obrigatórios",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Não foi possível criar a conta",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Não foi possível criar o usuário",
      };
    }

    // Se a confirmação de email está habilitada e não há sessão,
    // informar ao usuário que precisa confirmar o email
    if (!data.session) {
      // O perfil será criado pelo trigger, mas não podemos fazer login ainda
      return {
        success: false,
        needsEmailConfirmation: true,
        error:
          "Conta criada com sucesso! Por favor, verifique seu email para confirmar a conta.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    // O perfil é criado pelo trigger, mas pode não ter nome ainda (onboarding)
    // Retornar sucesso mesmo sem perfil completo, pois o onboarding será feito depois
    if (profileError || !profile) {
      // Se o perfil não existe, criar um básico
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          on_completed: false,
        });

      if (insertError) {
        console.error("Error creating profile:", insertError);
        return {
          success: false,
          error: "Erro ao criar perfil do usuário",
        };
      }

      // Retornar usuário básico para redirecionar ao onboarding
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email ?? "",
          fullName: "",
          avatarUrl: "/fallback-avatar.webp",
          createdAt: new Date(),
        },
      };
    }

    // Construir fullName a partir de first_name e last_name
    const fullName = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.last_name || "";

    // Sempre usar fallback-avatar.webp se não houver avatar_url definido
    const avatarUrl = profile.avatar_url || "/fallback-avatar.webp";

    const user: User = {
      id: profile.id,
      email: data.user.email ?? "",
      fullName,
      avatarUrl,
      phone: profile.phone ?? undefined,
      bio: profile.bio ?? undefined,
      createdAt: new Date(profile.created_at),
    };

    // Verificar se há convites pendentes para este email
    const { checkPendingInvitesAction } = await import(
      "@/features/workspaces/actions/invites"
    );
    const pendingInvites = await checkPendingInvitesAction();

    return {
      success: true,
      user,
      pendingInvites: pendingInvites.length > 0 ? pendingInvites : undefined,
    };
  } catch (error) {
    console.error("Error in signupAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao criar a conta",
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error in logoutAction:", error);
  }
}

export async function getCurrentUserAction(): Promise<User | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("Error in getCurrentUserAction:", error);
    return null;
  }
}

/**
 * Server Action para obter apenas o ID do usuário atual
 */
export async function getCurrentUserIdAction(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id || null;
  } catch (error) {
    console.error("Error in getCurrentUserIdAction:", error);
    return null;
  }
}

export async function resendConfirmationEmailAction(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        error: "Email é obrigatório",
      };
    }

    const supabase = await createClient();

    // Obter a URL base do site
    // Em produção, configure NEXT_PUBLIC_SITE_URL no .env
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm?next=/`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Não foi possível reenviar o email de confirmação",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in resendConfirmationEmailAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao reenviar o email de confirmação",
    };
  }
}
