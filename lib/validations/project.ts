/*
path :           lib/validations/project.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Project : création, mise à jour, soft delete,
                 restauration, suppression définitive. Source unique de vérité pour
                 la validation des entrées côté client et côté serveur.
flow:            createProjectSchema.safeParse(payload) → CreateProjectInput.
                 updateProjectSchema.safeParse(payload) → UpdateProjectInput (id requis).
                 projectIdSchema.safeParse(payload) → { id }.
                 hardDeleteSchema.safeParse(payload) → { id, slug } (double garde-fou).
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/page.tsx",
                   "@/app/actions/project/createProject.ts",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/app/actions/project/createProject.ts",
                  "@/app/actions/project/updateProject.ts",
                  "@/app/actions/project/softDeleteProject.ts",
                  "@/app/actions/project/restoreProject.ts",
                  "@/app/actions/project/hardDeleteProject.ts",
                  "@/components/project/ProjectForm.tsx"]
imports:         ["zod"]
exports:         ["PROJECT_STATUSES", "ProjectStatus", "PROJECT_STATUS_LABELS",
                  "createProjectSchema", "CreateProjectInput",
                  "updateProjectSchema", "UpdateProjectInput",
                  "projectIdSchema", "ProjectIdInput",
                  "hardDeleteSchema", "HardDeleteInput"]

userStories:     ["*en tant que développeur je veux valider les données d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Statuts (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

/**
 * Statuts autorisés — alignés sur la colonne `Project.status` (String en DB).
 * Pour ajouter un statut : ajouter ici + une entrée dans PROJECT_STATUS_LABELS.
 * Le typage `ProjectStatus` reste dérivé, aucune autre modification nécessaire.
 */
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
  .min(1, "Nom requis.")
  .max(80, "Nom trop long (80 caractères maximum).");

/**
 * Slug : optionnel à la saisie — si vide, l'action le génère depuis le nom.
 * La regex impose le format kebab-case (minuscules, chiffres, tirets).
 */
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
  .min(1, "Description requise.")
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
/*  Suppression douce / restauration                                   */
/* ------------------------------------------------------------------ */

export const projectIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});

export type ProjectIdInput = z.infer<typeof projectIdSchema>;

/* ------------------------------------------------------------------ */
/*  Suppression définitive                                             */
/* ------------------------------------------------------------------ */

/**
 * Exige le slug exact du projet en plus de l'id : double garde-fou
 * contre les suppressions accidentelles d'un projet en corbeille.
 * Le serveur vérifie en plus que le projet est bien soft-deleted.
 */
export const hardDeleteSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
  slug: z.string().min(1, "Slug de confirmation requis."),
});

export type HardDeleteInput = z.infer<typeof hardDeleteSchema>;