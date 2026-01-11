-- ============================================================================
-- FEATURE: LEADS
-- ============================================================================
-- Gerenciamento completo de leads do CRM
-- Inclui: leads, lead_responsibles, lead_activities, lead_messages_sent
-- ============================================================================

-- ============================================================================
-- TABELA: leads
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Campos básicos
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  
  -- Campos adicionais
  segment TEXT,
  revenue TEXT,
  linkedin TEXT,
  notes TEXT,
  origin TEXT, -- site, linkedin, indicacao, evento, telefone, email_marketing, cold_email, outro
  avatar_url TEXT,
  messages TEXT, -- JSON array de mensagens enviadas
  
  -- Pipeline e relacionamentos
  stage TEXT NOT NULL DEFAULT 'base' CHECK (stage IN (
    'base', 
    'lead_mapeado', 
    'tentando_contato', 
    'conexao_iniciada', 
    'desqualificado', 
    'qualificado', 
    'reuniao_agendada'
  )),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Mantido para compatibilidade
  
  -- Campos personalizados e ordenação
  custom_fields JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Soft delete e timestamps
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES: leads
-- ============================================================================

CREATE INDEX IF NOT EXISTS leads_workspace_id_idx ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_responsible_id_idx ON leads(responsible_id);
CREATE INDEX IF NOT EXISTS leads_campaign_id_idx ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON leads(archived_at);
CREATE INDEX IF NOT EXISTS leads_workspace_stage_sort_order_idx ON leads(workspace_id, stage, sort_order);

-- ============================================================================
-- TABELA: lead_responsibles (múltiplos responsáveis por lead)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_responsibles_lead_id ON lead_responsibles(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_responsibles_user_id ON lead_responsibles(user_id);

-- ============================================================================
-- TABELA: lead_activities (histórico de ações)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'created', 'stage_changed', 'field_updated', 'message_sent', 'archived', 'restored'
  field_name TEXT, -- campo que foi alterado (para 'field_updated')
  old_value JSONB,
  new_value JSONB,
  metadata JSONB, -- dados extras (nome da etapa, nome do campo, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_workspace_id ON lead_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_action_type ON lead_activities(action_type);

-- ============================================================================
-- TABELA: lead_messages_sent (histórico de mensagens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_messages_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL, -- 'whatsapp', 'email', 'linkedin'
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_messages_sent_lead_id ON lead_messages_sent(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_sent_workspace_id ON lead_messages_sent(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_sent_campaign_id ON lead_messages_sent(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_sent_sent_at ON lead_messages_sent(sent_at DESC);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.leads TO authenticated, anon, service_role;
GRANT ALL ON public.lead_responsibles TO authenticated, anon, service_role;
GRANT ALL ON public.lead_activities TO authenticated, anon, service_role;
GRANT ALL ON public.lead_messages_sent TO authenticated, anon, service_role;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at em leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS: lead_activities
-- ============================================================================

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Membros do workspace podem visualizar atividades
CREATE POLICY "Workspace members can view lead activities"
ON public.lead_activities
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

-- Membros do workspace podem inserir atividades
CREATE POLICY "Workspace members can insert lead activities"
ON public.lead_activities
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

-- Service role pode gerenciar todas as atividades
CREATE POLICY "Service role can manage all lead activities"
ON public.lead_activities
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RLS: lead_messages_sent
-- ============================================================================

ALTER TABLE public.lead_messages_sent ENABLE ROW LEVEL SECURITY;

-- Membros do workspace podem visualizar mensagens
CREATE POLICY "Workspace members can view lead messages"
ON public.lead_messages_sent
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

-- Membros do workspace podem inserir mensagens
CREATE POLICY "Workspace members can insert lead messages"
ON public.lead_messages_sent
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

-- Service role pode gerenciar todas as mensagens
CREATE POLICY "Service role can manage all lead messages"
ON public.lead_messages_sent
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE leads IS 'Leads do CRM - contatos potenciais de vendas';
COMMENT ON COLUMN leads.origin IS 'Origem do lead: site, linkedin, indicacao, evento, telefone, email_marketing, cold_email, outro';
COMMENT ON COLUMN leads.messages IS 'JSON array de mensagens enviadas ao lead. Formato: [{id, content, sentAt, channel}]';
COMMENT ON COLUMN leads.sort_order IS 'Ordem de exibição do lead dentro da coluna do Kanban';
COMMENT ON COLUMN leads.archived_at IS 'Data de arquivamento do lead. NULL = ativo, valor = arquivado';

COMMENT ON TABLE lead_responsibles IS 'Relacionamento N:N entre leads e usuários responsáveis';

COMMENT ON TABLE lead_activities IS 'Histórico de atividades realizadas em leads';
COMMENT ON COLUMN lead_activities.action_type IS 'Tipo da ação: created, stage_changed, field_updated, message_sent, archived, restored';
COMMENT ON COLUMN lead_activities.field_name IS 'Nome do campo alterado (usado quando action_type = field_updated)';
COMMENT ON COLUMN lead_activities.old_value IS 'Valor anterior (JSON para suportar diferentes tipos)';
COMMENT ON COLUMN lead_activities.new_value IS 'Novo valor (JSON para suportar diferentes tipos)';
COMMENT ON COLUMN lead_activities.metadata IS 'Dados extras como nome da etapa, nome do campo formatado, etc';

COMMENT ON TABLE lead_messages_sent IS 'Histórico de mensagens enviadas para leads';
COMMENT ON COLUMN lead_messages_sent.channel IS 'Canal de envio: whatsapp, email, linkedin';
COMMENT ON COLUMN lead_messages_sent.content IS 'Conteúdo da mensagem enviada';
COMMENT ON COLUMN lead_messages_sent.sent_at IS 'Data e hora do envio';
