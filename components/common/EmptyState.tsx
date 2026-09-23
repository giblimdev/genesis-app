/*
path :           components/common/EmptyState.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            État vide générique, réutilisable pour toute liste sans contenu. Affiche
                 une pastille colorée, un titre, une description et une action optionnelle
                 (CTA).
flow:            Composant pur → reçoit icon / title / description / action / accent.
                 L'accent pilote la couleur de la pastille et du halo. Le slot action est
                 rendu tel quel, sans wrapper restrictif.
ecosystem:       UI = [
                   "@/components/common/EmptyState.tsx",
                 ]
relatedFiles:    []
imports:         ["react"]
exports:         ["EmptyState", "EmptyStateProps", "EmptyStateAccent"]
useBy:           ["@/app/user/project/page.tsx",
                  "@/app/user/project/[slug]/page.tsx"]

userStories:     ["*auto-common-empty-state"]
status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Accents                                                            */
/* ------------------------------------------------------------------ */

export type EmptyStateAccent = "violet" | "cyan" | "amber" | "emerald" | "rose";

/**
 * Mapping accent → tokens @theme existants (chart-1..5).
 * Aucune couleur en dur : tout passe par les tokens du thème.
 */
const ACCENT_CLASSES: Record<
  EmptyStateAccent,
  { ring: string; glow: string; icon: string }
> = {
  violet: {
    ring: "ring-chart-1/20",
    glow: "from-chart-1/10 via-transparent to-transparent",
    icon: "from-chart-1 to-chart-1/80 text-white",
  },
  cyan: {
    ring: "ring-chart-2/20",
    glow: "from-chart-2/10 via-transparent to-transparent",
    icon: "from-chart-2 to-chart-2/80 text-white",
  },
  amber: {
    ring: "ring-chart-3/20",
    glow: "from-chart-3/10 via-transparent to-transparent",
    icon: "from-chart-3 to-chart-3/80 text-white",
  },
  emerald: {
    ring: "ring-chart-4/20",
    glow: "from-chart-4/10 via-transparent to-transparent",
    icon: "from-chart-4 to-chart-4/80 text-white",
  },
  rose: {
    ring: "ring-chart-5/20",
    glow: "from-chart-5/10 via-transparent to-transparent",
    icon: "from-chart-5 to-chart-5/80 text-white",
  },
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

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
  const accentClasses = ACCENT_CLASSES[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card shadow-sm">
      {/* Halo décoratif */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${accentClasses.glow}`}
      />

      <div className="relative flex flex-col items-center gap-5 px-6 py-14 text-center sm:px-10">
        {icon && (
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClasses.icon} shadow-lg ring-8 ${accentClasses.ring}`}
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
