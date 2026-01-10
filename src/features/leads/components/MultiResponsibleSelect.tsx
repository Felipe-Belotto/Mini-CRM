"use client";

import { useState } from "react";
import { Check, User, X } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import type { User as UserType } from "@/shared/types/crm";
import { getInitials, getAvatarColor } from "../lib/avatar-utils";

interface MultiResponsibleSelectProps {
  value: string[];
  onChange: (value: string[]) => Promise<void>;
  users: UserType[];
  disabled?: boolean;
}

export function MultiResponsibleSelect({
  value = [],
  onChange,
  users,
  disabled = false,
}: MultiResponsibleSelectProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedUsers = users.filter((user) => value.includes(user.id));

  const handleToggle = async (userId: string) => {
    if (isSaving) return;

    const newValue = value.includes(userId)
      ? value.filter((id) => id !== userId)
      : [...value, userId];

    setIsSaving(true);
    try {
      await onChange(newValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <Label className="text-sm font-medium text-muted-foreground min-w-[140px]">
        Responsável
      </Label>
      <div className="flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={disabled || isSaving}
            >
              {selectedUsers.length === 0 ? (
                <span className="text-muted-foreground">
                  Selecione responsáveis
                </span>
              ) : selectedUsers.length === 1 ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarImage
                      src={selectedUsers[0].avatarUrl}
                      alt={selectedUsers[0].fullName}
                    />
                    <AvatarFallback
                      className={cn(
                        "text-white font-semibold text-xs",
                        getAvatarColor(selectedUsers[0].fullName || ""),
                      )}
                    >
                      {getInitials(selectedUsers[0].fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{selectedUsers[0].fullName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-2">
                    {selectedUsers.slice(0, 3).map((user) => (
                      <Avatar
                        key={user.id}
                        className="h-6 w-6 border-2 border-background flex-shrink-0"
                      >
                        <AvatarImage
                          src={user.avatarUrl}
                          alt={user.fullName}
                        />
                        <AvatarFallback
                          className={cn(
                            "text-white font-semibold text-xs",
                            getAvatarColor(user.fullName || ""),
                          )}
                        >
                          {getInitials(user.fullName || "")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm">
                    {selectedUsers.length === 1
                      ? selectedUsers[0].fullName
                      : `${selectedUsers.length} responsáveis`}
                  </span>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <div className="p-2">
              <div className="space-y-1">
                {users.map((user) => {
                  const isSelected = value.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggle(user.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors",
                        isSelected && "bg-accent",
                      )}
                      disabled={isSaving}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={user.avatarUrl}
                          alt={user.fullName}
                        />
                        <AvatarFallback
                          className={cn(
                            "text-white font-semibold text-xs",
                            getAvatarColor(user.fullName || ""),
                          )}
                        >
                          {getInitials(user.fullName || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.fullName}
                        </p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                {users.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum usuário disponível</p>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}