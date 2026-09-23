/*
path :           app/actions/feature/updateFeature.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'une feature. Recalcule le slug si le
                 nom change et que le slug est laissé vide. Vérifie l'accès au projet
                 parent.
flow:            updateFeature(input) → getSession() → updateFeatureSchema.safeParse
                 → charge la feature → assertProjectAccess → si slug vide :
                 slugify(name) + unicité globale → prisma.feature.update →
                 revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/feature/updateFeature.ts",
                   "@/lib/validations/feature.ts",
                   "@/lib/actions/types.ts",
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
                  "@/lib/utils/slugify"]
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
import { slugifyWithFallback } from "@/lib/utils/slugify";
import type { ActionResult } from "@/lib/actions/types";

async function findFreeSlug(base: string, excludeId: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    const existing = await prisma.feature.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

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

  const current = await prisma.feature.findUnique({
    where: { id },
    select: { id: true, slug: true, projectId: true },
  });
  if (!current || current.projectId !== projectId) {
    return { success: false, error: "Feature introuvable." };
  }

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  const icon = parsed.data.icon?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;

  const explicitSlug = parsed.data.slug?.trim();
  const nextSlug = explicitSlug
    ? await findFreeSlug(explicitSlug, id)
    : await findFreeSlug(slugifyWithFallback(name, "feature"), id);

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