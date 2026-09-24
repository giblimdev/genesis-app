/*
path :           components/common/AccentPicker.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Sélecteur des 10 accents du projet + option « aucun ». Utilisable
                 dans n'importe quel formulaire qui porte un champ accent (Sprint,
                 Feature, Persona, UserStory). Affiche une pastille de couleur +
                 le nom de la famille, et se comporte comme un input contrôlé.
                 Écrit aussi un <input type="hidden"> avec la valeur pour être
                 compatible avec un <form action> (Server Action + FormData).
                 La liste des accents et les classes de couleur sont importées
                 du fichier central @/lib/design/accents.
flow:            Client Component → reçoit value + onChange en props →
                 rend 11 boutons (10 accents + "aucun") → clic appelle
                 onChange(family | ""). Un input hidden name={name}
                 porte la valeur pour le FormData.
ecosystem:       DesignSystem = [
                   "@/lib/design/accents.ts",
                   "@/components/common/AccentPicker.tsx",
                   "@/components/common/EmptyState.tsx",
                   "@/lib/validations/feature.ts",
                   "@/lib/validations/persona.ts",
                   "@/lib/validations/sprint.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/design/accents.ts",
                  "@/components/sprint/SprintForm.tsx",
                  "@/components/feature/FeatureForm.tsx",
                  "@/components/persona/PersonaForm.tsx",
                  "@/components/user-story/UserStoryForm.tsx",
                  "@/lib/utils"]
imports:         ["@/lib/utils",
                  "@/lib/design/accents",
                  "props reçues : { name?, value, onChange, disabled?, className? }"]
exports:         ["AccentPicker", "AccentPickerProps", "PROJECT_ACCENTS"]
useBy:           ["@/components/sprint/SprintForm.tsx",
                  "@/components/feature/FeatureForm.tsx",
                  "@/components/persona/PersonaForm.tsx",
                  "@/components/user-story/UserStoryForm.tsx"]

userStories:     ["*auto-accent-picker"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : composant contrôlé avec gestionnaires d'événements (onClick).

import { cn } from "@/lib/utils";
import {
  ACCENT_DOT_CLASS,
  ACCENT_RING_CLASS,
  PROJECT_ACCENTS,
} from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Réexports — compatibilité avec les imports existants              */
/* ------------------------------------------------------------------ */

export { PROJECT_ACCENTS };

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

        {/* 10 accents */}
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
                active && ACCENT_RING_CLASS[accent],
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 rounded-full",
                  ACCENT_DOT_CLASS[accent],
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