/// <reference path="./deno_types.d.ts" />
// @ts-expect-error - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno runtime imports
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  segment?: string;
  revenue?: string;
  notes?: string;
  customFields?: Record<string, string>;
}

interface CampaignData {
  name: string;
  context: string;
  voiceTone: "formal" | "informal" | "neutro";
  aiInstructions: string;
  formalityLevel?: number; // 1-5, onde 1=muito informal, 5=muito formal
}

interface SenderData {
  name: string;
  position: string;
  company: string;
}

interface GenerateRequest {
  campaign: CampaignData;
  lead: LeadData;
  channels: ("whatsapp" | "email")[];
  variationsPerChannel?: number;
  sender?: SenderData;
}

interface AISuggestion {
  id: string;
  type: "WhatsApp" | "Email";
  message: string;
}

interface GenerateResponse {
  success: boolean;
  suggestions?: AISuggestion[];
  error?: string;
}

function getFormalityDescription(
  channel: "whatsapp" | "email",
  formalityLevel?: number,
): string {
  // Se não há nível definido, usa padrão por canal
  if (formalityLevel === undefined || formalityLevel === null) {
    if (channel === "whatsapp") {
      return "informal e amigável, como uma conversa casual";
    }
    return "profissional e formal, adequado para comunicação empresarial";
  }

  // Ajusta baseado no nível (1-5)
  switch (formalityLevel) {
    case 1:
      return "muito informal e descontraído, como se falasse com um amigo próximo";
    case 2:
      return "informal e amigável, mas respeitoso";
    case 3:
      return "neutro, equilibrando profissionalismo com cordialidade";
    case 4:
      return "formal e profissional, adequado para ambiente corporativo";
    case 5:
      return "muito formal e cerimoniosa, para contextos executivos de alto nível";
    default:
      return "profissional e cordial";
  }
}

function getChannelInstructions(channel: "whatsapp" | "email"): string {
  if (channel === "whatsapp") {
    return `
- Mensagem curta e direta (máximo 3-4 parágrafos curtos)
- Pode usar emojis com moderação (1-2 no máximo)
- Linguagem conversacional
- Não use assunto/título
- Termine com uma pergunta ou call-to-action claro
- Não use saudações muito formais como "Prezado(a)"
    `.trim();
  }

  return `
- Estrutura de email profissional (saudação, corpo, fechamento, assinatura)
- NÃO use emojis
- Use parágrafos bem estruturados
- Inclua linha de assunto sugerida no início (formato: "Assunto: ...")
- Saudação apropriada ao tom
- Fechamento cordial com nome do remetente (use "[Seu Nome]" como placeholder)
- Seja mais detalhado que WhatsApp, mas ainda conciso
  `.trim();
}

function buildPrompt(
  campaign: CampaignData,
  lead: LeadData,
  channel: "whatsapp" | "email",
  variationsCount: number,
  sender?: SenderData,
): string {
  const formalityDesc = getFormalityDescription(
    channel,
    campaign.formalityLevel,
  );
  const channelInstructions = getChannelInstructions(channel);
  const channelName = channel === "whatsapp" ? "WhatsApp" : "Email";

  // Construir dados do lead
  let leadInfo = `
Dados do Lead:
- Nome: ${lead.name || "Não informado"}
- Cargo: ${lead.position || "Não informado"}
- Empresa: ${lead.company || "Não informado"}
- Email: ${lead.email || "Não informado"}
- Telefone: ${lead.phone || "Não informado"}
  `.trim();

  if (lead.segment) {
    leadInfo += `\n- Segmento: ${lead.segment}`;
  }
  if (lead.revenue) {
    leadInfo += `\n- Faturamento: ${lead.revenue}`;
  }
  if (lead.notes) {
    leadInfo += `\n- Observações: ${lead.notes}`;
  }

  // Adicionar campos personalizados
  if (lead.customFields && Object.keys(lead.customFields).length > 0) {
    leadInfo += "\n\nCampos Personalizados:";
    for (const [key, value] of Object.entries(lead.customFields)) {
      if (value) {
        leadInfo += `\n- ${key}: ${value}`;
      }
    }
  }

  // Dados do remetente
  const senderInfo = sender
    ? `
DADOS DO REMETENTE:
- Nome: ${sender.name}
${sender.position ? `- Cargo: ${sender.position}` : ""}
- Empresa/Workspace: ${sender.company}
`.trim()
    : "";

  return `
Você é um especialista em prospecção de vendas (SDR) escrevendo mensagens para ${channelName}.

CONTEXTO DA CAMPANHA:
${campaign.context}

INSTRUÇÕES DE ESTILO DO USUÁRIO:
${campaign.aiInstructions || "Seja profissional e direto ao ponto."}

TOM DE VOZ DA CAMPANHA: ${campaign.voiceTone}

NÍVEL DE FORMALIDADE: ${formalityDesc}

${leadInfo}

${senderInfo ? `${senderInfo}\n\n` : ""}INSTRUÇÕES ESPECÍFICAS PARA ${channelName.toUpperCase()}:
${channelInstructions}

IMPORTANTE PARA EMAIL:
- NÃO inclua "Assunto:" no corpo da mensagem
- Coloque o assunto APENAS na primeira linha, no formato: "Assunto: [título do assunto]"
- Use os dados do remetente para preencher [Seu Nome], [Seu Cargo], [Nome da Sua Empresa] com os valores reais
- Se não houver cargo do remetente, use apenas o nome e empresa

TAREFA:
Gere exatamente ${variationsCount} variações de mensagens personalizadas para ${channelName}.

Cada mensagem deve:
1. Ser personalizada usando os dados do lead (nome, cargo, empresa, etc.)
2. Seguir o contexto e objetivo da campanha
3. Respeitar o tom de voz e nível de formalidade especificados
4. Seguir as instruções específicas do canal
5. Ter um call-to-action claro
6. Ser única e diferente das outras variações
${sender ? "7. Substituir [Seu Nome] por " + sender.name + ", [Nome da Sua Empresa] por " + sender.company + (sender.position ? ", [Seu Cargo] por " + sender.position : "") : ""}

FORMATO DE RESPOSTA (JSON estrito):
Responda APENAS com um array JSON válido, sem markdown, sem explicações:
[
  {"id": "1", "type": "${channelName}", "message": "mensagem completa aqui"},
  {"id": "2", "type": "${channelName}", "message": "outra variação aqui"}
]
  `.trim();
}

