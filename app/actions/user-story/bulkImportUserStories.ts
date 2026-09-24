/*
path :           app/actions/user-story/bulkImportUserStories.ts
tag :            ["user-story", "bulk", "import", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import en lot de user stories pour un projet
                 donné. Le projectId est passé en PREMIER argument par la page
                 via `.bind(null, project.id)`. Résout parentSlug → parentId
                 et sprintSlug → sprintId. Un enfant peut référencer un Epic
                 créé DANS LE MÊME BATCH : la transaction interactive crée
                 d'abord tous les Epics, puis leurs enfants.

flow:            bulkImportUserStories(projectId, rawInput) → getSession()
                 → parse JSON si string → bulkImportUserStoriesSchema.safeParse
                 → assertProjectAccess → résolution slugs (batch dedup + DB)
                 → validation parentSlug (chaque parent doit exister en DB ou
                   dans le batch) → résolution sprintSlug → compute displayOrder
                 par parent → $transaction interactif : create Epics puis
                 create enfants avec parentId résolu → revalidatePath.

ecosystem:       UserStory = [
                   "@/app/actions/user-story/bulkImportUserStories.ts",
                   "@/app/actions/user-story/createUserStory.ts",
                   "@/app/actions/user-story/hardDeleteUserStory.ts",
                   "@/app/actions/user-story/restoreUserStory.ts",
                   "@/app/actions/user-story/softDeleteUserStory.ts",
                   "@/app/actions/user-story/updateUserStory.ts",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/trash/page.tsx",
                   "@/components/user-story/DeleteUserStoryButton.tsx",
                   "@/components/user-story/HardDeleteUserStoryButton.tsx",
                   "@/components/user-story/RestoreUserStoryButton.tsx",
                   "@/components/user-story/UserStoryCard.tsx",
                   "@/components/user-story/UserStoryForm.tsx",
                   "@/components/user-story/UserStoryMiniCard.tsx",
                   "@/components/user-story/UserStoryPriorityBadge.tsx",
                   "@/components/user-story/UserStoryStatusBadge.tsx",
                   "@/components/user-story/UserStoryTree.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/user-story.ts",
                   "@/lib/user-story/json.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/lib/validations/user-story.ts",
                  "@/lib/user-story/json.ts",
                  "@/lib/actions/types.ts",
                  "@/utils/slugify",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/validations/user-story",
                  "@/lib/user-story/json",
                  "@/lib/actions/types",
                  "@/utils/slugify"]
exports:         ["bulkImportUserStories"]
useBy:           ["@/app/back-studio/scrum/[slug]/backlog/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des user stories en lot"]
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
import { bulkImportUserStoriesSchema } from "@/lib/validations/user-story";
import {
  stringifyAcceptanceCriteria,
  stringifyStringList,
  type AcceptanceCriterion,
} from "@/lib/user-story/json";
import { slugifyWithFallback } from "@/utils/slugify";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PreparedStory = {
  /** "" si Epic racine, sinon slug de l'Epic parent. */
  parentSlug: string;
  /** null si pas de sprint, sinon ID déjà résolu. */
  sprintId: string | null;
  title: string;
  slug: string;
  personaRef: string | null;
  asA: string;
  iWant: string;
  soThat: string;
  status: string;
  priority: number;
  storyPoints: number | null;
  accent: string | null;
  acceptanceCriteria: string | null;
  dodChecked: string | null;
  linkedFiles: string | null;
  displayOrder: number;
};

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

