"use client";

import { User } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { User as UserType } from "@/shared/types/crm";

interface ResponsibleSelectProps {
  value?: string;
  onChange: (value: string) => void;
  users: UserType[];
  disabled?: boolean;
}

export function ResponsibleSelect({
  value,
  onChange,
  users,
  disabled,
}: ResponsibleSelectProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="responsavel" className="flex items-center gap-2">
        <User className="w-4 h-4 text-muted-foreground" />
        Responsável
      </Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Sem responsável</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
