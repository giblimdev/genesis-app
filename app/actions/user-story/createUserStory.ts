/*
path :           app/actions/user-story/createUserStory.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de création d'une user story (Epic si parentId vide,
                 Story sinon). Vérifie la session, l'accès au projet, valide le payload,
                 garantit l'unicité du slug DANS le projet, sérialise les 3 champs JSON,
                 valide le parent s'il est fourni (doit être un Epic du même projet).
flow:            createUserStory(input) → getSession() → createUserStorySchema.safeParse
                 → assertProjectAccess → validation parentId (si non vide) →
                 findFreeSlug → aggregate max displayOrder → sérialisation JSON →
                 prisma.userStory.create → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/user-story/createUserStory.ts",
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
                  "@/utils/slugify", "@/utils/slug"]
exports:         ["createUserStory"]

userStories:     ["*en tant que développeur je veux créer une user story"]
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
import { createUserStorySchema } from "@/lib/validations/user-story";
import {
  stringifyAcceptanceCriteria,
  stringifyStringList,
  type AcceptanceCriterion,
} from "@/lib/user-story/json";
import { slugifyWithFallback } from "@/utils/slugify";
import { findFreeSlug } from "@/utils/slug";
import type { ActionResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Découpe une saisie multiligne en liste nettoyée (trim + non vides).
 */
function parseLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Convertit les lignes de critères d'acceptation en AcceptanceCriterion[].
 * Chaque ligne devient un critère avec un id généré et done=false.
 */
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

export async function createUserStory(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = createUserStorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { projectId, title, asA, iWant, soThat, status, priority } =
    parsed.data;

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Projet introuvable ou accès refusé." };
  }

  /* --- Validation du parent (si Story enfant) --- */
  const parentIdRaw = parsed.data.parentId?.trim() || "";
  let parentId: string | null = null;
  if (parentIdRaw) {
    const parent = await prisma.userStory.findFirst({
      where: {
        id: parentIdRaw,
        projectId,
        parentId: null, // le parent doit être un Epic
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

  /* --- Champs JSON sérialisés --- */
  const acceptanceLines = parseLines(parsed.data.acceptanceInput ?? "");
  const dodLines = parseLines(parsed.data.dodInput ?? "");
  const linkedFilesLines = parseLines(parsed.data.linkedFilesInput ?? "");

  const acceptanceCriteria = stringifyAcceptanceCriteria(
    linesToAcceptanceCriteria(acceptanceLines),
  );
  const dodChecked = stringifyStringList(dodLines);
  const linkedFiles = stringifyStringList(linkedFilesLines);

  /* --- Slug --- */
  const baseSlug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugifyWithFallback(title, "story");

  const slug = await findFreeSlug(baseSlug, async (candidate) => {
    const existing = await prisma.userStory.findFirst({
      where: { projectId, slug: candidate, deletedAt: null },
      select: { id: true },
    });
    return existing !== null;
  });

  /* --- Display order --- */
  const maxOrder = await prisma.userStory.aggregate({
    where: { projectId, parentId, deletedAt: null },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    const story = await prisma.userStory.create({
      data: {
        projectId,
        parentId,
        title,
        slug,
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
        displayOrder,
      },
      select: { id: true, slug: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/backlog`);
    return { success: true, data: story };
  } catch (err) {
    console.error("[createUserStory]", err);
    return { success: false, error: "Création impossible." };
  }
}