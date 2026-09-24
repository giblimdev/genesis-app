/*
path :           app/actions/feature/createFeature.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de création d'une feature. Vérifie la session, l'accès
                 au projet, valide le payload, garantit l'unicité DU SLUG AU SEIN DU
                 PROJET (pas de contrainte DB — vérification applicative via findFirst),
                 calcule le displayOrder dans le projet.
flow:            createFeature(input) → getSession() → createFeatureSchema.safeParse
                 → assertProjectAccess → findFreeSlug (findFirst {projectId, slug})
                 → aggregate max displayOrder → prisma.feature.create → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/feature/createFeature.ts",
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
exports:         ["createFeature"]

userStories:     ["*en tant que développeur je veux créer une feature"]
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
import { createFeatureSchema } from "@/lib/validations/feature";
import { slugifyWithFallback } from "@/utils/slugify";
import { findFreeSlug } from "@/utils/slug";
import type { ActionResult } from "@/lib/actions/types";

export async function createFeature(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = createFeatureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { projectId, name, description, module } = parsed.data;

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Projet introuvable ou accès refusé." };
  }

  const icon = parsed.data.icon?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;
  const baseSlug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugifyWithFallback(name, "feature");

  const slug = await findFreeSlug(baseSlug, async (candidate) => {
    const existing = await prisma.feature.findFirst({
      where: { projectId, slug: candidate },
      select: { id: true },
    });
    return existing !== null;
  });

  const maxOrder = await prisma.feature.aggregate({
    where: { projectId },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    const feature = await prisma.feature.create({
      data: {
        projectId,
        name,
        slug,
        description,
        module,
        icon,
        accent,
        displayOrder,
      },
      select: { id: true, slug: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/features`);
    return { success: true, data: feature };
  } catch (err) {
    console.error("[createFeature]", err);
    return { success: false, error: "Création impossible." };
  }
}