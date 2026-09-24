/*
path :           components/sprint/SprintBoard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Plateau DnD du sprint. Les listeners dnd-kit sont posés
                 UNIQUEMENT sur le <li> racine de chaque carte — la carte
                 entière est draggable, curseur grab partout. Aucun
                 élément interactif dans le corps de la carte sauf le
                 bouton "ouvrir" à droite (stopPropagation sur
                 pointerdown pour ne pas démarrer un drag depuis lui).

flow:            Client Component → état local optimiste (sprintList,
                 backlogList) synchronisé via useEffect quand les props
                 serveur changent → onDragEnd : résout source/cible,
                 mise à jour optimiste, action serveur, refresh.

ecosystem:       Dev = ["@/components/sprint/SprintBoard.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities",
                  "@/app/actions/sprint/assignStoryToSprint",
                  "@/app/actions/sprint/unassignStoryFromSprint",
                  "@/app/actions/sprint/reorderSprintStories",
                  "@/components/user-story/UserStoryPriorityBadge",
                  "@/components/user-story/UserStoryStatusBadge"]
exports:         ["SprintBoard", "SprintBoardProps", "BoardStory"]

userStories:     ["*en tant que développeur je veux ajouter/retirer/réordonner des US par DnD"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Inbox, Target } from "lucide-react";
import { toast } from "sonner";

import { assignStoryToSprint } from "@/app/actions/sprint/assignStoryToSprint";
import { unassignStoryFromSprint } from "@/app/actions/sprint/unassignStoryFromSprint";
import { reorderSprintStories } from "@/app/actions/sprint/reorderSprintStories";
import { UserStoryPriorityBadge } from "@/components/user-story/UserStoryPriorityBadge";
import { UserStoryStatusBadge } from "@/components/user-story/UserStoryStatusBadge";

/* ------------------------------------------------------------------ */
/*  Identifiants de containers                                         */
/* ------------------------------------------------------------------ */

const BACKLOG_ID = "backlog-container";
const SPRINT_ID = "sprint-container";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BoardStory = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: string;
  readonly priority: number;
  readonly storyPoints: number | null;
};

export type SprintBoardProps = {
  readonly sprintId: string;
  readonly projectSlug: string;
  readonly locked: boolean;
  readonly sprintStories: readonly BoardStory[];
  readonly backlogStories: readonly BoardStory[];
};

