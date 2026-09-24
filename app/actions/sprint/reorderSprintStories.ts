/*
path :           app/actions/sprint/reorderSprintStories.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Réordonne les user stories d'un sprint. Reçoit la liste
                 complète des ids dans le nouvel ordre et met à jour le
                 displayOrder en une transaction. Refuse si le sprint est
                 verrouillé.

flow:            reorderSprintStories({ sprintId, orderedIds }) → getSession()
                 → reorderSprintStoriesSchema → assertSprintEditable →
                 assertProjectAccess → charge les US du sprint → vérifie que
                 tous les orderedIds appartiennent bien au sprint → transaction
                 update displayOrder → revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/reorderSprintStories.ts",
                   "@/lib/sprint/lock.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/sprint/lock",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["reorderSprintStories"]

userStories:     ["*en tant que développeur je veux réordonner les stories d'un sprint par DnD"]
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
import { reorderSprintStoriesSchema } from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function reorderSprintStories(
  input: unknown,
): Promise<ActionResult<{ sprintId: string; count: number }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = reorderSprintStoriesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { sprintId, orderedIds } = parsed.data;

  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!sprint) return { success: false, error: "Sprint introuvable." };

  const editable = await assertSprintEditable(sprint.id);
  if (!editable.ok) {
    return {
      success: false,
      error: "Ce sprint est verrouillé. Réordonnancement impossible.",
    };
  }

  const hasAccess = await assertProjectAccess(
    sprint.projectId,
    session.user.id,
  );
  if (!hasAccess) return { success: false, error: "Accès refusé." };

  /* Vérifie que tous les ids appartiennent au sprint. */
  const owned = await prisma.userStory.findMany({
    where: { id: { in: orderedIds }, sprintId: sprint.id },
    select: { id: true },
  });

  if (owned.length !== orderedIds.length) {
    return {
      success: false,
      error: "Certaines stories n'appartiennent pas à ce sprint.",
    };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.userStory.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );

    revalidatePath(
      `/back-studio/scrum/${sprint.projectId}/sprints/${sprint.id}`,
    );
    return {
      success: true,
      data: { sprintId: sprint.id, count: orderedIds.length },
    };
  } catch (err) {
    console.error("[reorderSprintStories]", err);
    return { success: false, error: "Réordonnancement impossible." };
  }
}