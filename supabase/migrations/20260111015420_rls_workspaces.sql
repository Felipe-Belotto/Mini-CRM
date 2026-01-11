-- ============================================================================
-- RLS: WORKSPACES (Feature Workspaces)
-- ============================================================================
-- Row Level Security para workspaces, workspace_members, workspace_invites, pipeline_configs
-- ============================================================================

-- ############################################################################
-- TABELA: workspaces
-- ############################################################################

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SELECT: Owner ou membro pode ver o workspace
-- ----------------------------------------------------------------------------

CREATE POLICY "Members can view their workspaces"
ON public.workspaces
FOR SELECT
USING (public.is_workspace_member(id));

-- Service role bypass
CREATE POLICY "Service role can view all workspaces"
ON public.workspaces
FOR SELECT
USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- INSERT: Qualquer usuário autenticado pode criar workspace
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can create workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND owner_id = auth.uid()
);

-- Service role bypass
CREATE POLICY "Service role can insert workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- UPDATE: Apenas owner ou admin
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can update workspaces"
ON public.workspaces
FOR UPDATE
USING (public.is_workspace_admin_or_owner(id))
WITH CHECK (public.is_workspace_admin_or_owner(id));

-- Service role bypass
CREATE POLICY "Service role can update workspaces"
ON public.workspaces
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- DELETE: Apenas owner
-- ----------------------------------------------------------------------------

CREATE POLICY "Only owner can delete workspace"
ON public.workspaces
FOR DELETE
USING (public.is_workspace_owner(id));

-- Service role bypass
CREATE POLICY "Service role can delete workspaces"
ON public.workspaces
FOR DELETE
USING (auth.role() = 'service_role');

-- ############################################################################
-- TABELA: workspace_members
-- ############################################################################

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SELECT: Membros podem ver outros membros do workspace
-- ----------------------------------------------------------------------------

CREATE POLICY "Members can view workspace members"
ON public.workspace_members
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all workspace members"
ON public.workspace_members
FOR SELECT
USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- INSERT: Owner/admin pode adicionar membros
-- Nota: Aceite de convite é feito via service_role
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can add workspace members"
ON public.workspace_members
FOR INSERT
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass (para aceite de convites)
CREATE POLICY "Service role can insert workspace members"
ON public.workspace_members
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- UPDATE: Owner/admin pode mudar roles
-- Restrição: não pode mudar o role do owner
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can update member roles"
ON public.workspace_members
FOR UPDATE
USING (
  public.is_workspace_admin_or_owner(workspace_id)
  AND role != 'owner' -- Não pode alterar o owner
)
WITH CHECK (
  public.is_workspace_admin_or_owner(workspace_id)
  AND role != 'owner' -- Não pode promover a owner
);

-- Service role bypass
CREATE POLICY "Service role can update workspace members"
ON public.workspace_members
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- DELETE: Owner/admin pode remover OU membro pode sair (remover a si mesmo)
-- Restrição: Owner não pode ser removido
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can remove members"
ON public.workspace_members
FOR DELETE
USING (
  public.is_workspace_admin_or_owner(workspace_id)
  AND role != 'owner' -- Owner não pode ser removido
);

CREATE POLICY "Members can leave workspace"
ON public.workspace_members
FOR DELETE
USING (
  user_id = auth.uid()
  AND role != 'owner' -- Owner não pode sair
);

-- Service role bypass
CREATE POLICY "Service role can delete workspace members"
ON public.workspace_members
FOR DELETE
USING (auth.role() = 'service_role');

-- ############################################################################
-- TABELA: workspace_invites
-- ############################################################################

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SELECT: Owner/admin pode ver convites OU usuário convidado (por email)
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can view workspace invites"
ON public.workspace_invites
FOR SELECT
USING (public.is_workspace_admin_or_owner(workspace_id));

-- Usuário convidado pode ver seu próprio convite (para aceitar)
-- Nota: Verificação por email do usuário autenticado
CREATE POLICY "Invited users can view their invites"
ON public.workspace_invites
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Service role bypass
CREATE POLICY "Service role can view all invites"
ON public.workspace_invites
FOR SELECT
USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- INSERT: Owner/admin pode criar convites
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can create invites"
ON public.workspace_invites
FOR INSERT
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can insert invites"
ON public.workspace_invites
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- UPDATE: Convidado pode aceitar OU owner/admin pode cancelar
-- ----------------------------------------------------------------------------

-- Owner/admin pode atualizar (cancelar, etc)
CREATE POLICY "Admins can update invites"
ON public.workspace_invites
FOR UPDATE
USING (public.is_workspace_admin_or_owner(workspace_id))
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Convidado pode atualizar seu convite (aceitar)
CREATE POLICY "Invited users can accept invites"
ON public.workspace_invites
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Service role bypass
CREATE POLICY "Service role can update invites"
ON public.workspace_invites
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- DELETE: Apenas owner/admin
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can delete invites"
ON public.workspace_invites
FOR DELETE
USING (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can delete invites"
ON public.workspace_invites
FOR DELETE
USING (auth.role() = 'service_role');

-- ############################################################################
-- TABELA: pipeline_configs
-- ############################################################################

ALTER TABLE public.pipeline_configs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SELECT: Membros podem ver configuração do pipeline
-- ----------------------------------------------------------------------------

CREATE POLICY "Members can view pipeline config"
ON public.pipeline_configs
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all pipeline configs"
ON public.pipeline_configs
FOR SELECT
USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- INSERT: Apenas via trigger (service_role)
-- Pipeline config é criado automaticamente com o workspace
-- ----------------------------------------------------------------------------

CREATE POLICY "Service role can insert pipeline configs"
ON public.pipeline_configs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- UPDATE: Owner/admin pode atualizar
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can update pipeline config"
ON public.pipeline_configs
FOR UPDATE
USING (public.is_workspace_admin_or_owner(workspace_id))
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can update pipeline configs"
ON public.pipeline_configs
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- DELETE: Não permitido (1 config por workspace)
-- Apenas service_role para casos excepcionais
-- ----------------------------------------------------------------------------

CREATE POLICY "Service role can delete pipeline configs"
ON public.pipeline_configs
FOR DELETE
USING (auth.role() = 'service_role');
