/*
path :           components/common/AccentPicker.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Sélecteur des 5 accents du projet + option « aucun ». Utilisable dans
                 n'importe quel formulaire qui porte un champ accent (Sprint, Feature,
                 Persona…). Affiche une pastille de couleur + le nom de la famille, et
                 se comporte comme un input contrôlé. Écrit aussi un <input type="hidden">
                 avec la valeur pour être compatible avec un <form action>
                 (Server Action + FormData).
flow:            Client Component → reçoit value + onChange en props →
                 rend 6 boutons (5 accents + "aucun") → clic appelle
                 onChange(family | ""). Un input hidden name={name}
                 porte la valeur pour le FormData.
ecosystem:       UI = [
                   "@/components/common/AccentPicker.tsx",
                 ]
relatedFiles:    ["@/components/sprint/SprintForm.tsx",
                  "@/components/feature/FeatureForm.tsx",
                  "@/components/persona/PersonaForm.tsx"]
imports:         ["@/lib/utils"]
exports:         ["AccentPicker", "AccentPickerProps", "PROJECT_ACCENTS"]
useBy:           ["@/components/sprint/SprintForm.tsx",
                  "@/components/feature/FeatureForm.tsx",
                  "@/components/persona/PersonaForm.tsx"]

userStories:     ["*auto-accent-picker"]
status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : composant contrôlé avec gestionnaires d'événements (onClick).

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

export const PROJECT_ACCENTS = [
  "violet",
  "cyan",
  "amber",
  "emerald",
  "rose",
] as const;

type Accent = (typeof PROJECT_ACCENTS)[number];

/**
 * Mapping accent → token de thème existant.
 * On utilise chart-1..5 (déjà définis dans @theme) pour ne pas
 * ajouter de nouvelles couleurs au CSS.
 */
const DOT_CLASS: Record<Accent, string> = {
  violet: "bg-chart-1",
  cyan: "bg-chart-2",
  amber: "bg-chart-3",
  emerald: "bg-chart-4",
  rose: "bg-chart-5",
};

const RING_CLASS: Record<Accent, string> = {
  violet: "ring-chart-1/40",
  cyan: "ring-chart-2/40",
  amber: "ring-chart-3/40",
  emerald: "ring-chart-4/40",
  rose: "ring-chart-5/40",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AccentPickerProps = {
  /** Nom du champ (name= pour le FormData). Défaut : "accent". */
  readonly name?: string;
  /** Valeur courante (nom de famille ou "" pour aucun). */
  readonly value: string;
  /** Callback de changement. */
  readonly onChange: (value: string) => void;
  /** Désactive le composant. */
  readonly disabled?: boolean;
  /** Classes additionnelles. */
  readonly className?: string;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function AccentPicker({
  name = "accent",
  value,
  onChange,
  disabled = false,
  className,
}: AccentPickerProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Input caché pour le FormData */}
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap gap-1.5">
        {/* Option "aucun" */}
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={disabled}
          aria-pressed={value === ""}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === ""
              ? "border-foreground/30 bg-muted text-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted/40",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className="inline-block h-3 w-3 rounded-full border border-border" />
          Aucun
        </button>

        {/* 5 accents */}
        {PROJECT_ACCENTS.map((accent) => {
          const active = value === accent;
          return (
            <button
              key={accent}
              type="button"
              onClick={() => onChange(accent)}
              disabled={disabled}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-foreground/30 bg-muted text-foreground ring-2 ring-offset-1"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                active && RING_CLASS[accent],
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 rounded-full",
                  DOT_CLASS[accent],
                )}
                aria-hidden
              />
              {accent}
            </button>
          );
        })}
      </div>

      {/* Aperçu live */}
      {value && (
        <p className="text-[10px] italic text-muted-foreground">
          Accent sélectionné :{" "}
          <span className="font-mono not-italic">{value}</span>
        </p>
      )}
    </div>
  );
}
