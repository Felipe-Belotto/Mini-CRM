-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================
-- Funções reutilizáveis para simplificar as RLS policies
-- Usadas por todas as features para verificar permissões de workspace
-- ============================================================================

-- ============================================================================
-- FUNÇÃO: is_workspace_member
-- ============================================================================
-- Verifica se o usuário atual é membro do workspace (qualquer role)
-- Retorna TRUE se for owner, admin ou member

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_workspace_member(UUID) IS 
  'Verifica se o usuário atual é membro do workspace (owner, admin ou member)';

-- ============================================================================
-- FUNÇÃO: is_workspace_admin_or_owner
-- ============================================================================
-- Verifica se o usuário atual é admin ou owner do workspace
-- Usado para operações de gerenciamento

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_workspace_admin_or_owner(UUID) IS 
  'Verifica se o usuário atual é admin ou owner do workspace';

-- ============================================================================
-- FUNÇÃO: is_workspace_owner
-- ============================================================================
-- Verifica se o usuário atual é o owner do workspace
-- Usado para operações críticas como deletar workspace

CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_workspace_owner(UUID) IS 
  'Verifica se o usuário atual é o owner do workspace';

-- ============================================================================
-- FUNÇÃO: get_user_workspace_ids
-- ============================================================================
-- Retorna todos os workspace_ids que o usuário é membro
-- Útil para queries que precisam filtrar por múltiplos workspaces

CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT workspace_id FROM public.workspace_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_workspace_ids() IS 
  'Retorna todos os workspace_ids que o usuário atual é membro';

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Permite que usuários autenticados executem as funções

GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_workspace_ids() TO authenticated;
