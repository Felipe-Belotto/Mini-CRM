"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  resendConfirmationEmailAction,
  signupAction,
} from "../actions/auth";
import { signupSchema } from "../lib/auth-schemas";
import { useToast } from "@/shared/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import type { SignupInput } from "../lib/auth-schemas";

const INVITE_TOKEN_KEY = "pending_invite_token";

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const inviteToken = searchParams.get("invite");
    if (inviteToken) {
      sessionStorage.setItem(INVITE_TOKEN_KEY, inviteToken);
    }
  }, [searchParams]);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setNeedsConfirmation(false);
    try {
      const result = await signupAction({
        email: data.email,
        password: data.password,
      });

      if (result.success && result.user) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        router.push("/onboarding/user");
        router.refresh();
      } else if (result.needsEmailConfirmation) {
        setNeedsConfirmation(true);
        toast({
          title: "Confirme seu email",
          description: result.error || "Verifique sua caixa de entrada",
        });
      } else {
        toast({
          title: "Erro no cadastro",
          description: result.error || "Não foi possível criar a conta",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao criar a conta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const email = form.getValues("email");
    if (!email || !email.trim()) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
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
    } catch (error) {
      toast({
        title: "Erro ao reenviar",
        description: "Ocorreu um erro ao reenviar o email de confirmação",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>
            Crie uma conta para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e
                          caractere especial
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {needsConfirmation && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-900 dark:text-blue-100">
                        Confirme seu email
                      </AlertTitle>
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <p className="mb-3">
                          Enviamos um link de confirmação para{" "}
                          <strong>{form.getValues("email")}</strong>. Por favor, verifique
                          sua caixa de entrada e clique no link para ativar sua conta.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResendConfirmation}
                          disabled={isResending}
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {isResending
                            ? "Reenviando..."
                            : "Reenviar email de confirmação"}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || needsConfirmation}
                  >
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Já tem uma conta?{" "}
                  <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Faça login
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
