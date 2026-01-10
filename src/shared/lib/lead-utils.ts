import type {
  KanbanStage,
  Lead,
  ValidationError,
  PipelineConfig,
} from "@/shared/types/crm";

/**
 * Valida se o lead possui os campos obrigatórios para uma etapa
 * Usa configuração dinâmica se fornecida, caso contrário usa validação padrão
 */
export function validateLeadForStage(
  lead: Lead,
  targetStage: KanbanStage,
  pipelineConfig?: PipelineConfig | null,
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

  // Mapear IDs de campos para valores do lead
  // Nota: Os IDs dos campos (chaves) continuam em português pois são identificadores usados no PipelineConfig
  // Mas os valores vêm das propriedades em inglês do tipo Lead
  const fieldValueMap: Record<string, string | undefined> = {
    nome: lead.name,
    email: lead.email,
    telefone: lead.phone,
    cargo: lead.position,
    empresa: lead.company,
  };

  // Validar campos obrigatórios
  stageConfig.requiredFields.forEach((fieldId) => {
    const value = fieldValueMap[fieldId];
    if (!value || value.trim() === "") {
      const fieldName = getFieldName(fieldId);
      errors.push({
        field: fieldId,
        message: `${fieldName} é obrigatório para esta etapa`,
      });
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
  };
  return fieldNames[fieldId] || fieldId;
}
