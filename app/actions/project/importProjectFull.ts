/*
path :           app/actions/project/importProjectFull.ts
tag :            ["project", "import", "snapshot", "upsert", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action d'import complet d'un projet à partir d'un
                 snapshot JSON. UPSERT par slug sur toutes les entités :
                 projet, features, personas, sprints, user stories, tasks.
                 Les relations (parentSlug, sprintSlug, userStorySlug,
                 assigneeEmail) sont résolues en séquentiel.

flow:            importProjectFull(rawInput) → getSession() → parse JSON
                 → projectSnapshotSchema.safeParse →
                   1. Upsert project (par slug)
                   2. Upsert sprints (slug → id)
                   3. Upsert features
                   4. Upsert personas
                   5. Upsert user stories (Epics puis enfants)
                   6. Upsert tasks (par userStorySlug + title)
                 → revalidatePath.

                 PAS de $transaction interactive : l'adapter better-sqlite3
                 la supporte mal (spinner infini). Toutes les opérations
                 sont séquentielles — si une échoue, l'état partiel reste
                 visible mais les logs indiquent où ça a cassé.

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/actions/project/importProjectFull.ts",
                   "@/app/back-studio/scrum/page.tsx",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/validations/project.ts",
                  "@/lib/actions/types.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/validations/project",
                  "@/lib/actions/types"]
exports:         ["importProjectFull"]
useBy:           ["@/app/back-studio/scrum/page.tsx"]

userStories:     ["*en tant que développeur je veux restaurer un projet complet depuis JSON"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { projectSnapshotSchema } from "@/lib/validations/project";
import type { BulkImportResult } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function orNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function checkUnique(slugs: readonly string[], label: string): string | null {
  const seen = new Set<string>();
  for (const s of slugs) {
    if (seen.has(s)) return `Slug dupliqué dans ${label} : « ${s} ».`;
    seen.add(s);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

export async function importProjectFull(
  rawInput: unknown,
): Promise<BulkImportResult> {
  console.log("🟢 [importProjectFull] START");

  /* ---------- 0. Auth ---------- */

  const session = await getSession();
  if (!session?.user?.id) {
    console.log("🔴 [importProjectFull] No session");
    return { success: false, error: "Authentification requise." };
  }
  const userId = session.user.id;
  console.log("🟢 [importProjectFull] userId =", userId);

  /* ---------- 1. Parse + validation ---------- */

  let parsedJson: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      parsedJson = JSON.parse(rawInput);
      console.log("🟢 [importProjectFull] JSON parsed OK");
    } catch (err) {
      console.log("🔴 [importProjectFull] JSON.parse error:", err);
      return { success: false, error: "JSON invalide." };
    }
  }

  const parsed = projectSnapshotSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") ?? "?";
    console.log("🔴 [importProjectFull] Zod error:", first);
    return {
      success: false,
      error: `Données invalides (${path} : ${first?.message ?? "inconnu"}).`,
    };
  }

  const snap = parsed.data;
  const projectSlug = snap.project.slug;
  console.log("🟢 [importProjectFull] Zod OK. Project slug:", projectSlug);
  console.log("🟢 [importProjectFull] counts:", {
    features: snap.features.length,
    personas: snap.personas.length,
    userStories: snap.userStories.length,
    sprints: snap.sprints.length,
    tasks: snap.tasks.length,
  });

  /* ---------- 2. Validations batch ---------- */

  const dupErr =
    checkUnique(snap.features.map((f) => f.slug), "features") ??
    checkUnique(snap.personas.map((p) => p.slug), "personas") ??
    checkUnique(snap.sprints.map((s) => s.slug), "sprints") ??
    checkUnique(snap.userStories.map((s) => s.slug), "userStories");

  if (dupErr) {
    console.log("🔴 [importProjectFull] dupErr:", dupErr);
    return { success: false, error: dupErr };
  }

  /* ---------- 3. Compteurs de progression ---------- */

  let created = 0;
  let updated = 0;
  const track = (wasExisting: boolean) => {
    if (wasExisting) updated += 1;
    else created += 1;
  };

  /* ================================================================ */
  /*  4. Upsert PROJECT                                              */
  /* ================================================================ */

  try {
    console.log("🟢 [importProjectFull] Upserting project…");

    const existingProject = await prisma.project.findFirst({
      where: { slug: projectSlug, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    let projectId: string;

    if (existingProject) {
      const isOwner = existingProject.ownerId === userId;
      if (!isOwner) {
        const isMember = await prisma.project.findFirst({
          where: {
            id: existingProject.id,
            users: { some: { id: userId } },
          },
          select: { id: true },
        });
        if (!isMember) {
          return {
            success: false,
            error: `Tu n'as pas accès au projet « ${projectSlug} ».`,
          };
        }
      }

      await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          name: snap.project.name,
          tagline: orNull(snap.project.tagline),
          description: snap.project.description,
          status: snap.project.status,
        },
      });
      projectId = existingProject.id;
      console.log("🟢 [importProjectFull] Project updated:", projectId);
    } else {
      const createdProject = await prisma.project.create({
        data: {
          name: snap.project.name,
          slug: projectSlug,
          tagline: orNull(snap.project.tagline),
          description: snap.project.description,
          status: snap.project.status,
          ownerId: userId,
          users: { connect: { id: userId } },
        },
        select: { id: true },
      });
      projectId = createdProject.id;
      console.log("🟢 [importProjectFull] Project created:", projectId);
    }

    /* ============================================================== */
    /*  5. Upsert SPRINTS                                            */
    /* ============================================================== */

    console.log("🟢 [importProjectFull] Upserting sprints…");

    const existingSprints = await prisma.sprint.findMany({
      where: {
        projectId,
        slug: { in: snap.sprints.map((s) => s.slug) },
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });
    const sprintSlugToId = new Map(
      existingSprints.map((s) => [s.slug, s.id]),
    );

    const maxSprintOrder = await prisma.sprint.aggregate({
      where: { projectId, deletedAt: null },
      _max: { displayOrder: true },
    });
    let nextSprintOrder = (maxSprintOrder._max.displayOrder ?? -1) + 1;

    for (const s of snap.sprints) {
      const existingId = sprintSlugToId.get(s.slug);
      const data = {
        name: s.name,
        goal: s.goal,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate),
        durationWeeks: s.durationWeeks,
        status: s.status,
        capacityPoints: s.capacityPoints,
        velocity: s.velocity,
        notes: orNull(s.notes),
        accent: orNull(s.accent),
      };

      if (existingId) {
        await prisma.sprint.update({ where: { id: existingId }, data });
        track(true);
      } else {
        const inserted = await prisma.sprint.create({
          data: {
            projectId,
            slug: s.slug,
            displayOrder: s.displayOrder ?? nextSprintOrder,
            ...data,
          },
          select: { id: true },
        });
        sprintSlugToId.set(s.slug, inserted.id);
        nextSprintOrder += 1;
        track(false);
      }
    }
    console.log("🟢 [importProjectFull] Sprints done. Total:", snap.sprints.length);

    /* ============================================================== */
    /*  6. Upsert FEATURES                                           */
    /* ============================================================== */

    console.log("🟢 [importProjectFull] Upserting features…");

    const existingFeatures = await prisma.feature.findMany({
      where: {
        projectId,
        slug: { in: snap.features.map((f) => f.slug) },
      },
      select: { id: true, slug: true },
    });
    const featureSlugToId = new Map(
      existingFeatures.map((f) => [f.slug, f.id]),
    );

    const maxFeatureOrder = await prisma.feature.aggregate({
      where: { projectId },
      _max: { displayOrder: true },
    });
    let nextFeatureOrder = (maxFeatureOrder._max.displayOrder ?? -1) + 1;

    for (const f of snap.features) {
      const existingId = featureSlugToId.get(f.slug);
      const data = {
        name: f.name,
        description: f.description,
        module: f.module,
        icon: orNull(f.icon),
        accent: orNull(f.accent),
      };
      if (existingId) {
        await prisma.feature.update({ where: { id: existingId }, data });
        track(true);
      } else {
        await prisma.feature.create({
          data: {
            projectId,
            slug: f.slug,
            displayOrder: f.displayOrder ?? nextFeatureOrder,
            ...data,
          },
        });
        nextFeatureOrder += 1;
        track(false);
      }
    }
    console.log("🟢 [importProjectFull] Features done. Total:", snap.features.length);

    /* ============================================================== */
    /*  7. Upsert PERSONAS                                           */
    /* ============================================================== */

    console.log("🟢 [importProjectFull] Upserting personas…");

    const existingPersonas = await prisma.persona.findMany({
      where: {
        projectId,
        slug: { in: snap.personas.map((p) => p.slug) },
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });
    const personaSlugToId = new Map(
      existingPersonas.map((p) => [p.slug, p.id]),
    );

    const maxPersonaOrder = await prisma.persona.aggregate({
      where: { projectId, deletedAt: null },
      _max: { displayOrder: true },
    });
    let nextPersonaOrder = (maxPersonaOrder._max.displayOrder ?? -1) + 1;

    for (const p of snap.personas) {
      const existingId = personaSlugToId.get(p.slug);
      const data = {
        name: p.name,
        value: orNull(p.value),
        keywords: orNull(p.keywords),
        icon: orNull(p.icon),
        accent: orNull(p.accent),
      };
      if (existingId) {
        await prisma.persona.update({ where: { id: existingId }, data });
        track(true);
      } else {
        await prisma.persona.create({
          data: {
            projectId,
            slug: p.slug,
            displayOrder: p.displayOrder ?? nextPersonaOrder,
            ...data,
          },
        });
        nextPersonaOrder += 1;
        track(false);
      }
    }
    console.log("🟢 [importProjectFull] Personas done. Total:", snap.personas.length);

    /* ============================================================== */
    /*  8. Upsert USER STORIES                                       */
    /* ============================================================== */

    console.log("🟢 [importProjectFull] Upserting user stories…");

    const epics = snap.userStories.filter((s) => s.parentSlug === null);
    const stories = snap.userStories.filter((s) => s.parentSlug !== null);

    const batchEpicSlugs = new Set(epics.map((e) => e.slug));
    const referencedParentSlugs = [
      ...new Set(stories.map((s) => s.parentSlug!)),
    ];
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

    for (const ref of referencedParentSlugs) {
      if (!batchEpicSlugs.has(ref) && !externalParentSlugToId.has(ref)) {
        return {
          success: false,
          error: `Epic parent introuvable : « ${ref} ». Fournis-le dans le JSON.`,
        };
      }
    }

    for (const s of snap.userStories) {
      if (s.parentSlug !== null && s.parentSlug === s.slug) {
        return {
          success: false,
          error: `La story « ${s.slug} » ne peut pas être son propre parent.`,
        };
      }
    }

    /* Sprints référencés. */
    const referencedSprintSlugs = [
      ...new Set(
        snap.userStories
          .map((s) => s.sprintSlug)
          .filter((s): s is string => s !== null),
      ),
    ];
    const missingSprintSlugs = referencedSprintSlugs.filter(
      (s) => !sprintSlugToId.has(s),
    );
    if (missingSprintSlugs.length > 0) {
      const external = await prisma.sprint.findMany({
        where: {
          projectId,
          slug: { in: missingSprintSlugs },
          deletedAt: null,
        },
        select: { id: true, slug: true },
      });
      for (const sp of external) sprintSlugToId.set(sp.slug, sp.id);
      const stillMissing = missingSprintSlugs.filter(
        (s) => !sprintSlugToId.has(s),
      );
      if (stillMissing.length > 0) {
        return {
          success: false,
          error: `Sprint introuvable : « ${stillMissing.join(", ")} ».`,
        };
      }
    }

    const existingStories = await prisma.userStory.findMany({
      where: {
        projectId,
        slug: { in: snap.userStories.map((s) => s.slug) },
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });
    const storySlugToId = new Map(
      existingStories.map((s) => [s.slug, s.id]),
    );

    const maxEpicOrder = await prisma.userStory.aggregate({
      where: { projectId, parentId: null, deletedAt: null },
      _max: { displayOrder: true },
    });
    let nextEpicOrder = (maxEpicOrder._max.displayOrder ?? -1) + 1;

    /* A. Epics. */
    for (const e of epics) {
      const existingId = storySlugToId.get(e.slug);
      const data = {
        title: e.title,
        personaRef: orNull(e.personaRef),
        asA: e.asA,
        iWant: e.iWant,
        soThat: e.soThat,
        status: e.status,
        priority: e.priority,
        storyPoints: e.storyPoints,
        accent: orNull(e.accent),
        sprintId: e.sprintSlug
          ? (sprintSlugToId.get(e.sprintSlug) ?? null)
          : null,
        acceptanceCriteria: orNull(e.acceptanceCriteria),
        dodChecked: orNull(e.dodChecked),
        linkedFiles: orNull(e.linkedFiles),
      };
      if (existingId) {
        await prisma.userStory.update({
          where: { id: existingId },
          data: { ...data, parentId: null },
        });
        track(true);
      } else {
        const createdStory = await prisma.userStory.create({
          data: {
            projectId,
            parentId: null,
            slug: e.slug,
            displayOrder: e.displayOrder ?? nextEpicOrder,
            ...data,
          },
          select: { id: true },
        });
        storySlugToId.set(e.slug, createdStory.id);
        nextEpicOrder += 1;
        track(false);
      }
    }
    console.log("🟢 [importProjectFull] Epics done. Total:", epics.length);

    /* B. Stories (enfants) — displayOrder par parent. */
    const childOrderByParentSlug = new Map<string, number>();

    const allParentIds = [
      ...new Set([
        ...storySlugToId.values(),
        ...externalParentSlugToId.values(),
      ]),
    ];
    if (allParentIds.length > 0) {
      const existingChildren = await prisma.userStory.findMany({
        where: {
          projectId,
          parentId: { in: allParentIds },
          deletedAt: null,
        },
        select: { parentId: true, displayOrder: true },
      });
      const maxByParentId = new Map<string, number>();
      for (const c of existingChildren) {
        if (c.parentId === null) continue;
        const prev = maxByParentId.get(c.parentId) ?? -1;
        if (c.displayOrder > prev) maxByParentId.set(c.parentId, c.displayOrder);
      }
      for (const [slug, id] of storySlugToId.entries()) {
        childOrderByParentSlug.set(slug, (maxByParentId.get(id) ?? -1) + 1);
      }
      for (const [slug, id] of externalParentSlugToId.entries()) {
        childOrderByParentSlug.set(slug, (maxByParentId.get(id) ?? -1) + 1);
      }
    }

    for (const s of stories) {
      const parentId =
        storySlugToId.get(s.parentSlug!) ??
        externalParentSlugToId.get(s.parentSlug!);
      if (!parentId) {
        return {
          success: false,
          error: `Parent introuvable pour « ${s.slug} ».`,
        };
      }

      const existingId = storySlugToId.get(s.slug);
      const data = {
        parentId,
        title: s.title,
        personaRef: orNull(s.personaRef),
        asA: s.asA,
        iWant: s.iWant,
        soThat: s.soThat,
        status: s.status,
        priority: s.priority,
        storyPoints: s.storyPoints,
        accent: orNull(s.accent),
        sprintId: s.sprintSlug
          ? (sprintSlugToId.get(s.sprintSlug) ?? null)
          : null,
        acceptanceCriteria: orNull(s.acceptanceCriteria),
        dodChecked: orNull(s.dodChecked),
        linkedFiles: orNull(s.linkedFiles),
      };
      if (existingId) {
        await prisma.userStory.update({ where: { id: existingId }, data });
        track(true);
      } else {
        const current = childOrderByParentSlug.get(s.parentSlug!) ?? 0;
        const createdChild = await prisma.userStory.create({
          data: {
            projectId,
            slug: s.slug,
            displayOrder: s.displayOrder ?? current,
            ...data,
          },
          select: { id: true },
        });
        storySlugToId.set(s.slug, createdChild.id);
        childOrderByParentSlug.set(s.parentSlug!, current + 1);
        track(false);
      }
    }
    console.log("🟢 [importProjectFull] Stories done. Total:", stories.length);

    /* ============================================================== */
    /*  9. Upsert TASKS                                              */
    /* ============================================================== */

    if (snap.tasks.length > 0) {
      console.log("🟢 [importProjectFull] Upserting tasks…");

      /* Résoudre les assigneeEmail → userId. */
      const emails = [
        ...new Set(
          snap.tasks
            .map((t) => t.assigneeEmail)
            .filter((e): e is string => e !== null),
        ),
      ];
      const usersByEmail = new Map<string, string>();
      if (emails.length > 0) {
        const users = await prisma.user.findMany({
          where: { email: { in: emails }, deletedAt: null },
          select: { id: true, email: true },
        });
        for (const u of users) usersByEmail.set(u.email, u.id);
      }

      /* Charge les tasks existantes des stories concernées. */
      const tasksByStory = new Map<string, { id: string; title: string }[]>();
      const referencedStoryIds = [
        ...new Set(
          snap.tasks
            .map((t) => storySlugToId.get(t.userStorySlug))
            .filter((id): id is string => id !== undefined),
        ),
      ];
      if (referencedStoryIds.length > 0) {
        const existingTasks = await prisma.task.findMany({
          where: { userStoryId: { in: referencedStoryIds } },
          select: { id: true, title: true, userStoryId: true },
        });
        for (const t of existingTasks) {
          const list = tasksByStory.get(t.userStoryId) ?? [];
          list.push({ id: t.id, title: t.title });
          tasksByStory.set(t.userStoryId, list);
        }
      }

      const nextOrderByStoryId = new Map<string, number>();
      for (const storyId of referencedStoryIds) {
        const tasks = tasksByStory.get(storyId) ?? [];
        nextOrderByStoryId.set(storyId, tasks.length);
      }

      for (const t of snap.tasks) {
        const storyId = storySlugToId.get(t.userStorySlug);
        if (!storyId) {
          return {
            success: false,
            error: `User story introuvable pour la tâche « ${t.title} » (storySlug: ${t.userStorySlug}).`,
          };
        }

        const assigneeId = t.assigneeEmail
          ? (usersByEmail.get(t.assigneeEmail) ?? null)
          : null;

        const data = {
          title: t.title,
          description: t.description,
          assigneeId,
          estimateHours: t.estimateHours,
          status: t.status,
          blockedBy: orNull(t.blockedBy),
          notes: orNull(t.notes),
        };

        const existingList = tasksByStory.get(storyId) ?? [];
        const existing = existingList.find((x) => x.title === t.title);

        if (existing) {
          await prisma.task.update({ where: { id: existing.id }, data });
          track(true);
        } else {
          const nextOrder = nextOrderByStoryId.get(storyId) ?? 0;
          await prisma.task.create({
            data: {
              userStoryId: storyId,
              displayOrder: t.displayOrder ?? nextOrder,
              ...data,
            },
          });
          existingList.push({ id: "new", title: t.title });
          tasksByStory.set(storyId, existingList);
          nextOrderByStoryId.set(storyId, nextOrder + 1);
          track(false);
        }
      }
      console.log("🟢 [importProjectFull] Tasks done. Total:", snap.tasks.length);
    }

    /* ============================================================== */
    /*  10. Invalidation du cache                                     */
    /* ============================================================== */

    revalidatePath("/back-studio/scrum");
    revalidatePath("/back-studio/scrum", "layout");

    const total = created + updated;
    console.log("🟢 [importProjectFull] DONE:", { created, updated, total });

    return {
      success: true,
      imported: total,
      created,
      updated,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Enregistrement impossible.";
    console.error("🔴 [importProjectFull] FATAL:", err);
    return {
      success: false,
      error: `Erreur : ${message}`,
    };
  }
}