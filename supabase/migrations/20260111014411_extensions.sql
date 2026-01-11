-- ============================================================================
-- EXTENSIONS E FUNÇÕES UTILITÁRIAS
-- ============================================================================
-- Extensões e funções compartilhadas usadas por múltiplas features
-- ============================================================================

-- Extensão pgcrypto para geração de UUIDs e criptografia
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================================================
-- FUNÇÃO UTILITÁRIA: update_updated_at_column
-- ============================================================================
-- Função reutilizável para atualizar automaticamente o campo updated_at
-- Usada por triggers em várias tabelas do sistema

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Função utilitária para atualizar automaticamente o campo updated_at em triggers';
