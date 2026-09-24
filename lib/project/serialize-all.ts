/*
path :           lib/project/serialize-all.ts
tag :            ["project", "export", "serialize", "bulk"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Sérialise EN UNE PASSE tous les projets d'un utilisateur
                 avec leurs enfants (features, personas, user stories,
                 sprints, tasks). Conçu pour l'export JSON complet.

flow:            serializeAllProjectsForDisk(userId) → findMany projects
                 → requêtes enfants SÉQUENTIELLES (pas Promise.all : l'adapter
                 better-sqlite3 deadlock sur les requêtes concurrentes) →
                 groupage en mémoire → construction du tableau de
                 ProjectDiskSnapshot.

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/actions/project/importProjectFull.ts",
                   "@/app/back-studio/scrum/page.tsx",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/lib/project/serialize-for-disk.ts",
                  "@/lib/prisma.ts",
                  "@/app/back-studio/scrum/page.tsx"]
imports:         ["server-only", "@/lib/prisma",
                  "@/lib/project/serialize-for-disk"]
exports:         ["serializeAllProjectsForDisk"]
useBy:           ["@/app/actions/project/exportProjectsFull.ts"]

userStories:     ["*en tant que développeur je veux exporter tous mes projets avec dépendances"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { prisma } from "@/lib/prisma";
import type { ProjectDiskSnapshot } from "@/lib/project/serialize-for-disk";

/* ------------------------------------------------------------------ */
/*  Helper de groupage                                                 */
/* ------------------------------------------------------------------ */

