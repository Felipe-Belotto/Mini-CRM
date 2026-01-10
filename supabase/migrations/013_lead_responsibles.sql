-- Criar tabela de relacionamento lead_responsibles para múltiplos responsáveis
CREATE TABLE IF NOT EXISTS public.lead_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_responsibles_lead_id ON public.lead_responsibles(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_responsibles_user_id ON public.lead_responsibles(user_id);

-- Migrar dados existentes do responsible_id para a nova tabela
INSERT INTO public.lead_responsibles (lead_id, user_id)
SELECT id, responsible_id
FROM public.leads
WHERE responsible_id IS NOT NULL
ON CONFLICT (lead_id, user_id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.lead_responsibles ENABLE ROW LEVEL SECURITY;

-- Policy: Membros do workspace podem ver responsáveis dos leads do workspace
DROP POLICY IF EXISTS "Workspace members can view lead responsibles" ON public.lead_responsibles;
CREATE POLICY "Workspace members can view lead responsibles"
  ON public.lead_responsibles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = lead_responsibles.lead_id
      AND wm.user_id = auth.uid()
    )
  );

-- Policy: Membros do workspace podem inserir responsáveis
DROP POLICY IF EXISTS "Workspace members can insert lead responsibles" ON public.lead_responsibles;
CREATE POLICY "Workspace members can insert lead responsibles"
  ON public.lead_responsibles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = lead_responsibles.lead_id
      AND wm.user_id = auth.uid()
    )
  );

-- Policy: Membros do workspace podem deletar responsáveis
DROP POLICY IF EXISTS "Workspace members can delete lead responsibles" ON public.lead_responsibles;
CREATE POLICY "Workspace members can delete lead responsibles"
  ON public.lead_responsibles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = lead_responsibles.lead_id
      AND wm.user_id = auth.uid()
    )
  );
