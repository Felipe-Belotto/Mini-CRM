"use client";

import {
  Briefcase,
  Building2,
  CheckCircle2,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import type React from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";
import { useAISuggestions } from "../hooks/use-ai-suggestions";
import { useMessageSender } from "../hooks/use-message-sender";
import { formatMessage } from "../lib/message-utils";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onMoveLead,
}) => {
  const { toast } = useToast();

  const { isGenerating, showSuggestions, suggestions, generateSuggestions } =
    useAISuggestions();

  if (!lead) return null;

  const { sendingMessage, sendMessage } = useMessageSender({
    lead,
    onMoveLead,
  });

  const handleSendMessage = async (messageType: string) => {
    await sendMessage(messageType);
  };

  const copyToClipboard = (template: string) => {
    navigator.clipboard.writeText(formatMessage(template, lead));
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-left">{lead.nome || "Lead sem nome"}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {lead.empresa}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Edição
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome *
                </Label>
                <Input
                  id="nome"
                  value={lead.nome}
                  onChange={(e) => onUpdate(lead.id, { nome: e.target.value })}
                  placeholder="Nome do lead"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={lead.email}
                  onChange={(e) => onUpdate(lead.id, { email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  value={lead.telefone}
                  onChange={(e) =>
                    onUpdate(lead.id, { telefone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cargo" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Cargo *
                </Label>
                <Input
                  id="cargo"
                  value={lead.cargo}
                  onChange={(e) => onUpdate(lead.id, { cargo: e.target.value })}
                  placeholder="Cargo na empresa"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="empresa" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Empresa
                </Label>
                <Input
                  id="empresa"
                  value={lead.empresa}
                  onChange={(e) =>
                    onUpdate(lead.id, { empresa: e.target.value })
                  }
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3 text-muted-foreground">
                  Campos Personalizados
                </p>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="segmento">Segmento</Label>
                    <Input
                      id="segmento"
                      value={lead.segmento || ""}
                      onChange={(e) =>
                        onUpdate(lead.id, { segmento: e.target.value })
                      }
                      placeholder="Ex: Tecnologia, Varejo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="faturamento">Faturamento</Label>
                    <Input
                      id="faturamento"
                      value={lead.faturamento || ""}
                      onChange={(e) =>
                        onUpdate(lead.id, { faturamento: e.target.value })
                      }
                      placeholder="Ex: R$ 1M - R$ 5M"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={lead.notas || ""}
                      onChange={(e) =>
                        onUpdate(lead.id, { notas: e.target.value })
                      }
                      placeholder="Observações sobre o lead..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Button
              onClick={generateSuggestions}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isGenerating}
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
                        onClick={() => handleSendMessage(suggestion.type)}
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
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
