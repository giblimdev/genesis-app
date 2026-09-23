/*
path :           app/actions/user-story/softDeleteUserStory.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression douce d'une user story (deletedAt = now).
                 Détache automatiquement les enfants (parentId → null) pour éviter
                 les orphelins pointant vers une story supprimée.
flow:            softDeleteUserStory({ id }) → getSession() → userStoryIdSchema
                 → findFirst({ id, deletedAt: null }) → assertProjectAccess →
                 transaction : update enfants + update story → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/user-story/softDeleteUserStory.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/components/user-story/DeleteUserStoryButton.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/user-story", "@/lib/actions/types"]
exports:         ["softDeleteUserStory"]

userStories:     ["*en tant que développeur je veux placer une user story dans la corbeille"]
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

export async function softDeleteUserStory(
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
    where: { id: parsed.data.id, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!current) {
    return { success: false, error: "User story introuvable." };
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
      /* Détache les enfants pour éviter les orphelins. */
      prisma.userStory.updateMany({
        where: { parentId: current.id },
        data: { parentId: null },
      }),
      prisma.userStory.update({
        where: { id: current.id },
        data: { deletedAt: new Date() },
        select: { id: true },
      }),
    ]);

    revalidatePath(`/back-studio/scrum/${current.projectId}/backlog`);
    revalidatePath(`/back-studio/scrum/${current.projectId}/backlog/trash`);
    return {
      success: true,
      data: { id: current.id, projectId: current.projectId },
    };
  } catch (err) {
    console.error("[softDeleteUserStory]", err);
    return { success: false, error: "Suppression impossible." };
  }
}