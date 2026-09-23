/*
path :           app/actions/project/softDeleteProject.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression douce. Positionne deletedAt = now().
                 Le projet disparaît des listes actives mais reste restaurable.
flow:            softDeleteProject({ id }) → getSession() → projectIdSchema.safeParse
                 → prisma.project.update({ deletedAt: new Date() }) → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/project/softDeleteProject.ts",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/components/project/DeleteProjectButton.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/validations/project", "@/lib/actions/types"]
exports:         ["softDeleteProject"]

userStories:     ["*en tant que développeur je veux placer un projet dans la corbeille"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { projectIdSchema } from "@/lib/validations/project";
import type { ActionResult } from "@/lib/actions/types";

export async function softDeleteProject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = projectIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  try {
    const project = await prisma.project.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
    revalidatePath("/back-studio/scrum");
    revalidatePath("/back-studio/scrum/trash");
    return { success: true, data: project };
  } catch (err) {
    console.error("[softDeleteProject]", err);
    return { success: false, error: "Suppression impossible." };
  }
}