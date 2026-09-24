/*
path :           app/actions/sprint/createSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de création d'un sprint. Unicité du slug DANS
                 le projet (findFreeSlug), calcul du displayOrder, connecte
                 l'utilisateur au projet via assertProjectAccess.
flow:            createSprint(input) → getSession() → createSprintSchema →
                 assertProjectAccess → findFreeSlug → max displayOrder →
                 prisma.sprint.create → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/sprint/createSprint.ts",
                   "@/lib/validations/sprint.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types", "@/utils/slugify", "@/utils/slug"]
exports:         ["createSprint"]

userStories:     ["*en tant que développeur je veux créer un sprint"]
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
import { createSprintSchema } from "@/lib/validations/sprint";
import { slugifyWithFallback } from "@/utils/slugify";
import { findFreeSlug } from "@/utils/slug";
import type { ActionResult } from "@/lib/actions/types";

export async function createSprint(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = createSprintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { projectId, name, goal } = parsed.data;

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Projet introuvable ou accès refusé." };
  }

  const explicitSlug = parsed.data.slug?.trim();
  const baseSlug = explicitSlug
    ? explicitSlug
    : slugifyWithFallback(name, "sprint");

  const slug = await findFreeSlug(baseSlug, async (candidate) => {
    const found = await prisma.sprint.findFirst({
      where: { projectId, slug: candidate, deletedAt: null },
      select: { id: true },
    });
    return found !== null;
  });

  const maxOrder = await prisma.sprint.aggregate({
    where: { projectId, deletedAt: null },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  const notes = parsed.data.notes?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;
  const velocity =
    parsed.data.velocity === "" || parsed.data.velocity === undefined
      ? null
      : Number(parsed.data.velocity);

  try {
    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        slug,
        goal,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        durationWeeks: parsed.data.durationWeeks,
        status: parsed.data.status,
        capacityPoints: parsed.data.capacityPoints,
        velocity,
        notes,
        accent,
        displayOrder,
      },
      select: { id: true, slug: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/sprints`);
    return { success: true, data: sprint };
  } catch (err) {
    console.error("[createSprint]", err);
    return { success: false, error: "Création impossible." };
  }
}