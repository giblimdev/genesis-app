/*
path :           app/actions/sprint/restoreSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Restaure un sprint soft-deleted (deletedAt → null).

flow:            restoreSprint({ id }) → getSession() → sprintIdSchema →
                 findFirst({ id, deletedAt: { not: null } }) → assertProjectAccess
                 → prisma.update({ deletedAt: null }) → revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/restoreSprint.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["restoreSprint"]

userStories:     ["*en tant que développeur je veux restaurer un sprint"]
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
import { sprintIdSchema } from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function restoreSprint(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = sprintIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const current = await prisma.sprint.findFirst({
    where: { id: parsed.data.id, deletedAt: { not: null } },
    select: { id: true, projectId: true },
  });
  if (!current) {
    return { success: false, error: "Sprint introuvable dans la corbeille." };
  }

  const hasAccess = await assertProjectAccess(
    current.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.sprint.update({
      where: { id: current.id },
      data: { deletedAt: null },
    });

    revalidatePath(`/back-studio/scrum/${current.projectId}/sprints`);
    revalidatePath(`/back-studio/scrum/${current.projectId}/sprints/trash`);
    return {
      success: true,
      data: { id: current.id, projectId: current.projectId },
    };
  } catch (err) {
    console.error("[restoreSprint]", err);
    return { success: false, error: "Restauration impossible." };
  }
}