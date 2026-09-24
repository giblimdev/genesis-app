/*
path :           app/actions/feature/bulkImportFeatures.ts
tag :            ["feature", "bulk", "import", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import en lot de features pour un projet
                 donné. Le projectId est passé en PREMIER argument par la
                 page via `.bind(null, project.id)`. Reçoit un tableau JSON,
                 valide l'ensemble, détecte les collisions de slug intra-batch
                 ET en base (dans le projet), puis insère tout en une seule
                 transaction.

flow:            bulkImportFeatures(projectId, rawInput) → getSession()
                 → parse JSON si string → bulkImportFeaturesSchema.safeParse
                 → assertProjectAccess → slugify + batch dedup → findMany
                 collisions en base (projectId scopé) → aggregate max
                 displayOrder → $transaction de create → revalidatePath.

ecosystem:       Feature = [
                   "@/app/actions/feature/bulkImportFeatures.ts",
                   "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                   "@/lib/json-templates/feature.ts",
                   "@/lib/validations/feature.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/feature.ts",
                  "@/lib/actions/types.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/feature",
                  "@/lib/actions/types",
                  "@/utils/slugify"]
exports:         ["bulkImportFeatures"]
useBy:           ["@/app/back-studio/scrum/[slug]/features/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des features en lot"]
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
import { bulkImportFeaturesSchema } from "@/lib/validations/feature";
import { slugifyWithFallback } from "@/utils/slugify";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PreparedFeature = {
  name: string;
  slug: string;
  description: string;
  module: string;
  icon: string | null;
  accent: string | null;
  displayOrder: number;
};

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function bulkImportFeatures(
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

  const parsed = bulkImportFeaturesSchema.safeParse(parsedJson);
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
  const prepared: PreparedFeature[] = [];

  for (const item of items) {
    const baseSlug = item.slug?.trim()
      ? item.slug.trim()
      : slugifyWithFallback(item.name, "feature");

    if (seen.has(baseSlug)) {
      return {
        success: false,
        error: `Slug dupliqué dans le JSON : « ${baseSlug} ».`,
      };
    }
    seen.add(baseSlug);

    prepared.push({
      name: item.name,
      slug: baseSlug,
      description: item.description,
      module: item.module,
      icon: item.icon?.trim() || null,
      accent: item.accent?.trim() || null,
      displayOrder: 0, // assigné après
    });
  }

  /* ---------- 3. Étape 2 : collisions en base (1 requête) ---------- */

  const slugs = prepared.map((p) => p.slug);
  const existing = await prisma.feature.findMany({
    where: { projectId, slug: { in: slugs } },
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

  const maxOrder = await prisma.feature.aggregate({
    where: { projectId },
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
        prisma.feature.create({
          data: {
            projectId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            module: data.module,
            icon: data.icon,
            accent: data.accent,
            displayOrder: data.displayOrder,
          },
        }),
      ),
    );

    /* On ne connaît pas le slug du projet ici → on revalide par projectId. */
    revalidatePath("/back-studio/scrum", "layout");

    return { success: true, imported: prepared.length };
  } catch (err) {
    console.error("[bulkImportFeatures]", err);
    return { success: false, error: "Insertion impossible." };
  }
}