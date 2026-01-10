"use client";

import {
  CheckCircle2,
  Copy,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import type { Campaign, Lead } from "@/shared/types/crm";
import { formatMessage } from "../lib/message-utils";
import type { AISuggestion } from "../lib/message-utils";

interface LeadAISectionProps {
  lead: Lead;
  activeCampaigns: Campaign[];
  selectedCampaignId: string;
  onCampaignChange: (campaignId: string) => void;
  isGenerating: boolean;
  showSuggestions: boolean;
  suggestions: AISuggestion[];
  onGenerate: () => void;
  onSendMessage: (messageType: string) => Promise<void>;
  sendingMessage: boolean;
}

export function LeadAISection({
  lead,
  activeCampaigns,
  selectedCampaignId,
  onCampaignChange,
  isGenerating,
  showSuggestions,
  suggestions,
  onGenerate,
  onSendMessage,
  sendingMessage,
}: LeadAISectionProps) {
  const { toast } = useToast();

  const copyToClipboard = (template: string) => {
    navigator.clipboard.writeText(formatMessage(template, lead));
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  return (
    <div className="space-y-4">
      {activeCampaigns.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="campanha">Campanha</Label>
          <Select value={selectedCampaignId} onValueChange={onCampaignChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma campanha" />
            </SelectTrigger>
            <SelectContent>
              {activeCampaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        onClick={onGenerate}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        disabled={isGenerating || (activeCampaigns.length > 0 && !selectedCampaignId)}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isGenerating ? "Gerando..." : "Gerar Sugestões de Mensagem"}
      </Button>

      {isGenerating && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-dashed">
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showSuggestions && (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="ai-suggestion-card">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {suggestion.type === "WhatsApp" && (
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                    )}
                    {suggestion.type === "Email" && (
                      <Mail className="w-4 h-4 text-blue-500" />
                    )}
                    {suggestion.type === "LinkedIn" && (
                      <User className="w-4 h-4 text-sky-600" />
                    )}
                    <span className="text-sm font-medium">
                      {suggestion.type}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion.message)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {formatMessage(suggestion.message, lead)}
                </p>
                <Button
                  className={cn(
                    "w-full mt-3 transition-all",
                    sendingMessage && "animate-success",
                  )}
                  variant="outline"
                  onClick={() => onSendMessage(suggestion.type)}
                  disabled={sendingMessage}
                >
                  {sendingMessage ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar via {suggestion.type}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isGenerating && !showSuggestions && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Clique no botão acima para gerar sugestões de mensagens
            personalizadas com IA
          </p>
        </div>
      )}
    </div>
  );
}
