-- Adiciona campo messages para armazenar histórico de mensagens enviadas
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS messages TEXT;

-- Comentário explicativo
COMMENT ON COLUMN leads.messages IS 'JSON array de mensagens enviadas ao lead. Formato: [{id, content, sentAt, channel}]';
