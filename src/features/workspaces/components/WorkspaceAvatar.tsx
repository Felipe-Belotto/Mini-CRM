"use client";

import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/shared/lib/utils";

interface WorkspaceAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-5 h-5", text: "text-xs" },
  md: { container: "w-6 h-6", text: "text-xs" },
  lg: { container: "w-8 h-8", text: "text-xs" },
};

export const WorkspaceAvatar: React.FC<WorkspaceAvatarProps> = ({
  name,
  logoUrl,
  size = "md",
  className,
}) => {
  const sizeConfig = sizeMap[size];
  
  const initials = useMemo(() => {
    if (!name || typeof name !== "string") {
      return "MC";
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "MC";
    }
    return parts
      .map((n) => n[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "MC";
  }, [name]);

  const imageWidth = size === "lg" ? 32 : size === "md" ? 24 : 20;
  const imageHeight = size === "lg" ? 32 : size === "md" ? 24 : 20;

  return (
    <div
      className={cn(
        "rounded-lg bg-accent flex items-center justify-center overflow-hidden flex-shrink-0",
        sizeConfig.container,
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name || "Workspace"}
          width={imageWidth}
          height={imageHeight}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className={cn(
            "font-semibold text-accent-foreground",
            sizeConfig.text,
          )}
        >
          {initials}
        </span>
      )}
    </div>
  );
};
