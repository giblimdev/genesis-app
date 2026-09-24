/*
path :           lib/validations/project.ts
tag :            ["project", "validation", "snapshot"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Project + import en lot + snapshot complet
                 (format produit par exportProjectFull). Le snapshot permet de
                 restaurer un projet avec toutes ses dépendances (features,
                 personas, user stories, sprints, tasks) en un seul JSON.

flow:            createProjectSchema.safeParse → CreateProjectInput
                 updateProjectSchema.safeParse → UpdateProjectInput
                 projectIdSchema.safeParse → ProjectIdInput
                 hardDeleteSchema.safeParse → HardDeleteInput
                 bulkImportProjectsSchema.safeParse → BulkImportProjectInput
                 projectSnapshotSchema.safeParse → ProjectSnapshotInput

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/actions/project/importProjectFull.ts",
                   "@/app/back-studio/scrum/page.tsx",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/app/actions/project/createProject.ts",
                  "@/app/actions/project/updateProject.ts",
                  "@/app/actions/project/softDeleteProject.ts",
                  "@/app/actions/project/restoreProject.ts",
                  "@/app/actions/project/hardDeleteProject.ts",
                  "@/app/actions/project/bulkImportProjects.ts",
                  "@/app/actions/project/importProjectFull.ts",
                  "@/components/project/ProjectForm.tsx"]
imports:         ["zod"]
exports:         ["PROJECT_STATUSES", "ProjectStatus", "PROJECT_STATUS_LABELS",
                  "createProjectSchema", "CreateProjectInput",
                  "updateProjectSchema", "UpdateProjectInput",
                  "projectIdSchema", "ProjectIdInput",
                  "hardDeleteSchema", "HardDeleteInput",
                  "bulkImportProjectsSchema", "BulkImportProjectInput",
                  "projectSnapshotSchema", "ProjectSnapshotInput",
                  "snapshotTaskSchema", "SnapshotTaskInput"]

userStories:     ["*en tant que développeur je veux valider les données d'un projet",
                  "*en tant que développeur je veux restaurer un projet complet depuis JSON"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Statuts (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

export const PROJECT_STATUSES = [
  "planned",
  "wip",
  "done",
  "deprecated",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Planifié",
  wip: "En cours",
  done: "Terminé",
  deprecated: "Déprécié",
};

/* ------------------------------------------------------------------ */
/*  Champs partagés                                                    */
/* ------------------------------------------------------------------ */

const nameField = z
  .string()
  .trim()
  .min(2, "Nom trop court (2 caractères minimum).")
  .max(80, "Nom trop long (80 caractères maximum).");

const slugField = z
  .string()
  .trim()
  .max(80, "Slug trop long (80 caractères maximum).")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (minuscules, chiffres et tirets uniquement).",
  )
  .optional()
  .or(z.literal(""));

const taglineField = z
  .string()
  .trim()
  .max(160, "Accroche trop longue (160 caractères maximum).")
  .optional()
  .or(z.literal(""));

const descriptionField = z
  .string()
  .trim()
  .min(10, "Description trop courte (10 caractères minimum).")
  .max(5000, "Description trop longue (5000 caractères maximum).");

const statusField = z.enum(PROJECT_STATUSES).default("planned");

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export const createProjectSchema = z.object({
  name: nameField,
  slug: slugField,
  tagline: taglineField,
  description: descriptionField,
  status: statusField,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export const updateProjectSchema = createProjectSchema.extend({
  id: z.string().min(1, "Identifiant requis."),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/* ------------------------------------------------------------------ */
/*  Soft delete / restauration                                         */
/* ------------------------------------------------------------------ */

export const projectIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});

export type ProjectIdInput = z.infer<typeof projectIdSchema>;

/* ------------------------------------------------------------------ */
/*  Suppression définitive                                             */
/* ------------------------------------------------------------------ */

export const hardDeleteSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
  slug: z.string().min(1, "Slug de confirmation requis."),
});

