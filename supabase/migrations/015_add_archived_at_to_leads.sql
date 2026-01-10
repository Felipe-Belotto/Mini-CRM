-- Adicionar campo archived_at para soft delete de leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para filtrar leads arquivados eficientemente
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON public.leads(archived_at);

-- Comentário explicativo
COMMENT ON COLUMN public.leads.archived_at IS 'Data de arquivamento do lead. NULL = ativo, valor = arquivado';
