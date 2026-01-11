"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, Mail, MessageCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { getUserInitials } from "@/shared/lib/user-utils";
import type { LeadMessageSent } from "../actions/messages";
import { getMessagePreview } from "../lib/message-utils";

interface MessageHistoryProps {
  messages: LeadMessageSent[];
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-3.5 w-3.5 text-green-600" />,
  email: <Mail className="h-3.5 w-3.5 text-blue-600" />,
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
};

export const MessageHistory: React.FC<MessageHistoryProps> = ({ messages }) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = (messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhuma mensagem enviada ainda.</p>
        <p className="text-xs mt-1">As mensagens enviadas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 pt-2">
      {/* Lista de mensagens */}
      <div className="divide-y">
        {messages.map((message) => {
          const isExpanded = expandedMessages.has(message.id);
          const preview = getMessagePreview(message.content);
          const showFullContent = isExpanded || message.content.length <= 60;

          return (
            <div key={message.id} className="py-3 space-y-2">
              {/* Header com canal e data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channelIcons[message.channel] || (
                    <MessageCircle className="h-3.5 w-3.5" />
                  )}
                  <Badge variant="outline" className="text-xs border-muted">
                    {channelLabels[message.channel] || message.channel}
                  </Badge>
                  {message.campaign && (
                    <span className="text-xs text-muted-foreground">
                      • {message.campaign.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(message.sentAt, "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Preview/Conteúdo da mensagem com collapse */}
              <div className="space-y-1">
                <div className="w-full flex items-start gap-2 group">
                  <button
                    type="button"
                    onClick={() => toggleExpand(message.id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                      {showFullContent ? message.content : preview}
                    </p>
                  </button>
                  {message.content.length > 60 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleExpand(message.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Enviado por */}
              {message.user && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={message.user.avatarUrl} />
                    <AvatarFallback className="text-[6px]">
                      {getUserInitials(message.user.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {message.user.fullName || "Usuário"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
