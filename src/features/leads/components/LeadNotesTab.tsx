"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import type { Lead, User } from "@/shared/types/crm";
import { getAvatarColor, getInitials } from "../lib/avatar-utils";

interface NoteEntry {
  id: string;
  content: string;
  createdAt: string;
  userId?: string;
}

interface LeadNotesTabProps {
  lead: Lead;
  users: User[];
  currentUserId?: string;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
}

function parseNotes(notesString?: string): NoteEntry[] {
  if (!notesString) return [];

  try {
    const parsed = JSON.parse(notesString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    if (notesString.trim()) {
      return [
        {
          id: "legacy-note",
          content: notesString,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  return [];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadNotesTab({
  lead,
  users,
  currentUserId,
  onUpdate,
}: LeadNotesTabProps) {
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const initialNotes = parseNotes(lead.notes);

  const [optimisticNotes, addOptimisticNote] = useOptimistic<
    NoteEntry[],
    NoteEntry
  >(initialNotes, (state, newNoteEntry) => [newNoteEntry, ...state]);

  const getUserById = (userId?: string): User | undefined => {
    if (!userId) return undefined;
    return users.find((u) => u.id === userId);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const newNoteEntry: NoteEntry = {
      id: crypto.randomUUID(),
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      userId: currentUserId,
    };

    setNewNote("");

    startTransition(async () => {
      addOptimisticNote(newNoteEntry);

      try {
        const updatedNotes = [newNoteEntry, ...initialNotes];
        await onUpdate(lead.id, { notes: JSON.stringify(updatedNotes) });
      } catch (error) {
        toast({
          title: "Erro ao salvar",
          description:
            error instanceof Error
              ? error.message
              : "Não foi possível salvar a nota",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddNote();
            }
          }}
          placeholder="Adicione uma nova nota... (Enter para salvar)"
          className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={isPending}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleAddNote}
          disabled={isPending || !newNote.trim()}
          className="h-10 w-10 flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {optimisticNotes.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Histórico ({optimisticNotes.length}{" "}
            {optimisticNotes.length === 1 ? "nota" : "notas"})
          </h4>
          <div className="space-y-3">
            {optimisticNotes.map((note) => {
              const author = getUserById(note.userId);

              return (
                <div
                  key={note.id}
                  className="bg-muted/50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(note.createdAt)}</span>
                      </div>
                    </div>

                    {author && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 cursor-pointer">
                            <AvatarImage
                              src={author.avatarUrl}
                              alt={author.fullName}
                            />
                            <AvatarFallback
                              className={cn(
                                "text-white font-semibold text-[10px]",
                                getAvatarColor(author.fullName || ""),
                              )}
                            >
                              {getInitials(author.fullName || "")}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="flex items-center gap-3 p-3"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={author.avatarUrl}
                              alt={author.fullName}
                            />
                            <AvatarFallback
                              className={cn(
                                "text-white font-semibold text-sm",
                                getAvatarColor(author.fullName || ""),
                              )}
                            >
                              {getInitials(author.fullName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {author.fullName}
                            </p>
                            {author.role && (
                              <p className="text-xs text-muted-foreground">
                                {author.role === "owner"
                                  ? "Proprietário"
                                  : author.role === "admin"
                                    ? "Administrador"
                                    : "Membro"}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhuma nota registrada</p>
          <p className="text-xs mt-1">
            Adicione a primeira nota sobre este lead
          </p>
        </div>
      )}
    </div>
  );
}
