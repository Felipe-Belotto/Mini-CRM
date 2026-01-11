-- ============================================================================
-- Fix: lead_activities.user_id deve referenciar profiles(id) para join funcionar
-- ============================================================================

-- Remove a FK atual que aponta para auth.users
ALTER TABLE public.lead_activities
DROP CONSTRAINT IF EXISTS lead_activities_user_id_fkey;

-- Adiciona nova FK apontando para profiles
ALTER TABLE public.lead_activities
ADD CONSTRAINT lead_activities_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Faz o mesmo para lead_messages_sent
ALTER TABLE public.lead_messages_sent
DROP CONSTRAINT IF EXISTS lead_messages_sent_user_id_fkey;

ALTER TABLE public.lead_messages_sent
ADD CONSTRAINT lead_messages_sent_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
