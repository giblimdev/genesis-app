/*
path :           components/task/TaskStatusBadge.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Badge de statut d'une tâche. Mappe les 5 statuts sur les
                 tokens chart-* + muted.

flow:            Rendu pur → status en prop → lookup → span coloré.

ecosystem:       Dev = ["@/components/task/TaskStatusBadge.tsx"]
imports:         ["@/lib/validations/task", "@/lib/utils"]
exports:         ["TaskStatusBadge"]

userStories:     ["*en tant que développeur je veux afficher le statut d'une tâche"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/validations/task";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "border-border bg-muted/40 text-muted-foreground",
  "in-progress": "border-chart-3/30 bg-chart-3/10 text-chart-3",
  review: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  done: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  blocked: "border-chart-5/30 bg-chart-5/10 text-chart-5",
};

export function TaskStatusBadge({
  status,
  className,
}: {
  readonly status: string;
  readonly className?: string;
}) {
  const known = (status in STATUS_STYLE ? status : "todo") as TaskStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        STATUS_STYLE[known],
        className,
      )}
    >
      {TASK_STATUS_LABELS[known]}
    </span>
  );
}