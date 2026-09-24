/*
path :           lib/project/serialize-for-disk.ts
tag :            ["project", "export", "serialize"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Sérialise un projet (avec ses enfants si demandé) en un
                 objet JSON prêt à être écrit sur disque. Retire tous les
                 champs non-ré-importables : id, ownerId, createdAt,
                 updatedAt, deletedAt. Les relations parent/enfant sont
                 converties en slugs stables pour garantir un round-trip
                 copier/coller dans un autre projet. Inclut désormais les
                 Tasks (identifiées par userStorySlug + title).

flow:            serializeProjectForDisk(projectId, { includeChildren })
                 → prisma.project.findFirst → si enfants : features,
                 personas, stories, sprints + tasks → mapping id→slug →
                 construction du ProjectDiskSnapshot → retour.

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/actions/project/importProjectFull.ts",
                   "@/app/back-studio/scrum/page.tsx",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/app/api/back-studio/save-prog/route.ts",
                  "@/lib/project/disk-fallback.ts",
                  "@/lib/project/serialize-all.ts",
                  "@/lib/project/serialize-to-md.ts",
                  "@/lib/prisma.ts"]
imports:         ["server-only", "@/lib/prisma"]
exports:         ["serializeProjectForDisk", "ProjectDiskSnapshot"]
useBy:           ["@/app/api/back-studio/save-prog/route.ts",
                  "@/lib/project/serialize-all.ts",
                  "@/app/actions/project/exportProjectFull.ts"]

userStories:     ["*en tant que développeur je veux un snapshot JSON propre"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ProjectDiskSnapshot = {
  readonly project: {
    readonly name: string;
    readonly slug: string;
    readonly tagline: string | null;
    readonly description: string;
    readonly status: string;
  };
  readonly features: readonly unknown[];
  readonly personas: readonly unknown[];
  readonly userStories: readonly unknown[];
  readonly sprints: readonly unknown[];
  readonly tasks: readonly unknown[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function orNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/* ------------------------------------------------------------------ */
/*  Sérialisation                                                      */
/* ------------------------------------------------------------------ */

export async function serializeProjectForDisk(
  projectId: string,
  options: { includeChildren: boolean },
): Promise<ProjectDiskSnapshot | null> {
  /* ---------- 1. Projet ---------- */

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      name: true,
      slug: true,
      tagline: true,
      description: true,
      status: true,
    },
  });

  if (!project) return null;

  /* ---------- 2. Sans enfants : retour minimal ---------- */

  if (!options.includeChildren) {
    return {
      project,
      features: [],
      personas: [],
      userStories: [],
      sprints: [],
      tasks: [],
    };
  }

  /* ---------- 3. Enfants en parallèle ---------- */

  const [features, personas, stories, sprints, rawStories, rawSprints, rawTasks] =
    await Promise.all([
      prisma.feature.findMany({
        where: { projectId },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: {
          name: true,
          slug: true,
          description: true,
          module: true,
          icon: true,
          accent: true,
          displayOrder: true,
        },
      }),

      prisma.persona.findMany({
        where: { projectId, deletedAt: null },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: {
          name: true,
          slug: true,
          value: true,
          keywords: true,
          icon: true,
          accent: true,
          displayOrder: true,
        },
      }),

      prisma.userStory.findMany({
        where: { projectId, deletedAt: null },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
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
      }),

      prisma.sprint.findMany({
        where: { projectId, deletedAt: null },
        orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }],
        select: {
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
      }),

      /* Mapping id → slug pour parentId / sprintId. */
      prisma.userStory.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, slug: true },
      }),

      prisma.sprint.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, slug: true },
      }),

      /* Toutes les tâches du projet, avec leur userStoryId + assignee. */
      prisma.task.findMany({
        where: { UserStory: { projectId, deletedAt: null } },
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
        },
      }),
    ]);

  /* ---------- 4. Conversion des ids en slugs ---------- */

  const storySlugById = new Map(rawStories.map((s) => [s.id, s.slug]));
  const sprintSlugById = new Map(rawSprints.map((s) => [s.id, s.slug]));

  /* ---------- 5. Sérialisation ---------- */

  const serializedFeatures = features.map((f) => ({
    name: f.name,
    slug: f.slug,
    description: f.description,
    module: f.module,
    icon: orNull(f.icon),
    accent: orNull(f.accent),
    displayOrder: f.displayOrder,
  }));

  const serializedPersonas = personas.map((p) => ({
    name: p.name,
    slug: p.slug,
    value: orNull(p.value),
    keywords: orNull(p.keywords),
    icon: orNull(p.icon),
    accent: orNull(p.accent),
    displayOrder: p.displayOrder,
  }));

  const serializedStories = stories.map((s) => ({
    parentSlug: s.parentId ? storySlugById.get(s.parentId) ?? null : null,
    slug: s.slug,
    title: s.title,
    personaRef: orNull(s.personaRef),
    asA: s.asA,
    iWant: s.iWant,
    soThat: s.soThat,
    status: s.status,
    priority: s.priority,
    storyPoints: s.storyPoints,
    accent: orNull(s.accent),
    sprintSlug: s.sprintId ? sprintSlugById.get(s.sprintId) ?? null : null,
    acceptanceCriteria: s.acceptanceCriteria,
    dodChecked: s.dodChecked,
    linkedFiles: s.linkedFiles,
    displayOrder: s.displayOrder,
  }));

  const serializedSprints = sprints.map((s) => ({
    name: s.name,
    slug: s.slug,
    goal: s.goal,
    startDate: s.startDate.toISOString().slice(0, 10),
    endDate: s.endDate.toISOString().slice(0, 10),
    durationWeeks: s.durationWeeks,
    status: s.status,
    capacityPoints: s.capacityPoints,
    velocity: s.velocity,
    notes: orNull(s.notes),
    accent: orNull(s.accent),
    displayOrder: s.displayOrder,
  }));

  const serializedTasks = rawTasks
    .map((t) => {
      const userStorySlug = storySlugById.get(t.userStoryId);
      if (!userStorySlug) return null; /* story supprimée → skip */
      return {
        userStorySlug,
        title: t.title,
        description: t.description,
        assigneeEmail: t.assignee?.email ?? null,
        estimateHours: t.estimateHours,
        status: t.status,
        blockedBy: t.blockedBy,
        notes: orNull(t.notes),
        displayOrder: t.displayOrder,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    project,
    features: serializedFeatures,
    personas: serializedPersonas,
    userStories: serializedStories,
    sprints: serializedSprints,
    tasks: serializedTasks,
  };
}