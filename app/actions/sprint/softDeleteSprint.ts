/*
path :           app/actions/sprint/softDeleteSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Soft delete d'un sprint (deletedAt = now). Détache toutes les
                 user stories rattachées (sprintId → null) pour éviter les
                 références orphelines côté backlog.

flow:            softDeleteSprint({ id }) → getSession() → sprintIdSchema →
                 findFirst({ id, deletedAt: null }) → assertSprintEditable
                 (refus si verrouillé) → $transaction : updateMany US + update
                 sprint → revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/softDeleteSprint.ts",
                   "@/lib/sprint/lock.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/sprint/lock",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["softDeleteSprint"]

userStories:     ["*en tant que développeur je veux placer un sprint dans la corbeille"]
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
import { sprintIdSchema } from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function softDeleteSprint(
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
    where: { id: parsed.data.id, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!current) {
    return { success: false, error: "Sprint introuvable." };
  }

  const editable = await assertSprintEditable(current.id);
  if (!editable.ok) {
    return {
      success: false,
      error:
        editable.reason === "locked"
          ? "Ce sprint est verrouillé (en cours ou archivé). Suppression impossible."
          : "Sprint introuvable.",
    };
  }

  const hasAccess = await assertProjectAccess(
    current.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.$transaction([
      /* Détache les US assignées. */
      prisma.userStory.updateMany({
        where: { sprintId: current.id },
        data: { sprintId: null },
      }),
      prisma.sprint.update({
        where: { id: current.id },
        data: { deletedAt: new Date() },
        select: { id: true },
      }),
    ]);

    revalidatePath(`/back-studio/scrum/${current.projectId}/sprints`);
    revalidatePath(`/back-studio/scrum/${current.projectId}/sprints/trash`);
    return {
      success: true,
      data: { id: current.id, projectId: current.projectId },
    };
  } catch (err) {
    console.error("[softDeleteSprint]", err);
    return { success: false, error: "Suppression impossible." };
  }
}