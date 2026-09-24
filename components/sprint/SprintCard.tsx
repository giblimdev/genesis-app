/*
path :           components/sprint/SprintCard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte d'un sprint dans la liste. Affiche nom, objectif tronqué,
                 statut, dates, capacité, nombre d'US assignées, actions
                 (ouvrir, éditer, supprimer). Les classes de couleur d'accent
                 sont importées du fichier central @/lib/design/accents.
flow:            Client Component → rend un article avec header + stats +
                 footer d'actions.
ecosystem:       Dev = ["@/components/sprint/SprintCard.tsx"]
relatedFiles:    ["@/lib/design/accents.ts",
                  "@/components/sprint/SprintStatusBadge.tsx",
                  "@/components/sprint/DeleteSprintButton.tsx",
                  "@/components/ui/button"]
imports:         ["react", "next/link", "lucide-react",
                  "@/components/sprint/SprintStatusBadge",
                  "@/components/sprint/DeleteSprintButton",
                  "@/components/ui/button",
                  "@/lib/design/accents",
                  "@/lib/utils"]
exports:         ["SprintCard", "SprintCardProps", "SprintCardData"]

userStories:     ["*en tant que développeur je veux visualiser un sprint dans une carte"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";
import { CalendarDays, Pencil, Target, Users } from "lucide-react";

import { SprintStatusBadge } from "./SprintStatusBadge";
import { DeleteSprintButton } from "./DeleteSprintButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCENT_BAR_BEFORE_CLASS,
  type ProjectAccent,
} from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SprintCardData = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly goal: string;
  readonly status: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly durationWeeks: number;
  readonly capacityPoints: number;
  readonly accent: string | null;
  readonly storyCount: number;
};

export type SprintCardProps = {
  readonly sprint: SprintCardData;
  readonly projectSlug: string;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintCard({ sprint, projectSlug }: SprintCardProps) {
  const href = `/back-studio/scrum/${projectSlug}/sprints/${sprint.slug}`;
  const accentClass = sprint.accent
    ? ACCENT_BAR_BEFORE_CLASS[sprint.accent as ProjectAccent]
    : undefined;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 pl-6 transition-colors hover:border-primary/40",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-transparent",
        accentClass,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary"
          >
            {sprint.name}
          </Link>
          <p className="font-mono text-[10px] text-muted-foreground">
            /{sprint.slug}
          </p>
        </div>
        <SprintStatusBadge status={sprint.status} />
      </header>

      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {sprint.goal}
      </p>

      <dl className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
        <Stat
          icon={<CalendarDays className="size-3" aria-hidden />}
          label="Période"
          value={`${sprint.startDate} → ${sprint.endDate}`}
        />
        <Stat
          icon={<Target className="size-3" aria-hidden />}
          label="Capacité"
          value={`${sprint.capacityPoints} pts`}
        />
        <Stat
          icon={<Users className="size-3" aria-hidden />}
          label="Stories"
          value={String(sprint.storyCount)}
        />
      </dl>

      <footer className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Link
          href={href}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Ouvrir
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`${href}/edit`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label="Éditer"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
          <DeleteSprintButton
            id={sprint.id}
            name={sprint.name}
            projectSlug={projectSlug}
            compact
          />
        </div>
      </footer>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <dt className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-mono text-xs font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}