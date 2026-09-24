/*
path :           components/sprint/SprintStatusBadge.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Badge de statut d'un sprint + variante compacte « verrouillé ».
                 Mappe les 5 statuts sur les tokens chart-1..5 et muted.

flow:            Rendu pur → status en prop → lookup → span coloré.

ecosystem:       Dev = ["@/components/sprint/SprintStatusBadge.tsx"]
imports:         ["@/lib/validations/sprint", "@/lib/utils"]
exports:         ["SprintStatusBadge", "SprintLockBadge"]

userStories:     ["*en tant que développeur je veux afficher le statut d'un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  SPRINT_STATUS_LABELS,
  type SprintStatus,
} from "@/lib/validations/sprint";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const STATUS_STYLE: Record<SprintStatus, string> = {
  planned: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  composed: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  active: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  completed: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  cancelled: "border-border bg-muted/40 text-muted-foreground",
};

export function SprintStatusBadge({
  status,
  className,
}: {
  readonly status: string;
  readonly className?: string;
}) {
  const known = (status in STATUS_STYLE ? status : "planned") as SprintStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        STATUS_STYLE[known],
        className,
      )}
    >
      {SPRINT_STATUS_LABELS[known]}
    </span>
  );
}

export function SprintLockBadge({ className }: { readonly className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      <Lock className="h-2.5 w-2.5" aria-hidden />
      Verrouillé
    </span>
  );
}