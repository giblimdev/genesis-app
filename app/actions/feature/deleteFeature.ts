/*
path :           app/actions/feature/deleteFeature.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de suppression DÉFINITIVE d'une feature (pas de soft
                 delete dans le schéma Feature). Vérifie l'accès au projet parent.
flow:            deleteFeature({ id }) → getSession() → featureIdSchema.safeParse
                 → charge la feature → assertProjectAccess → prisma.feature.delete
                 → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/feature/deleteFeature.ts",
                   "@/lib/validations/feature.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/feature.ts",
                  "@/components/feature/DeleteFeatureButton.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/feature",
                  "@/lib/actions/types"]
exports:         ["deleteFeature"]

userStories:     ["*en tant que développeur je veux supprimer une feature"]
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
import { featureIdSchema } from "@/lib/validations/feature";
import type { ActionResult } from "@/lib/actions/types";

export async function deleteFeature(
  input: unknown,
): Promise<ActionResult<{ id: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = featureIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const feature = await prisma.feature.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, projectId: true },
  });
  if (!feature) {
    return { success: false, error: "Feature introuvable." };
  }

  const hasAccess = await assertProjectAccess(
    feature.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    await prisma.feature.delete({ where: { id: feature.id } });
    revalidatePath(`/back-studio/scrum/${feature.projectId}/features`);
    return { success: true, data: { id: feature.id, projectId: feature.projectId } };
  } catch (err) {
    console.error("[deleteFeature]", err);
    return { success: false, error: "Suppression impossible." };
  }
}