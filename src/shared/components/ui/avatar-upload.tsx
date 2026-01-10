"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, X, User } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";

export interface AvatarUploadProps {
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  onError?: (message: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // em bytes
  className?: string;
  fallbackText?: string;
}

const sizeMap = {
  sm: { container: "w-16 h-16", icon: "w-4 h-4", button: "w-5 h-5" },
  md: { container: "w-20 h-20", icon: "w-5 h-5", button: "w-6 h-6" },
  lg: { container: "w-24 h-24", icon: "w-6 h-6", button: "w-7 h-7" },
  xl: { container: "w-32 h-32", icon: "w-8 h-8", button: "w-9 h-9" },
};

export function AvatarUpload({
  value,
  onChange,
  onRemove,
  onError,
  size = "md",
  disabled = false,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxSize = 5 * 1024 * 1024, // 5MB padrão
  className,
  fallbackText,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isHovering, setIsHovering] = React.useState(false);

  const sizeConfig = sizeMap[size];

  React.useEffect(() => {
    if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else if (typeof value === "string") {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      const message = `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
      if (onError) {
        onError(message);
      } else {
        alert(message);
      }
      return;
    }

    if (accept && !accept.split(",").some((type) => file.type === type.trim())) {
      const message = "Tipo de arquivo inválido";
      if (onError) {
        onError(message);
      } else {
        alert(message);
      }
      return;
    }

    onChange?.(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreview(null);
    onChange?.(null);
    onRemove?.();
  };

  const displayValue = preview || (typeof value === "string" ? value : null);

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={() => !disabled && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={cn(
          "relative transition-opacity",
          sizeConfig.container,
          disabled ? "cursor-default" : "cursor-pointer",
        )}
        onClick={handleClick}
      >
        <Avatar className={cn("w-full h-full", sizeConfig.container)}>
          {displayValue ? (
            <AvatarImage src={displayValue} alt="Avatar" />
          ) : (
            <AvatarFallback>
              {fallbackText ? (
                <span className="text-muted-foreground font-medium">
                  {fallbackText}
                </span>
              ) : (
                <User className={cn("text-muted-foreground", sizeConfig.icon)} />
              )}
            </AvatarFallback>
          )}
        </Avatar>

        {!disabled && isHovering && (
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center gap-2 transition-opacity",
              "opacity-100",
            )}
          >
            {displayValue ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full bg-background/90 hover:bg-background text-foreground",
                    sizeConfig.button,
                  )}
                  onClick={handleClick}
                >
                  <Camera className={sizeConfig.icon} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground",
                    sizeConfig.button,
                  )}
                  onClick={handleRemove}
                >
                  <X className={sizeConfig.icon} />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full bg-background/90 hover:bg-background text-foreground",
                  sizeConfig.button,
                )}
                onClick={handleClick}
              >
                <Camera className={sizeConfig.icon} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}