"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { useToast } from "@/shared/hooks/use-toast";
import type { Lead, User as UserType } from "@/shared/types/crm";
import { MultiResponsibleSelect } from "./MultiResponsibleSelect";
import { EditableField } from "./EditableField";
import { CustomFieldInput } from "@/features/custom-fields/components/CustomFieldInput";
import type { CustomField } from "@/shared/types/crm";
import { uploadLeadAvatarAction } from "../actions/upload-avatar";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";

interface LeadEditFormProps {
  lead: Lead;
  users: UserType[];
  customFields: CustomField[];
  getCustomFieldValue: (fieldId: string) => string | undefined;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onCustomFieldChange: (fieldId: string, value: string) => void;
}

export function LeadEditForm({
  lead,
  users,
  customFields,
  getCustomFieldValue,
  onUpdate,
  onCustomFieldChange,
}: LeadEditFormProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (file: File | null) => {
    setAvatarFile(file);

    // Se um arquivo foi selecionado, fazer upload imediatamente
    if (file && currentWorkspace) {
      setIsUploadingAvatar(true);
      try {
        const result = await uploadLeadAvatarAction(
          lead.id,
          currentWorkspace.id,
          file,
        );

        if (result.success && result.url) {
          // Atualizar o lead com a nova URL
          await onUpdate(lead.id, { avatarUrl: result.url });
          // Limpar avatarFile para usar a URL retornada
          setAvatarFile(null);
          toast({
            title: "Avatar atualizado",
            description: "O avatar do lead foi atualizado com sucesso.",
          });
        } else {
          toast({
            title: "Erro ao fazer upload",
            description: result.error || "Não foi possível fazer upload do avatar",
            variant: "destructive",
          });
          setAvatarFile(null);
        }
      } catch (error) {
        toast({
          title: "Erro ao fazer upload",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao fazer upload do avatar",
          variant: "destructive",
        });
        setAvatarFile(null);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    // Atualizar para remover avatar
    onUpdate(lead.id, { avatarUrl: undefined });
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-center mb-4">
        <AvatarUpload
          value={avatarFile || lead.avatarUrl || null}
          onChange={handleAvatarChange}
          onRemove={handleAvatarRemove}
          disabled={isUploadingAvatar}
          size="lg"
          fallbackText={lead.name ? lead.name.charAt(0).toUpperCase() : "L"}
        />
      </div>

      <EditableField
        label="Nome"
        value={lead.name}
        onSave={async (value) => {
          await onUpdate(lead.id, { name: value });
        }}
        type="text"
        icon={<User className="w-4 h-4 text-muted-foreground" />}
        placeholder="Nome do lead"
        required
      />

      <EditableField
        label="Email"
        value={lead.email}
        onSave={async (value) => {
          await onUpdate(lead.id, { email: value });
        }}
        type="email"
        icon={<Mail className="w-4 h-4 text-muted-foreground" />}
        placeholder="email@empresa.com"
      />

      <EditableField
        label="Telefone"
        value={lead.phone}
        onSave={async (value) => {
          await onUpdate(lead.id, { phone: value });
        }}
        type="tel"
        icon={<Phone className="w-4 h-4 text-muted-foreground" />}
        placeholder="(00) 00000-0000"
        required
      />

      <EditableField
        label="Cargo"
        value={lead.position}
        onSave={async (value) => {
          await onUpdate(lead.id, { position: value });
        }}
        type="text"
        icon={<Briefcase className="w-4 h-4 text-muted-foreground" />}
        placeholder="Cargo na empresa"
        required
      />

      <EditableField
        label="Empresa"
        value={lead.company}
        onSave={async (value) => {
          await onUpdate(lead.id, { company: value });
        }}
        type="text"
        icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
        placeholder="Nome da empresa"
      />

      <MultiResponsibleSelect
        value={lead.responsibleIds}
        onChange={async (responsibleIds) => {
          await onUpdate(lead.id, { responsibleIds });
        }}
        users={users}
      />

      <EditableField
        label="Notas"
        value={lead.notes || ""}
        onSave={async (value) => {
          await onUpdate(lead.id, { notes: value });
        }}
        type="textarea"
        placeholder="Observações sobre o lead..."
      />

      {customFields.length > 0 && (
        <div className="border-t pt-4 mt-2">
          <p className="text-sm font-medium mb-3 text-muted-foreground">
            Campos Personalizados
          </p>

          <div className="grid gap-4">
            {customFields.map((field) => (
              <CustomFieldInput
                key={field.id}
                field={field}
                value={getCustomFieldValue(field.id)}
                onChange={(value) => onCustomFieldChange(field.id, value)}
                lead={lead}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
