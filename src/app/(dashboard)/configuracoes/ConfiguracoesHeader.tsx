"use client";

import { usePathname } from "next/navigation";

const pageConfig = {
  "/configuracoes/perfil": null,
  "/configuracoes/workspace": null,
  "/configuracoes/funil": {
    title: "Configuração do Funil",
    description: "Configure quais campos são obrigatórios para cada etapa do funil",
  },
  "/configuracoes/campos": {
    title: "Campos Personalizados",
    description: "Crie e gerencie campos adicionais para leads",
  },
};

export function ConfiguracoesHeader() {
  const pathname = usePathname();
  const config = pageConfig[pathname as keyof typeof pageConfig];

  if (!config) {
    return null;
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{config.title}</h1>
      <p className="text-muted-foreground">{config.description}</p>
    </div>
  );
}
