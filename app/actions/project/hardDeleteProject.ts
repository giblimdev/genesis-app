/*
path :           app/actions/project/hardDeleteProject.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression définitive d'un projet. Irréversible.
                 Exige une double confirmation : le projet doit être en corbeille
                 (deletedAt != null) ET l'appelant doit fournir le slug exact du
                 projet pour éviter les suppressions accidentelles.
flow:            hardDeleteProject({ id, slug }) → getSession() → hardDeleteSchema.safeParse
                 → prisma.project.findUnique({ id }) → refus si absent, non-supprimé,
                 ou slug ne correspond pas → prisma.project.delete() (cascade Prisma).
ecosystem:       Dev = [
                   "@/app/actions/project/hardDeleteProject.ts",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/validations/project.ts",
                  "@/components/project/HardDeleteProjectButton.tsx",
                  "@/app/back-studio/scrum/trash/page.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/validations/project", "@/lib/actions/types"]
exports:         ["hardDeleteProject"]

userStories:     ["*en tant que développeur je veux supprimer définitivement un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hardDeleteSchema } from "@/lib/validations/project";
import type { ActionResult } from "@/lib/actions/types";

export async function hardDeleteProject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = hardDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, slug } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, slug: true, deletedAt: true },
  });

  if (!project) {
    return { success: false, error: "Projet introuvable." };
  }
  if (!project.deletedAt) {
    return {
      success: false,
      error:
        "Ce projet n'est pas dans la corbeille. Supprime-le d'abord (soft delete).",
    };
  }
  if (project.slug !== slug) {
    return {
      success: false,
      error: "Le slug saisi ne correspond pas. Suppression annulée.",
    };
  }

  try {
    await prisma.project.delete({ where: { id } });

    revalidatePath("/back-studio/scrum");
    revalidatePath("/back-studio/scrum/trash");

    return { success: true, data: { id } };
  } catch (err) {
    console.error("[hardDeleteProject]", err);
    return { success: false, error: "Suppression définitive impossible." };
  }
}