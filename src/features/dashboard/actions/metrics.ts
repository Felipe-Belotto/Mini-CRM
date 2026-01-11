"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { KANBAN_COLUMNS } from "@/shared/types/crm";

// Tipos para métricas avançadas
export interface ConversionRate {
  fromStage: string;
  toStage: string;
  fromStageName: string;
  toStageName: string;
  rate: number; // Percentual de 0 a 100
  count: number; // Quantidade que converteu
  total: number; // Total que passou pela etapa de origem
}

export interface LeadsByPeriod {
  period: string; // Data formatada
  count: number;
}

export interface TimeByStage {
  stage: string;
  stageName: string;
  averageHours: number;
  averageDays: number;
}

export interface PerformanceByUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  leadsCount: number;
  qualifiedCount: number;
  messagesCount: number;
}

/**
 * Helper para extrair valor de JSONB (já vem como objeto do Supabase)
 */
function extractJsonbValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  // Se já for string, retorna diretamente
  if (typeof value === "string") return value;
  // Se for objeto/outro tipo, tenta converter
  return String(value);
}

/**
 * Calcula taxa de conversão entre etapas baseado no histórico de atividades
 */
export async function getConversionRatesAction(): Promise<ConversionRate[]> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();
    if (!currentWorkspace) return [];

    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(currentWorkspace.id);
    if (!hasAccess) return [];

    const supabase = await createClient();

    // Buscar atividades de mudança de etapa
    const { data: stageChanges, error } = await supabase
      .from("lead_activities")
      .select("old_value, new_value")
      .eq("workspace_id", currentWorkspace.id)
      .eq("action_type", "stage_changed");

    if (error) {
      // Silencioso se a tabela não existir ainda
      if (error.code !== "42P01") {
        console.error("Error fetching stage changes:", error.message || error.code);
      }
      return [];
    }

    if (!stageChanges || stageChanges.length === 0) {
      return [];
    }

    // Contar transições
    const transitions = new Map<string, { count: number; total: number }>();
    const stageTotals = new Map<string, number>();

    for (const change of stageChanges) {
      // JSONB já vem como objeto do Supabase, não precisa de JSON.parse
      const fromStage = extractJsonbValue(change.old_value);
      const toStage = extractJsonbValue(change.new_value);

      if (!fromStage || !toStage) continue;

      const key = `${fromStage}:${toStage}`;
      const existing = transitions.get(key) || { count: 0, total: 0 };
      existing.count++;
      transitions.set(key, existing);

      // Contar total de leads que saíram de cada etapa
      stageTotals.set(fromStage, (stageTotals.get(fromStage) || 0) + 1);
    }

    // Calcular taxas de conversão para transições positivas do funil
    const positiveTransitions = [
      ["base", "lead_mapeado"],
      ["lead_mapeado", "tentando_contato"],
      ["tentando_contato", "conexao_iniciada"],
      ["conexao_iniciada", "qualificado"],
      ["qualificado", "reuniao_agendada"],
    ];

    const rates: ConversionRate[] = [];
    for (const [from, to] of positiveTransitions) {
      const key = `${from}:${to}`;
      const transition = transitions.get(key) || { count: 0, total: 0 };
      const total = stageTotals.get(from) || 0;

      const fromColumn = KANBAN_COLUMNS.find((c) => c.id === from);
      const toColumn = KANBAN_COLUMNS.find((c) => c.id === to);

      rates.push({
        fromStage: from,
        toStage: to,
        fromStageName: fromColumn?.title || from,
        toStageName: toColumn?.title || to,
        rate: total > 0 ? Math.round((transition.count / total) * 100) : 0,
        count: transition.count,
        total,
      });
    }

    return rates;
  } catch (error) {
    console.error("Error in getConversionRatesAction:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Busca leads criados por período
 */
export async function getLeadsByPeriodAction(
  period: "day" | "week" | "month" = "day",
  days = 30
): Promise<LeadsByPeriod[]> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();
    if (!currentWorkspace) return [];

    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(currentWorkspace.id);
    if (!hasAccess) return [];

    const supabase = await createClient();

    // Calcular data de início
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: leads, error } = await supabase
      .from("leads")
      .select("created_at")
      .eq("workspace_id", currentWorkspace.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching leads by period:", error.message || error.code);
      return [];
    }

    if (!leads || leads.length === 0) {
      return [];
    }

    // Agrupar por período
    const grouped = new Map<string, number>();

    for (const lead of leads) {
      const date = new Date(lead.created_at);
      let key: string;

      if (period === "day") {
        key = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      } else if (period === "week") {
        // Agrupar por semana (início da semana)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      } else {
        key = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      }

      grouped.set(key, (grouped.get(key) || 0) + 1);
    }

    return Array.from(grouped.entries()).map(([period, count]) => ({
      period,
      count,
    }));
  } catch (error) {
    console.error("Error in getLeadsByPeriodAction:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Calcula tempo médio em cada etapa (requer histórico de atividades)
 */
export async function getAverageTimeByStageAction(): Promise<TimeByStage[]> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();
    if (!currentWorkspace) return [];

    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(currentWorkspace.id);
    if (!hasAccess) return [];

    const supabase = await createClient();

    // Buscar atividades de mudança de etapa ordenadas por lead e data
    const { data: activities, error } = await supabase
      .from("lead_activities")
      .select("lead_id, old_value, new_value, created_at")
      .eq("workspace_id", currentWorkspace.id)
      .eq("action_type", "stage_changed")
      .order("lead_id")
      .order("created_at", { ascending: true });

    if (error) {
      // Silencioso se a tabela não existir ainda
      if (error.code !== "42P01") {
        console.error("Error fetching activities for time calculation:", error.message || error.code);
      }
      return [];
    }

    if (!activities || activities.length === 0) {
      return [];
    }

    // Calcular tempo em cada etapa
    const stageTimes = new Map<string, number[]>();

    let currentLeadId: string | null = null;
    let enteredStageAt: Date | null = null;
    let currentStage: string | null = null;

    for (const activity of activities) {
      // JSONB já vem como objeto do Supabase, não precisa de JSON.parse
      const toStage = extractJsonbValue(activity.new_value);
      const activityDate = new Date(activity.created_at);

      // Novo lead
      if (activity.lead_id !== currentLeadId) {
        // Salvar tempo do lead anterior
        if (currentLeadId && currentStage && enteredStageAt) {
          const hours = (activityDate.getTime() - enteredStageAt.getTime()) / (1000 * 60 * 60);
          const times = stageTimes.get(currentStage) || [];
          times.push(hours);
          stageTimes.set(currentStage, times);
        }

        currentLeadId = activity.lead_id;
        enteredStageAt = activityDate;
        currentStage = toStage;
      } else {
        // Mesmo lead, mudou de etapa
        if (currentStage && enteredStageAt) {
          const hours = (activityDate.getTime() - enteredStageAt.getTime()) / (1000 * 60 * 60);
          const times = stageTimes.get(currentStage) || [];
          times.push(hours);
          stageTimes.set(currentStage, times);
        }

        enteredStageAt = activityDate;
        currentStage = toStage;
      }
    }

    // Calcular médias
    const results: TimeByStage[] = [];
    for (const column of KANBAN_COLUMNS) {
      const times = stageTimes.get(column.id) || [];
      const averageHours =
        times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      results.push({
        stage: column.id,
        stageName: column.title,
        averageHours: Math.round(averageHours * 10) / 10,
        averageDays: Math.round((averageHours / 24) * 10) / 10,
      });
    }

    return results;
  } catch (error) {
    console.error("Error in getAverageTimeByStageAction:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Performance por usuário responsável
 */
export async function getPerformanceByUserAction(): Promise<PerformanceByUser[]> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();
    if (!currentWorkspace) return [];

    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(currentWorkspace.id);
    if (!hasAccess) return [];

    const supabase = await createClient();

    // Buscar membros do workspace (sem join, mais simples)
    const { data: members, error: membersError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", currentWorkspace.id);

    // Também incluir o owner do workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", currentWorkspace.id)
      .single();

    if (membersError) {
      console.error("Error fetching members:", membersError.message || membersError.code);
      return [];
    }

    // Combinar membros + owner
    const userIds = new Set<string>();
    if (workspace?.owner_id) {
      userIds.add(workspace.owner_id);
    }
    if (members) {
      for (const member of members) {
        userIds.add(member.user_id);
      }
    }

    if (userIds.size === 0) {
      return [];
    }

    // Buscar profiles separadamente
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(userIds));

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    // Para cada usuário, buscar métricas
    const results: PerformanceByUser[] = [];

    for (const userId of userIds) {
      const profile = profileMap.get(userId);

      // Contar leads onde é responsável
      const { count: leadsCount } = await supabase
        .from("lead_responsibles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Contar leads qualificados/reunião onde é responsável
      const { data: qualifiedLeads } = await supabase
        .from("lead_responsibles")
        .select("lead_id")
        .eq("user_id", userId);

      let qualifiedCount = 0;
      if (qualifiedLeads && qualifiedLeads.length > 0) {
        const leadIds = qualifiedLeads.map((l) => l.lead_id);
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("id", leadIds)
          .in("stage", ["qualificado", "reuniao_agendada"]);
        qualifiedCount = count || 0;
      }

      // Contar mensagens enviadas (pode falhar se tabela não existir)
      let messagesCount = 0;
      try {
        const { count } = await supabase
          .from("lead_messages_sent")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        messagesCount = count || 0;
      } catch {
        // Tabela pode não existir ainda
      }

      results.push({
        userId,
        userName: profile?.full_name || "Usuário",
        avatarUrl: profile?.avatar_url || undefined,
        leadsCount: leadsCount || 0,
        qualifiedCount,
        messagesCount,
      });
    }

    // Ordenar por leads qualificados
    return results.sort((a, b) => b.qualifiedCount - a.qualifiedCount);
  } catch (error) {
    console.error("Error in getPerformanceByUserAction:", error instanceof Error ? error.message : error);
    return [];
  }
}
