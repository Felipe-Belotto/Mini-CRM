"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { loginAction } from "../actions/auth";
import { isValidEmail } from "../lib/auth-utils";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { resendConfirmationEmailAction } from "../actions/auth";
import { useToast } from "@/shared/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setConfirmationError(error);
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Email inválido";
    }

    if (!password) {
      newErrors.password = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const result = await loginAction({ email, password });

      if (result.success && result.user) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        const inviteToken = searchParams.get("invite");
        if (inviteToken) {
          sessionStorage.setItem("pending_invite_token", inviteToken);
        }

        const redirectTo =
          new URLSearchParams(window.location.search).get("redirect") || "/";
        router.push(redirectTo);
        router.refresh();
      } else {
        toast({
          title: "Erro no login",
          description: result.error || "Credenciais inválidas",
          variant: "destructive",
        });
        setErrors({
          general: result.error || "Credenciais inválidas",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao fazer login";
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      {confirmationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="mb-2">{confirmationError}</p>
            {email && isValidEmail(email) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsResending(true);
                  const result = await resendConfirmationEmailAction(email);
                  if (result.success) {
                    toast({
                      title: "Email reenviado!",
                      description: "Verifique sua caixa de entrada e spam",
                    });
                  } else {
                    toast({
                      title: "Erro ao reenviar",
                      description: result.error || "Não foi possível reenviar o email",
                      variant: "destructive",
                    });
                  }
                  setIsResending(false);
                }}
                disabled={isResending}
                className="mt-2"
              >
                {isResending ? "Reenviando..." : "Reenviar email de confirmação"}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {errors.general && (
        <div className="rounded-md bg-destructive/15 p-3">
          <p className="text-sm text-destructive">{errors.general}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="text-center text-sm text-foreground">
        Não tem uma conta?{" "}
        <Link
          href={
            searchParams.get("invite")
              ? `/signup?invite=${encodeURIComponent(searchParams.get("invite")!)}`
              : "/signup"
          }
          className="text-primary hover:underline font-medium"
        >
          Cadastre-se
        </Link>
      </div>
    </form>
  );
}
