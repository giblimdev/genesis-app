/*
path :           app/actions/project/updateProject.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'un projet existant. Recalcule le slug
                 si le nom change ET que le slug est laissé vide. Refuse les projets
                 soft-deleted.
flow:            updateProject(input) → getSession() → updateProjectSchema.safeParse
                 → charge le projet (not found / deleted → erreur) → si slug vide :
                 slugify(name) + unicité → prisma.project.update → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/project/updateProject.ts",
                   "@/lib/validations/project.ts",
                   "@/lib/actions/types.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/validations/project.ts",
                  "@/components/project/ProjectForm.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/validations/project", "@/lib/actions/types",
                  "@/lib/utils/slugify"]
exports:         ["updateProject"]

userStories:     ["*en tant que développeur je veux modifier un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { updateProjectSchema } from "@/lib/validations/project";
import { slugifyWithFallback } from "@/utils/slugify";
import type { ActionResult } from "@/lib/actions/types";

async function findFreeSlug(base: string, excludeId: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    const existing = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function updateProject(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, name, description, status } = parsed.data;
  const tagline = parsed.data.tagline?.trim() || null;

  const current = await prisma.project.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, slug: true },
  });
  if (!current || current.deletedAt) {
    return { success: false, error: "Projet introuvable." };
  }

  // Slug : conservé si fourni et non vide, recalculé sinon.
  const explicitSlug = parsed.data.slug?.trim();
  const nextSlug = explicitSlug
    ? await findFreeSlug(explicitSlug, id)
    : await findFreeSlug(slugifyWithFallback(name, "project"), id);

  try {
    const project = await prisma.project.update({
      where: { id },
      data: { name, slug: nextSlug, tagline, description, status },
      select: { id: true, slug: true },
    });

    revalidatePath("/back-studio/scrum");
    revalidatePath(`/back-studio/scrum/${project.slug}`);
    return { success: true, data: project };
  } catch (err) {
    console.error("[updateProject]", err);
    return { success: false, error: "Mise à jour impossible." };
  }
}