export type HardDeleteInput = z.infer<typeof hardDeleteSchema>;

/* ------------------------------------------------------------------ */
/*  Import en lot (tableau de projets)                                 */
/* ------------------------------------------------------------------ */

/**
 * Import bulk : tableau de createProjectSchema.
 * Chaque élément est identique à une création unitaire — le slug peut
 * être vide (auto-généré par l'action), l'ownerId vient de la session.
 */
export const bulkImportProjectsSchema = z
  .array(createProjectSchema)
  .min(1, "Le tableau doit contenir au moins un projet.")
  .max(500, "500 projets maximum par import.");

export type BulkImportProjectInput = z.infer<typeof bulkImportProjectsSchema>;

/* ------------------------------------------------------------------ */
/*  Snapshot complet (format produit par exportProjectFull)            */
/* ------------------------------------------------------------------ */

/**
 * Task du snapshot : identifiée par (userStorySlug, title).
 * L'assignee est référencé par email (résolu en userId à l'import).
 */
export const snapshotTaskSchema = z.object({
  userStorySlug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  description: z.string().min(1).max(5000),
  assigneeEmail: z.string().email().nullable(),
  estimateHours: z.number().int().min(0).max(9999),
  status: z.string().min(1).max(40),
  blockedBy: z.string().nullable(),
  notes: z.string().nullable(),
  displayOrder: z.number().int().optional(),
});

export type SnapshotTaskInput = z.infer<typeof snapshotTaskSchema>;

/* ------------------------------------------------------------------ */

const snapshotProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80),
  tagline: z.string().nullable(),
  description: z.string().min(1).max(50_000),
  status: z.enum(PROJECT_STATUSES),
});

const snapshotFeatureSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80),
  description: z.string().min(1).max(3000),
  module: z.string().min(1).max(40),
  icon: z.string().nullable(),
  accent: z.string().nullable(),
  displayOrder: z.number().int().optional(),
});

const snapshotPersonaSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80),
  value: z.string().nullable(),
  keywords: z.string().nullable(),
  icon: z.string().nullable(),
  accent: z.string().nullable(),
  displayOrder: z.number().int().optional(),
});

const snapshotUserStorySchema = z.object({
  parentSlug: z.string().nullable(),
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  personaRef: z.string().nullable(),
  asA: z.string().min(1).max(200),
  iWant: z.string().min(1).max(500),
  soThat: z.string().min(1).max(500),
  status: z.string().min(1).max(40),
  priority: z.number().int().min(1).max(10),
  storyPoints: z.number().int().nullable(),
  accent: z.string().nullable(),
  sprintSlug: z.string().nullable(),
  acceptanceCriteria: z.string().nullable(),
  dodChecked: z.string().nullable(),
  linkedFiles: z.string().nullable(),
  displayOrder: z.number().int().optional(),
});

const snapshotSprintSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(120),
  goal: z.string().min(1).max(500),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date YYYY-MM-DD attendue."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date YYYY-MM-DD attendue."),
  durationWeeks: z.number().int().min(1).max(52),
  status: z.string().min(1).max(40),
  capacityPoints: z.number().int().min(0),
  velocity: z.number().int().nullable(),
  notes: z.string().nullable(),
  accent: z.string().nullable(),
  displayOrder: z.number().int().optional(),
});

export const projectSnapshotSchema = z.object({
  project: snapshotProjectSchema,
  features: z.array(snapshotFeatureSchema).max(500).default([]),
  personas: z.array(snapshotPersonaSchema).max(500).default([]),
  userStories: z.array(snapshotUserStorySchema).max(1000).default([]),
  sprints: z.array(snapshotSprintSchema).max(200).default([]),
  tasks: z.array(snapshotTaskSchema).max(5000).default([]),
});

export type ProjectSnapshotInput = z.infer<typeof projectSnapshotSchema>;
