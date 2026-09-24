/*
path :           app/actions/task/createTask.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de création d'une tâche rattachée à une
                 UserStory. Vérifie l'accès au projet parent de la story,
                 calcule le displayOrder en fin de liste, sérialise blockedBy.

flow:            createTask(input) → getSession() → createTaskSchema →
                 charge la story + son projet → assertProjectAccess →
                 aggregate max displayOrder → prisma.task.create → revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/task/createTask.ts",
                   "@/lib/validations/task.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/task",
                  "@/lib/user-story/json",
                  "@/lib/actions/types"]
exports:         ["createTask"]

userStories:     ["*en tant que développeur je veux créer une tâche"]
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
import { createTaskSchema } from "@/lib/validations/task";
import { parseStringList, stringifyStringList } from "@/lib/user-story/json";
import type { ActionResult } from "@/lib/actions/types";

export async function createTask(
  input: unknown,
): Promise<ActionResult<{ id: string; userStoryId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { userStoryId, title, description } = parsed.data;

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

  const assigneeId = parsed.data.assigneeId?.trim() || null;
  const notes = parsed.data.notes?.trim() || null;
  const blockedByLines = parseStringList(parsed.data.blockedByInput ?? "");
  const blockedBy = stringifyStringList(blockedByLines);

  const maxOrder = await prisma.task.aggregate({
    where: { userStoryId: story.id },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    const task = await prisma.task.create({
      data: {
        userStoryId: story.id,
        title,
        description,
        assigneeId,
        estimateHours: parsed.data.estimateHours,
        status: parsed.data.status,
        blockedBy,
        notes,
        displayOrder,
      },
      select: { id: true, userStoryId: true },
    });

    revalidatePath(
      `/back-studio/scrum/${story.projectId}/backlog/${story.id}`,
    );
    return { success: true, data: task };
  } catch (err) {
    console.error("[createTask]", err);
    return { success: false, error: "Création impossible." };
  }
}