async function generateMessagesForChannel(
  genAI: InstanceType<typeof GoogleGenerativeAI>,
  campaign: CampaignData,
  lead: LeadData,
  channel: "whatsapp" | "email",
  variationsCount: number,
  sender?: SenderData,
): Promise<AISuggestion[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = buildPrompt(campaign, lead, channel, variationsCount, sender);

  // Retry logic para erros 503 (service overloaded)
  let lastError: Error | null = null;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 segundos

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Limpar resposta - remover markdown code blocks se presentes
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      // Parse JSON
      const suggestions = JSON.parse(cleanedText) as AISuggestion[];

      // Substituir placeholders do remetente nas mensagens
      const replaceSenderPlaceholders = (message: string): string => {
        let result = message;
        if (sender) {
          result = result.replace(/\[Seu Nome\]/g, sender.name);
          result = result.replace(/\[Nome da Sua Empresa\]/g, sender.company);
          if (sender.position) {
            result = result.replace(/\[Seu Cargo\]/g, sender.position);
          } else {
            // Se não tem cargo, remove a linha do cargo
            result = result.replace(/\n\[Seu Cargo\]\n/g, "\n");
            result = result.replace(/\[Seu Cargo\]/g, "");
          }
        }
        return result;
      };

      // Garantir IDs únicos com prefixo do canal e substituir placeholders
      return suggestions.map((s, index) => ({
        ...s,
        id: `${channel}-${index + 1}`,
        type: channel === "whatsapp" ? "WhatsApp" : "Email",
        message: replaceSenderPlaceholders(s.message),
      }));
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar se é erro 503 (overloaded) e ainda temos tentativas
      const errorMessage = lastError.message;
      const isOverloaded = errorMessage.includes("503") || errorMessage.includes("overloaded");
      
      if (isOverloaded && attempt < maxRetries) {
        console.log(`Model overloaded, retrying (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
      
      // Se não é erro 503 ou já esgotamos as tentativas, lançar erro
      throw lastError;
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError || new Error("Failed to generate messages after retries");
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validar método HTTP
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Verificar API key
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    
    // Logs de debug
    console.log("=== GEMINI_API_KEY Debug ===");
    console.log("GEMINI_API_KEY exists:", !!geminiApiKey);
    console.log("GEMINI_API_KEY length:", geminiApiKey?.length || 0);
    console.log("GEMINI_API_KEY first chars:", geminiApiKey?.substring(0, 10) || "N/A");
    
    // Listar todas as env vars que contêm "GEMINI" ou "API"
    const allEnvVars = Deno.env.toObject();
    const relevantKeys = Object.keys(allEnvVars).filter(
      k => k.includes("GEMINI") || k.includes("API_KEY")
    );
    console.log("Relevant env keys found:", relevantKeys);
    console.log("===========================");
    
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI service not configured. Please contact support.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    const body: GenerateRequest = await req.json();
    const { campaign, lead, channels, variationsPerChannel = 2, sender } = body;

    // Validar campos obrigatórios
    if (!campaign || !lead || !channels || channels.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: campaign, lead, channels",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // Gerar mensagens para cada canal em paralelo
    const allSuggestions: AISuggestion[] = [];
    const errors: string[] = [];

    await Promise.all(
      channels.map(async (channel) => {
        try {
          const suggestions = await generateMessagesForChannel(
            genAI,
            campaign,
            lead,
            channel,
            variationsPerChannel,
          );
          allSuggestions.push(...suggestions);
        } catch (error) {
          console.error(`Error generating ${channel} messages:`, error);
          errors.push(`Failed to generate ${channel} messages`);
        }
      }),
    );

    // Se todos os canais falharam, retornar erro
    if (allSuggestions.length === 0 && errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: errors.join(". "),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Ordenar: WhatsApp primeiro, depois Email
    allSuggestions.sort((a, b) => {
      if (a.type === "WhatsApp" && b.type === "Email") return -1;
      if (a.type === "Email" && b.type === "WhatsApp") return 1;
      return 0;
    });

    const response: GenerateResponse = {
      success: true,
      suggestions: allSuggestions,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-ai-messages function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
