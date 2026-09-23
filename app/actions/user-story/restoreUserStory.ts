/*
path :           app/actions/user-story/restoreUserStory.ts
projectId:       <à fournir>
type :           action
generic:         false

role:            Server Action de restauration d'une user story soft-deleted
                 (deletedAt → null).
flow:            restoreUserStory({ id }) → getSession() → userStoryIdSchema
                 → findFirst({ id, deletedAt: { not: null } }) → assertProjectAccess
                 → prisma.userStory.update({ deletedAt: null }) → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/user-story/restoreUserStory.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/components/user-story/RestoreUserStoryButton.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/user-story", "@/lib/actions/types"]
exports:         ["restoreUserStory"]

userStories:     ["*en tant que développeur je veux restaurer une user story supprimée"]
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
import { userStoryIdSchema } from "@/lib/validations/user-story";
import type { ActionResult } from "@/lib/actions/types";

export async function restoreUserStory(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = userStoryIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const current = await prisma.userStory.findFirst({
    where: { id: parsed.data.id, deletedAt: { not: null } },
    select: { id: true, projectId: true },
  });
  if (!current) {
    return { success: false, error: "User story introuvable dans la corbeille." };
  }

  const hasAccess = await assertProjectAccess(
    current.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.userStory.update({
      where: { id: current.id },
      data: { deletedAt: null },
    });

    revalidatePath(`/back-studio/scrum/${current.projectId}/backlog`);
    revalidatePath(`/back-studio/scrum/${current.projectId}/backlog/trash`);
    return {
      success: true,
      data: { id: current.id, projectId: current.projectId },
    };
  } catch (err) {
    console.error("[restoreUserStory]", err);
    return { success: false, error: "Restauration impossible." };
  }
}