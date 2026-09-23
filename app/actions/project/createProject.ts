/*
path :           app/actions/project/createProject.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de création d'un projet. Vérifie la session, valide
                 le payload, garantit l'unicité du slug via findFirst (le schéma
                 n'a plus @unique sur Project.slug), calcule le displayOrder,
                 connecte le créateur (ownerId + relation OwnedProjects).
flow:            createProject(input) → getSession() → createProjectSchema.safeParse
                 → findFreeSlug (findFirst) → aggregate max displayOrder →
                 prisma.project.create → revalidatePath("/back-studio/scrum").
ecosystem:       Dev = [
                   "@/app/actions/project/createProject.ts",
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
exports:         ["createProject"]

userStories:     ["*en tant que développeur je veux créer un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createProjectSchema } from "@/lib/validations/project";
import { slugifyWithFallback } from "@/utils/slugify";
import type { ActionResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Unicité applicative du slug (findFirst)                            */
/* ------------------------------------------------------------------ */

async function isSlugTaken(slug: string): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  return existing !== null;
}

async function findFreeSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    if (!(await isSlugTaken(candidate))) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, status } = parsed.data;
  const tagline = parsed.data.tagline?.trim() || null;
  const baseSlug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugifyWithFallback(name, "project");

  const slug = await findFreeSlug(baseSlug);

  const maxOrder = await prisma.project.aggregate({
    where: { deletedAt: null },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        tagline,
        description,
        status,
        displayOrder,
        ownerId: session.user.id,
        users: { connect: { id: session.user.id } },
      },
      select: { id: true, slug: true },
    });

    revalidatePath("/back-studio/scrum");
    return { success: true, data: project };
  } catch (err) {
    console.error("[createProject]", err);
    return { success: false, error: "Création impossible." };
  }
}