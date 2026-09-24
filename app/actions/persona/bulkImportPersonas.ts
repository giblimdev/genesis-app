/*
path :           app/actions/persona/bulkImportPersonas.ts
tag :            ["persona", "bulk", "import", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import en lot de personas pour un projet
                 donné. Le projectId est passé en PREMIER argument par la
                 page via `.bind(null, project.id)`. Reçoit un tableau JSON,
                 valide l'ensemble, convertit les keywords en JSON stringifié,
                 détecte les collisions de slug intra-batch ET en base (dans
                 le projet, hors soft-deleted), puis insère tout en une seule
                 transaction.

flow:            bulkImportPersonas(projectId, rawInput) → getSession()
                 → parse JSON si string → bulkImportPersonasSchema.safeParse
                 → assertProjectAccess → slugify + batch dedup →
                 findMany collisions en base (projectId scopé, deletedAt null)
                 → aggregate max displayOrder → $transaction de create →
                 revalidatePath.

ecosystem:       Persona = [
                   "@/app/actions/persona/bulkImportPersonas.ts",
                   "@/app/actions/persona/createPersona.ts",
                   "@/app/actions/persona/hardDeletePersona.ts",
                   "@/app/actions/persona/restorePersona.ts",
                   "@/app/actions/persona/softDeletePersona.ts",
                   "@/app/actions/persona/updatePersona.ts",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx",
                   "@/components/persona/DeletePersonaButton.tsx",
                   "@/components/persona/HardDeletePersonaButton.tsx",
                   "@/components/persona/PersonaCard.tsx",
                   "@/components/persona/PersonaForm.tsx",
                   "@/components/persona/RestorePersonaButton.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/persona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/persona.ts",
                  "@/lib/actions/types.ts",
                  "@/utils/slugify",
                  "@/utils/keywords",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/persona",
                  "@/lib/actions/types",
                  "@/utils/slugify", "@/utils/keywords"]
exports:         ["bulkImportPersonas"]
useBy:           ["@/app/back-studio/scrum/[slug]/personas/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des personas en lot"]
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
import { bulkImportPersonasSchema } from "@/lib/validations/persona";
import { slugifyWithFallback } from "@/utils/slugify";
import { parseKeywordsInput, stringifyKeywords } from "@/utils/keywords";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PreparedPersona = {
  name: string;
  slug: string;
  value: string | null;
  keywords: string | null;
  icon: string | null;
  accent: string | null;
  displayOrder: number;
};

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function bulkImportPersonas(
  projectId: string,
  rawInput: unknown,
): Promise<BulkImportResult> {
  /* ---------- 0. Sécurité / auth ---------- */

  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentification requise." };
  }

  if (typeof projectId !== "string" || projectId.length === 0) {
    return { success: false, error: "Projet introuvable." };
  }

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return { success: false, error: "Projet introuvable ou accès refusé." };
  }

  /* ---------- 1. Parse + validation ---------- */

  let parsedJson: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      parsedJson = JSON.parse(rawInput);
    } catch {
      return { success: false, error: "JSON invalide." };
    }
  }

  const parsed = bulkImportPersonasSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") ?? "?";
    return {
      success: false,
      error: `Données invalides (${path} : ${first?.message ?? "inconnu"}).`,
    };
  }

  const items = parsed.data;

  /* ---------- 2. Étape 1 : résolution des slugs (batch) ---------- */

  const seen = new Set<string>();
  const prepared: PreparedPersona[] = [];

  for (const item of items) {
    const baseSlug = item.slug?.trim()
      ? item.slug.trim()
      : slugifyWithFallback(item.name, "persona");

    if (seen.has(baseSlug)) {
      return {
        success: false,
        error: `Slug dupliqué dans le JSON : « ${baseSlug} ».`,
      };
    }
    seen.add(baseSlug);

    const keywordsList = parseKeywordsInput(item.keywordsInput ?? "");
    const keywords = stringifyKeywords(keywordsList);

    prepared.push({
      name: item.name,
      slug: baseSlug,
      value: item.value?.trim() || null,
      keywords,
      icon: item.icon?.trim() || null,
      accent: item.accent?.trim() || null,
      displayOrder: 0, // assigné après
    });
  }

  /* ---------- 3. Étape 2 : collisions en base (1 requête) ---------- */

  const slugs = prepared.map((p) => p.slug);
  const existing = await prisma.persona.findMany({
    where: {
      projectId,
      slug: { in: slugs },
      deletedAt: null,
    },
    select: { slug: true },
  });

  if (existing.length > 0) {
    const conflictList = existing.map((e) => e.slug).join(", ");
    return {
      success: false,
      error: `Slugs déjà utilisés dans ce projet : ${conflictList}.`,
    };
  }

  /* ---------- 4. Étape 3 : calcul du displayOrder de départ ---------- */

  const maxOrder = await prisma.persona.aggregate({
    where: { projectId, deletedAt: null },
    _max: { displayOrder: true },
  });
  let nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  for (const p of prepared) {
    p.displayOrder = nextOrder++;
  }

  /* ---------- 5. Étape 4 : transaction ---------- */

  try {
    await prisma.$transaction(
      prepared.map((data) =>
        prisma.persona.create({
          data: {
            projectId,
            name: data.name,
            slug: data.slug,
            value: data.value,
            keywords: data.keywords,
            icon: data.icon,
            accent: data.accent,
            displayOrder: data.displayOrder,
          },
        }),
      ),
    );

    revalidatePath("/back-studio/scrum", "layout");

    return { success: true, imported: prepared.length };
  } catch (err) {
    console.error("[bulkImportPersonas]", err);
    return { success: false, error: "Insertion impossible." };
  }
}