/*
path :           app/actions/sprint/assignStoryToSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Assigne une user story à un sprint (DnD). Refuse si la story
                 appartient à un autre projet ou si elle est soft-deleted.
                 Calcule le displayOrder en fin de sprint.

flow:            assignStoryToSprint({ sprintId, userStoryId }) → getSession()
                 → assignStoryToSprintSchema → charge sprint + story →
                 assertSprintEditable → vérifie même projet → max displayOrder
                 → prisma.userStory.update({ sprintId, displayOrder }) →
                 revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/assignStoryToSprint.ts",
                   "@/lib/sprint/lock.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/sprint/lock",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["assignStoryToSprint"]

userStories:     ["*en tant que développeur je veux ajouter une user story à un sprint par DnD"]
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
import { assertSprintEditable } from "@/lib/sprint/lock";
import { assignStoryToSprintSchema } from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function assignStoryToSprint(
  input: unknown,
): Promise<ActionResult<{ sprintId: string; userStoryId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = assignStoryToSprintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { sprintId, userStoryId } = parsed.data;

  const [sprint, story] = await Promise.all([
    prisma.sprint.findFirst({
      where: { id: sprintId, deletedAt: null },
      select: { id: true, projectId: true },
    }),
    prisma.userStory.findFirst({
      where: { id: userStoryId, deletedAt: null },
      select: { id: true, projectId: true, sprintId: true },
    }),
  ]);

  if (!sprint) return { success: false, error: "Sprint introuvable." };
  if (!story) return { success: false, error: "User story introuvable." };

  if (story.projectId !== sprint.projectId) {
    return {
      success: false,
      error: "La user story n'appartient pas au même projet.",
    };
  }

  const editable = await assertSprintEditable(sprint.id);
  if (!editable.ok) {
    return {
      success: false,
      error: "Ce sprint est introuvable.",
    };
  }

  const hasAccess = await assertProjectAccess(
    sprint.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  /* Déjà assignée à ce sprint → no-op. */
  if (story.sprintId === sprint.id) {
    return {
      success: true,
      data: { sprintId: sprint.id, userStoryId: story.id },
    };
  }

  const maxOrder = await prisma.userStory.aggregate({
    where: { sprintId: sprint.id },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    await prisma.userStory.update({
      where: { id: story.id },
      data: { sprintId: sprint.id, displayOrder },
    });

    revalidatePath(`/back-studio/scrum/${sprint.projectId}/sprints/${sprintId}`);
    return {
      success: true,
      data: { sprintId: sprint.id, userStoryId: story.id },
    };
  } catch (err) {
    console.error("[assignStoryToSprint]", err);
    return { success: false, error: "Assignation impossible." };
  }
}