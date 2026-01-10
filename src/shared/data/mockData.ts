import type {
  Campaign,
  KanbanStage,
  Lead,
  User,
  Workspace,
} from "@/shared/types/crm";

export const mockUsers: User[] = [
  {
    id: "1",
    email: "usuario@teste.com",
    fullName: "Usuário Teste",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    email: "joao@teste.com",
    fullName: "João Silva",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "3",
    email: "maria@teste.com",
    fullName: "Maria Santos",
    createdAt: new Date("2024-01-01"),
  },
];

export const mockWorkspaces: Workspace[] = [
  {
    id: "1",
    name: "Workspace Principal",
    slug: "workspace-principal",
    createdAt: new Date("2024-01-01"),
    ownerId: "1",
  },
];

export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "carlos@empresa.com",
    phone: "(11) 99999-1234",
    position: "Diretor Comercial",
    company: "TechCorp Brasil",
    segment: "Tecnologia",
    revenue: "R$ 10M - R$ 50M",
    linkedIn: "linkedin.com/in/carlossilva",
    stage: "lead_mapeado",
    campaignId: "1",
    workspaceId: "1",
    responsibleId: "1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    name: "Ana Rodrigues",
    email: "ana@startup.io",
    phone: "(21) 98888-5678",
    position: "CEO",
    company: "StartupX",
    segment: "Fintech",
    revenue: "R$ 1M - R$ 5M",
    stage: "tentando_contato",
    campaignId: "1",
    workspaceId: "1",
    responsibleId: "2",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: "3",
    name: "Roberto Mendes",
    email: "roberto@industria.com.br",
    phone: "(31) 97777-9012",
    position: "Gerente de Compras",
    company: "Indústria ABC",
    segment: "Manufatura",
    revenue: "R$ 50M - R$ 100M",
    stage: "conexao_iniciada",
    campaignId: "2",
    workspaceId: "1",
    responsibleId: "1",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: "4",
    name: "Maria Costa",
    email: "maria@varejo.com",
    phone: "",
    position: "",
    company: "Varejo Nacional",
    stage: "base",
    workspaceId: "1",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: "5",
    name: "Fernando Lima",
    email: "fernando@consultoria.com",
    phone: "(41) 96666-3456",
    position: "Partner",
    company: "Consultoria Premium",
    segment: "Consultoria",
    revenue: "R$ 5M - R$ 10M",
    stage: "qualificado",
    campaignId: "1",
    workspaceId: "1",
    responsibleId: "3",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-28"),
  },
  {
    id: "6",
    name: "Juliana Santos",
    email: "juliana@saude.med",
    phone: "(51) 95555-7890",
    position: "Diretora Administrativa",
    company: "Clínica Saúde+",
    segment: "Saúde",
    stage: "reuniao_agendada",
    campaignId: "2",
    workspaceId: "1",
    responsibleId: "2",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-30"),
  },
  {
    id: "7",
    name: "Pedro Oliveira",
    email: "pedro@logistica.net",
    phone: "(19) 94444-2345",
    position: "Gerente de Operações",
    company: "LogiExpress",
    segment: "Logística",
    notes: "Não tem interesse no momento",
    stage: "desqualificado",
    campaignId: "1",
    workspaceId: "1",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-26"),
  },
  {
    id: "8",
    name: "",
    email: "contato@newlead.com",
    phone: "",
    position: "",
    company: "New Lead Corp",
    stage: "base",
    workspaceId: "1",
    createdAt: new Date("2024-01-28"),
    updatedAt: new Date("2024-01-28"),
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Prospecção Q1 2024",
    context:
      "Campanha focada em empresas de tecnologia e startups que buscam soluções de automação comercial.",
    voiceTone: "informal",
    aiInstructions:
      "Mencionar cases de sucesso no setor tech. Focar em ROI e escalabilidade. Evitar jargões técnicos demais.",
    status: "active",
    triggerStage: "lead_mapeado",
    workspaceId: "1",
    leadsCount: 45,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Expansão Indústria",
    context:
      "Prospecção ativa no setor industrial, focando em gerentes de compras e diretores de operações.",
    voiceTone: "formal",
    aiInstructions:
      "Usar linguagem corporativa. Destacar compliance e segurança. Mencionar certificações ISO.",
    status: "active",
    workspaceId: "1",
    leadsCount: 32,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    name: "Reativação de Base",
    context:
      "Campanha para reengajar leads antigos que não responderam nas últimas tentativas.",
    voiceTone: "neutro",
    aiInstructions:
      "Ser breve e direto. Oferecer conteúdo de valor antes de pedir reunião.",
    status: "paused",
    workspaceId: "1",
    leadsCount: 120,
    createdAt: new Date("2023-11-15"),
  },
];

export const getLeadsByStage = (leads: Lead[], stage: KanbanStage): Lead[] => {
  return leads.filter((lead) => lead.stage === stage);
};

export const getLeadsCountByStage = (
  leads: Lead[],
): Record<KanbanStage, number> => {
  const counts: Record<KanbanStage, number> = {
    base: 0,
    lead_mapeado: 0,
    tentando_contato: 0,
    conexao_iniciada: 0,
    desqualificado: 0,
    qualificado: 0,
    reuniao_agendada: 0,
  };

  leads.forEach((lead) => {
    counts[lead.stage]++;
  });

  return counts;
};
