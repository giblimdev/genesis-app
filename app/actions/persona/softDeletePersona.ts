/*
path :           app/actions/persona/softDeletePersona.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression douce d'un persona (deletedAt = now()).
                 Le persona disparaît des listes actives mais reste restaurable.
flow:            softDeletePersona({ id }) → getSession() → personaIdSchema.safeParse
                 → findFirst({ id, deletedAt: null }) → assertProjectAccess (si
                 projectId non null) → prisma.update({ deletedAt }) → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/persona/softDeletePersona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/components/persona/DeletePersonaButton.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/persona", "@/lib/actions/types"]
exports:         ["softDeletePersona"]

userStories:     ["*en tant que développeur je veux placer un persona dans la corbeille"]
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
import { personaIdSchema } from "@/lib/validations/persona";
import type { ActionResult } from "@/lib/actions/types";

export async function softDeletePersona(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = personaIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const current = await prisma.persona.findFirst({
    where: { id: parsed.data.id, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!current) {
    return { success: false, error: "Persona introuvable." };
  }

  if (current.projectId) {
    const hasAccess = await assertProjectAccess(
      current.projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return { success: false, error: "Accès refusé." };
    }
  }

  try {
    const persona = await prisma.persona.update({
      where: { id: current.id },
      data: { deletedAt: new Date() },
      select: { id: true, projectId: true },
    });

    if (persona.projectId) {
      revalidatePath(`/back-studio/scrum/${persona.projectId}/personas`);
      revalidatePath(`/back-studio/scrum/${persona.projectId}/personas/trash`);
    }
    return {
      success: true,
      data: { id: persona.id, projectId: persona.projectId ?? "" },
    };
  } catch (err) {
    console.error("[softDeletePersona]", err);
    return { success: false, error: "Suppression impossible." };
  }
}