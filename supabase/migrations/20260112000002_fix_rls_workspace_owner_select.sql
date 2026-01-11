-- ============================================================================
-- FIX: RLS workspaces - Permitir owner ver workspace imediatamente
-- ============================================================================
-- Problema: Quando um workspace é criado, o .insert().select() tenta
-- retornar o registro, mas a política de SELECT usa is_workspace_member()
-- que verifica workspace_members. O trigger AFTER INSERT que adiciona o
-- owner como membro ainda não executou, causando erro de RLS no SELECT.
--
-- Solução: Adicionar política que permite ao owner ver o workspace
-- diretamente pelo campo owner_id, sem depender de workspace_members.
-- ============================================================================

-- Política para permitir que o owner veja seu workspace diretamente
-- Isso é necessário para o fluxo de criação, onde o SELECT acontece
-- antes do trigger AFTER INSERT adicionar o owner como membro
CREATE POLICY "Owners can view their own workspaces"
ON public.workspaces
FOR SELECT
USING (owner_id = auth.uid());

COMMENT ON POLICY "Owners can view their own workspaces" ON public.workspaces IS 
  'Permite que owner veja workspace diretamente, sem depender de workspace_members (necessário para criação)';
