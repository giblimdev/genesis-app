/*
path :           app/actions/user-story/updateUserStory.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'une user story. Recalcule le slug si
                 le titre change et que le slug est laissé vide. Valide le parent (Epic
                 du même projet) et empêche l'auto-parenté. Resérialise les champs JSON.
flow:            updateUserStory(input) → getSession() → updateUserStorySchema.safeParse
                 → findFirst({ id, projectId, deletedAt: null }) → assertProjectAccess
                 → validation parentId → findFreeSlug → prisma.userStory.update →
                 revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/user-story/updateUserStory.ts",
                   "@/lib/validations/user-story.ts",
                   "@/lib/actions/types.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/user-story.ts",
                  "@/lib/user-story/json.ts",
                  "@/components/user-story/UserStoryForm.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/user-story",
                  "@/lib/user-story/json",
                  "@/lib/actions/types",
                  "@/utils/slugify"]
exports:         ["updateUserStory"]

userStories:     ["*en tant que développeur je veux modifier une user story"]
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
import { updateUserStorySchema } from "@/lib/validations/user-story";
import {
  stringifyAcceptanceCriteria,
  stringifyStringList,
  type AcceptanceCriterion,
} from "@/lib/user-story/json";
import { slugifyWithFallback } from "@/utils/slugify";
import type { ActionResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function isSlugTaken(
  projectId: string,
  slug: string,
  excludeId: string,
): Promise<boolean> {
  const existing = await prisma.userStory.findFirst({
    where: {
      projectId,
      slug,
      deletedAt: null,
      NOT: { id: excludeId },
    },
    select: { id: true },
  });
  return existing !== null;
}

async function findFreeSlug(
  projectId: string,
  base: string,
  excludeId: string,
): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    if (!(await isSlugTaken(projectId, candidate, excludeId))) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function parseLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function linesToAcceptanceCriteria(lines: string[]): AcceptanceCriterion[] {
  return lines.map((text, i) => ({
    id: `ac-${Date.now()}-${i}`,
    text,
    done: false,
  }));
}

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function updateUserStory(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = updateUserStorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, projectId, title, asA, iWant, soThat, status, priority } =
    parsed.data;

  const current = await prisma.userStory.findFirst({
    where: { id, projectId, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!current) {
    return { success: false, error: "User story introuvable." };
  }

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  /* --- Validation du parent --- */
  const parentIdRaw = parsed.data.parentId?.trim() || "";
  let parentId: string | null = null;

  if (parentIdRaw) {
    if (parentIdRaw === id) {
      return {
        success: false,
        error: "Une story ne peut pas être son propre parent.",
      };
    }
    const parent = await prisma.userStory.findFirst({
      where: {
        id: parentIdRaw,
        projectId,
        parentId: null,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!parent) {
      return {
        success: false,
        error: "Epic parent introuvable ou invalide.",
      };
    }
    parentId = parent.id;
  }

  /* --- Champs optionnels --- */
  const personaRef = parsed.data.personaRef?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;
  const sprintId = parsed.data.sprintId?.trim() || null;
  const storyPoints =
    parsed.data.storyPoints === "" || parsed.data.storyPoints === undefined
      ? null
      : Number(parsed.data.storyPoints);

  /* --- Champs JSON --- */
  const acceptanceLines = parseLines(parsed.data.acceptanceInput ?? "");
  const dodLines = parseLines(parsed.data.dodInput ?? "");
  const linkedFilesLines = parseLines(parsed.data.linkedFilesInput ?? "");

  const acceptanceCriteria = stringifyAcceptanceCriteria(
    linesToAcceptanceCriteria(acceptanceLines),
  );
  const dodChecked = stringifyStringList(dodLines);
  const linkedFiles = stringifyStringList(linkedFilesLines);

  /* --- Slug --- */
  const explicitSlug = parsed.data.slug?.trim();
  const nextSlug = explicitSlug
    ? await findFreeSlug(projectId, explicitSlug, id)
    : await findFreeSlug(projectId, slugifyWithFallback(title, "story"), id);

  try {
    const story = await prisma.userStory.update({
      where: { id },
      data: {
        parentId,
        title,
        slug: nextSlug,
        personaRef,
        asA,
        iWant,
        soThat,
        status,
        priority,
        storyPoints,
        accent,
        sprintId,
        acceptanceCriteria,
        dodChecked,
        linkedFiles,
      },
      select: { id: true, slug: true, projectId: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/backlog`);
    revalidatePath(`/back-studio/scrum/${projectId}/backlog/${story.slug}`);
    return { success: true, data: story };
  } catch (err) {
    console.error("[updateUserStory]", err);
    return { success: false, error: "Mise à jour impossible." };
  }
}