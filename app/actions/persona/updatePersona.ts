/*
path :           app/actions/persona/updatePersona.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action de mise à jour d'un persona. Recalcule le slug si le
                 nom change et que le slug est laissé vide. Resérialise les keywords.
                 Vérifie l'accès au projet parent et refuse les personas soft-deleted.
flow:            updatePersona(input) → getSession() → updatePersonaSchema.safeParse
                 → findFirst({ id, projectId, deletedAt: null }) → assertProjectAccess
                 → si slug vide : slugify + findFreeSlug → prisma.persona.update →
                 revalidatePath.
ecosystem:       Dev = [
                   "@/app/actions/persona/updatePersona.ts",
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
exports:         ["updatePersona"]

userStories:     ["*en tant que développeur je veux modifier un persona"]
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
import { updatePersonaSchema } from "@/lib/validations/persona";
import { slugifyWithFallback } from "@/utils/slugify";
import { parseKeywordsInput, stringifyKeywords } from "@/utils/keywords";
import type { ActionResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Unicité applicative du slug dans le projet                         */
/* ------------------------------------------------------------------ */

async function isSlugTaken(
  projectId: string,
  slug: string,
  excludeId: string,
): Promise<boolean> {
  const existing = await prisma.persona.findFirst({
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

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function updatePersona(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; projectId: string }>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = updatePersonaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, projectId, name } = parsed.data;

  const current = await prisma.persona.findFirst({
    where: { id, projectId, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!current) {
    return { success: false, error: "Persona introuvable." };
  }

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  const value = parsed.data.value?.trim() || null;
  const icon = parsed.data.icon?.trim() || null;
  const accent = parsed.data.accent?.trim() || null;

  const keywordsList = parseKeywordsInput(parsed.data.keywordsInput ?? "");
  const keywords = stringifyKeywords(keywordsList);

  const explicitSlug = parsed.data.slug?.trim();
  const nextSlug = explicitSlug
    ? await findFreeSlug(projectId, explicitSlug, id)
    : await findFreeSlug(
        projectId,
        slugifyWithFallback(name, "persona"),
        id,
      );

  try {
    const persona = await prisma.persona.update({
      where: { id },
      data: {
        name,
        slug: nextSlug,
        value,
        keywords,
        icon,
        accent,
      },
      select: { id: true, slug: true, projectId: true },
    });

    revalidatePath(`/back-studio/scrum/${projectId}/personas`);
    revalidatePath(`/back-studio/scrum/${projectId}/personas/${persona.slug}`);
    return { success: true, data: { id: persona.id, slug: persona.slug, projectId } };
  } catch (err) {
    console.error("[updatePersona]", err);
    return { success: false, error: "Mise à jour impossible." };
  }
}