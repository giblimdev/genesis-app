/*
path :           app/actions/sprint/unassignStoryFromSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Retire une user story de son sprint (sprintId → null). Refuse
                 si le sprint courant est verrouillé.

flow:            unassignStoryFromSprint({ userStoryId }) → getSession() →
                 unassignStoryFromSprintSchema → charge la story →
                 assertSprintEditable(story.sprintId) → assertProjectAccess →
                 prisma.update({ sprintId: null }) → revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/unassignStoryFromSprint.ts",
                   "@/lib/sprint/lock.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/sprint/lock",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["unassignStoryFromSprint"]

userStories:     ["*en tant que développeur je veux retirer une user story d'un sprint par DnD"]
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
import { unassignStoryFromSprintSchema } from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function unassignStoryFromSprint(
  input: unknown,
): Promise<ActionResult<{ userStoryId: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = unassignStoryFromSprintSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const story = await prisma.userStory.findFirst({
    where: { id: parsed.data.userStoryId, deletedAt: null },
    select: { id: true, projectId: true, sprintId: true },
  });

  if (!story) return { success: false, error: "User story introuvable." };

  if (story.sprintId) {
    const editable = await assertSprintEditable(story.sprintId);
    if (!editable.ok) {
      return {
        success: false,
        error: "Ce sprint est verrouillé. Composition impossible.",
      };
    }
  }

  const hasAccess = await assertProjectAccess(
    story.projectId,
    session.user.id,
  );
  if (!hasAccess) return { success: false, error: "Accès refusé." };

  try {
    await prisma.userStory.update({
      where: { id: story.id },
      data: { sprintId: null },
    });

    if (story.sprintId) {
      revalidatePath(
        `/back-studio/scrum/${story.projectId}/sprints/${story.sprintId}`,
      );
    }
    return {
      success: true,
      data: { userStoryId: story.id, projectId: story.projectId },
    };
  } catch (err) {
    console.error("[unassignStoryFromSprint]", err);
    return { success: false, error: "Retrait impossible." };
  }
}