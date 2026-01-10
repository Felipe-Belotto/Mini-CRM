"use client";

import { useState } from "react";
import { Pencil, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import type { User as UserType } from "@/shared/types/crm";
import { getInitials, getAvatarColor } from "../lib/avatar-utils";

interface ResponsibleSelectProps {
  value?: string;
  onChange: (value: string) => void | Promise<void>;
  users: UserType[];
  disabled?: boolean;
  readonly?: boolean;
  onEdit?: () => void;
}

export function ResponsibleSelect({
  value,
  onChange,
  users,
  disabled,
  readonly = false,
  onEdit,
}: ResponsibleSelectProps) {
  const [isEditing, setIsEditing] = useState(!readonly);
  const [isSaving, setIsSaving] = useState(false);
  const selectedUser = value ? users.find((u) => u.id === value) : null;

  const handleValueChange = async (val: string) => {
    setIsSaving(true);
    try {
      await onChange(val === "none" ? "" : val);
      if (readonly) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating responsible:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.();
  };

  if (readonly && !isEditing) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Label className="flex-1 text-sm font-medium">Responsável</Label>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border border-transparent rounded-md bg-muted/50">
          {selectedUser ? (
            <div className="flex items-center gap-2 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.fullName} />
                <AvatarFallback
                  className={cn(
                    "text-white font-semibold text-xs",
                    getAvatarColor(selectedUser.fullName || ""),
                  )}
                >
                  {getInitials(selectedUser.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{selectedUser.fullName}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sem responsável</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="responsavel" className="flex items-center gap-2">
        <User className="w-4 h-4 text-muted-foreground" />
        Responsável
      </Label>
      <Select
        value={value || "none"}
        onValueChange={handleValueChange}
        disabled={disabled || isSaving}
      >
        <SelectTrigger>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedUser && (
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.fullName}
                />
                <AvatarFallback
                  className={cn(
                    "text-white font-semibold text-xs",
                    getAvatarColor(selectedUser.fullName || ""),
                  )}
                >
                  {getInitials(selectedUser.fullName || "")}
                </AvatarFallback>
              </Avatar>
            )}
            <SelectValue placeholder="Selecione um responsável" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="pl-8">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <span>Sem responsável</span>
            </div>
          </SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id} className="pl-8">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback
                    className={cn(
                      "text-white font-semibold text-xs",
                      getAvatarColor(user.fullName || ""),
                    )}
                  >
                    {getInitials(user.fullName || "")}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.fullName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