export async function bulkImportUserStories(
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

  const parsed = bulkImportUserStoriesSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") ?? "?";
    return {
      success: false,
      error: `Données invalides (${path} : ${first?.message ?? "inconnu"}).`,
    };
  }

  const items = parsed.data;

  /* ---------- 2. Résolution des slugs (batch dedup) ---------- */

  const seen = new Set<string>();
  const prepared: PreparedStory[] = [];

  for (const item of items) {
    const baseSlug = item.slug?.trim()
      ? item.slug.trim()
      : slugifyWithFallback(item.title, "story");

    if (seen.has(baseSlug)) {
      return {
        success: false,
        error: `Slug dupliqué dans le JSON : « ${baseSlug} ».`,
      };
    }
    seen.add(baseSlug);

    /* Champs JSON sérialisés */
    const acceptanceLines = parseLines(item.acceptanceInput ?? "");
    const dodLines = parseLines(item.dodInput ?? "");
    const linkedFilesLines = parseLines(item.linkedFilesInput ?? "");

    prepared.push({
      parentSlug: item.parentSlug?.trim() ?? "",
      sprintId: null, // résolu plus bas
      title: item.title,
      slug: baseSlug,
      personaRef: item.personaRef?.trim() || null,
      asA: item.asA,
      iWant: item.iWant,
      soThat: item.soThat,
      status: item.status,
      priority: item.priority,
      storyPoints:
        item.storyPoints === "" || item.storyPoints === undefined
          ? null
          : Number(item.storyPoints),
      accent: item.accent?.trim() || null,
      acceptanceCriteria: stringifyAcceptanceCriteria(
        linesToAcceptanceCriteria(acceptanceLines),
      ),
      dodChecked: stringifyStringList(dodLines),
      linkedFiles: stringifyStringList(linkedFilesLines),
      displayOrder: 0, // assigné après
    });
  }

  /* ---------- 3. Collisions en base (1 requête) ---------- */

  const slugs = prepared.map((p) => p.slug);
  const existing = await prisma.userStory.findMany({
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

  /* ---------- 4. Résolution des parentSlug ---------- */

  /* On sépare Epics (parentSlug vide) et enfants (parentSlug non vide). */
  const epics = prepared.filter((p) => p.parentSlug === "");
  const children = prepared.filter((p) => p.parentSlug !== "");

  /* Slugs distincts référencés comme parents. */
  const referencedParentSlugs = [...new Set(children.map((c) => c.parentSlug))];
  const batchEpicSlugs = new Set(epics.map((e) => e.slug));

  /* Parents absents du batch → doivent exister en DB. */
  const externalParentSlugs = referencedParentSlugs.filter(
    (s) => !batchEpicSlugs.has(s),
  );

  const externalParents = externalParentSlugs.length
    ? await prisma.userStory.findMany({
        where: {
          projectId,
          slug: { in: externalParentSlugs },
          parentId: null,
          deletedAt: null,
        },
        select: { id: true, slug: true },
      })
    : [];

  const externalParentSlugToId = new Map(
    externalParents.map((p) => [p.slug, p.id]),
  );

  /* Chaque parentSlug référencé doit exister (batch OU DB). */
  for (const ref of referencedParentSlugs) {
    if (!batchEpicSlugs.has(ref) && !externalParentSlugToId.has(ref)) {
      return {
        success: false,
        error: `Epic parent introuvable : « ${ref} ». Fournis-le dans le JSON ou vérifie son slug.`,
      };
    }
  }

  /* Aucun item ne peut se déclarer comme son propre parent. */
  for (const item of prepared) {
    if (item.parentSlug !== "" && item.parentSlug === item.slug) {
      return {
        success: false,
        error: `La story « ${item.slug} » ne peut pas être son propre parent.`,
      };
    }
  }

  /* ---------- 5. Résolution des sprintSlug ---------- */

  const sprintSlugs = [
    ...new Set(
      items
        .map((it) => it.sprintSlug?.trim() ?? "")
        .filter((s) => s.length > 0),
    ),
  ];

  const sprintSlugToId = new Map<string, string>();
  if (sprintSlugs.length > 0) {
    const sprints = await prisma.sprint.findMany({
      where: {
        projectId,
        slug: { in: sprintSlugs },
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });
    for (const s of sprints) sprintSlugToId.set(s.slug, s.id);

    /* Chaque sprintSlug doit exister. */
    for (const s of sprintSlugs) {
      if (!sprintSlugToId.has(s)) {
        return {
          success: false,
          error: `Sprint introuvable dans ce projet : « ${s} ».`,
        };
      }
    }
  }

  /* On attache les sprintId résolus. */
  for (let i = 0; i < items.length; i++) {
    const raw = items[i]!.sprintSlug?.trim() ?? "";
    prepared[i]!.sprintId = raw ? (sprintSlugToId.get(raw) ?? null) : null;
  }

  /* ---------- 6. Calcul du displayOrder ---------- */

  /* 6a. Epics : compteur unique partagé (parentId = null). */
  const maxEpicOrder = await prisma.userStory.aggregate({
    where: { projectId, parentId: null, deletedAt: null },
    _max: { displayOrder: true },
  });
  let nextEpicOrder = (maxEpicOrder._max.displayOrder ?? -1) + 1;

  /* 6b. Enfants : compteur par parent (parmi les parents DÉJÀ en DB). */
  const childOrderByParentSlug = new Map<string, number>();

  if (externalParentSlugs.length > 0) {
    const parentChildren = await prisma.userStory.findMany({
      where: {
        projectId,
        parentId: { in: [...externalParentSlugToId.values()] },
        deletedAt: null,
      },
      select: { parentId: true, displayOrder: true },
    });

    const maxByParentId = new Map<string, number>();
    for (const c of parentChildren) {
      if (c.parentId === null) continue;
      const prev = maxByParentId.get(c.parentId) ?? -1;
      if (c.displayOrder > prev) maxByParentId.set(c.parentId, c.displayOrder);
    }

    for (const [slug, id] of externalParentSlugToId.entries()) {
      childOrderByParentSlug.set(slug, (maxByParentId.get(id) ?? -1) + 1);
    }
  }

  /* 6c. Assignation. */
  for (const p of prepared) {
    if (p.parentSlug === "") {
      p.displayOrder = nextEpicOrder++;
    } else {
      const current = childOrderByParentSlug.get(p.parentSlug) ?? 0;
      p.displayOrder = current;
      childOrderByParentSlug.set(p.parentSlug, current + 1);
    }
  }

  /* ---------- 7. Transaction interactive ---------- */

  try {
    await prisma.$transaction(async (tx) => {
      /* 7a. Créer tous les Epics, collecter slug → id. */
      const epicSlugToId = new Map<string, string>();

      for (const epic of epics) {
        const created = await tx.userStory.create({
          data: {
            projectId,
            parentId: null,
            title: epic.title,
            slug: epic.slug,
            personaRef: epic.personaRef,
            asA: epic.asA,
            iWant: epic.iWant,
            soThat: epic.soThat,
            status: epic.status,
            priority: epic.priority,
            storyPoints: epic.storyPoints,
            accent: epic.accent,
            sprintId: epic.sprintId,
            acceptanceCriteria: epic.acceptanceCriteria,
            dodChecked: epic.dodChecked,
            linkedFiles: epic.linkedFiles,
            displayOrder: epic.displayOrder,
          },
          select: { id: true, slug: true },
        });
        epicSlugToId.set(created.slug, created.id);
      }

      /* 7b. Créer les enfants, résoudre parentId. */
      for (const child of children) {
        const parentId =
          epicSlugToId.get(child.parentSlug) ??
          externalParentSlugToId.get(child.parentSlug);

        if (!parentId) {
          /* Ne devrait jamais arriver — on a validé avant. */
          throw new Error(`Parent introuvable pour « ${child.slug} ».`);
        }

        await tx.userStory.create({
          data: {
            projectId,
            parentId,
            title: child.title,
            slug: child.slug,
            personaRef: child.personaRef,
            asA: child.asA,
            iWant: child.iWant,
            soThat: child.soThat,
            status: child.status,
            priority: child.priority,
            storyPoints: child.storyPoints,
            accent: child.accent,
            sprintId: child.sprintId,
            acceptanceCriteria: child.acceptanceCriteria,
            dodChecked: child.dodChecked,
            linkedFiles: child.linkedFiles,
            displayOrder: child.displayOrder,
          },
        });
      }
    });

    revalidatePath("/back-studio/scrum", "layout");

    return { success: true, imported: prepared.length };
  } catch (err) {
    console.error("[bulkImportUserStories]", err);
    return { success: false, error: "Insertion impossible." };
  }
}