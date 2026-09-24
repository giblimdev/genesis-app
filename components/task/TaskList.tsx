/*
path :           components/task/TaskList.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Liste DnD réordonnable des tâches d'une UserStory. Affiche les
                 tâches triées par displayOrder, avec poignée de drag, actions
                 éditer/supprimer, et un état vide. Si la prop `bulkImport`
                 (une Server Action pré-liée) est fournie, un bouton
                 « Import JSON » apparaît à côté de « Ajouter une tâche ».

flow:            Client Component → DndContext + SortableContext →
                 onDragEnd calcule le nouvel ordre → reorderTasks() →
                 router.refresh() pour resynchroniser. Synchronisation des
                 items via useEffect sur la prop `tasks`.

ecosystem:       Task = [
                   "@/app/actions/task/bulkImportTasks.ts",
                   "@/app/actions/task/createTask.ts",
                   "@/app/actions/task/deleteTask.ts",
                   "@/app/actions/task/reorderTasks.ts",
                   "@/app/actions/task/updateTask.ts",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/[taskId]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/new/page.tsx",
                   "@/components/task/DeleteTaskButton.tsx",
                   "@/components/task/TaskForm.tsx",
                   "@/components/task/TaskList.tsx",
                   "@/components/task/TaskRow.tsx",
                   "@/components/task/TaskStatusBadge.tsx",
                   "@/lib/json-templates/task.ts",
                   "@/lib/validations/task.ts",
                 ]
relatedFiles:    ["@/app/actions/task/reorderTasks.ts",
                  "@/components/task/TaskRow.tsx",
                  "@/components/common/ImportJsonDialog.tsx",
                  "@/lib/json-templates/task.ts",
                  "@/lib/actions/types.ts",
                  "@/components/ui/button"]
imports:         ["react", "next/link", "next/navigation", "lucide-react", "sonner",
                  "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/actions/task/reorderTasks",
                  "@/components/task/TaskRow",
                  "@/components/common/ImportJsonDialog",
                  "@/lib/json-templates/task",
                  "@/lib/actions/types",
                  "@/components/ui/button",
                  "props reçues : { userStoryId, projectSlug, storySlug, tasks, bulkImport? }"]
exports:         ["TaskList", "TaskListProps"]
useBy:           ["@/app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx"]

userStories:     ["*en tant que développeur je veux lister et réordonner les tâches par DnD",
                  "*en tant que développeur je veux importer des tâches en lot depuis la story"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, ClipboardPaste, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { reorderTasks } from "@/app/actions/task/reorderTasks";
import { TaskRow, type TaskRowData } from "./TaskRow";
import { ImportJsonDialog } from "@/components/common/ImportJsonDialog";
import { TASK_JSON_TEMPLATE } from "@/lib/json-templates/task";
import { buttonVariants } from "@/components/ui/button";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TaskListProps = {
  readonly userStoryId: string;
  readonly projectSlug: string;
  readonly storySlug: string;
  readonly tasks: readonly TaskRowData[];
  /**
   * Server Action pré-liée : `bulkImportTasks.bind(null, story.id)`.
   * Si fournie, le bouton « Import JSON » apparaît dans l'en-tête.
   * Signature attendue : (rawJson: string) => Promise<BulkImportResult>.
   */
  readonly bulkImport?: (rawJson: string) => Promise<BulkImportResult>;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskList({
  userStoryId,
  projectSlug,
  storySlug,
  tasks,
  bulkImport,
}: TaskListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<TaskRowData[]>(() => [...tasks]);

  /* Resynchronise quand la prop change (après router.refresh()). */
  useEffect(() => {
    setItems([...tasks]);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      const res = await reorderTasks({
        userStoryId,
        orderedIds: next.map((t) => t.id),
      });
      if (!res.success) {
        toast.error(res.error);
        setItems([...tasks]);
        return;
      }
      router.refresh();
    });
  }

  const newHref = `/back-studio/scrum/${projectSlug}/backlog/${storySlug}/tasks/new`;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-3.5 text-primary" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tâches ({items.length})
          </h2>
          {pending && (
            <span className="text-[10px] italic text-muted-foreground">
              Mise à jour…
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bulkImport && (
            <ImportJsonDialog
              trigger={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <ClipboardPaste className="h-4 w-4" aria-hidden />
                  Import JSON
                </button>
              }
              title="Importer des tâches"
              description="Colle un tableau JSON de tâches. Chaque tâche est rattachée à cette user story. Le champ blockedByInput accepte plusieurs lignes (une ligne = un identifiant ou un titre de tâche bloquante)."
              template={TASK_JSON_TEMPLATE}
              submitLabel="Importer"
              onSubmit={bulkImport}
            />
          )}

          <Link
            href={newHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter une tâche
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs italic text-muted-foreground">
          Aucune tâche. Découpe cette user story en tâches actionnables, ou
          utilise l&apos;import JSON pour en ajouter plusieurs d&apos;un coup.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {items.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projectSlug={projectSlug}
                  storySlug={storySlug}
                  reorderDisabled={pending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}