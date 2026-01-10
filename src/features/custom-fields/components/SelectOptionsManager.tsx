"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface SelectOptionsManagerProps {
  options: string[];
  newOption: string;
  onNewOptionChange: (value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (option: string) => void;
  error?: string;
}

export function SelectOptionsManager({
  options,
  newOption,
  onNewOptionChange,
  onAddOption,
  onRemoveOption,
  error,
}: SelectOptionsManagerProps) {
  return (
    <div className="grid gap-2">
      <Label>Opções *</Label>
      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={(e) => onNewOptionChange(e.target.value)}
          placeholder="Nova opção"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddOption();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAddOption}
          disabled={!newOption.trim()}
        >
          Adicionar
        </Button>
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {options.map((option) => (
            <div
              key={option}
              className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
            >
              <span>{option}</span>
              <button
                type="button"
                onClick={() => onRemoveOption(option)}
                className="text-destructive hover:text-destructive/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
