"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { useToast } from "@/shared/hooks/use-toast";
import { Edit, Save } from "lucide-react";
import { updateProfileAction } from "@/features/auth/actions/onboarding";
import { onboardingSchema } from "@/features/auth/lib/auth-schemas";
import type { OnboardingInput } from "@/features/auth/lib/auth-schemas";

interface EditProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatarUrl);
  const [originalFirstName, setOriginalFirstName] = useState(initialData.firstName);
  const [originalLastName, setOriginalLastName] = useState(initialData.lastName);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(initialData.avatarUrl);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      avatar: undefined,
    },
  });

  const watchAvatar = form.watch("avatar");
  const watchFirstName = form.watch("firstName");
  const watchLastName = form.watch("lastName");

  const hasChanges =
    watchFirstName.trim() !== originalFirstName.trim() ||
    watchLastName.trim() !== originalLastName.trim() ||
    watchAvatar !== undefined ||
    (avatarUrl !== originalAvatarUrl && !watchAvatar);

  const handleCancelEdit = () => {
    form.reset({
      firstName: originalFirstName,
      lastName: originalLastName,
      avatar: undefined,
    });
    setAvatarUrl(originalAvatarUrl);
    setIsEditing(false);
  };

  const onSubmit = async (data: OnboardingInput) => {
    setIsSubmitting(true);
    try {
      const result = await updateProfileAction({
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
      });

      if (!result.success) {
        toast({
          title: "Erro ao atualizar perfil",
          description: result.error || "Não foi possível atualizar o perfil",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Perfil atualizado com sucesso!",
        description: "Suas alterações foram salvas",
      });

      setOriginalFirstName(data.firstName);
      setOriginalLastName(data.lastName);
      setOriginalAvatarUrl(avatarUrl);
      form.reset({
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: undefined,
      });
      setIsEditing(false);

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao atualizar o perfil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Informações Pessoais</h2>
        </div>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        )}
      </div>

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
                      value={field.value || avatarUrl || null}
                      onChange={(file) => {
                        if (isEditing) {
                          field.onChange(file || undefined);
                          if (file) {
                            setAvatarUrl(null);
                          }
                        }
                      }}
                      onRemove={() => {
                        if (isEditing) {
                          field.onChange(undefined);
                          setAvatarUrl(null);
                        }
                      }}
                      onError={(message) => {
                        toast({
                          title: "Erro no upload",
                          description: message,
                          variant: "destructive",
                        });
                      }}
                      size="xl"
                      disabled={isSubmitting || !isEditing}
                      maxSize={5 * 1024 * 1024}
                      className={!isEditing ? "pointer-events-none" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {isEditing && (
                    <p className="text-xs text-muted-foreground text-center">
                      Clique na foto para alterar • JPG, PNG ou WEBP • Máximo 5MB
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  {isEditing ? (
                    <Input
                      placeholder="Seu nome"
                      disabled={isSubmitting}
                      {...field}
                    />
                  ) : (
                    <div className="px-3 py-2 min-h-[40px] border border-transparent rounded-md text-sm">
                      {field.value || <span className="text-muted-foreground">Não informado</span>}
                    </div>
                  )}
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
                  {isEditing ? (
                    <Input
                      placeholder="Seu sobrenome"
                      disabled={isSubmitting}
                      {...field}
                    />
                  ) : (
                    <div className="px-3 py-2 min-h-[40px] border border-transparent rounded-md text-sm">
                      {field.value || <span className="text-muted-foreground">Não informado</span>}
                    </div>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
            <div className="flex items-center gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !hasChanges}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
