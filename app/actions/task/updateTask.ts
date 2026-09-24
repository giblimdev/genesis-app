/*
path :           app/actions/task/updateTask.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'une tâche. Resérialise blockedBy.

flow:            updateTask(input) → getSession() → updateTaskSchema →
                 charge la task + sa story + le projet → assertProjectAccess →
                 prisma.task.update → revalidatePath.

ecosystem:       Dev = ["@/app/actions/task/updateTask.ts"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/task",
                  "@/lib/user-story/json",
                  "@/lib/actions/types"]
exports:         ["updateTask"]

userStories:     ["*en tant que développeur je veux modifier une tâche"]
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
import { updateTaskSchema } from "@/lib/validations/task";
import { parseStringList, stringifyStringList } from "@/lib/user-story/json";
import type { ActionResult } from "@/lib/actions/types";

export async function updateTask(
  input: unknown,
): Promise<ActionResult<{ id: string; userStoryId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, title, description } = parsed.data;

  const current = await prisma.task.findFirst({
    where: { id },
    select: {
      id: true,
      userStoryId: true,
      UserStory: { select: { projectId: true } },
    },
  });
  if (!current) {
    return { success: false, error: "Tâche introuvable." };
  }

  const hasAccess = await assertProjectAccess(
    current.UserStory.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  const assigneeId = parsed.data.assigneeId?.trim() || null;
  const notes = parsed.data.notes?.trim() || null;
  const blockedByLines = parseStringList(parsed.data.blockedByInput ?? "");
  const blockedBy = stringifyStringList(blockedByLines);

  try {
    await prisma.task.update({
      where: { id: current.id },
      data: {
        title,
        description,
        assigneeId,
        estimateHours: parsed.data.estimateHours,
        status: parsed.data.status,
        blockedBy,
        notes,
      },
    });

    revalidatePath(
      `/back-studio/scrum/${current.UserStory.projectId}/backlog/${current.userStoryId}`,
    );
    return {
      success: true,
      data: { id: current.id, userStoryId: current.userStoryId },
    };
  } catch (err) {
    console.error("[updateTask]", err);
    return { success: false, error: "Mise à jour impossible." };
  }
}