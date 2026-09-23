/*
path :           components/user-story/UserStoryPriorityBadge.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Badge de priorité d'une user story (1-10). Code couleur par tranche :
                 P1-3 (urgent, rose), P4-7 (normal, ambre), P8-10 (optionnel, muted).
flow:            Rendu pur → priority en prop → lookup tranche → span coloré.
ecosystem:       Dev = [
                   "@/components/user-story/UserStoryPriorityBadge.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryCard.tsx"]
imports:         ["@/utils"]
exports:         ["UserStoryPriorityBadge", "UserStoryPriorityBadgeProps"]

userStories:     ["*en tant que développeur je veux afficher la priorité d'une user story"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { cn } from "@/lib/utils";

export type UserStoryPriorityBadgeProps = {
  readonly priority: number;
  readonly className?: string;
};

function styleFor(priority: number): string {
  if (priority <= 3) return "border-chart-5/30 bg-chart-5/10 text-chart-5";
  if (priority <= 7) return "border-chart-3/30 bg-chart-3/10 text-chart-3";
  return "border-border bg-muted/40 text-muted-foreground";
}

export function UserStoryPriorityBadge({
  priority,
  className,
}: UserStoryPriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium",
        styleFor(priority),
        className,
      )}
      aria-label={`Priorité ${priority} sur 10`}
    >
      P{priority}
    </span>
  );
}
