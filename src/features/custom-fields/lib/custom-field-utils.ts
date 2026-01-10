import type { CustomField } from "@/shared/types/crm";

/**
 * Obtém o label do tipo de campo personalizado
 */
export function getCustomFieldTypeLabel(tipo: CustomField["type"]): string {
  const labels: Record<CustomField["type"], string> = {
    text: "Texto",
    number: "Número",
    email: "Email",
    phone: "Telefone",
    textarea: "Texto Longo",
    select: "Seleção",
    date: "Data",
  };
  return labels[tipo];
}
