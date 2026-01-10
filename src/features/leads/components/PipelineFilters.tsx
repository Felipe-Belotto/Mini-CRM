"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArrowUpCircle,
  CalendarIcon,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { Campaign, CustomField, User } from "@/shared/types/crm";
import { LEAD_ORIGINS } from "@/shared/types/crm";
import type { LeadFilters } from "../hooks/use-lead-filters";

interface PipelineFiltersProps {
  filters: LeadFilters;
  activeFiltersCount: number;
  campaigns: Campaign[];
  users: User[];
  customFields: CustomField[];
  eligibleForPromotionCount: number;
  isPromoting: boolean;
  onUpdateFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void;
  onUpdateCustomFieldFilter: (fieldId: string, value: unknown) => void;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onPromoteEligibleLeads: () => void;
}

export const PipelineFilters: React.FC<PipelineFiltersProps> = ({
  filters,
  activeFiltersCount,
  campaigns,
  users,
  customFields,
  eligibleForPromotionCount,
  isPromoting,
  onUpdateFilter,
  onUpdateCustomFieldFilter,
  onClearFilters,
  onClearSearch,
  onPromoteEligibleLeads,
}) => {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b bg-background">
      {/* Busca textual */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, telefone ou empresa..."
          value={filters.search}
          onChange={(e) => onUpdateFilter("search", e.target.value)}
          className="pl-9 pr-9"
        />
        {filters.search && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Botão para promover leads elegíveis */}
      {eligibleForPromotionCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                onClick={onPromoteEligibleLeads}
                disabled={isPromoting}
              >
                {isPromoting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" />
                )}
                Promover elegíveis
                <Badge 
                  variant="secondary" 
                  className="ml-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-semibold bg-white/20 text-white border-0"
                >
                  {eligibleForPromotionCount}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-sm">
                Promove {eligibleForPromotionCount} lead{eligibleForPromotionCount > 1 ? "s" : ""} da <strong>Base</strong> para <strong>Lead Mapeado</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Critérios: Nome + (Empresa ou Cargo) + (Email ou Telefone)
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Botão de filtros com popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar todos
                </Button>
              )}
            </div>

            {/* Filtro por Campanha */}
            <div className="space-y-2">
              <Label className="text-sm">Campanha</Label>
              <Select
                value={filters.campaignId || "all"}
                onValueChange={(value) =>
                  onUpdateFilter("campaignId", value === "all" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as campanhas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Responsável */}
            <div className="space-y-2">
              <Label className="text-sm">Responsável</Label>
              <Select
                value={filters.responsibleId || "all"}
                onValueChange={(value) =>
                  onUpdateFilter("responsibleId", value === "all" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os responsáveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Origem */}
            <div className="space-y-2">
              <Label className="text-sm">Origem</Label>
              <Select
                value={filters.origin || "all"}
                onValueChange={(value) =>
                  onUpdateFilter("origin", value === "all" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {LEAD_ORIGINS.map((origin) => (
                    <SelectItem key={origin.id} value={origin.id}>
                      {origin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Data de Criação */}
            <div className="space-y-2">
              <Label className="text-sm">Data de criação</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from
                        ? format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR })
                        : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from || undefined}
                      onSelect={(date) =>
                        onUpdateFilter("dateRange", {
                          ...filters.dateRange,
                          from: date || null,
                        })
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to
                        ? format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })
                        : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to || undefined}
                      onSelect={(date) =>
                        onUpdateFilter("dateRange", {
                          ...filters.dateRange,
                          to: date || null,
                        })
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Ver Arquivados */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showArchived"
                  checked={filters.showArchived}
                  onCheckedChange={(checked) =>
                    onUpdateFilter("showArchived", checked === true)
                  }
                />
                <label
                  htmlFor="showArchived"
                  className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  Ver leads arquivados
                </label>
              </div>
            </div>

            {/* Campos Personalizados */}
            {customFields.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Campos Personalizados</Label>
                </div>
                {customFields.map((field) => (
                  <CustomFieldFilter
                    key={field.id}
                    field={field}
                    value={filters.customFields[field.id]}
                    onChange={(value) => onUpdateCustomFieldFilter(field.id, value)}
                  />
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Botão limpar filtros (visível quando há filtros ativos) */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
};

// Componente para renderizar filtro de campo personalizado baseado no tipo
interface CustomFieldFilterProps {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
}

const CustomFieldFilter: React.FC<CustomFieldFilterProps> = ({
  field,
  value,
  onChange,
}) => {
  switch (field.type) {
    case "select":
      return (
        <div className="space-y-2">
          <Label className="text-sm">{field.name}</Label>
          <Select
            value={(value as string) || "all"}
            onValueChange={(v) => onChange(v === "all" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Todos(as)`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos(as)</SelectItem>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "text":
    case "email":
    case "phone":
    case "textarea":
      return (
        <div className="space-y-2">
          <Label className="text-sm">{field.name}</Label>
          <Input
            placeholder={`Filtrar por ${field.name.toLowerCase()}`}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label className="text-sm">{field.name}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={(value as { min?: number })?.min || ""}
              onChange={(e) =>
                onChange({
                  ...(value as object || {}),
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={(value as { max?: number })?.max || ""}
              onChange={(e) =>
                onChange({
                  ...(value as object || {}),
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="flex-1"
            />
          </div>
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <Label className="text-sm">{field.name}</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !(value as { from?: Date })?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {(value as { from?: Date })?.from
                    ? format((value as { from: Date }).from, "dd/MM/yy", { locale: ptBR })
                    : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={(value as { from?: Date })?.from}
                  onSelect={(date) =>
                    onChange({
                      ...(value as object || {}),
                      from: date || null,
                    })
                  }
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !(value as { to?: Date })?.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {(value as { to?: Date })?.to
                    ? format((value as { to: Date }).to, "dd/MM/yy", { locale: ptBR })
                    : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={(value as { to?: Date })?.to}
                  onSelect={(date) =>
                    onChange({
                      ...(value as object || {}),
                      to: date || null,
                    })
                  }
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );

    default:
      return null;
  }
};
