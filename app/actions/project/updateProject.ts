/*
path :           app/actions/project/updateProject.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'un projet existant. Recalcule le slug
                 si le nom change et que le slug est laissé vide. Refuse les projets
                 soft-deleted. Unicité applicative via findFirst.
flow:            updateProject(input) → getSession() → updateProjectSchema.safeParse
                 → findFirst({ id, deletedAt: null }) → si slug vide :
                 slugify(name) + findFreeSlug (findFirst) → prisma.update →
                 revalidatePath.
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
                  "@/utils/slugify"]
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

/* ------------------------------------------------------------------ */
/*  Unicité applicative du slug (findFirst)                            */
/* ------------------------------------------------------------------ */

async function isSlugTaken(slug: string, excludeId: string): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: { slug, deletedAt: null, NOT: { id: excludeId } },
    select: { id: true },
  });
  return existing !== null;
}

async function findFreeSlug(base: string, excludeId: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    if (!(await isSlugTaken(candidate, excludeId))) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

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

  const current = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!current) {
    return { success: false, error: "Projet introuvable." };
  }

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