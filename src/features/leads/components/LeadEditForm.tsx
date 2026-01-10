"use client";

import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Lead } from "@/shared/types/crm";
import { ResponsibleSelect } from "./ResponsibleSelect";
import { CustomFieldInput } from "@/features/custom-fields/components/CustomFieldInput";
import { mockUsers } from "@/shared/data/mockData";
import type { CustomField } from "@/shared/types/crm";

interface LeadEditFormProps {
  lead: Lead;
  customFields: CustomField[];
  getCustomFieldValue: (fieldId: string) => string | undefined;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onCustomFieldChange: (fieldId: string, value: string) => void;
}

export function LeadEditForm({
  lead,
  customFields,
  getCustomFieldValue,
  onUpdate,
  onCustomFieldChange,
}: LeadEditFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nome" className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Nome *
        </Label>
        <Input
          id="nome"
          value={lead.name}
          onChange={(e) => onUpdate(lead.id, { name: e.target.value })}
          placeholder="Nome do lead"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={lead.email}
          onChange={(e) => onUpdate(lead.id, { email: e.target.value })}
          placeholder="email@empresa.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="telefone" className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          Telefone *
        </Label>
        <Input
          id="telefone"
          value={lead.phone}
          onChange={(e) =>
            onUpdate(lead.id, { phone: e.target.value })
          }
          placeholder="(00) 00000-0000"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cargo" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Cargo *
        </Label>
        <Input
          id="cargo"
          value={lead.position}
          onChange={(e) => onUpdate(lead.id, { position: e.target.value })}
          placeholder="Cargo na empresa"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="empresa" className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Empresa
        </Label>
        <Input
          id="empresa"
          value={lead.company}
          onChange={(e) =>
            onUpdate(lead.id, { company: e.target.value })
          }
          placeholder="Nome da empresa"
        />
      </div>

      <ResponsibleSelect
        value={lead.responsibleId}
        onChange={(value) =>
          onUpdate(lead.id, {
            responsibleId: value || undefined,
          })
        }
        users={mockUsers}
      />

      <div className="grid gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          value={lead.notes || ""}
          onChange={(e) =>
            onUpdate(lead.id, { notes: e.target.value })
          }
          placeholder="Observações sobre o lead..."
          rows={3}
        />
      </div>

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
