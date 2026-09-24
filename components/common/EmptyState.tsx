/*
path :           components/common/EmptyState.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            État vide générique, réutilisable pour toute liste sans contenu. Affiche
                 une pastille colorée, un titre, une description et une action optionnelle
                 (CTA). Le composant accepte les 10 accents du projet ; les classes de
                 couleur sont importées du fichier central @/lib/design/accents.
flow:            Composant pur → reçoit icon / title / description / action / accent.
                 L'accent pilote la couleur de la pastille et du halo.
ecosystem:       DesignSystem = [
                   "@/lib/design/accents.ts",
                   "@/components/common/AccentPicker.tsx",
                   "@/components/common/EmptyState.tsx",
                   "@/lib/validations/feature.ts",
                   "@/lib/validations/persona.ts",
                   "@/lib/validations/sprint.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/design/accents.ts"]
imports:         ["react", "@/lib/design/accents"]
exports:         ["EmptyState", "EmptyStateProps", "EmptyStateAccent"]
useBy:           ["@/app/back-studio/scrum/page.tsx",
                  "@/app/back-studio/scrum/trash/page.tsx",
                  "@/app/back-studio/scrum/[slug]/features/page.tsx",
                  "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                  "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                  "@/app/back-studio/scrum/[slug]/sprints/page.tsx"]

userStories:     ["*auto-common-empty-state"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { ReactNode } from "react";

import {
  ACCENT_GLOW_CLASS,
  ACCENT_ICON_BG_STRONG_CLASS,
  ACCENT_RING_SOFT_CLASS,
  type ProjectAccent,
} from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Accent accepté par EmptyState — miroir des 10 accents projet. */
export type EmptyStateAccent = ProjectAccent;

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  accent?: EmptyStateAccent;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  accent = "violet",
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card shadow-sm">
      {/* Halo décoratif */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${ACCENT_GLOW_CLASS[accent]}`}
      />

      <div className="relative flex flex-col items-center gap-5 px-6 py-14 text-center sm:px-10">
        {icon && (
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ACCENT_ICON_BG_STRONG_CLASS[accent]} shadow-lg ring-8 ${ACCENT_RING_SOFT_CLASS[accent]}`}
          >
            {icon}
          </div>
        )}

        <div className="flex w-full max-w-md flex-col items-center gap-2">
          <h3 className="text-balance text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h3>
          <p className="max-w-prose text-balance text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}