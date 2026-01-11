// Tipos para o módulo de atividades

export type ActivityActionType =
  | "created"
  | "stage_changed"
  | "field_updated"
  | "message_sent"
  | "archived"
  | "restored";

export interface LeadActivity {
  id: string;
  leadId: string;
  workspaceId: string;
  userId: string | null;
  actionType: ActivityActionType;
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: ActivityMetadata | null;
  createdAt: Date;
  // Dados do usuário (join)
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface ActivityMetadata {
  // Para stage_changed
  oldStageName?: string;
  newStageName?: string;
  // Para field_updated
  fieldLabel?: string;
  // Para message_sent
  channel?: string;
  campaignName?: string;
  // Genérico
  [key: string]: unknown;
}

export interface CreateActivityInput {
  leadId: string;
  workspaceId: string;
  userId?: string;
  actionType: ActivityActionType;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: ActivityMetadata;
}
