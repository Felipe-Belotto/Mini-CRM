"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/shared/types/crm";
import {
  loginAction,
  signupAction,
  logoutAction,
  getCurrentUserAction,
  type LoginInput,
  type SignupInput,
} from "@/features/auth/actions/auth";
import { useToast } from "@/shared/hooks/use-toast";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<boolean>;
  signup: (input: SignupInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentUser = await getCurrentUserAction();
      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (input: LoginInput): Promise<boolean> => {
      try {
        const result = await loginAction(input);

        if (result.success && result.user) {
          setUser(result.user);
          toast({
            title: "Login realizado!",
            description: `Bem-vindo, ${result.user.fullName}!`,
          });
          router.push("/");
          return true;
        } else {
          toast({
            title: "Erro no login",
            description: result.error || "Credenciais inválidas",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro no login",
          description: "Ocorreu um erro ao fazer login",
          variant: "destructive",
        });
        return false;
      }
    },
    [router, toast],
  );

  const signup = useCallback(
    async (input: SignupInput): Promise<boolean> => {
      try {
        const result = await signupAction(input);

        if (result.success && result.user) {
          setUser(result.user);
          toast({
            title: "Cadastro realizado!",
            description: `Bem-vindo, ${result.user.fullName}!`,
          });
          router.push("/");
          return true;
        } else {
          toast({
            title: "Erro no cadastro",
            description: result.error || "Não foi possível criar a conta",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro no cadastro",
          description: "Ocorreu um erro ao criar a conta",
          variant: "destructive",
        });
        return false;
      }
    },
    [router, toast],
  );

  const logout = useCallback(async () => {
    try {
      await logoutAction();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }, [router]);

  const refresh = useCallback(async () => {
    await checkSession();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refresh,
  };
}