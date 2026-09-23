/*
path :           components/project/ProjectCard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte d'un projet dans la liste. Affiche nom, accroche, description
                 tronquée, badge de statut, compteurs (features/personas/stories/sprints)
                 et actions (ouvrir, éditer, supprimer).
flow:            Client Component → reçoit un objet project sérialisé + hrefs →
                 rend une <article> cliquable avec les actions.
ecosystem:       Dev = [
                   "@/components/project/ProjectCard.tsx",
                   "@/app/back-studio/scrum/page.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/scrum/page.tsx",
                  "@/components/project/DeleteProjectButton.tsx",
                  "@/components/project/ProjectStatusBadge.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@/components/project/ProjectStatusBadge",
                  "@/components/project/DeleteProjectButton",
                  "@/components/ui/button"]
exports:         ["ProjectCard", "ProjectCardProps", "ProjectCardData"]

userStories:     ["*en tant que développeur je veux visualiser un projet dans une carte"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";
import { BookOpen, Pencil, Users2 } from "lucide-react";

import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { Button, buttonVariants } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ProjectCardData = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly tagline: string | null;
  readonly description: string;
  readonly status: string;
  readonly counts: {
    readonly features: number;
    readonly personas: number;
    readonly userStories: number;
    readonly sprints: number;
  };
};

export type ProjectCardProps = {
  readonly project: ProjectCardData;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ProjectCard({ project }: ProjectCardProps) {
  const href = `/back-studio/scrum/${project.slug}`;

  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {project.name}
          </Link>
          {project.tagline && (
            <p className="line-clamp-2 text-xs italic text-muted-foreground">
              {project.tagline}
            </p>
          )}
        </div>
        <ProjectStatusBadge status={project.status} />
      </header>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      <dl className="grid grid-cols-4 gap-2 border-t border-border/60 pt-3 text-center">
        <Stat label="Features" value={project.counts.features} />
        <Stat label="Personas" value={project.counts.personas} />
        <Stat label="Stories" value={project.counts.userStories} />
        <Stat label="Sprints" value={project.counts.sprints} />
      </dl>

      <footer className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Link
          href={href}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
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
          <DeleteProjectButton
            id={project.id}
            name={project.name}
            compact
          />
        </div>
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat (interne)                                                     */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-mono text-sm font-bold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}