"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getLeadMessagesAction, type LeadMessageSent } from "../actions/messages";

interface MessageHistoryProps {
  leadId: string;
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4 text-green-600" />,
  email: <Mail className="h-4 w-4 text-blue-600" />,
  linkedin: <Linkedin className="h-4 w-4 text-sky-600" />,
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  linkedin: "LinkedIn",
};

const channelColors: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  email: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  linkedin: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
};

export const MessageHistory: React.FC<MessageHistoryProps> = ({ leadId }) => {
  const [messages, setMessages] = useState<LeadMessageSent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      setIsLoading(true);
      try {
        const data = await getLeadMessagesAction(leadId);
        setMessages(data);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, [leadId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma mensagem enviada ainda.</p>
        <p className="text-sm mt-1">
          As mensagens enviadas aparecerão aqui.
        </p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mensagens Enviadas</CardTitle>
        <CardDescription>
          Histórico de mensagens enviadas para este lead
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Header com canal e data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {channelIcons[message.channel] || <MessageCircle className="h-4 w-4" />}
                <Badge
                  variant="secondary"
                  className={channelColors[message.channel] || ""}
                >
                  {channelLabels[message.channel] || message.channel}
                </Badge>
                {message.campaign && (
                  <Badge variant="outline" className="text-xs">
                    {message.campaign.name}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(message.sentAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            {/* Conteúdo da mensagem */}
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {/* Enviado por */}
            {message.user && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={message.user.avatarUrl} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(message.user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  Enviado por {message.user.fullName}
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
