"use client";

import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Slider } from "@/shared/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { type CampaignFormData, FORMALITY_LEVEL_LABELS } from "../lib/campaign-utils";
import { KANBAN_COLUMNS } from "@/shared/types/crm";

interface CampaignFormProps {
  formData: CampaignFormData;
  onFieldChange: <K extends keyof CampaignFormData>(
    field: K,
    value: CampaignFormData[K],
  ) => void;
}

export function CampaignForm({ formData, onFieldChange }: CampaignFormProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome da Campanha *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          placeholder="Ex: Prospecção Q1 2024"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="context">Contexto *</Label>
        <Textarea
          id="context"
          value={formData.context}
          onChange={(e) => onFieldChange("context", e.target.value)}
          placeholder="Descreva o objetivo e público-alvo da campanha..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="voiceTone">Tom de Voz</Label>
        <Select
          value={formData.voiceTone}
          onValueChange={(value: "formal" | "informal" | "neutro") =>
            onFieldChange("voiceTone", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tom" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="informal">Informal</SelectItem>
            <SelectItem value="neutro">Neutro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="aiInstructions">Instruções para IA</Label>
        <Textarea
          id="aiInstructions"
          value={formData.aiInstructions}
          onChange={(e) => onFieldChange("aiInstructions", e.target.value)}
          placeholder="Instruções específicas para geração de mensagens..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="formalityLevel">Nível de Formalidade (Opcional)</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Define o nível de formalidade das mensagens geradas pela IA.
                  Se não definido, será usado automaticamente por canal:
                  WhatsApp mais informal, Email mais formal.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Slider
              id="formalityLevel"
              min={0}
              max={5}
              step={1}
              value={[formData.formalityLevel ?? 0]}
              onValueChange={(value) =>
                onFieldChange("formalityLevel", value[0] === 0 ? undefined : value[0])
              }
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-28 text-right">
              {formData.formalityLevel
                ? FORMALITY_LEVEL_LABELS[formData.formalityLevel]
                : "Automático"}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Auto</span>
            <span>Informal</span>
            <span>Neutro</span>
            <span>Formal</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="triggerStage">Etapa Gatilho (Opcional)</Label>
        <Select
          value={formData.triggerStage || "none"}
          onValueChange={(value) =>
            onFieldChange(
              "triggerStage",
              value === "none" ? undefined : (value as any),
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma etapa gatilho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {KANBAN_COLUMNS.filter(
              (col) => col.id !== "base" && col.id !== "desqualificado",
            ).map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Quando um lead entrar nesta etapa, as mensagens serão geradas
          automaticamente
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: "active" | "paused" | "finished") =>
            onFieldChange("status", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="finished">Finalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
