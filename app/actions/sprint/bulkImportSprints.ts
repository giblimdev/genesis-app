/*
path :           app/actions/sprint/bulkImportSprints.ts
tag :            ["sprint", "bulk", "import", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import en lot de sprints pour un projet donné.
                 Le projectId est passé en PREMIER argument par la page via
                 `.bind(null, project.id)`. Reçoit un tableau JSON, valide
                 l'ensemble, détecte les collisions de slug intra-batch ET en
                 base (dans le projet, hors soft-deleted), puis insère tout en
                 une seule transaction.

flow:            bulkImportSprints(projectId, rawInput) → getSession()
                 → parse JSON si string → bulkImportSprintsSchema.safeParse
                 → assertProjectAccess → slugify + batch dedup →
                 findMany collisions en base (projectId scopé, deletedAt null)
                 → aggregate max displayOrder → $transaction de create →
                 revalidatePath.

ecosystem:       Sprint = [
                   "@/app/actions/sprint/assignStoryToSprint.ts",
                   "@/app/actions/sprint/bulkImportSprints.ts",
                   "@/app/actions/sprint/changeSprintStatus.ts",
                   "@/app/actions/sprint/createSprint.ts",
                   "@/app/actions/sprint/hardDeleteSprint.ts",
                   "@/app/actions/sprint/reorderSprintStories.ts",
                   "@/app/actions/sprint/restoreSprint.ts",
                   "@/app/actions/sprint/softDeleteSprint.ts",
                   "@/app/actions/sprint/unassignStoryFromSprint.ts",
                   "@/app/actions/sprint/updateSprint.ts",
                   "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/trash/page.tsx",
                   "@/components/sprint/DeleteSprintButton.tsx",
                   "@/components/sprint/HardDeleteSprintButton.tsx",
                   "@/components/sprint/RestoreSprintButton.tsx",
                   "@/components/sprint/SprintBoard.tsx",
                   "@/components/sprint/SprintCard.tsx",
                   "@/components/sprint/SprintForm.tsx",
                   "@/components/sprint/SprintStatusBadge.tsx",
                   "@/components/sprint/SprintStatusSelect.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/sprint.ts",
                   "@/lib/sprint/lock.ts",
                   "@/lib/sprint/transitions.ts",
                   "@/lib/validations/sprint.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/sprint.ts",
                  "@/lib/actions/types.ts",
                  "@/utils/slugify",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types",
                  "@/utils/slugify"]
exports:         ["bulkImportSprints"]
useBy:           ["@/app/back-studio/scrum/[slug]/sprints/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des sprints en lot"]
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
import { bulkImportSprintsSchema } from "@/lib/validations/sprint";
import { slugifyWithFallback } from "@/utils/slugify";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PreparedSprint = {
  name: string;
  slug: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  durationWeeks: number;
  status: string;
  capacityPoints: number;
  velocity: number | null;
  notes: string | null;
  accent: string | null;
  displayOrder: number;
};

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function bulkImportSprints(
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

  const parsed = bulkImportSprintsSchema.safeParse(parsedJson);
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
  const prepared: PreparedSprint[] = [];

  for (const item of items) {
    const baseSlug = item.slug?.trim()
      ? item.slug.trim()
      : slugifyWithFallback(item.name, "sprint");

    if (seen.has(baseSlug)) {
      return {
        success: false,
        error: `Slug dupliqué dans le JSON : « ${baseSlug} ».`,
      };
    }
    seen.add(baseSlug);

    /* velocity : nombre ou null */
    const velocity =
      item.velocity === "" || item.velocity === undefined
        ? null
        : Number(item.velocity);

    prepared.push({
      name: item.name,
      slug: baseSlug,
      goal: item.goal,
      startDate: item.startDate,
      endDate: item.endDate,
      durationWeeks: item.durationWeeks,
      status: item.status,
      capacityPoints: item.capacityPoints,
      velocity,
      notes: item.notes?.trim() || null,
      accent: item.accent?.trim() || null,
      displayOrder: 0, // assigné après
    });
  }

  /* ---------- 3. Étape 2 : collisions en base (1 requête) ---------- */

  const slugs = prepared.map((p) => p.slug);
  const existing = await prisma.sprint.findMany({
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

  const maxOrder = await prisma.sprint.aggregate({
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
        prisma.sprint.create({
          data: {
            projectId,
            name: data.name,
            slug: data.slug,
            goal: data.goal,
            startDate: data.startDate,
            endDate: data.endDate,
            durationWeeks: data.durationWeeks,
            status: data.status,
            capacityPoints: data.capacityPoints,
            velocity: data.velocity,
            notes: data.notes,
            accent: data.accent,
            displayOrder: data.displayOrder,
          },
        }),
      ),
    );

    revalidatePath("/back-studio/scrum", "layout");

    return { success: true, imported: prepared.length };
  } catch (err) {
    console.error("[bulkImportSprints]", err);
    return { success: false, error: "Insertion impossible." };
  }
}