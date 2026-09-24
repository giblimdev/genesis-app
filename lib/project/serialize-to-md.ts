/*
path :           lib/project/serialize-to-md.ts
tag :            ["project", "export", "markdown"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Convertit un ProjectDiskSnapshot en document Markdown lisible.
                 Inclut les tâches sous chaque user story.

flow:            snapshotToMarkdown(snapshot) → sections ordonnées
                 (projet → features → personas → user stories → sprints) →
                 retourne un string Markdown. Tolère les valeurs null et les
                 champs JSON invalides.

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/actions/project/importProjectFull.ts",
                   "@/app/back-studio/scrum/page.tsx",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/lib/project/serialize-for-disk.ts",
                  "@/components/project/ProjectExportDialog.tsx"]
imports:         ["@/lib/project/serialize-for-disk"]
exports:         ["snapshotToMarkdown"]
useBy:           ["@/components/project/ProjectExportDialog.tsx"]

userStories:     ["*en tant que développeur je veux convertir un projet en markdown"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { ProjectDiskSnapshot } from "@/lib/project/serialize-for-disk";

/* ------------------------------------------------------------------ */
/*  Types locaux                                                       */
/* ------------------------------------------------------------------ */

type FeatureItem = {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly module: string;
  readonly icon: string | null;
  readonly accent: string | null;
  readonly displayOrder: number;
};

type PersonaItem = {
  readonly name: string;
  readonly slug: string;
  readonly value: string | null;
  readonly keywords: string | null;
  readonly icon: string | null;
  readonly accent: string | null;
  readonly displayOrder: number;
};

type UserStoryItem = {
  readonly parentSlug: string | null;
  readonly slug: string;
  readonly title: string;
  readonly personaRef: string | null;
  readonly asA: string;
  readonly iWant: string;
  readonly soThat: string;
  readonly status: string;
  readonly priority: number;
  readonly storyPoints: number | null;
  readonly accent: string | null;
  readonly sprintSlug: string | null;
  readonly acceptanceCriteria: string | null;
  readonly dodChecked: string | null;
  readonly linkedFiles: string | null;
  readonly displayOrder: number;
};

type SprintItem = {
  readonly name: string;
  readonly slug: string;
  readonly goal: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly durationWeeks: number;
  readonly status: string;
  readonly capacityPoints: number;
  readonly velocity: number | null;
  readonly notes: string | null;
  readonly accent: string | null;
  readonly displayOrder: number;
};

