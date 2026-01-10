/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida força da senha
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("A senha deve ter pelo menos 6 caracteres");
  }

  if (password.length > 72) {
    errors.push("A senha deve ter no máximo 72 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
