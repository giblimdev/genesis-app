/*
path :           components/user-story/UserStoryStatusBadge.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Badge coloré du statut d'une user story (backlog, ready, in-progress,
                 review, done). Mappe chaque statut sur un token de thème.
flow:            Rendu pur → status en prop → lookup → span coloré.
ecosystem:       Dev = [
                   "@/components/user-story/UserStoryStatusBadge.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryCard.tsx",
                  "@/components/user-story/UserStoryTree.tsx"]
imports:         ["@/lib/validations/user-story", "@/utils"]
exports:         ["UserStoryStatusBadge", "UserStoryStatusBadgeProps"]

userStories:     ["*en tant que développeur je veux afficher le statut d'une user story"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  STORY_STATUS_LABELS,
  type StoryStatus,
} from "@/lib/validations/user-story";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<StoryStatus, string> = {
  backlog: "border-border bg-muted/40 text-muted-foreground",
  ready: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  "in-progress": "border-chart-3/30 bg-chart-3/10 text-chart-3",
  review: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  done: "border-chart-1/30 bg-chart-1/10 text-chart-1",
};

export type UserStoryStatusBadgeProps = {
  readonly status: string;
  readonly className?: string;
};

export function UserStoryStatusBadge({
  status,
  className,
}: UserStoryStatusBadgeProps) {
  const known = (status in STATUS_STYLE ? status : "backlog") as StoryStatus;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        STATUS_STYLE[known],
        className,
      )}
    >
      {STORY_STATUS_LABELS[known]}
    </span>
  );
}
