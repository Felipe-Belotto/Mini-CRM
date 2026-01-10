"use client";

import { Suspense, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { completeOnboardingAction } from "@/features/auth/actions/onboarding";
import type { OnboardingInput } from "@/features/auth/lib/auth-schemas";
import { onboardingSchema } from "@/features/auth/lib/auth-schemas";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { Button } from "@/shared/components/ui/button";
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
import { Input } from "@/shared/components/ui/input";
import { useToast } from "@/shared/hooks/use-toast";

function UserOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const inviteToken = searchParams.get("invite");
    if (inviteToken) {
      sessionStorage.setItem("pending_invite_token", inviteToken);
    }
  }, [searchParams]);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      avatar: undefined,
    },
  });

  const onSubmit = async (data: OnboardingInput) => {
    setIsSubmitting(true);
    try {
      const result = await completeOnboardingAction({
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
      });

      if (!result.success) {
        toast({
          title: "Erro ao completar perfil",
          description: result.error || "Não foi possível completar o perfil",
          variant: "destructive",
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/onboarding/workspace");
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao completar perfil",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao completar o perfil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Complete seu perfil
          </CardTitle>
          <CardDescription>
            Preencha suas informações para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AvatarUpload
                          value={field.value}
                          onChange={(file) => {
                            field.onChange(file || undefined);
                          }}
                          onRemove={() => {
                            field.onChange(undefined);
                          }}
                          onError={(message) => {
                            toast({
                              title: "Erro no upload",
                              description: message,
                              variant: "destructive",
                            });
                          }}
                          size="xl"
                          disabled={isSubmitting}
                          maxSize={5 * 1024 * 1024}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Clique na foto para alterar • JPG, PNG ou WEBP • Máximo 5MB
                </p>
              </div>

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu sobrenome"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Completar perfil"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function UserOnboardingFormFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Complete seu perfil
          </CardTitle>
          <CardDescription>
            Preencha suas informações para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded-md" />
            <div className="h-10 bg-muted animate-pulse rounded-md" />
            <div className="h-10 bg-muted animate-pulse rounded-md" />
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UserOnboardingPage() {
  return (
    <Suspense fallback={<UserOnboardingFormFallback />}>
      <UserOnboardingForm />
    </Suspense>
  );
}
