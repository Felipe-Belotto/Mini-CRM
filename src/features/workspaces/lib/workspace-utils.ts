/**
 * Utilitários para manipulação de workspace
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida tipo de arquivo de imagem
 */
export function validateImageFileType(file: File): FileValidationResult {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Tipo de arquivo inválido. Use JPG, PNG ou WEBP",
    };
  }

  return { valid: true };
}

/**
 * Valida tamanho de arquivo
 */
export function validateFileSize(file: File, maxSizeMB: number = 2): FileValidationResult {
  const maxSize = maxSizeMB * 1024 * 1024; // Converter MB para bytes
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Valida arquivo de imagem completo (tipo e tamanho)
 */
export function validateImageFile(file: File): FileValidationResult {
  const typeValidation = validateImageFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Cria preview de arquivo de imagem como data URL
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Falha ao ler o arquivo"));
      }
    };
    reader.onerror = () => {
      reject(new Error("Erro ao ler o arquivo"));
    };
    reader.readAsDataURL(file);
  });
}