type TaskItem = {
  readonly userStorySlug: string;
  readonly title: string;
  readonly description: string;
  readonly assigneeEmail: string | null;
  readonly estimateHours: number;
  readonly status: string;
  readonly blockedBy: string | null;
  readonly notes: string | null;
  readonly displayOrder: number;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function line(label: string, value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return `- **${label}** : ${value}`;
}

function joinNonEmpty(items: readonly (string | null)[]): string {
  return items.filter((x): x is string => x !== null).join("\n");
}

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

type AcceptanceCriterion = {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
};

function parseAcceptanceCriteria(raw: string | null): AcceptanceCriterion[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is AcceptanceCriterion =>
        !!v &&
        typeof v === "object" &&
        typeof (v as AcceptanceCriterion).text === "string" &&
        typeof (v as AcceptanceCriterion).done === "boolean",
    );
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function renderProjectHeader(s: ProjectDiskSnapshot): string {
  const p = s.project;
  return [
    `# ${p.name}`,
    "",
    p.tagline ? `> ${p.tagline}` : null,
    p.tagline ? "" : null,
    joinNonEmpty([line("Slug", `\`${p.slug}\``), line("Statut", p.status)]),
    "",
    "## Description",
    "",
    p.description,
  ]
    .filter((x) => x !== null)
    .join("\n");
}

function renderFeatures(items: readonly FeatureItem[]): string {
  if (items.length === 0) return "";
  const blocks = items.map((f) => {
    const meta = joinNonEmpty([
      line("Module", f.module),
      line("Accent", f.accent),
      line("Icône", f.icon),
      line("Ordre", String(f.displayOrder)),
    ]);
    return [
      `### ${f.name}`,
      "",
      `\`${f.slug}\``,
      "",
      meta,
      "",
      f.description,
    ].join("\n");
  });
  return [
    `## Features (${items.length})`,
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}

function renderPersonas(items: readonly PersonaItem[]): string {
  if (items.length === 0) return "";
  const blocks = items.map((p) => {
    const keywords = parseStringArray(p.keywords);
    const meta = joinNonEmpty([
      line("Accent", p.accent),
      line("Icône", p.icon),
      line("Ordre", String(p.displayOrder)),
      line(
        "Mots-clés",
        keywords.length > 0 ? keywords.map((k) => `\`${k}\``).join(", ") : null,
      ),
    ]);
    return [
      `### ${p.name}`,
      "",
      `\`${p.slug}\``,
      "",
      p.value ? `> ${p.value}` : null,
      p.value ? "" : null,
      meta,
    ]
      .filter((x) => x !== null)
      .join("\n");
  });
  return [
    `## Personas (${items.length})`,
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}

function renderTasks(tasks: readonly TaskItem[]): string {
  if (tasks.length === 0) return "";

  /* ✅ Spread avant sort car `tasks` est readonly. */
  const sorted = [...tasks].sort((a, b) => a.displayOrder - b.displayOrder);

  const lines = sorted.map((t) => {
    const statusIcon =
      t.status === "done"
        ? "✅"
        : t.status === "in-progress"
          ? "🔄"
          : t.status === "review"
            ? "👀"
            : t.status === "blocked"
              ? "🚫"
              : "⬜";
    const meta: string[] = [];
    if (t.estimateHours > 0) meta.push(`${t.estimateHours}h`);
    if (t.assigneeEmail) meta.push(`@${t.assigneeEmail}`);
    const metaStr = meta.length > 0 ? ` _(${meta.join(", ")})_` : "";
    return `- ${statusIcon} **${t.title}**${metaStr}\n  ${t.description}`;
  });

  return ["", "**Tâches**", "", ...lines].join("\n");
}

function renderUserStories(
  items: readonly UserStoryItem[],
  tasks: readonly TaskItem[],
): string {
  if (items.length === 0) return "";

  /* Index tasks par storySlug. */
  const tasksByStory = new Map<string, TaskItem[]>();
  for (const t of tasks) {
    const list = tasksByStory.get(t.userStorySlug) ?? [];
    list.push(t);
    tasksByStory.set(t.userStorySlug, list);
  }

  const blocks = items.map((s) => {
    const isEpic = s.parentSlug === null;
    const ac = parseAcceptanceCriteria(s.acceptanceCriteria);
    const dod = parseStringArray(s.dodChecked);
    const files = parseStringArray(s.linkedFiles);
    const storyTasks = tasksByStory.get(s.slug) ?? [];

    const meta = joinNonEmpty([
      line("Type", isEpic ? "Epic" : "Story"),
      line("Statut", s.status),
      line("Priorité", `P${s.priority}`),
      line("Story points", s.storyPoints !== null ? String(s.storyPoints) : null),
      line("Persona", s.personaRef),
      line("Parent", s.parentSlug ? `\`${s.parentSlug}\`` : null),
      line("Sprint", s.sprintSlug ? `\`${s.sprintSlug}\`` : null),
      line("Accent", s.accent),
      line("Ordre", String(s.displayOrder)),
    ]);

    const acBlock =
      ac.length > 0
        ? [
            "",
            "**Critères d'acceptation**",
            "",
            ...ac.map((c) => `- [${c.done ? "x" : " "}] ${c.text}`),
          ].join("\n")
        : "";

    const dodBlock =
      dod.length > 0
        ? ["", "**Definition of Done**", "", ...dod.map((d) => `- ${d}`)].join(
            "\n",
          )
        : "";

    const filesBlock =
      files.length > 0
        ? [
            "",
            "**Fichiers liés**",
            "",
            ...files.map((f) => `- \`${f}\``),
          ].join("\n")
        : "";

    const tasksBlock = renderTasks(storyTasks);

    return [
      `### ${s.title}`,
      "",
      `\`${s.slug}\``,
      "",
      `**En tant que** ${s.asA} — **Je veux** ${s.iWant} — **Afin de** ${s.soThat}`,
      "",
      meta,
      acBlock,
      dodBlock,
      filesBlock,
      tasksBlock,
    ]
      .filter((x) => x !== "")
      .join("\n");
  });

  return [
    `## User Stories (${items.length})`,
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}

function renderSprints(items: readonly SprintItem[]): string {
  if (items.length === 0) return "";
  const blocks = items.map((s) => {
    const meta = joinNonEmpty([
      line("Statut", s.status),
      line("Période", `${s.startDate} → ${s.endDate} (${s.durationWeeks} sem.)`),
      line("Capacité", `${s.capacityPoints} pts`),
      line("Vélocité", s.velocity !== null ? `${s.velocity} pts` : null),
      line("Accent", s.accent),
      line("Ordre", String(s.displayOrder)),
    ]);

    const notesBlock = s.notes ? ["", "**Notes**", "", s.notes].join("\n") : "";

    return [
      `### ${s.name}`,
      "",
      `\`${s.slug}\``,
      "",
      `**Objectif** : ${s.goal}`,
      "",
      meta,
      notesBlock,
    ]
      .filter((x) => x !== "")
      .join("\n");
  });
  return [
    `## Sprints (${items.length})`,
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export function snapshotToMarkdown(snapshot: ProjectDiskSnapshot): string {
  const features = snapshot.features as readonly FeatureItem[];
  const personas = snapshot.personas as readonly PersonaItem[];
  const stories = snapshot.userStories as readonly UserStoryItem[];
  const sprints = snapshot.sprints as readonly SprintItem[];
  const tasks = (snapshot.tasks ?? []) as readonly TaskItem[];

  const sections = [
    renderProjectHeader(snapshot),
    renderFeatures(features),
    renderPersonas(personas),
    renderUserStories(stories, tasks),
    renderSprints(sprints),
  ].filter((s) => s.length > 0);

  return sections.join("\n\n---\n\n") + "\n";
}