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
 * 
 * Regra especial: Para etapas após "Base", o lead deve ter:
 * - Nome obrigatório
 * - Pelo menos um dado de contato (telefone OU email)
 */
export function validateLeadForStage(
  lead: Lead,
  targetStage: KanbanStage,
  pipelineConfig?: PipelineConfig | null,
  options?: ValidateLeadOptions,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Etapas que não requerem validação
  if (targetStage === "base" || targetStage === "desqualificado") {
    return errors;
  }

  // Validação especial: Para sair do "Base", o lead precisa ter nome e pelo menos um contato
  // Esta validação é sempre aplicada para etapas após "Base", independente de configuração
  const hasName = lead.name && lead.name.trim() !== "";
  const hasPhone = lead.phone && lead.phone.trim() !== "";
  const hasEmail = lead.email && lead.email.trim() !== "";
  const hasContact = hasPhone || hasEmail;

  // Nome é sempre obrigatório para etapas após Base
  if (!hasName) {
    errors.push({
      field: "nome",
      message: "Nome é obrigatório para esta etapa",
    });
  }

  // Pelo menos um contato (telefone OU email) é obrigatório
  if (!hasContact) {
    errors.push({
      field: "contato",
      message: "É necessário ter pelo menos um contato (Telefone ou Email) para esta etapa",
    });
  }

  // Se não há configuração de pipeline, retornar apenas as validações especiais acima
  if (!pipelineConfig) {
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

  // Validar outros campos obrigatórios configurados (exceto nome, telefone e email que já foram validados)
  stageConfig.requiredFields.forEach((fieldId) => {
    // Pular validação de nome, telefone e email pois já foram validados acima
    if (fieldId === "nome" || fieldId === "telefone" || fieldId === "email") {
      return;
    }

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
