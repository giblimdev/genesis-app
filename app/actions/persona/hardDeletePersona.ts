/*
path :           app/actions/persona/hardDeletePersona.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression DÉFINITIVE d'un persona. Irréversible.
                 Exige une double confirmation : le persona doit être en corbeille
                 (deletedAt != null) ET l'appelant doit fournir le slug exact.
flow:            hardDeletePersona({ id, slug }) → getSession() → hardDeletePersonaSchema
                 → findFirst({ id, deletedAt: { not: null } }) → refus si absent,
                 non-supprimé, ou slug ne correspond pas → assertProjectAccess →
                 prisma.persona.delete() → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/persona/hardDeletePersona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/persona.ts",
                  "@/components/persona/HardDeletePersonaButton.tsx",
                  "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/persona", "@/lib/actions/types"]
exports:         ["hardDeletePersona"]

userStories:     ["*en tant que développeur je veux supprimer définitivement un persona"]
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
import { hardDeletePersonaSchema } from "@/lib/validations/persona";
import type { ActionResult } from "@/lib/actions/types";

export async function hardDeletePersona(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = hardDeletePersonaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, slug } = parsed.data;

  const persona = await prisma.persona.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true, slug: true, projectId: true },
  });

  if (!persona) {
    return {
      success: false,
      error:
        "Ce persona n'est pas dans la corbeille. Supprime-le d'abord (soft delete).",
    };
  }
  if (persona.slug !== slug) {
    return {
      success: false,
      error: "Le slug saisi ne correspond pas. Suppression annulée.",
    };
  }

  if (persona.projectId) {
    const hasAccess = await assertProjectAccess(
      persona.projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return { success: false, error: "Accès refusé." };
    }
  }

  try {
    await prisma.persona.delete({ where: { id: persona.id } });

    if (persona.projectId) {
      revalidatePath(`/back-studio/scrum/${persona.projectId}/personas`);
      revalidatePath(`/back-studio/scrum/${persona.projectId}/personas/trash`);
    }
    return {
      success: true,
      data: { id: persona.id, projectId: persona.projectId ?? "" },
    };
  } catch (err) {
    console.error("[hardDeletePersona]", err);
    return { success: false, error: "Suppression définitive impossible." };
  }
}