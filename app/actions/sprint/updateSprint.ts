/*
path :           app/actions/sprint/updateSprint.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'un sprint. REFUSE si le sprint
                 est verrouillé (active / completed / cancelled). Recalcule le
                 slug si le nom change et que le slug est laissé vide.
flow:            updateSprint(input) → getSession() → updateSprintSchema →
                 findFirst({ id, projectId, deletedAt: null }) →
                 assertSprintEditable → assertProjectAccess → findFreeSlug →
                 prisma.sprint.update → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/sprint/updateSprint.ts",
                   "@/lib/sprint/lock.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/sprint/lock",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types", "@/utils/slugify", "@/utils/slug"]
exports:         ["updateSprint"]

userStories:     ["*en tant que développeur je veux modifier un sprint",
                  "*en tant que développeur je veux bloquer l'édition d'un sprint verrouillé"]
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
import { assertSprintEditable } from "@/lib/sprint/lock";
import { updateSprintSchema } from "@/lib/validations/sprint";
import { slugifyWithFallback } from "@/utils/slugify";
import { findFreeSlug } from "@/utils/slug";
import type { ActionResult } from "@/lib/actions/types";

export async function updateSprint(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = updateSprintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, projectId, name, goal } = parsed.data;

  const current = await prisma.sprint.findFirst({
    where: { id, projectId, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!current) {
    return { success: false, error: "Sprint introuvable." };
  }

  const editable = await assertSprintEditable(id);
  if (!editable.ok) {
    return {
      success: false,
      error:
        editable.reason === "locked"
          ? "Ce sprint est verrouillé (en cours ou archivé). Modification impossible."
          : "Sprint introuvable.",
    };
  }

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  const explicitSlug = parsed.data.slug?.trim();

  const isTaken = async (candidate: string): Promise<boolean> => {
    const found = await prisma.sprint.findFirst({
      where: {
        projectId,
        slug: candidate,
        deletedAt: null,
        NOT: { id },
      },
      select: { id: true },
    });
    return found !== null;
  };

  const nextSlug = explicitSlug
    ? await findFreeSlug(explicitSlug, isTaken)
    : await findFreeSlug(slugifyWithFallback(name, "sprint"), isTaken);

  const notes = parsed.data.notes?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;
  const velocity =
    parsed.data.velocity === "" || parsed.data.velocity === undefined
      ? null
      : Number(parsed.data.velocity);

  try {
    const sprint = await prisma.sprint.update({
      where: { id },
      data: {
        name,
        slug: nextSlug,
        goal,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        durationWeeks: parsed.data.durationWeeks,
        status: parsed.data.status,
        capacityPoints: parsed.data.capacityPoints,
        velocity,
        notes,
        accent,
      },
      select: { id: true, slug: true, projectId: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/sprints`);
    revalidatePath(
      `/back-studio/scrum/${projectId}/sprints/${sprint.slug}`,
    );
    return { success: true, data: sprint };
  } catch (err) {
    console.error("[updateSprint]", err);
    return { success: false, error: "Mise à jour impossible." };
  }
}