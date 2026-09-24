/*
path :           lib/validations/sprint.ts
tag :            ["sprint", "validation"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Sprint + assignation/désassignation de
                 user stories + changement de statut + import en lot. Les accents
                 sont importés du fichier central @/lib/design/accents.

flow:            createSprintSchema.safeParse → CreateSprintInput
                 updateSprintSchema.safeParse → UpdateSprintInput
                 changeSprintStatusSchema.safeParse → ChangeSprintStatusInput
                 sprintIdSchema / hardDeleteSprintSchema / assignStorySchema /
                 reorderSprintStoriesSchema / bulkImportSprintsSchema.

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
relatedFiles:    ["@/lib/design/accents.ts",
                  "@/lib/json-templates/sprint.ts",
                  "@/lib/sprint/lock.ts",
                  "@/lib/sprint/transitions.ts",
                  "@/components/sprint/SprintForm.tsx"]
imports:         ["zod", "@/lib/design/accents"]
exports:         ["SPRINT_STATUSES", "SprintStatus", "SPRINT_STATUS_LABELS",
                  "SPRINT_LOCKED_STATUSES", "isSprintLocked",
                  "SPRINT_ACCENTS", "SprintAccent",
                  "createSprintSchema", "CreateSprintInput",
                  "updateSprintSchema", "UpdateSprintInput",
                  "changeSprintStatusSchema", "ChangeSprintStatusInput",
                  "sprintIdSchema", "SprintIdInput",
                  "hardDeleteSprintSchema", "HardDeleteSprintInput",
                  "assignStoryToSprintSchema", "AssignStoryInput",
                  "unassignStoryFromSprintSchema",
                  "reorderSprintStoriesSchema",
                  "bulkImportSprintsSchema", "BulkImportSprintInput"]

userStories:     ["*en tant que développeur je veux valider les données d'un sprint",
                  "*en tant que développeur je veux changer le statut d'un sprint",
                  "*en tant que développeur je veux importer des sprints en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

import { PROJECT_ACCENTS } from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Statuts                                                            */
/* ------------------------------------------------------------------ */

export const SPRINT_STATUSES = [
  "planned",
  "composed",
  "active",
  "completed",
  "cancelled",
] as const;

export type SprintStatus = (typeof SPRINT_STATUSES)[number];

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  planned: "Planifié",
  composed: "Composé",
  active: "En cours",
  completed: "Archivé",
  cancelled: "Annulé",
};

/**
 * Statuts pour lesquels le sprint est VERROUILLÉ :
 * aucune modification (métadonnées + composition) n'est autorisée.
 * Le changement de statut reste possible via changeSprintStatus.
 */
export const SPRINT_LOCKED_STATUSES = [
  "active",
  "completed",
  "cancelled",
] as const;

export function isSprintLocked(status: string): boolean {
  return (SPRINT_LOCKED_STATUSES as readonly string[]).includes(status);
}

/* ------------------------------------------------------------------ */
/*  Accents — alias de la liste centrale                              */
/* ------------------------------------------------------------------ */

export const SPRINT_ACCENTS = PROJECT_ACCENTS;
export type SprintAccent = (typeof PROJECT_ACCENTS)[number];

/* ------------------------------------------------------------------ */
/*  Champs partagés                                                    */
/* ------------------------------------------------------------------ */

const nameField = z
  .string()
  .trim()
  .min(1, "Nom requis.")
  .max(80, "Nom trop long (80 caractères maximum).");

const slugField = z
  .string()
  .trim()
  .max(120, "Slug trop long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (minuscules, chiffres et tirets uniquement).",
  )
  .optional()
  .or(z.literal(""));

const goalField = z
  .string()
  .trim()
  .min(1, "Objectif requis.")
  .max(500, "Objectif trop long (500 caractères maximum).");

const dateField = z.coerce.date({ error: "Date invalide." });

const durationField = z.coerce
  .number()
  .int("Durée entière requise.")
  .min(1, "Durée minimale : 1 semaine.")
  .max(52, "Durée maximale : 52 semaines.")
  .default(2);

const statusField = z.enum(SPRINT_STATUSES).default("planned");

