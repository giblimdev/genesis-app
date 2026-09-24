/*
path :           app/actions/task/bulkImportTasks.ts
tag :            ["task", "bulk", "import", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import en lot de tâches pour une user story
                 donnée. Le userStoryId est passé en PREMIER argument par la
                 page via `.bind(null, story.id)`. Reçoit un tableau JSON,
                 valide l'ensemble, sérialise blockedBy, calcule le displayOrder
                 à la suite des tâches existantes de la story, puis insère tout
                 en une seule transaction.

flow:            bulkImportTasks(userStoryId, rawInput) → getSession()
                 → parse JSON si string → bulkImportTasksSchema.safeParse
                 → charge la story + projectId → assertProjectAccess
                 → aggregate max displayOrder (scopé userStoryId)
                 → $transaction de create → revalidatePath.

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
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/task.ts",
                  "@/lib/user-story/json.ts",
                  "@/lib/actions/types.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/task",
                  "@/lib/user-story/json",
                  "@/lib/actions/types"]
exports:         ["bulkImportTasks"]
useBy:           ["@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/new/page.tsx",
                  "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des tâches en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/auth/project-access";
import { bulkImportTasksSchema } from "@/lib/validations/task";
import { parseStringList, stringifyStringList } from "@/lib/user-story/json";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PreparedTask = {
  title: string;
  description: string;
  assigneeId: string | null;
  estimateHours: number;
  status: string;
  blockedBy: string | null;
  notes: string | null;
  displayOrder: number;
};

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function bulkImportTasks(
  userStoryId: string,
  rawInput: unknown,
): Promise<BulkImportResult> {
  /* ---------- 0. Sécurité / auth ---------- */

  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentification requise." };
  }

  if (typeof userStoryId !== "string" || userStoryId.length === 0) {
    return { success: false, error: "User story introuvable." };
  }

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!story) {
    return { success: false, error: "User story introuvable." };
  }

  const hasAccess = await assertProjectAccess(story.projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  /* ---------- 1. Parse + validation ---------- */

  let parsedJson: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      parsedJson = JSON.parse(rawInput);
    } catch {
      return { success: false, error: "JSON invalide." };
    }
  }

  const parsed = bulkImportTasksSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") ?? "?";
    return {
      success: false,
      error: `Données invalides (${path} : ${first?.message ?? "inconnu"}).`,
    };
  }

  const items = parsed.data;

  /* ---------- 2. Préparation ---------- */

  const prepared: PreparedTask[] = items.map((item) => {
    const blockedByLines = parseStringList(item.blockedByInput ?? "");
    return {
      title: item.title,
      description: item.description,
      assigneeId: item.assigneeId?.trim() || null,
      estimateHours: item.estimateHours,
      status: item.status,
      blockedBy: stringifyStringList(blockedByLines),
      notes: item.notes?.trim() || null,
      displayOrder: 0, // assigné après
    };
  });

  /* ---------- 3. Calcul du displayOrder de départ ---------- */

  const maxOrder = await prisma.task.aggregate({
    where: { userStoryId: story.id },
    _max: { displayOrder: true },
  });
  let nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  for (const p of prepared) {
    p.displayOrder = nextOrder++;
  }

  /* ---------- 4. Transaction ---------- */

  try {
    await prisma.$transaction(
      prepared.map((data) =>
        prisma.task.create({
          data: {
            userStoryId: story.id,
            title: data.title,
            description: data.description,
            assigneeId: data.assigneeId,
            estimateHours: data.estimateHours,
            status: data.status,
            blockedBy: data.blockedBy,
            notes: data.notes,
            displayOrder: data.displayOrder,
          },
        }),
      ),
    );

    revalidatePath("/back-studio/scrum", "layout");

    return { success: true, imported: prepared.length };
  } catch (err) {
    console.error("[bulkImportTasks]", err);
    return { success: false, error: "Insertion impossible." };
  }
}
