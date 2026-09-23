/*
path :           app/actions/persona/createPersona.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de création d'un persona. Vérifie la session, l'accès
                 au projet, valide le payload, garantit l'unicité du slug DANS le
                 projet (findFirst car plus de @unique), sérialise les keywords en
                 JSON stringifié, calcule le displayOrder.
flow:            createPersona(input) → getSession() → createPersonaSchema.safeParse
                 → assertProjectAccess → findFirst pour l'unicité du slug →
                 parseKeywordsInput + stringifyKeywords → aggregate max displayOrder
                 → prisma.persona.create → revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/persona/createPersona.ts",
                   "@/lib/validations/persona.ts",
                   "@/lib/actions/types.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/persona.ts",
                  "@/utils/keywords",
                  "@/components/persona/PersonaForm.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/persona",
                  "@/lib/actions/types",
                  "@/utils/slugify", "@/utils/keywords"]
exports:         ["createPersona"]

userStories:     ["*en tant que développeur je veux créer un persona"]
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
import { createPersonaSchema } from "@/lib/validations/persona";
import { slugifyWithFallback } from "@/utils/slugify";
import { parseKeywordsInput, stringifyKeywords } from "@/utils/keywords";
import type { ActionResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Unicité applicative du slug dans le projet                         */
/* ------------------------------------------------------------------ */

async function isSlugTaken(projectId: string, slug: string): Promise<boolean> {
  const existing = await prisma.persona.findFirst({
    where: { projectId, slug, deletedAt: null },
    select: { id: true },
  });
  return existing !== null;
}

async function findFreeSlug(projectId: string, base: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    if (!(await isSlugTaken(projectId, candidate))) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function createPersona(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = createPersonaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { projectId, name } = parsed.data;

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Projet introuvable ou accès refusé." };
  }

  const value = parsed.data.value?.trim() || null;
  const icon = parsed.data.icon?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;

  const keywordsList = parseKeywordsInput(parsed.data.keywordsInput ?? "");
  const keywords = stringifyKeywords(keywordsList);

  const baseSlug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugifyWithFallback(name, "persona");

  const slug = await findFreeSlug(projectId, baseSlug);

  const maxOrder = await prisma.persona.aggregate({
    where: { projectId, deletedAt: null },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    const persona = await prisma.persona.create({
      data: {
        projectId,
        name,
        slug,
        value,
        keywords,
        icon,
        accent,
        displayOrder,
      },
      select: { id: true, slug: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/personas`);
    return { success: true, data: persona };
  } catch (err) {
    console.error("[createPersona]", err);
    return { success: false, error: "Création impossible." };
  }
}