/* ------------------------------------------------------------------ */
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export function SprintBoard({
  sprintId,
  projectSlug,
  locked,
  sprintStories,
  backlogStories,
}: SprintBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const [sprintList, setSprintList] = useState<BoardStory[]>(() => [
    ...sprintStories,
  ]);
  const [backlogList, setBacklogList] = useState<BoardStory[]>(() => [
    ...backlogStories,
  ]);

  useEffect(() => {
    setSprintList([...sprintStories]);
  }, [sprintStories]);

  useEffect(() => {
    setBacklogList([...backlogStories]);
  }, [backlogStories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const allById = useMemo(() => {
    const map = new Map<string, BoardStory>();
    for (const s of sprintList) map.set(s.id, s);
    for (const s of backlogList) map.set(s.id, s);
    return map;
  }, [sprintList, backlogList]);

  const activeStory = activeId ? allById.get(activeId) ?? null : null;

  function findStory(
    id: string,
  ): { story: BoardStory; container: "sprint" | "backlog" } | null {
    const inSprint = sprintList.find((s) => s.id === id);
    if (inSprint) return { story: inSprint, container: "sprint" };
    const inBacklog = backlogList.find((s) => s.id === id);
    if (inBacklog) return { story: inBacklog, container: "backlog" };
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (locked) return;

    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const source = findStory(activeIdStr);
    if (!source) return;

    let targetContainer: "sprint" | "backlog" | null = null;

    if (overIdStr === SPRINT_ID) {
      targetContainer = "sprint";
    } else if (overIdStr === BACKLOG_ID) {
      targetContainer = "backlog";
    } else {
      const overStory = findStory(overIdStr);
      if (overStory) targetContainer = overStory.container;
    }

    if (!targetContainer) return;

    /* ---------- Sprint → Sprint : réordonnancement ---------- */

    if (source.container === "sprint" && targetContainer === "sprint") {
      if (overIdStr === SPRINT_ID) return;
      const oldIndex = sprintList.findIndex((s) => s.id === activeIdStr);
      const newIndex = sprintList.findIndex((s) => s.id === overIdStr);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const next = arrayMove(sprintList, oldIndex, newIndex);
      setSprintList(next);

      startTransition(async () => {
        const res = await reorderSprintStories({
          sprintId,
          orderedIds: next.map((s) => s.id),
        });
        if (!res.success) {
          toast.error(res.error);
          setSprintList([...sprintStories]);
          return;
        }
        router.refresh();
      });
      return;
    }

    /* ---------- Backlog → Sprint : assignation ---------- */

    if (source.container === "backlog" && targetContainer === "sprint") {
      setBacklogList((prev) => prev.filter((s) => s.id !== activeIdStr));
      setSprintList((prev) => [...prev, source.story]);

      startTransition(async () => {
        const res = await assignStoryToSprint({
          sprintId,
          userStoryId: activeIdStr,
        });
        if (!res.success) {
          toast.error(res.error);
          setSprintList([...sprintStories]);
          setBacklogList([...backlogStories]);
          return;
        }
        toast.success("User story ajoutée au sprint.");
        router.refresh();
      });
      return;
    }

    /* ---------- Sprint → Backlog : retrait ---------- */

    if (source.container === "sprint" && targetContainer === "backlog") {
      setSprintList((prev) => prev.filter((s) => s.id !== activeIdStr));
      setBacklogList((prev) => [...prev, source.story]);

      startTransition(async () => {
        const res = await unassignStoryFromSprint({
          userStoryId: activeIdStr,
        });
        if (!res.success) {
          toast.error(res.error);
          setSprintList([...sprintStories]);
          setBacklogList([...backlogStories]);
          return;
        }
        toast.success("User story retirée du sprint.");
        router.refresh();
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Column
          id={BACKLOG_ID}
          title="Backlog du projet"
          subtitle="US non assignées"
          icon={<Inbox className="size-3.5" aria-hidden />}
          stories={backlogList}
          projectSlug={projectSlug}
          variant="backlog"
          emptyLabel="Aucune US en attente."
        />

        <Column
          id={SPRINT_ID}
          title="Sprint"
          subtitle="US assignées"
          icon={<Target className="size-3.5" aria-hidden />}
          stories={sprintList}
          projectSlug={projectSlug}
          variant="sprint"
          emptyLabel="Glisse une US ici pour la rattacher au sprint."
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeStory ? (
          <div className="flex items-start gap-2 rounded-lg border border-primary/50 bg-card px-3 py-2 shadow-2xl shadow-primary/20">
            <GripVertical
              className="mt-0.5 size-3.5 text-primary"
              aria-hidden
            />
            <span className="line-clamp-2 text-sm font-medium text-foreground">
              {activeStory.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>

      {pending && (
        <p className="mt-3 text-center text-[11px] italic text-muted-foreground">
          Mise à jour…
        </p>
      )}
    </DndContext>
  );
}

/* ------------------------------------------------------------------ */
/*  Colonne                                                            */
/* ------------------------------------------------------------------ */

function Column({
  id,
  title,
  subtitle,
  icon,
  stories,
  projectSlug,
  variant,
  emptyLabel,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  stories: readonly BoardStory[];
  projectSlug: string;
  variant: "backlog" | "sprint";
  emptyLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
        isOver
          ? "border-primary/60 bg-primary/5"
          : variant === "sprint"
            ? "border-chart-1/30 bg-chart-1/[0.03]"
            : "border-border bg-card"
      }`}
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
            {icon}
          </span>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-foreground">{title}</h3>
            <span className="text-[10px] text-muted-foreground">
              {subtitle}
            </span>
          </div>
        </div>
        <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
          {stories.length}
        </span>
      </header>

      <SortableContext
        items={stories.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex min-h-[120px] flex-col gap-2">
          {stories.length === 0 ? (
            <li className="grid h-20 place-items-center rounded-md border border-dashed border-border/60 bg-muted/10 px-3 text-center text-[11px] italic text-muted-foreground">
              {emptyLabel}
            </li>
          ) : (
            stories.map((story) => (
              <SortableStory
                key={story.id}
                story={story}
                projectSlug={projectSlug}
              />
            ))
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte de story                                                     */
/*                                                                     */
/*  ⚠️ RÈGLE ABSOLUE : `{...listeners}` est posé UNIQUEMENT sur le     */
/*  <li> racine. Aucun autre élément du sous-arbre ne doit avoir       */
/*  `{...listeners}` ni `onPointerDown`, sinon seul cet élément        */
/*  devient draggable.                                                 */
/* ------------------------------------------------------------------ */

function SortableStory({
  story,
  projectSlug,
}: {
  story: BoardStory;
  projectSlug: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    /* Ceinture + bretelles : sur desktop ça n'a pas d'effet, sur tactile
       ça empêche le scroll de voler le drag. */
    touchAction: "none" as const,
  };

  const href = `/back-studio/scrum/${projectSlug}/backlog/${story.slug}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group flex cursor-grab items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 shadow-sm transition-colors hover:border-primary/40 active:cursor-grabbing"
    >
      {/* Décor uniquement — PAS de listeners ici, PAS de bouton. */}
      <span
        aria-hidden
        className="grid size-4 shrink-0 place-items-center text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
      >
        <GripVertical className="size-3.5" />
      </span>

      {/* Corps de la carte — 100 % inerte, aucun élément interactif. */}
      <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="line-clamp-2 text-sm font-medium text-foreground">
          {story.title}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <UserStoryPriorityBadge priority={story.priority} />
          <UserStoryStatusBadge status={story.status} />
          {story.storyPoints !== null && (
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {story.storyPoints} pt{story.storyPoints > 1 ? "s" : ""}
            </span>
          )}
        </span>
      </div>

      {/* Bouton "ouvrir" — réactive les pointer-events pour lui seul,
          et stoppe la propagation pour ne PAS démarrer un drag. */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          window.location.href = href;
        }}
        aria-label={`Ouvrir ${story.title}`}
        title="Ouvrir la story"
        className="pointer-events-auto grid size-7 shrink-0 cursor-pointer place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        <ExternalLink className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}