function groupByProject<T extends { projectId: string | null }>(
  items: readonly T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (item.projectId === null) continue;
    const list = map.get(item.projectId) ?? [];
    list.push(item);
    map.set(item.projectId, list);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Sérialisation bulk                                                 */
/* ------------------------------------------------------------------ */

export async function serializeAllProjectsForDisk(
  userId: string,
): Promise<ProjectDiskSnapshot[]> {
  console.log("[serializeAllProjectsForDisk] START userId =", userId);

  /* ---------- 1. Projets ---------- */

  const projects = await prisma.project.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      description: true,
      status: true,
    },
  });

  console.log("[serializeAllProjectsForDisk] projects found =", projects.length);

  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  /* ---------- 2. Enfants SÉQUENTIELS (SQLite deadlock sinon) ---------- */

  console.log("[serializeAllProjectsForDisk] loading features…");
  const features = await prisma.feature.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      projectId: true,
      name: true,
      slug: true,
      description: true,
      module: true,
      icon: true,
      accent: true,
      displayOrder: true,
    },
  });

  console.log("[serializeAllProjectsForDisk] loading personas…");
  const personas = await prisma.persona.findMany({
    where: { projectId: { in: projectIds }, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      projectId: true,
      name: true,
      slug: true,
      value: true,
      keywords: true,
      icon: true,
      accent: true,
      displayOrder: true,
    },
  });

  console.log("[serializeAllProjectsForDisk] loading userStories…");
  const stories = await prisma.userStory.findMany({
    where: { projectId: { in: projectIds }, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      projectId: true,
      parentId: true,
      slug: true,
      title: true,
      personaRef: true,
      asA: true,
      iWant: true,
      soThat: true,
      status: true,
      priority: true,
      storyPoints: true,
      accent: true,
      sprintId: true,
      acceptanceCriteria: true,
      dodChecked: true,
      linkedFiles: true,
      displayOrder: true,
    },
  });

  console.log("[serializeAllProjectsForDisk] loading sprints…");
  const sprints = await prisma.sprint.findMany({
    where: { projectId: { in: projectIds }, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }],
    select: {
      projectId: true,
      name: true,
      slug: true,
      goal: true,
      startDate: true,
      endDate: true,
      durationWeeks: true,
      status: true,
      capacityPoints: true,
      velocity: true,
      notes: true,
      accent: true,
      displayOrder: true,
    },
  });

  console.log("[serializeAllProjectsForDisk] loading tasks…");
  const tasks = await prisma.task.findMany({
    where: {
      UserStory: { projectId: { in: projectIds }, deletedAt: null },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      userStoryId: true,
      title: true,
      description: true,
      estimateHours: true,
      status: true,
      blockedBy: true,
      notes: true,
      displayOrder: true,
      assignee: { select: { email: true } },
      UserStory: { select: { projectId: true } },
    },
  });

  console.log("[serializeAllProjectsForDisk] loading maps (stories id→slug)…");
  const rawStories = await prisma.userStory.findMany({
    where: { projectId: { in: projectIds }, deletedAt: null },
    select: { id: true, slug: true, projectId: true },
  });

  console.log("[serializeAllProjectsForDisk] loading maps (sprints id→slug)…");
  const rawSprints = await prisma.sprint.findMany({
    where: { projectId: { in: projectIds }, deletedAt: null },
    select: { id: true, slug: true },
  });

  console.log("[serializeAllProjectsForDisk] all queries done, building output…");

  /* ---------- 3. Maps globaux ---------- */

  const storySlugById = new Map(rawStories.map((s) => [s.id, s.slug]));
  const sprintSlugById = new Map(rawSprints.map((s) => [s.id, s.slug]));

  const featuresByProject = groupByProject(features);
  const personasByProject = groupByProject(personas);
  const storiesByProject = groupByProject(stories);
  const sprintsByProject = groupByProject(sprints);

  /* Tasks : regroupées par projectId via UserStory.projectId. */
  const tasksByProject = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const pid = t.UserStory.projectId;
    if (!pid) continue;
    const list = tasksByProject.get(pid) ?? [];
    list.push(t);
    tasksByProject.set(pid, list);
  }

  /* ---------- 4. Construction ---------- */

  const output = projects.map((project) => {
    const pFeatures = featuresByProject.get(project.id) ?? [];
    const pPersonas = personasByProject.get(project.id) ?? [];
    const pStories = storiesByProject.get(project.id) ?? [];
    const pSprints = sprintsByProject.get(project.id) ?? [];
    const pTasks = tasksByProject.get(project.id) ?? [];

    const serializedTasks = pTasks
      .map((t) => {
        const userStorySlug = storySlugById.get(t.userStoryId);
        if (!userStorySlug) return null;
        return {
          userStorySlug,
          title: t.title,
          description: t.description,
          assigneeEmail: t.assignee?.email ?? null,
          estimateHours: t.estimateHours,
          status: t.status,
          blockedBy: t.blockedBy,
          notes: t.notes,
          displayOrder: t.displayOrder,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return {
      project: {
        name: project.name,
        slug: project.slug,
        tagline: project.tagline,
        description: project.description,
        status: project.status,
      },

      features: pFeatures.map((f) => ({
        name: f.name,
        slug: f.slug,
        description: f.description,
        module: f.module,
        icon: f.icon,
        accent: f.accent,
        displayOrder: f.displayOrder,
      })),

      personas: pPersonas.map((p) => ({
        name: p.name,
        slug: p.slug,
        value: p.value,
        keywords: p.keywords,
        icon: p.icon,
        accent: p.accent,
        displayOrder: p.displayOrder,
      })),

      userStories: pStories.map((s) => ({
        parentSlug: s.parentId ? (storySlugById.get(s.parentId) ?? null) : null,
        slug: s.slug,
        title: s.title,
        personaRef: s.personaRef,
        asA: s.asA,
        iWant: s.iWant,
        soThat: s.soThat,
        status: s.status,
        priority: s.priority,
        storyPoints: s.storyPoints,
        accent: s.accent,
        sprintSlug: s.sprintId ? (sprintSlugById.get(s.sprintId) ?? null) : null,
        acceptanceCriteria: s.acceptanceCriteria,
        dodChecked: s.dodChecked,
        linkedFiles: s.linkedFiles,
        displayOrder: s.displayOrder,
      })),

      sprints: pSprints.map((s) => ({
        name: s.name,
        slug: s.slug,
        goal: s.goal,
        startDate: s.startDate.toISOString().slice(0, 10),
        endDate: s.endDate.toISOString().slice(0, 10),
        durationWeeks: s.durationWeeks,
        status: s.status,
        capacityPoints: s.capacityPoints,
        velocity: s.velocity,
        notes: s.notes,
        accent: s.accent,
        displayOrder: s.displayOrder,
      })),

      tasks: serializedTasks,
    } satisfies ProjectDiskSnapshot;
  });

  console.log("[serializeAllProjectsForDisk] DONE. Output length:", output.length);

  return output;
}