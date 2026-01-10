"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Mail } from "lucide-react";

const inviteCategories = [
  {
    label: "Pendentes",
    href: "/invites/pending",
    description: "Convites aguardando sua resposta",
    icon: Mail,
  },
];

export function InvitesHeader() {
  const pathname = usePathname();

  const isInvitesPath = pathname?.startsWith("/invites");

  if (!isInvitesPath) {
    return null;
  }

  if (pathname?.startsWith("/invites/accept")) {
    return null;
  }

  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Convites</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus convites de workspaces
            </p>
          </div>
        </div>

        <nav className="mt-4 flex gap-1 border-b border-transparent">
          {inviteCategories.map((category) => {
            const isActive = pathname === category.href || pathname?.startsWith(category.href + "/");
            const Icon = category.icon;
            
            return (
              <Link
                key={category.href}
                href={category.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 border-b-2 border-transparent -mb-px",
                  isActive
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title={category.description}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
