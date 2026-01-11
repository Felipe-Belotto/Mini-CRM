"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Building2,
  Briefcase,
  Check,
  Mail,
  Phone,
  User,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import {
  KANBAN_COLUMNS,
  LEAD_ORIGINS,
  type KanbanStage,
  type Lead,
  type User as UserType,
} from "@/shared/types/crm";
import { useWorkspace } from "@/shared/hooks/use-workspace";
import { createLeadAction } from "../actions/leads";
import { getAvatarColor, getInitials } from "../lib/avatar-utils";
import { uploadLeadAvatarAction } from "../actions/upload-avatar";
import { parseJsonToFormData, type JsonLeadInput, type LeadFormData } from "../lib/json-import-utils";

interface CreateLeadWizardProps {
  initialStage?: KanbanStage;
  users: UserType[];
  onSuccess: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: "Identificação", description: "Foto e nome do lead" },
  { id: 2, title: "Contato", description: "Email e telefone" },
  { id: 3, title: "Empresa", description: "Dados profissionais" },
  { id: 4, title: "Configurações", description: "Origem e responsável" },
];

// Mapeia source/origem do JSON para o id usado no sistema
function mapOriginToId(source: string): string {
  const normalized = source.toLowerCase().trim();
  const originMap: Record<string, string> = {
    linkedin: "linkedin",
    facebook: "facebook",
    instagram: "instagram",
    google: "google",
    whatsapp: "whatsapp",
    tiktok: "tiktok",
    youtube: "youtube",
    twitter: "twitter",
    "twitter/x": "twitter",
    x: "twitter",
    site: "site",
    website: "site",
    indicação: "indicacao",
    indicacao: "indicacao",
    referral: "indicacao",
    evento: "evento",
    event: "evento",
    telefone: "telefone",
    phone: "telefone",
    email: "email",
    "e-mail": "email",
  };
  return originMap[normalized] || "outro";
}

// Mapeia stage do JSON para KanbanStage
function mapStageToId(stage: string): KanbanStage {
  const normalized = stage.toLowerCase().trim().replace(/\s+/g, "_");
  const stageMap: Record<string, KanbanStage> = {
    base: "base",
    lead_mapeado: "lead_mapeado",
    "lead mapeado": "lead_mapeado",
    tentando_contato: "tentando_contato",
    "tentando contato": "tentando_contato",
    conexao_iniciada: "conexao_iniciada",
    "conexão iniciada": "conexao_iniciada",
    "conexao iniciada": "conexao_iniciada",
    qualificado: "qualificado",
    qualified: "qualificado",
    desqualificado: "desqualificado",
    disqualified: "desqualificado",
    reuniao_agendada: "reuniao_agendada",
    "reunião agendada": "reuniao_agendada",
    "reuniao agendada": "reuniao_agendada",
  };
  return stageMap[normalized] || "base";
}

