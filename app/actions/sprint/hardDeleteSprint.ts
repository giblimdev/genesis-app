/*
path :           app/actions/sprint/hardDeleteSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Suppression DÉFINITIVE d'un sprint en corbeille. Exige la
                 saisie du slug exact.

flow:            hardDeleteSprint({ id, slug }) → getSession() →
                 hardDeleteSprintSchema → findFirst({ id, deletedAt != null })
                 → vérifie slug → assertProjectAccess → prisma.delete →
                 revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/hardDeleteSprint.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["hardDeleteSprint"]

userStories:     ["*en tant que développeur je veux supprimer définitivement un sprint"]
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
import { hardDeleteSprintSchema } from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function hardDeleteSprint(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = hardDeleteSprintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, slug } = parsed.data;

  const sprint = await prisma.sprint.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true, slug: true, projectId: true },
  });

  if (!sprint) {
    return {
      success: false,
      error:
        "Ce sprint n'est pas dans la corbeille. Supprime-le d'abord (soft delete).",
    };
  }
  if (sprint.slug !== slug) {
    return {
      success: false,
      error: "Le slug saisi ne correspond pas. Suppression annulée.",
    };
  }

  const hasAccess = await assertProjectAccess(
    sprint.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.sprint.delete({ where: { id: sprint.id } });

    revalidatePath(`/back-studio/scrum/${sprint.projectId}/sprints`);
    revalidatePath(`/back-studio/scrum/${sprint.projectId}/sprints/trash`);
    return {
      success: true,
      data: { id: sprint.id, projectId: sprint.projectId },
    };
  } catch (err) {
    console.error("[hardDeleteSprint]", err);
    return { success: false, error: "Suppression définitive impossible." };
  }
}