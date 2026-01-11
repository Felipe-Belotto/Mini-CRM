"use client";

import {
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import type { Campaign, CustomField, Lead } from "@/shared/types/crm";
import type { AISuggestion } from "../lib/message-utils";
import { buildMailtoLink, buildWhatsAppLink } from "../lib/message-utils";

interface LeadAIMessagesSectionProps {
  lead: Lead;
  campaigns: Campaign[];
  customFields?: CustomField[];
  customFieldValues?: Record<string, string>;
  // AI generation state
  isGenerating: boolean;
  showSuggestions: boolean;
  suggestions: AISuggestion[];
  error?: string | null;
  selectedChannels: ("whatsapp" | "email")[];
  onGenerate: (campaign: Campaign, channels: ("whatsapp" | "email")[]) => void;
  onRegenerate: (
    campaign: Campaign,
    channels: ("whatsapp" | "email")[],
  ) => void;
  // Message sending
  onSendMessage: (type: string, message: string) => Promise<void>;
  sendingMessage: boolean;
}

const channelIcons: Record<string, React.ReactNode> = {
  WhatsApp: <MessageCircle className="w-4 h-4 text-green-600" />,
  Email: <Mail className="w-4 h-4 text-blue-600" />,
};

export function LeadAIMessagesSection({
  lead,
  campaigns,
  isGenerating,
  showSuggestions,
  suggestions,
  error,
  selectedChannels,
  onGenerate,
  onRegenerate,
  onSendMessage,
  sendingMessage,
}: LeadAIMessagesSectionProps) {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [localSelectedChannels, setLocalSelectedChannels] = useState<
    ("whatsapp" | "email")[]
  >(selectedChannels.length > 0 ? selectedChannels : ["whatsapp", "email"]);

  // Filtrar apenas campanhas ativas
  const activeCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === "active"),
    [campaigns],
  );

  const selectedCampaign = useMemo(
    () => activeCampaigns.find((c) => c.id === selectedCampaignId),
    [activeCampaigns, selectedCampaignId],
  );

  // Agrupar sugestões por canal
  const suggestionsByChannel = useMemo(() => {
    const groups: Record<string, AISuggestion[]> = {
      WhatsApp: [],
      Email: [],
    };

    for (const suggestion of suggestions) {
      if (groups[suggestion.type]) {
        groups[suggestion.type].push(suggestion);
      }
    }

    return groups;
  }, [suggestions]);

  const toggleChannel = (channel: "whatsapp" | "email") => {
    setLocalSelectedChannels((prev) => {
      if (prev.includes(channel)) {
        // Não permitir desmarcar se for o único canal selecionado
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== channel);
      }
      return [...prev, channel];
    });
  };

  const handleGenerate = () => {
    if (!selectedCampaign) {
      toast({
        title: "Selecione uma campanha",
        description: "Escolha uma campanha antes de gerar mensagens",
        variant: "destructive",
      });
      return;
    }
    if (localSelectedChannels.length === 0) {
      toast({
        title: "Selecione um canal",
        description: "Escolha pelo menos um canal (WhatsApp ou Email)",
        variant: "destructive",
      });
      return;
    }
    onGenerate(selectedCampaign, localSelectedChannels);
  };

  const handleRegenerate = () => {
    if (!selectedCampaign) return;
    onRegenerate(selectedCampaign, localSelectedChannels);
  };

  const copyToClipboard = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  const handleSendMessage = async (suggestion: AISuggestion) => {
    setSendingMessageId(suggestion.id);
    try {
      await onSendMessage(suggestion.type, suggestion.message);
    } finally {
      setSendingMessageId(null);
    }
  };

  const getFormalityLabel = (level?: number) => {
    if (!level) return null;
    const labels: Record<number, string> = {
      1: "Muito informal",
      2: "Informal",
      3: "Neutro",
      4: "Formal",
      5: "Muito formal",
    };
    return labels[level];
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Seleção de campanha */}
      {activeCampaigns.length > 0 ? (
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label
              htmlFor="campaign-select"
              className="text-xs text-muted-foreground"
            >
              Campanha
            </Label>
            <Select
              value={selectedCampaignId}
              onValueChange={setSelectedCampaignId}
            >
              <SelectTrigger id="campaign-select" className="h-9">
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                {activeCampaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center gap-2">
                      <span>{campaign.name}</span>
                      {campaign.formalityLevel && (
                        <Badge variant="outline" className="text-xs">
                          {getFormalityLabel(campaign.formalityLevel)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCampaign && (
              <p className="text-xs text-muted-foreground">
                Tom: {selectedCampaign.voiceTone}
                {selectedCampaign.formalityLevel &&
                  ` • Formalidade: ${getFormalityLabel(selectedCampaign.formalityLevel)}`}
              </p>
            )}
          </div>

          {/* Seleção de canais */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="channel-whatsapp"
                checked={localSelectedChannels.includes("whatsapp")}
                onCheckedChange={() => toggleChannel("whatsapp")}
              />
              <label
                htmlFor="channel-whatsapp"
                className="text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                WhatsApp
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="channel-email"
                checked={localSelectedChannels.includes("email")}
                onCheckedChange={() => toggleChannel("email")}
              />
              <label
                htmlFor="channel-email"
                className="text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                E-mail
              </label>
            </div>
          </div>

          {/* Botão de gerar */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              size="sm"
              className="flex-1"
              disabled={
                isGenerating ||
                !selectedCampaignId ||
                localSelectedChannels.length === 0
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Gerar Mensagens
                </>
              )}
            </Button>
            {showSuggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating || !selectedCampaignId}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">Nenhuma campanha ativa disponível.</p>
          <p className="text-xs mt-1">
            Crie uma campanha nas configurações para gerar mensagens.
          </p>
        </div>
      )}

      {/* Estado de carregamento */}
      {isGenerating && (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* Erro */}
      {error && !isGenerating && (
        <div className="text-center py-3 text-destructive">
          <p className="text-sm">{error}</p>
          <Button
            variant="link"
            size="sm"
            onClick={handleGenerate}
            className="mt-1"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Sugestões agrupadas por canal */}
      {showSuggestions && !isGenerating && (
        <div className="space-y-4 pt-2">
          {/* WhatsApp */}
          {suggestionsByChannel.WhatsApp.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {channelIcons.WhatsApp}
                <span className="text-sm font-medium">WhatsApp</span>
                <Badge variant="outline" className="text-xs border-muted">
                  {suggestionsByChannel.WhatsApp.length} variações
                </Badge>
              </div>
              <div className="space-y-2">
                {suggestionsByChannel.WhatsApp.map((suggestion, index) => (
                  <MessageCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    lead={lead}
                    campaignName={selectedCampaign?.name}
                    onCopy={() => copyToClipboard(suggestion.message)}
                    onSend={() => handleSendMessage(suggestion)}
                    isSending={sendingMessageId === suggestion.id}
                    disabled={sendingMessage}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Separador */}
          {suggestionsByChannel.WhatsApp.length > 0 &&
            suggestionsByChannel.Email.length > 0 && <Separator />}

          {/* Email */}
          {suggestionsByChannel.Email.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {channelIcons.Email}
                <span className="text-sm font-medium">E-mail</span>
                <Badge variant="outline" className="text-xs border-muted">
                  {suggestionsByChannel.Email.length} variações
                </Badge>
              </div>
              <div className="space-y-2">
                {suggestionsByChannel.Email.map((suggestion, index) => (
                  <MessageCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    lead={lead}
                    campaignName={selectedCampaign?.name}
                    onCopy={() => copyToClipboard(suggestion.message)}
                    onSend={() => handleSendMessage(suggestion)}
                    isSending={sendingMessageId === suggestion.id}
                    disabled={sendingMessage}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


interface MessageCardProps {
  suggestion: AISuggestion;
  index: number;
  lead: Lead;
  campaignName?: string;
  onCopy: () => void;
  onSend: () => void;
  isSending: boolean;
  disabled: boolean;
}

function MessageCard({
  suggestion,
  index,
  lead,
  campaignName,
  onCopy,
  onSend,
  isSending,
  disabled,
}: MessageCardProps) {
  // Construir links diretos
  const directLink = useMemo(() => {
    if (suggestion.type === "WhatsApp") {
      return buildWhatsAppLink(lead.phone, suggestion.message);
    } else if (suggestion.type === "Email") {
      return buildMailtoLink(lead.email, suggestion.message, campaignName);
    }
    return null;
  }, [
    suggestion.type,
    suggestion.message,
    lead.phone,
    lead.email,
    campaignName,
  ]);

  const hasContactInfo =
    suggestion.type === "WhatsApp" ? !!lead.phone : !!lead.email;
  const contactMissing = !hasContactInfo;

  // Ao clicar no link, salva automaticamente no histórico
  const handleOpenLink = () => {
    if (!disabled && !isSending) {
      onSend();
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Variação {index + 1}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          className="h-6 w-6"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        {suggestion.message}
      </p>

      {/* Link direto (wa.me ou mailto) - salva automaticamente ao clicar */}
      {directLink ? (
        <Button
          asChild
          size="sm"
          className="w-full h-8"
          disabled={disabled || isSending}
        >
          <a
            href={directLink}
            target={suggestion.type === "Email" ? "_self" : "_blank"}
            rel="noopener noreferrer"
            onClick={handleOpenLink}
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
            )}
            {isSending ? "Salvando..." : `Abrir ${suggestion.type}`}
          </a>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="w-full h-8" disabled>
          <span className="text-xs">
            {contactMissing
              ? suggestion.type === "WhatsApp"
                ? "Telefone não informado"
                : "E-mail não informado"
              : "Link indisponível"}
          </span>
        </Button>
      )}
    </div>
  );
}
