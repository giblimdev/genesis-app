/*
path :           components/task/TaskRow.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Ligne sortable d'une tâche. Affiche drag handle, statut, titre,
                 estimation, assignee + actions (éditer, supprimer).

flow:            Client Component → useSortable (dnd-kit) → rend une <li> avec
                 le handle de drag à gauche, puis les métadonnées.

ecosystem:       Dev = ["@/components/task/TaskRow.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@dnd-kit/sortable", "@dnd-kit/utilities",
                  "@/components/task/TaskStatusBadge",
                  "@/components/task/DeleteTaskButton",
                  "@/components/ui/button"]
exports:         ["TaskRow", "TaskRowProps", "TaskRowData"]

userStories:     ["*en tant que développeur je veux visualiser une tâche dans une liste"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";
import { Clock, GripVertical, Pencil, User as UserIcon } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TaskStatusBadge } from "./TaskStatusBadge";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TaskRowData = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly estimateHours: number;
  readonly assigneeName: string | null;
};

export type TaskRowProps = {
  readonly task: TaskRowData;
  readonly projectSlug: string;
  readonly storySlug: string;
  readonly reorderDisabled?: boolean;
};

export function TaskRow({
  task,
  projectSlug,
  storySlug,
  reorderDisabled = false,
}: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: reorderDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const editHref = `/back-studio/scrum/${projectSlug}/backlog/${storySlug}/tasks/${task.id}/edit`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:border-primary/40",
        isDragging && "border-primary/60 shadow-lg",
      )}
    >
      {/* Drag handle */}
      {!reorderDisabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Déplacer la tâche"
          className="mt-1 grid size-5 shrink-0 cursor-grab place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>
      )}

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />

          {task.estimateHours > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Clock className="size-2.5" aria-hidden />
              {task.estimateHours} h
            </span>
          )}

          {task.assigneeName && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              <UserIcon className="size-2.5" aria-hidden />
              {task.assigneeName}
            </span>
          )}
        </div>

        <span className="text-sm font-semibold text-foreground">
          {task.title}
        </span>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Link
          href={editHref}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Éditer"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Link>
        <DeleteTaskButton id={task.id} title={task.title} compact />
      </div>
    </li>
  );
}