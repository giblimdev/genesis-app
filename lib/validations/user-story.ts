/*
path :           lib/validations/user-story.ts
tag :            ["user-story", "validation"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD UserStory : création (Epic ou Story), mise à jour,
                 soft delete, restauration, suppression définitive et import en lot.
                 Les champs JSON sont reçus sous forme de texte multiligne (une ligne =
                 un élément) et sérialisés côté action. Les accents sont importés du
                 fichier central @/lib/design/accents. Le bulk import utilise des
                 slugs (parentSlug, sprintSlug) au lieu d'IDs pour être lisible dans
                 un fichier JSON.

flow:            createUserStorySchema.safeParse(payload) → CreateUserStoryInput.
                 updateUserStorySchema.safeParse(payload) → UpdateUserStoryInput.
                 userStoryIdSchema.safeParse(payload) → { id }.
                 hardDeleteUserStorySchema.safeParse(payload) → { id, slug }.
                 bulkImportUserStoriesSchema.safeParse(payload) → BulkImportUserStoryInput[].

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
relatedFiles:    ["@/lib/design/accents.ts",
                  "@/lib/json-templates/user-story.ts",
                  "@/components/user-story/UserStoryForm.tsx"]
imports:         ["zod", "@/lib/design/accents"]
exports:         ["STORY_STATUSES", "StoryStatus", "STORY_STATUS_LABELS",
                  "STORY_PRIORITY_MIN", "STORY_PRIORITY_MAX",
                  "STORY_ACCENTS", "StoryAccent",
                  "createUserStorySchema", "CreateUserStoryInput",
                  "updateUserStorySchema", "UpdateUserStoryInput",
                  "userStoryIdSchema", "UserStoryIdInput",
                  "hardDeleteUserStorySchema", "HardDeleteUserStoryInput",
                  "bulkImportUserStoriesSchema", "BulkImportUserStoryInput"]
useBy:           ["@/app/actions/user-story/createUserStory.ts",
                  "@/app/actions/user-story/updateUserStory.ts",
                  "@/app/actions/user-story/softDeleteUserStory.ts",
                  "@/app/actions/user-story/restoreUserStory.ts",
                  "@/app/actions/user-story/hardDeleteUserStory.ts",
                  "@/app/actions/user-story/bulkImportUserStories.ts",
                  "@/components/user-story/UserStoryForm.tsx"]

userStories:     ["*en tant que développeur je veux valider les données d'une user story",
                  "*en tant que développeur je veux importer des user stories en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

import { PROJECT_ACCENTS } from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Statuts (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

export const STORY_STATUSES = [
  "backlog",
  "ready",
  "in-progress",
  "review",
  "done",
] as const;

export type StoryStatus = (typeof STORY_STATUSES)[number];

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  backlog: "Backlog",
  ready: "Prêt",
  "in-progress": "En cours",
  review: "En revue",
  done: "Terminé",
};

/* ------------------------------------------------------------------ */
/*  Priorité                                                           */
/* ------------------------------------------------------------------ */

export const STORY_PRIORITY_MIN = 1;
export const STORY_PRIORITY_MAX = 10;

/* ------------------------------------------------------------------ */
/*  Accents — alias de la liste centrale                              */
/* ------------------------------------------------------------------ */

export const STORY_ACCENTS = PROJECT_ACCENTS;
export type StoryAccent = (typeof PROJECT_ACCENTS)[number];

/* ------------------------------------------------------------------ */
/*  Champs partagés                                                    */
/* ------------------------------------------------------------------ */

const titleField = z
  .string()
  .trim()
  .min(1, "Titre requis.")
  .max(200, "Titre trop long (200 caractères maximum).");

const slugField = z
  .string()
  .trim()
  .max(120, "Slug trop long (120 caractères maximum).")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (minuscules, chiffres et tirets uniquement).",
  )
  .optional()
  .or(z.literal(""));

const asAField = z
  .string()
  .trim()
  .min(1, "« En tant que » requis.")
  .max(200, "« En tant que » trop long.");

const iWantField = z
  .string()
  .trim()
  .min(1, "« Je veux » requis.")
  .max(500, "« Je veux » trop long.");

const soThatField = z
  .string()
  .trim()
  .min(1, "« Afin de » requis.")
  .max(500, "« Afin de » trop long.");

