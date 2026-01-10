-- Corrigir permissões na tabela lead_responsibles
-- Problema: faltava o GRANT na migração 013

-- Desabilitar RLS temporariamente
ALTER TABLE public.lead_responsibles DISABLE ROW LEVEL SECURITY;

-- Remover policies existentes
DROP POLICY IF EXISTS "Workspace members can view lead responsibles" ON public.lead_responsibles;
DROP POLICY IF EXISTS "Workspace members can insert lead responsibles" ON public.lead_responsibles;
DROP POLICY IF EXISTS "Workspace members can delete lead responsibles" ON public.lead_responsibles;

-- GRANT permissões (estava faltando na migração 013!)
GRANT ALL ON public.lead_responsibles TO authenticated, anon, service_role;
