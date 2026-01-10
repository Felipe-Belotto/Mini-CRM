"use client";

import {
  Building2,
  Briefcase,
  Mail,
  Phone,
  LinkedinIcon,
} from "lucide-react";
import { LEAD_ORIGINS, type Lead, type User as UserType } from "@/shared/types/crm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { HorizontalEditableField } from "./HorizontalEditableField";
import { MultiResponsibleSelect } from "./MultiResponsibleSelect";
import type { CustomField } from "@/shared/types/crm";
import { CustomFieldInput } from "@/features/custom-fields/components/CustomFieldInput";

interface LeadDetailsTabProps {
  lead: Lead;
  users: UserType[];
  customFields: CustomField[];
  getCustomFieldValue: (fieldId: string) => string | undefined;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onCustomFieldChange: (fieldId: string, value: string) => void;
  onResponsibleChange: (responsibleIds: string[]) => Promise<void>;
  responsibleIds: string[];
}

export function LeadDetailsTab({
  lead,
  users,
  customFields,
  getCustomFieldValue,
  onUpdate,
  onCustomFieldChange,
  onResponsibleChange,
  responsibleIds,
}: LeadDetailsTabProps) {
  const nameParts = lead.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const handleFirstNameChange = async (value: string) => {
    const newName = value ? `${value} ${lastName}`.trim() : lastName;
    await onUpdate(lead.id, { name: newName });
  };

  const handleLastNameChange = async (value: string) => {
    const newName = firstName ? `${firstName} ${value}`.trim() : firstName;
    await onUpdate(lead.id, { name: newName });
  };

  return (
    <div className="space-y-1">
      <HorizontalEditableField
        label="Nome"
        value={firstName}
        onSave={handleFirstNameChange}
        type="text"
        placeholder="Primeiro nome"
        required
      />

      <HorizontalEditableField
        label="Sobrenome"
        value={lastName}
        onSave={handleLastNameChange}
        type="text"
        placeholder="Sobrenome"
      />

      <HorizontalEditableField
        label="Email"
        value={lead.email}
        onSave={async (value) => {
          await onUpdate(lead.id, { email: value });
        }}
        type="email"
        placeholder="email@empresa.com"
      />

      <HorizontalEditableField
        label="Telefone"
        value={lead.phone}
        onSave={async (value) => {
          await onUpdate(lead.id, { phone: value });
        }}
        type="tel"
        placeholder="(00) 00000-0000"
        required
      />

      <HorizontalEditableField
        label="Cargo"
        value={lead.position}
        onSave={async (value) => {
          await onUpdate(lead.id, { position: value });
        }}
        type="text"
        placeholder="Cargo na empresa"
        required
      />

      <HorizontalEditableField
        label="Empresa"
        value={lead.company}
        onSave={async (value) => {
          await onUpdate(lead.id, { company: value });
        }}
        type="text"
        placeholder="Nome da empresa"
      />

      <div className="flex items-center gap-3 py-2">
        <label className="text-sm font-medium text-muted-foreground min-w-[140px]">
          Origem
        </label>
        <div className="flex-1">
          <Select
            value={lead.origin || ""}
            onValueChange={async (value) => {
              await onUpdate(lead.id, { origin: value || undefined });
            }}
          >
            <SelectTrigger className="h-9">
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
      </div>

      {lead.linkedIn && (
        <HorizontalEditableField
          label="LinkedIn"
          value={lead.linkedIn}
          onSave={async (value) => {
            await onUpdate(lead.id, { linkedIn: value });
          }}
          type="text"
          placeholder="URL do LinkedIn"
        />
      )}

      <MultiResponsibleSelect
        value={responsibleIds}
        onChange={onResponsibleChange}
        users={users}
      />

      {customFields.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium mb-3 text-muted-foreground">
            Campos Personalizados
          </p>

          <div className="space-y-1">
            {customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 py-2">
                <label className="text-sm font-medium text-muted-foreground min-w-[140px]">
                  {field.name}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </label>
                <div className="flex-1">
                  <CustomFieldInput
                    field={field}
                    value={getCustomFieldValue(field.id)}
                    onChange={(value) => onCustomFieldChange(field.id, value)}
                    lead={lead}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}