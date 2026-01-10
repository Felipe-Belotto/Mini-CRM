"use client";

import type React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { getUserInitials } from "@/shared/lib/user-utils";
import type { User } from "@/shared/types/crm";

interface UserAvatarProps {
  user: User;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <Avatar className="w-8 h-8">
        {user.avatarUrl && user.avatarUrl !== "/fallback-avatar.webp" ? (
          <AvatarImage src={user.avatarUrl} alt={user.fullName} />
        ) : null}
        <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-sm font-medium text-sidebar-foreground truncate w-full text-start">
          {user.fullName}
        </span>
      </div>
    </div>
  );
};