"use client";

import { useState } from "react";
import { Briefcase, Building2, Mail, Phone, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { useToast } from "@/shared/hooks/use-toast";
import { LEAD_ORIGINS, type KanbanStage, type Lead, type User as UserType } from "@/shared/types/crm";
import { MultiResponsibleSelect } from "./MultiResponsibleSelect";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { createLeadAction } from "../actions/leads";
import { uploadLeadAvatarAction } from "../actions/upload-avatar";

interface CreateLeadFormProps {
  initialStage?: KanbanStage;
  users: UserType[];
  onSubmit: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "sortOrder">) => Promise<void>;
  onCancel: () => void;
}

export function CreateLeadForm({
  initialStage = "base",
  users,
  onSubmit,
  onCancel,
}: CreateLeadFormProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [origin, setOrigin] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [responsibleIds, setResponsibleIds] = useState<string[]>([]);
  const [stage, setStage] = useState<KanbanStage>(initialStage);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !currentWorkspace) return;

    setIsLoading(true);
    try {
      // Criar lead primeiro para obter o ID
      const newLead = await createLeadAction({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        company: company.trim(),
        origin: origin || undefined,
        notes: notes.trim(),
        stage,
        responsibleIds,
        workspaceId: currentWorkspace.id,
      });

      // Se tiver arquivo de avatar, fazer upload
      if (avatarFile && newLead.id) {
        const uploadResult = await uploadLeadAvatarAction(
          newLead.id,
          currentWorkspace.id,
          avatarFile,
        );

        if (!uploadResult.success) {
          toast({
            title: "Aviso",
            description:
              uploadResult.error ||
              "Lead criado, mas não foi possível fazer upload do avatar",
            variant: "destructive",
          });
        }
      }

      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        company: company.trim(),
        origin: origin || undefined,
        notes: notes.trim(),
        stage,
        responsibleIds,
        workspaceId: currentWorkspace.id,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o lead",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Avatar Upload */}
      <div className="flex justify-center mb-4">
        <AvatarUpload
          value={avatarFile}
          onChange={(file) => setAvatarFile(file)}
          disabled={isLoading}
          size="lg"
          fallbackText="Foto"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Nome *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className={errors.name ? "border-destructive" : ""}
          placeholder="Nome do lead"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="email@empresa.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          Telefone
        </Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isLoading}
          placeholder="(00) 00000-0000"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="position" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Cargo
        </Label>
        <Input
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          disabled={isLoading}
          placeholder="Cargo na empresa"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="company" className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Empresa
        </Label>
        <Input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={isLoading}
          placeholder="Nome da empresa"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="origin">Origem do Lead</Label>
        <Select value={origin} onValueChange={setOrigin} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a origem" />
          </SelectTrigger>
          <SelectContent>
            {LEAD_ORIGINS.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="stage">Etapa Inicial</Label>
        <Select value={stage} onValueChange={(value: KanbanStage) => setStage(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="base">Base</SelectItem>
            <SelectItem value="lead_mapeado">Lead Mapeado</SelectItem>
            <SelectItem value="tentando_contato">Tentando Contato</SelectItem>
            <SelectItem value="conexao_iniciada">Conexão Iniciada</SelectItem>
            <SelectItem value="qualificado">Qualificado</SelectItem>
            <SelectItem value="reuniao_agendada">Reunião Agendada</SelectItem>
            <SelectItem value="desqualificado">Desqualificado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MultiResponsibleSelect
        value={responsibleIds}
        onChange={async (ids) => setResponsibleIds(ids)}
        users={users}
        disabled={isLoading}
      />

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          placeholder="Observações sobre o lead..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={isLoading}
        >
          {isLoading ? "Criando..." : "Criar Lead"}
        </Button>
      </div>
    </form>
  );
}
