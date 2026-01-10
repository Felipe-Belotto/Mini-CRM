-- Adiciona campo origin para rastrear a origem do lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin TEXT;

-- Origens pré-definidas serão validadas no frontend
-- Valores esperados: site, linkedin, indicacao, evento, telefone, email_marketing, cold_email, outro
COMMENT ON COLUMN leads.origin IS 'Origem do lead: site, linkedin, indicacao, evento, telefone, email_marketing, cold_email, outro';
