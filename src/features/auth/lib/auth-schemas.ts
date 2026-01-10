import { z } from "zod";

/**
 * Schema para validação de senha segura
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 */
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(
    /[^A-Za-z0-9]/,
    "A senha deve conter pelo menos um caractere especial",
  );

/**
 * Schema para signup
 */
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Email inválido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Schema para onboarding
 */
export const onboardingSchema = z.object({
  firstName: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
  lastName: z
    .string()
    .min(1, "Sobrenome é obrigatório")
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
    .max(50, "Sobrenome deve ter no máximo 50 caracteres"),
  avatar: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "A imagem deve ter no máximo 5MB",
    )
    .refine(
      (file) =>
        !file ||
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type,
        ),
      "A imagem deve ser JPEG, PNG ou WebP",
    ),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;