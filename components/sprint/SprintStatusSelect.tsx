/*
path :           components/sprint/SprintStatusSelect.tsx
projectId:       <à fournir>
type :           component
generic:         true

role:            Sélecteur inline du statut d'un sprint. Affiché dans le
                 header de la page détail — reste accessible même quand le
                 sprint est verrouillé (c'est le mécanisme de déblocage).
                 Style « pill » coloré + chevron, interaction via un <select>
                 natif invisible superposé (accessible clavier + mobile).

flow:            Client Component → useState(busy) → onChange →
                 changeSprintStatus({ id, status }) → toast + router.refresh()
                 → la page serveur refetch le sprint et recalcule `locked`.

ecosystem:       Dev = ["@/components/sprint/SprintStatusSelect.tsx"]
relatedFiles:    ["@/app/actions/sprint/changeSprintStatus.ts",
                  "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/lib/validations/sprint",
                  "@/lib/utils",
                  "@/app/actions/sprint/changeSprintStatus",
                  "props reçues : { sprintId: string; currentStatus: string; }"]
exports:         ["SprintStatusSelect", "SprintStatusSelectProps"]
useBy:           ["@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx"]

userStories:     ["*en tant que développeur je veux changer le statut d'un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  SPRINT_STATUSES,
  SPRINT_STATUS_LABELS,
  type SprintStatus,
} from "@/lib/validations/sprint";
import { changeSprintStatus } from "@/app/actions/sprint/changeSprintStatus";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Styles par statut                                                  */
/* ------------------------------------------------------------------ */

const STATUS_STYLE: Record<SprintStatus, { pill: string; dot: string }> = {
  planned: {
    pill: "border-chart-2/30 bg-chart-2/10 text-chart-2",
    dot: "bg-chart-2",
  },
  composed: {
    pill: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    dot: "bg-chart-1",
  },
  active: {
    pill: "border-chart-3/30 bg-chart-3/10 text-chart-3",
    dot: "bg-chart-3",
  },
  completed: {
    pill: "border-chart-4/30 bg-chart-4/10 text-chart-4",
    dot: "bg-chart-4",
  },
  cancelled: {
    pill: "border-border bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type SprintStatusSelectProps = {
  readonly sprintId: string;
  readonly currentStatus: string;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintStatusSelect({
  sprintId,
  currentStatus,
}: SprintStatusSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const known = (
    SPRINT_STATUSES as readonly string[]
  ).includes(currentStatus)
    ? (currentStatus as SprintStatus)
    : "planned";

  const style = STATUS_STYLE[known];
  const disabled = busy || pending;

  function handleChange(next: string) {
    if (next === known) return;

    setBusy(true);
    startTransition(async () => {
      const result = await changeSprintStatus({
        id: sprintId,
        status: next,
      });

      if (!result.success) {
        toast.error(result.error);
        setBusy(false);
        return;
      }

      toast.success(
        `Statut mis à jour : ${SPRINT_STATUS_LABELS[result.data.status]}.`,
      );
      router.refresh();
      setBusy(false);
    });
  }

  return (
    <label
      className={cn(
        "relative inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border pl-2.5 pr-7 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:brightness-95",
        style.pill,
        disabled && "cursor-wait opacity-70",
      )}
      title="Changer le statut du sprint"
    >
      {disabled ? (
        <Loader2 className="size-2.5 animate-spin" aria-hidden />
      ) : (
        <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
      )}

      <span>{SPRINT_STATUS_LABELS[known]}</span>

      <ChevronDown
        className="pointer-events-none absolute right-2 size-3.5 opacity-60"
        aria-hidden
      />

      {/* Select natif invisible superposé — accessible, mobile-friendly. */}
      <select
        value={known}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        aria-label="Changer le statut du sprint"
        className="absolute inset-0 cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-wait"
      >
        {SPRINT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SPRINT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}