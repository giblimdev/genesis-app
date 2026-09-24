/*
path :           app/actions/project/bulkImportProjects.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import en lot de projets depuis un JSON.
                 Reçoit un tableau de projets, valide l'ensemble, détecte
                 les collisions de slug intra-batch ET en base, puis
                 insère tout en une seule transaction.

flow:            bulkImportProjects(input) → getSession() → parse JSON
                 → bulkImportProjectsSchema.safeParse → pour chaque projet :
                 slugify + findFreeSlug → collecte prepared[] → vérifie
                 l'absence de doublons intra-batch → une seule requête
                 findMany pour les collisions en base → $transaction de
                 create → revalidatePath("/back-studio/scrum").

ecosystem:       Dev = [
                   "@/app/actions/project/bulkImportProjects.ts",
                   "@/lib/validations/project.ts",
                   "@/lib/actions/types.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/auth/session.ts",
                  "@/lib/validations/project.ts",
                  "@/lib/actions/types.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/validations/project", "@/lib/actions/types",
                  "@/lib/utils/slugify"]
exports:         ["bulkImportProjects"]

userStories:     ["*en tant que développeur je veux importer des projets en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { bulkImportProjectsSchema } from "@/lib/validations/project";
import { slugifyWithFallback } from "@/utils/slugify";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PreparedProject = {
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  status: string;
  displayOrder: number;
};

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function bulkImportProjects(
  rawInput: unknown,
): Promise<BulkImportResult> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  /* ---------- Parse + validation ---------- */

  let parsedJson: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      parsedJson = JSON.parse(rawInput);
    } catch {
      return { success: false, error: "JSON invalide." };
    }
  }

  const parsed = bulkImportProjectsSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first.path.join(".");
    return {
      success: false,
      error: `Données invalides (${path} : ${first.message}).`,
    };
  }

  const items = parsed.data;

  /* ---------- Étape 1 : calcul du displayOrder de départ ---------- */

  const maxOrder = await prisma.project.aggregate({
    where: { deletedAt: null },
    _max: { displayOrder: true },
  });
  let nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  /* ---------- Étape 2 : résolution des slugs (dans le batch) ---------- */

  const seen = new Set<string>();
  const prepared: PreparedProject[] = [];

  for (const item of items) {
    const baseSlug = item.slug?.trim()
      ? item.slug.trim()
      : slugifyWithFallback(item.name, "project");

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
      tagline: item.tagline?.trim() || null,
      description: item.description,
      status: item.status,
      displayOrder: nextOrder++,
    });
  }

  /* ---------- Étape 3 : collisions en base (une seule requête) ---------- */

  const slugs = prepared.map((p) => p.slug);
  const existing = await prisma.project.findMany({
    where: { slug: { in: slugs }, deletedAt: null },
    select: { slug: true },
  });

  if (existing.length > 0) {
    const conflictList = existing.map((e) => e.slug).join(", ");
    return {
      success: false,
      error: `Slugs déjà utilisés en base : ${conflictList}.`,
    };
  }

  /* ---------- Étape 4 : transaction ---------- */

  try {
    await prisma.$transaction(
      prepared.map((data) =>
        prisma.project.create({
          data: {
            name: data.name,
            slug: data.slug,
            tagline: data.tagline,
            description: data.description,
            status: data.status,
            displayOrder: data.displayOrder,
            ownerId: session.user.id,
            users: { connect: { id: session.user.id } },
          },
        }),
      ),
    );

    revalidatePath("/back-studio/scrum");
    return { success: true, imported: prepared.length };
  } catch (err) {
    console.error("[bulkImportProjects]", err);
    return { success: false, error: "Insertion impossible." };
  }
}
