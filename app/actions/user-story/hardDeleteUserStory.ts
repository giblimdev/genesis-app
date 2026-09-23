/*
path :           app/actions/user-story/hardDeleteUserStory.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression DÉFINITIVE d'une user story. Irréversible.
                 Exige que la story soit en corbeille ET que le slug saisi corresponde.
flow:            hardDeleteUserStory({ id, slug }) → getSession() → hardDeleteUserStorySchema
                 → findFirst({ id, deletedAt: { not: null } }) → vérif slug + accès →
                 prisma.userStory.delete → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/user-story/hardDeleteUserStory.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/components/user-story/HardDeleteUserStoryButton.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/user-story", "@/lib/actions/types"]
exports:         ["hardDeleteUserStory"]

userStories:     ["*en tant que développeur je veux supprimer définitivement une user story"]
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
import { hardDeleteUserStorySchema } from "@/lib/validations/user-story";
import type { ActionResult } from "@/lib/actions/types";

export async function hardDeleteUserStory(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = hardDeleteUserStorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, slug } = parsed.data;

  const story = await prisma.userStory.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true, slug: true, projectId: true },
  });

  if (!story) {
    return {
      success: false,
      error:
        "Cette user story n'est pas dans la corbeille. Supprime-la d'abord (soft delete).",
    };
  }
  if (story.slug !== slug) {
    return {
      success: false,
      error: "Le slug saisi ne correspond pas. Suppression annulée.",
    };
  }

  const hasAccess = await assertProjectAccess(
    story.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.userStory.delete({ where: { id: story.id } });

    revalidatePath(`/back-studio/scrum/${story.projectId}/backlog`);
    revalidatePath(`/back-studio/scrum/${story.projectId}/backlog/trash`);
    return {
      success: true,
      data: { id: story.id, projectId: story.projectId },
    };
  } catch (err) {
    console.error("[hardDeleteUserStory]", err);
    return { success: false, error: "Suppression définitive impossible." };
  }
}