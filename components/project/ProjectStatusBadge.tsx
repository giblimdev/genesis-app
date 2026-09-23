/*
path :           components/project/ProjectStatusBadge.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Badge de statut d'un projet. Mappe les 4 statuts (planned, wip, done,
                 deprecated) sur des tokens de thème (chart-2, chart-3, chart-4, muted).
flow:            Rendu pur → status en prop → lookup dans STATUS_STYLE → span coloré.
ecosystem:       Dev = [
                   "@/components/project/ProjectStatusBadge.tsx",
                 ]
relatedFiles:    ["@/components/project/ProjectCard.tsx",
                  "@/app/back-studio/scrum/[slug]/page.tsx"]
imports:         ["@/lib/validations/project", "@/lib/utils"]
exports:         ["ProjectStatusBadge", "ProjectStatusBadgeProps"]

userStories:     ["*en tant que développeur je veux afficher le statut d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/validations/project";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  planned: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  wip: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  done: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  deprecated: "border-border bg-muted/40 text-muted-foreground",
};

export type ProjectStatusBadgeProps = {
  readonly status: string;
  readonly className?: string;
};

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const known = (Object.keys(STATUS_STYLE) as ProjectStatus[]).includes(
    status as ProjectStatus,
  )
    ? (status as ProjectStatus)
    : "planned";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        STATUS_STYLE[known],
        className,
      )}
    >
      {PROJECT_STATUS_LABELS[known]}
    </span>
  );
}