const capacityField = z.coerce
  .number()
  .int()
  .min(0, "Capacité positive requise.")
  .max(9999)
  .default(0);

const velocityField = z
  .union([z.coerce.number().int().min(0).max(9999), z.literal("")])
  .optional();

const notesField = z
  .string()
  .trim()
  .max(3000, "Notes trop longues.")
  .optional()
  .or(z.literal(""));

const accentField = z
  .union([z.enum(PROJECT_ACCENTS), z.literal("")])
  .optional();

/* ------------------------------------------------------------------ */
/*  Schéma de base (sans refine)                                       */
/* ------------------------------------------------------------------ */

const sprintBaseSchema = z.object({
  projectId: z.string().min(1, "Projet requis."),
  name: nameField,
  slug: slugField,
  goal: goalField,
  startDate: dateField,
  endDate: dateField,
  durationWeeks: durationField,
  status: statusField,
  capacityPoints: capacityField,
  velocity: velocityField,
  notes: notesField,
  accent: accentField,
});

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export const createSprintSchema = sprintBaseSchema.refine(
  (d) => d.endDate > d.startDate,
  {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  },
);

export type CreateSprintInput = z.infer<typeof createSprintSchema>;

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export const updateSprintSchema = sprintBaseSchema
  .extend({
    id: z.string().min(1, "Identifiant requis."),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  });

export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;

/* ------------------------------------------------------------------ */
/*  Changement de statut (bypass du verrou)                            */
/* ------------------------------------------------------------------ */

export const changeSprintStatusSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
  status: z.enum(SPRINT_STATUSES),
});
export type ChangeSprintStatusInput = z.infer<
  typeof changeSprintStatusSchema
>;

/* ------------------------------------------------------------------ */
/*  Identifiants / suppression                                         */
/* ------------------------------------------------------------------ */

export const sprintIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});
export type SprintIdInput = z.infer<typeof sprintIdSchema>;

export const hardDeleteSprintSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
  slug: z.string().min(1, "Slug de confirmation requis."),
});
export type HardDeleteSprintInput = z.infer<typeof hardDeleteSprintSchema>;

/* ------------------------------------------------------------------ */
/*  Composition (DnD)                                                  */
/* ------------------------------------------------------------------ */

export const assignStoryToSprintSchema = z.object({
  sprintId: z.string().min(1, "Sprint requis."),
  userStoryId: z.string().min(1, "User story requise."),
});
export type AssignStoryInput = z.infer<typeof assignStoryToSprintSchema>;

export const unassignStoryFromSprintSchema = z.object({
  userStoryId: z.string().min(1, "User story requise."),
});
export type UnassignStoryInput = z.infer<
  typeof unassignStoryFromSprintSchema
>;

export const reorderSprintStoriesSchema = z.object({
  sprintId: z.string().min(1, "Sprint requis."),
  orderedIds: z
    .array(z.string().min(1))
    .min(1, "Aucune story.")
    .max(500, "500 stories maximum."),
});
export type ReorderSprintStoriesInput = z.infer<
  typeof reorderSprintStoriesSchema
>;

/* ------------------------------------------------------------------ */
/*  Import en lot                                                      */
/* ------------------------------------------------------------------ */

/**
 * Item de bulk import — identique à createSprintSchema SAUF que
 * `projectId` est fourni par la page via `.bind()`, pas par le JSON.
 * Les dates sont reçues en ISO string (YYYY-MM-DD ou ISO complet) et
 * coercées en Date par Zod. La contrainte endDate > startDate est
 * appliquée par item.
 */
const bulkSprintItemSchema = z
  .object({
    name: nameField,
    slug: slugField,
    goal: goalField,
    startDate: dateField,
    endDate: dateField,
    durationWeeks: durationField,
    status: statusField,
    capacityPoints: capacityField,
    velocity: velocityField,
    notes: notesField,
    accent: accentField,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  });

export const bulkImportSprintsSchema = z
  .array(bulkSprintItemSchema)
  .min(1, "Le tableau doit contenir au moins un sprint.")
  .max(500, "500 sprints maximum par import.");

export type BulkImportSprintInput = z.infer<typeof bulkImportSprintsSchema>;