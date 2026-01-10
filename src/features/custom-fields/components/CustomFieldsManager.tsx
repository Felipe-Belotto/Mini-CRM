"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { deleteCustomFieldAction } from "../actions/custom-fields";
import { CustomFieldForm } from "./CustomFieldForm";
import { CustomFieldCard } from "./CustomFieldCard";
import type { CustomField } from "@/shared/types/crm";

interface CustomFieldsManagerProps {
  initialFields: CustomField[];
  workspaceId: string;
}

export function CustomFieldsManager({
  initialFields,
  workspaceId,
}: CustomFieldsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState<CustomField[]>(initialFields);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [deletingField, setDeletingField] = useState<CustomField | null>(null);

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
  };

  const handleDelete = async () => {
    if (!deletingField) return;

    startTransition(async () => {
      const result = await deleteCustomFieldAction(deletingField.id);

      if (result.success) {
        setFields((prev) => prev.filter((f) => f.id !== deletingField.id));
        setDeletingField(null);
        toast({
          title: "Campo deletado!",
          description: "Campo foi deletado com sucesso.",
        });
        router.refresh();
      } else {
        toast({
          title: "Erro ao deletar campo",
          description: result.error || "Não foi possível deletar o campo",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Campo Personalizado</DialogTitle>
              <DialogDescription>
                Crie um novo campo que estará disponível para todos os leads do
                workspace
              </DialogDescription>
            </DialogHeader>
            <CustomFieldForm
              workspaceId={workspaceId}
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                handleSuccess();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Nenhum campo personalizado criado ainda.</p>
            <p className="text-sm mt-2">
              Crie seu primeiro campo para começar a personalizar seus leads.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <CustomFieldCard
              key={field.id}
              field={field}
              onEdit={handleEdit}
              onDelete={(f) => setDeletingField(f)}
            />
          ))}
        </div>
      )}

      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Campo</DialogTitle>
              <DialogDescription>
                Atualize as informações do campo personalizado
              </DialogDescription>
            </DialogHeader>
            <CustomFieldForm
              field={editingField}
              workspaceId={workspaceId}
              onSuccess={() => {
                setEditingField(null);
                handleSuccess();
              }}
              onCancel={() => setEditingField(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={!!deletingField}
        onOpenChange={(open) => !open && setDeletingField(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Campo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o campo "{deletingField?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
