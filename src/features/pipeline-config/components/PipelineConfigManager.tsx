"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/use-toast";
import { updatePipelineConfigAction } from "../actions/pipeline-config";
import { StageConfigForm } from "./StageConfigForm";
import type {
  StageConfig,
  KanbanStage,
  PipelineConfig,
  CustomField,
} from "@/shared/types/crm";
import { KANBAN_COLUMNS } from "@/shared/types/crm";

interface PipelineConfigManagerProps {
  initialConfig: PipelineConfig | null;
  initialCustomFields: CustomField[];
  workspaceId: string;
}

export function PipelineConfigManager({
  initialConfig,
  initialCustomFields,
  workspaceId,
}: PipelineConfigManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [localConfig, setLocalConfig] = useState<StageConfig[]>(
    initialConfig?.stages || []
  );

  const configurableStages: KanbanStage[] = [
    "lead_mapeado",
    "tentando_contato",
    "conexao_iniciada",
    "qualificado",
    "reuniao_agendada",
  ];

  const availableFields = useMemo(() => {
    const defaultFields = [
      { id: "nome", nome: "Nome" },
      { id: "email", nome: "Email" },
      { id: "telefone", nome: "Telefone" },
      { id: "cargo", nome: "Cargo" },
      { id: "empresa", nome: "Empresa" },
    ];

    const customFieldsMapped = initialCustomFields.map((f) => ({
      id: f.id,
      nome: f.name,
    }));

    return [...defaultFields, ...customFieldsMapped];
  }, [initialCustomFields]);

  const handleStageChange = (stage: KanbanStage, requiredFields: string[]) => {
    setLocalConfig((prev) => {
      const existing = prev.find((s) => s.stage === stage);
      if (existing) {
        return prev.map((s) =>
          s.stage === stage ? { ...s, requiredFields } : s,
        );
      } else {
        return [...prev, { stage, requiredFields }];
      }
    });
  };

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const result = await updatePipelineConfigAction({
          workspaceId,
          stages: localConfig,
        });

        if (result.success && result.config) {
          toast({
            title: "Configuração atualizada!",
            description: "A configuração do pipeline foi atualizada com sucesso.",
          });
          router.refresh();
        } else {
          toast({
            title: "Erro ao atualizar configuração",
            description:
              result.error || "Não foi possível atualizar a configuração",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao atualizar configuração",
          description: "Ocorreu um erro ao atualizar a configuração",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>

      <div className="grid gap-6">
        {configurableStages.map((stage) => {
          const stageConfig = localConfig.find((s) => s.stage === stage);
          return (
            <Card key={stage}>
              <CardHeader>
                <CardTitle className="text-base">
                  {KANBAN_COLUMNS.find((c) => c.id === stage)?.title}
                </CardTitle>
                <CardDescription>
                  Configure os campos obrigatórios para esta etapa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StageConfigForm
                  stage={stage}
                  config={stageConfig || null}
                  availableFields={availableFields}
                  onChange={(requiredFields) =>
                    handleStageChange(stage, requiredFields)
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