const personaRefField = z
  .string()
  .trim()
  .max(120, "Référence persona trop longue.")
  .optional()
  .or(z.literal(""));

const statusField = z.enum(STORY_STATUSES).default("backlog");

const priorityField = z.coerce
  .number()
  .int("Priorité entière requise.")
  .min(STORY_PRIORITY_MIN, `Priorité minimale : ${STORY_PRIORITY_MIN}.`)
  .max(STORY_PRIORITY_MAX, `Priorité maximale : ${STORY_PRIORITY_MAX}.`)
  .default(5);

const storyPointsField = z
  .union([z.coerce.number().int().min(0).max(999), z.literal("")])
  .optional();

const sprintIdField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

const parentIdField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

const accentField = z
  .union([z.enum(PROJECT_ACCENTS), z.literal("")])
  .optional();

/**
 * Champs multilignes : une ligne = un élément.
 * La conversion en JSON sérialisé est faite dans l'action.
 */
const acceptanceInput = z
  .string()
  .max(5000, "Critères d'acceptation trop longs.")
  .optional()
  .or(z.literal(""));

const dodInput = z
  .string()
  .max(3000, "DoD trop longue.")
  .optional()
  .or(z.literal(""));

const linkedFilesInput = z
  .string()
  .max(3000, "Liste de fichiers trop longue.")
  .optional()
  .or(z.literal(""));

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export const createUserStorySchema = z.object({
  projectId: z.string().min(1, "Projet requis."),
  parentId: parentIdField,
  title: titleField,
  slug: slugField,
  personaRef: personaRefField,
  asA: asAField,
  iWant: iWantField,
  soThat: soThatField,
  status: statusField,
  priority: priorityField,
  storyPoints: storyPointsField,
  accent: accentField,
  sprintId: sprintIdField,
  acceptanceInput,
  dodInput,
  linkedFilesInput,
});

export type CreateUserStoryInput = z.infer<typeof createUserStorySchema>;

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export const updateUserStorySchema = createUserStorySchema.extend({
  id: z.string().min(1, "Identifiant requis."),
});

export type UpdateUserStoryInput = z.infer<typeof updateUserStorySchema>;

/* ------------------------------------------------------------------ */
/*  Soft delete / restauration                                         */
/* ------------------------------------------------------------------ */

export const userStoryIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});

export type UserStoryIdInput = z.infer<typeof userStoryIdSchema>;

/* ------------------------------------------------------------------ */
/*  Suppression définitive                                             */
/* ------------------------------------------------------------------ */

export const hardDeleteUserStorySchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
  slug: z.string().min(1, "Slug de confirmation requis."),
});

export type HardDeleteUserStoryInput = z.infer<
  typeof hardDeleteUserStorySchema
>;

/* ------------------------------------------------------------------ */
/*  Import en lot                                                      */
/* ------------------------------------------------------------------ */

/**
 * Item de bulk import.
 *
 * Différences avec createUserStorySchema :
 *   - `projectId`     : fourni par la page via `.bind()`, pas dans le JSON.
 *   - `parentSlug`    : au lieu de `parentId`. Slug de l'Epic parent,
 *                       résolu en ID pendant la transaction. Peut référencer
 *                       un Epic existant OU un Epic créé dans le même batch.
 *   - `sprintSlug`    : au lieu de `sprintId`. Slug du sprint, résolu en ID.
 */
const bulkUserStoryItemSchema = z.object({
  parentSlug: z
    .string()
    .trim()
    .max(120, "Slug parent trop long.")
    .optional()
    .or(z.literal("")),
  title: titleField,
  slug: slugField,
  personaRef: personaRefField,
  asA: asAField,
  iWant: iWantField,
  soThat: soThatField,
  status: statusField,
  priority: priorityField,
  storyPoints: storyPointsField,
  accent: accentField,
  sprintSlug: z
    .string()
    .trim()
    .max(120, "Slug sprint trop long.")
    .optional()
    .or(z.literal("")),
  acceptanceInput,
  dodInput,
  linkedFilesInput,
});

export const bulkImportUserStoriesSchema = z
  .array(bulkUserStoryItemSchema)
  .min(1, "Le tableau doit contenir au moins une user story.")
  .max(500, "500 user stories maximum par import.");

export type BulkImportUserStoryInput = z.infer<
  typeof bulkImportUserStoriesSchema
>;