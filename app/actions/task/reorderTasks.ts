/*
path :           app/actions/task/reorderTasks.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Réordonne les tâches d'une UserStory via DnD. Reçoit la liste
                 complète des ids dans le nouvel ordre, met à jour displayOrder
                 en une transaction.

flow:            reorderTasks({ userStoryId, orderedIds }) → getSession() →
                 reorderTasksSchema → charge story + projet → assertProjectAccess
                 → vérifie que tous les ids appartiennent à la story →
                 $transaction update displayOrder → revalidatePath.

ecosystem:       Dev = ["@/app/actions/task/reorderTasks.ts"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/task",
                  "@/lib/actions/types"]
exports:         ["reorderTasks"]

userStories:     ["*en tant que développeur je veux réordonner les tâches par DnD"]
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
import { reorderTasksSchema } from "@/lib/validations/task";
import type { ActionResult } from "@/lib/actions/types";

export async function reorderTasks(
  input: unknown,
): Promise<ActionResult<{ userStoryId: string; count: number }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = reorderTasksSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { userStoryId, orderedIds } = parsed.data;

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!story) return { success: false, error: "User story introuvable." };

  const hasAccess = await assertProjectAccess(story.projectId, session.user.id);
  if (!hasAccess) return { success: false, error: "Accès refusé." };

  const owned = await prisma.task.findMany({
    where: { id: { in: orderedIds }, userStoryId: story.id },
    select: { id: true },
  });

  if (owned.length !== orderedIds.length) {
    return {
      success: false,
      error: "Certaines tâches n'appartiennent pas à cette user story.",
    };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.task.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );

    revalidatePath(
      `/back-studio/scrum/${story.projectId}/backlog/${story.id}`,
    );
    return {
      success: true,
      data: { userStoryId: story.id, count: orderedIds.length },
    };
  } catch (err) {
    console.error("[reorderTasks]", err);
    return { success: false, error: "Réordonnancement impossible." };
  }
}