export function CreateLeadWizard({
  initialStage = "base",
  users,
  onSuccess,
  onCancel,
}: CreateLeadWizardProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    position: "",
    company: "",
    origin: "",
    stage: initialStage,
    responsibleIds: [],
    notes: "",
    avatarFile: null,
  });

  // JSON Import
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonImport = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput) as JsonLeadInput;
      const mappedData = parseJsonToFormData(parsed, formData);

      setFormData((prev) => ({
        ...prev,
        ...mappedData,
      }));

      toast({
        title: "JSON importado",
        description: "Campos preenchidos com sucesso. Revise os dados.",
      });

      setJsonDialogOpen(false);
      setJsonInput("");
    } catch (error) {
      setJsonError(
        error instanceof SyntaxError
          ? "JSON inválido. Verifique a formatação."
          : "Erro ao processar o JSON."
      );
    }
  };

  const updateField = <K extends keyof LeadFormData>(
    field: K,
    value: LeadFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Nome é obrigatório";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSkip = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleSubmit = async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const newLead = await createLeadAction({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        position: formData.position.trim(),
        company: formData.company.trim(),
        origin: formData.origin || undefined,
        notes: formData.notes.trim(),
        stage: formData.stage,
        responsibleIds: formData.responsibleIds,
        workspaceId: currentWorkspace.id,
      });

      if (formData.avatarFile && newLead.id) {
        const uploadResult = await uploadLeadAvatarAction(
          newLead.id,
          currentWorkspace.id,
          formData.avatarFile
        );

        if (!uploadResult.success) {
          toast({
            title: "Aviso",
            description:
              uploadResult.error ||
              "Lead criado, mas não foi possível fazer upload do avatar",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Lead criado",
        description: `${formData.name} foi adicionado ao pipeline`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o lead",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                      ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    step.id < currentStep ? "bg-primary/50" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex-1 flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setJsonDialogOpen(true)}
                  className="h-8 w-8"
                >
                  <Braces className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar via JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* JSON Import Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Braces className="w-5 h-5" />
              Importar Lead via JSON
            </DialogTitle>
            <DialogDescription>
              Cole o JSON gerado pela IA para preencher automaticamente os campos do lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError(null);
              }}
              placeholder={`{
  "firstName": "Ricardo",
  "lastName": "Oliveira",
  "email": "email@empresa.com",
  "phone": "(11) 99999-9999",
  "role": "Gerente de Vendas",
  "company": "Empresa LTDA",
  "source": "LinkedIn",
  "notes": "Observações..."
}`}
              rows={10}
              className={cn(
                "font-mono text-sm",
                jsonError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {jsonError && (
              <p className="text-sm text-destructive">{jsonError}</p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Campos suportados:</p>
              <p>
                <code className="bg-muted px-1 rounded">name</code> ou{" "}
                <code className="bg-muted px-1 rounded">firstName</code> +{" "}
                <code className="bg-muted px-1 rounded">lastName</code>,{" "}
                <code className="bg-muted px-1 rounded">email</code>,{" "}
                <code className="bg-muted px-1 rounded">phone</code>,{" "}
                <code className="bg-muted px-1 rounded">position</code> ou{" "}
                <code className="bg-muted px-1 rounded">role</code>,{" "}
                <code className="bg-muted px-1 rounded">company</code>,{" "}
                <code className="bg-muted px-1 rounded">origin</code> ou{" "}
                <code className="bg-muted px-1 rounded">source</code>,{" "}
                <code className="bg-muted px-1 rounded">notes</code>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJsonDialogOpen(false);
                setJsonInput("");
                setJsonError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleJsonImport} disabled={!jsonInput.trim()}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Title */}
      <div className="text-center mb-6">
        <h3 className="font-medium">{STEPS[currentStep - 1].title}</h3>
        <p className="text-sm text-muted-foreground">
          {STEPS[currentStep - 1].description}
        </p>
      </div>

      {/* Step Content */}
      <div className="min-h-[200px]">
        {currentStep === 1 && (
          <StepIdentity
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onUpdate={updateField}
          />
        )}
        {currentStep === 2 && (
          <StepContact
            formData={formData}
            isLoading={isLoading}
            onUpdate={updateField}
          />
        )}
        {currentStep === 3 && (
          <StepCompany
            formData={formData}
            isLoading={isLoading}
            onUpdate={updateField}
          />
        )}
        {currentStep === 4 && (
          <StepSettings
            formData={formData}
            users={users}
            isLoading={isLoading}
            onUpdate={updateField}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <div>
          {currentStep === 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isLoading}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep > 1 && currentStep < 4 && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Pular
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="gap-1"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? "Criando..." : "Criar Lead"}
              {!isLoading && <Check className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Identificação
interface StepIdentityProps {
  formData: LeadFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  onUpdate: <K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) => void;
}

function StepIdentity({ formData, errors, isLoading, onUpdate }: StepIdentityProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <AvatarUpload
          value={formData.avatarFile || "/fallback-avatar.webp"}
          onChange={(file) => onUpdate("avatarFile", file)}
          disabled={isLoading}
          size="xl"
          className="[&_span]:ring-2 [&_span]:ring-border [&_span]:ring-offset-2 [&_span]:ring-offset-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onUpdate("name", e.target.value)}
          disabled={isLoading}
          placeholder="Nome do lead"
          className={cn(errors.name && "border-destructive")}
          autoFocus
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>
    </div>
  );
}

// Step 2: Contato
interface StepContactProps {
  formData: LeadFormData;
  isLoading: boolean;
  onUpdate: <K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) => void;
}

function StepContact({ formData, isLoading, onUpdate }: StepContactProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onUpdate("email", e.target.value)}
          disabled={isLoading}
          placeholder="email@empresa.com"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          Telefone
        </Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => onUpdate("phone", e.target.value)}
          disabled={isLoading}
          placeholder="(00) 00000-0000"
        />
      </div>
    </div>
  );
}

// Step 3: Empresa
interface StepCompanyProps {
  formData: LeadFormData;
  isLoading: boolean;
  onUpdate: <K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) => void;
}

function StepCompany({ formData, isLoading, onUpdate }: StepCompanyProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company" className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Empresa
        </Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => onUpdate("company", e.target.value)}
          disabled={isLoading}
          placeholder="Nome da empresa"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Cargo
        </Label>
        <Input
          id="position"
          value={formData.position}
          onChange={(e) => onUpdate("position", e.target.value)}
          disabled={isLoading}
          placeholder="Cargo na empresa"
        />
      </div>
    </div>
  );
}

// Step 4: Configurações
interface StepSettingsProps {
  formData: LeadFormData;
  users: UserType[];
  isLoading: boolean;
  onUpdate: <K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) => void;
}

function StepSettings({ formData, users, isLoading, onUpdate }: StepSettingsProps) {
  const handleResponsibleToggle = (userId: string) => {
    const currentIds = formData.responsibleIds;
    if (currentIds.includes(userId)) {
      onUpdate("responsibleIds", currentIds.filter(id => id !== userId));
    } else {
      onUpdate("responsibleIds", [...currentIds, userId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origem</Label>
          <Select
            value={formData.origin || "none"}
            onValueChange={(value) => onUpdate("origin", value === "none" ? "" : value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {LEAD_ORIGINS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stage">Etapa Inicial</Label>
          <Select
            value={formData.stage}
            onValueChange={(value: KanbanStage) => onUpdate("stage", value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Responsáveis - Lista com checkbox (múltipla seleção) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Responsáveis
          {formData.responsibleIds.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({formData.responsibleIds.length} selecionado{formData.responsibleIds.length > 1 ? "s" : ""})
            </span>
          )}
        </Label>
        {users.length > 0 ? (
          <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
            {users.map((user) => {
              const isSelected = formData.responsibleIds.includes(user.id);
              return (
                <label
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors",
                    isSelected && "bg-accent/30",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleResponsibleToggle(user.id)}
                    disabled={isLoading}
                  />
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback
                      className={cn(
                        "text-white font-semibold text-xs",
                        getAvatarColor(user.fullName || "")
                      )}
                    >
                      {getInitials(user.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{user.fullName}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-md px-3 py-4 text-center text-sm text-muted-foreground">
            <User className="w-6 h-6 mx-auto mb-1 opacity-50" />
            Nenhum usuário disponível
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onUpdate("notes", e.target.value)}
          disabled={isLoading}
          placeholder="Observações sobre o lead..."
          rows={3}
        />
      </div>
    </div>
  );
}
