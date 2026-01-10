"use client";

import { useCustomFields } from "@/features/custom-fields/hooks/use-custom-fields";

interface AvailableField {
  id: string;
  nome: string;
}

/**
 * Hook para obter campos disponíveis (padrão + personalizados)
 */
export function useAvailableFields(): AvailableField[] {
  const { fields: customFields } = useCustomFields();

  const defaultFields: AvailableField[] = [
    { id: "nome", nome: "Nome" },
    { id: "email", nome: "Email" },
    { id: "telefone", nome: "Telefone" },
    { id: "cargo", nome: "Cargo" },
    { id: "empresa", nome: "Empresa" },
  ];

  const customFieldsMapped: AvailableField[] = customFields.map((f) => ({
    id: f.id,
    nome: f.name,
  }));

  return [...defaultFields, ...customFieldsMapped];
}
