"use client";

import type React from "react";
import { AppSidebar } from "./AppSidebar";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};
