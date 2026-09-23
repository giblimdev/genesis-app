/*
path :           app/actions/project/restoreProject.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de restauration d'un projet soft-deleted (deletedAt → null).
flow:            restoreProject({ id }) → getSession() → projectIdSchema.safeParse
                 → prisma.project.update({ deletedAt: null }) → revalidatePath
                 sur la liste et la corbeille.
ecosystem:       Dev = [
                   "@/app/actions/project/restoreProject.ts",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/validations/project.ts",
                  "@/components/project/RestoreProjectButton.tsx",
                  "@/app/back-studio/scrum/trash/page.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/validations/project", "@/lib/actions/types"]
exports:         ["restoreProject"]

userStories:     ["*en tant que développeur je veux restaurer un projet supprimé"]
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

export async function restoreProject(
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
      data: { deletedAt: null },
      select: { id: true },
    });

    revalidatePath("/back-studio/scrum");
    revalidatePath("/back-studio/scrum/trash");

    return { success: true, data: project };
  } catch (err) {
    console.error("[restoreProject]", err);
    return { success: false, error: "Restauration impossible." };
  }
}
