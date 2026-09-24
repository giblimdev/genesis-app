/*
path :           app/actions/feature/updateFeature.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'une feature. Recalcule le slug si le
                 nom change et que le slug est laissé vide. Vérifie l'accès au projet
                 parent et l'unicité DU SLUG AU SEIN DU PROJET (findFirst).
flow:            updateFeature(input) → getSession() → updateFeatureSchema.safeParse
                 → charge la feature → assertProjectAccess → si slug vide :
                 slugify(name) + findFreeSlug (findFirst {projectId, slug, id != exclu})
                 → prisma.feature.update → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/feature/updateFeature.ts",
                   "@/lib/validations/feature.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/feature.ts",
                  "@/components/feature/FeatureForm.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/feature",
                  "@/lib/actions/types",
                  "@/utils/slugify", "@/utils/slug"]
exports:         ["updateFeature"]

userStories:     ["*en tant que développeur je veux modifier une feature"]
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
import { updateFeatureSchema } from "@/lib/validations/feature";
import { slugifyWithFallback } from "@/utils/slugify";
import { findFreeSlug } from "@/utils/slug";
import type { ActionResult } from "@/lib/actions/types";

export async function updateFeature(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = updateFeatureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, projectId, name, description, module } = parsed.data;

  const current = await prisma.feature.findFirst({
    where: { id, projectId },
    select: { id: true, slug: true },
  });
  if (!current) {
    return { success: false, error: "Feature introuvable." };
  }

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  const icon = parsed.data.icon?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;

  const explicitSlug = parsed.data.slug?.trim();

  const isTaken = async (candidate: string): Promise<boolean> => {
    const existing = await prisma.feature.findFirst({
      where: { projectId, slug: candidate, NOT: { id } },
      select: { id: true },
    });
    return existing !== null;
  };

  const nextSlug = explicitSlug
    ? await findFreeSlug(explicitSlug, isTaken)
    : await findFreeSlug(slugifyWithFallback(name, "feature"), isTaken);

  try {
    const feature = await prisma.feature.update({
      where: { id },
      data: { name, slug: nextSlug, description, module, icon, accent },
      select: { id: true, slug: true, projectId: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/features`);
    revalidatePath(`/back-studio/scrum/${projectId}/features/${feature.slug}`);
    return { success: true, data: feature };
  } catch (err) {
    console.error("[updateFeature]", err);
    return { success: false, error: "Mise à jour impossible." };
  }
}