import type {
  CustomField,
  KanbanStage,
  Lead,
  ValidationError,
  PipelineConfig,
} from "@/shared/types/crm";

/**
 * Interface para valores de campos personalizados
 */
export interface CustomFieldValues {
  [fieldId: string]: string | undefined;
}

/**
 * Opções adicionais para validação
 */
export interface ValidateLeadOptions {
  customFields?: CustomField[];
  customFieldValues?: CustomFieldValues;
}

/**
 * Valida se o lead possui os campos obrigatórios para uma etapa
 * Usa configuração dinâmica se fornecida, caso contrário usa validação padrão
 * Suporta validação de campos personalizados quando customFields e customFieldValues são fornecidos
 */
export function validateLeadForStage(
  lead: Lead,
  targetStage: KanbanStage,
  pipelineConfig?: PipelineConfig | null,
  options?: ValidateLeadOptions,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Se não há configuração ou a etapa não requer validação, retornar vazio
  if (!pipelineConfig || targetStage === "base" || targetStage === "desqualificado") {
    return errors;
  }

  const stageConfig = pipelineConfig.stages.find((s) => s.stage === targetStage);
  if (!stageConfig) {
    return errors;
  }

  const standardFieldValueMap: Record<string, string | undefined> = {
    nome: lead.name,
    email: lead.email,
    telefone: lead.phone,
    cargo: lead.position,
    empresa: lead.company,
    origem: lead.origin,
  };

  const { customFields = [], customFieldValues = {} } = options || {};

  // Validar campos obrigatórios
  stageConfig.requiredFields.forEach((fieldId) => {
    // Primeiro verificar se é um campo padrão
    if (fieldId in standardFieldValueMap) {
      const value = standardFieldValueMap[fieldId];
      if (!value || value.trim() === "") {
        const fieldName = getFieldName(fieldId);
        errors.push({
          field: fieldId,
          message: `${fieldName} é obrigatório para esta etapa`,
        });
      }
    } else {
      // É um campo personalizado - verificar pelo ID (UUID)
      const customField = customFields.find((f) => f.id === fieldId);
      if (customField) {
        const value = customFieldValues[fieldId];
        if (!value || value.trim() === "") {
          errors.push({
            field: fieldId,
            message: `${customField.name} é obrigatório para esta etapa`,
          });
        }
      }
    }
  });

  return errors;
}

function getFieldName(fieldId: string): string {
  const fieldNames: Record<string, string> = {
    nome: "Nome",
    email: "Email",
    telefone: "Telefone",
    cargo: "Cargo",
    empresa: "Empresa",
    origem: "Origem",
  };
  return fieldNames[fieldId] || fieldId;
}
