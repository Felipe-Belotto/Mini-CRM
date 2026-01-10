"use client";

import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { CampaignFormData } from "../lib/campaign-utils";
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
