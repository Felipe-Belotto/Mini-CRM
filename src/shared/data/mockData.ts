import type { Campaign, KanbanStage, Lead } from "@/shared/types/crm";

export const mockLeads: Lead[] = [
  {
    id: "1",
    nome: "Carlos Silva",
    email: "carlos@empresa.com",
    telefone: "(11) 99999-1234",
    cargo: "Diretor Comercial",
    empresa: "TechCorp Brasil",
    segmento: "Tecnologia",
    faturamento: "R$ 10M - R$ 50M",
    linkedIn: "linkedin.com/in/carlossilva",
    stage: "lead_mapeado",
    campanhaId: "1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    nome: "Ana Rodrigues",
    email: "ana@startup.io",
    telefone: "(21) 98888-5678",
    cargo: "CEO",
    empresa: "StartupX",
    segmento: "Fintech",
    faturamento: "R$ 1M - R$ 5M",
    stage: "tentando_contato",
    campanhaId: "1",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: "3",
    nome: "Roberto Mendes",
    email: "roberto@industria.com.br",
    telefone: "(31) 97777-9012",
    cargo: "Gerente de Compras",
    empresa: "Indústria ABC",
    segmento: "Manufatura",
    faturamento: "R$ 50M - R$ 100M",
    stage: "conexao_iniciada",
    campanhaId: "2",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: "4",
    nome: "Maria Costa",
    email: "maria@varejo.com",
    telefone: "",
    cargo: "",
    empresa: "Varejo Nacional",
    stage: "base",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: "5",
    nome: "Fernando Lima",
    email: "fernando@consultoria.com",
    telefone: "(41) 96666-3456",
    cargo: "Partner",
    empresa: "Consultoria Premium",
    segmento: "Consultoria",
    faturamento: "R$ 5M - R$ 10M",
    stage: "qualificado",
    campanhaId: "1",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-28"),
  },
  {
    id: "6",
    nome: "Juliana Santos",
    email: "juliana@saude.med",
    telefone: "(51) 95555-7890",
    cargo: "Diretora Administrativa",
    empresa: "Clínica Saúde+",
    segmento: "Saúde",
    stage: "reuniao_agendada",
    campanhaId: "2",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-30"),
  },
  {
    id: "7",
    nome: "Pedro Oliveira",
    email: "pedro@logistica.net",
    telefone: "(19) 94444-2345",
    cargo: "Gerente de Operações",
    empresa: "LogiExpress",
    segmento: "Logística",
    notas: "Não tem interesse no momento",
    stage: "desqualificado",
    campanhaId: "1",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-26"),
  },
  {
    id: "8",
    nome: "",
    email: "contato@newlead.com",
    telefone: "",
    cargo: "",
    empresa: "New Lead Corp",
    stage: "base",
    createdAt: new Date("2024-01-28"),
    updatedAt: new Date("2024-01-28"),
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    nome: "Prospecção Q1 2024",
    contexto:
      "Campanha focada em empresas de tecnologia e startups que buscam soluções de automação comercial.",
    tomDeVoz: "informal",
    instrucoesIA:
      "Mencionar cases de sucesso no setor tech. Focar em ROI e escalabilidade. Evitar jargões técnicos demais.",
    status: "ativa",
    leadsCount: 45,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    nome: "Expansão Indústria",
    contexto:
      "Prospecção ativa no setor industrial, focando em gerentes de compras e diretores de operações.",
    tomDeVoz: "formal",
    instrucoesIA:
      "Usar linguagem corporativa. Destacar compliance e segurança. Mencionar certificações ISO.",
    status: "ativa",
    leadsCount: 32,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    nome: "Reativação de Base",
    contexto:
      "Campanha para reengajar leads antigos que não responderam nas últimas tentativas.",
    tomDeVoz: "neutro",
    instrucoesIA:
      "Ser breve e direto. Oferecer conteúdo de valor antes de pedir reunião.",
    status: "pausada",
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
