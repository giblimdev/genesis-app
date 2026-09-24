/*
path :           app/actions/task/deleteTask.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression DÉFINITIVE d'une tâche (le modèle
                 Task n'a pas de deletedAt). Vérifie l'accès au projet parent.

flow:            deleteTask({ id }) → getSession() → taskIdSchema →
                 charge la task + story + projet → assertProjectAccess →
                 prisma.task.delete → revalidatePath.

ecosystem:       Dev = ["@/app/actions/task/deleteTask.ts"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/task",
                  "@/lib/actions/types"]
exports:         ["deleteTask"]

userStories:     ["*en tant que développeur je veux supprimer une tâche"]
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
import { taskIdSchema } from "@/lib/validations/task";
import type { ActionResult } from "@/lib/actions/types";

export async function deleteTask(
  input: unknown,
): Promise<ActionResult<{ id: string; userStoryId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = taskIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const task = await prisma.task.findFirst({
    where: { id: parsed.data.id },
    select: {
      id: true,
      userStoryId: true,
      UserStory: { select: { projectId: true } },
    },
  });
  if (!task) {
    return { success: false, error: "Tâche introuvable." };
  }

  const hasAccess = await assertProjectAccess(
    task.UserStory.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.task.delete({ where: { id: task.id } });
    revalidatePath(
      `/back-studio/scrum/${task.UserStory.projectId}/backlog/${task.userStoryId}`,
    );
    return {
      success: true,
      data: { id: task.id, userStoryId: task.userStoryId },
    };
  } catch (err) {
    console.error("[deleteTask]", err);
    return { success: false, error: "Suppression impossible." };
  }
}