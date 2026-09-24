/*
path :           lib/validations/feature.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Feature : création, mise à jour, suppression,
                 import en lot. Source unique de vérité pour la validation des
                 entrées côté client et côté serveur. Les accents sont importés du
                 fichier central @/lib/design/accents.
flow:            createFeatureSchema.safeParse(payload) → CreateFeatureInput.
                 updateFeatureSchema.safeParse(payload) → UpdateFeatureInput.
                 featureIdSchema.safeParse(payload) → { id }.
                 bulkImportFeaturesSchema.safeParse(payload) → BulkImportFeatureInput[].
ecosystem:       DesignSystem = [
                   "@/lib/design/accents.ts",
                   "@/components/common/AccentPicker.tsx",
                   "@/components/common/EmptyState.tsx",
                   "@/lib/validations/feature.ts",
                   "@/lib/validations/persona.ts",
                   "@/lib/validations/sprint.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/design/accents.ts",
                  "@/app/actions/feature/createFeature.ts",
                  "@/app/actions/feature/updateFeature.ts",
                  "@/app/actions/feature/deleteFeature.ts",
                  "@/app/actions/feature/bulkImportFeatures.ts",
                  "@/components/feature/FeatureForm.tsx"]
imports:         ["zod", "@/lib/design/accents"]
exports:         ["FEATURE_MODULES", "FeatureModule", "FEATURE_MODULE_LABELS",
                  "getModuleLabel",
                  "FEATURE_ACCENTS", "FeatureAccent",
                  "createFeatureSchema", "CreateFeatureInput",
                  "updateFeatureSchema", "UpdateFeatureInput",
                  "featureIdSchema", "FeatureIdInput",
                  "bulkImportFeaturesSchema", "BulkImportFeatureInput"]

userStories:     ["*en tant que développeur je veux valider les données d'une feature",
                  "*en tant que développeur je veux importer des features en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

import { PROJECT_ACCENTS } from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Modules — champ string requis (liste ouverte, suggestions UI)      */
/* ------------------------------------------------------------------ */

/** Suggestions affichées dans l’UI. Le champ accepte n’importe quelle string. */
export const FEATURE_MODULES = [
  "vision",
  "conception",
  "backlog",
  "dev",
  "qualite",
  "communication",
  "equipe",
  "securite",
] as const;

export type FeatureModule = string;

export const FEATURE_MODULE_LABELS: Record<string, string> = {
  vision: "Vision",
  conception: "Conception",
  backlog: "Backlog",
  dev: "Développement",
  qualite: "Qualité",
  communication: "Communication",
  equipe: "Équipe",
  securite: "Sécurité",
};

export function getModuleLabel(module: string): string {
  return FEATURE_MODULE_LABELS[module] ?? module;
}

/* ------------------------------------------------------------------ */
/*  Accents — alias de la liste centrale                               */
/* ------------------------------------------------------------------ */

export const FEATURE_ACCENTS = PROJECT_ACCENTS;
export type FeatureAccent = (typeof PROJECT_ACCENTS)[number];

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
  .max(80, "Slug trop long (80 caractères maximum).")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (minuscules, chiffres et tirets uniquement).",
  )
  .optional()
  .or(z.literal(""));

const descriptionField = z
  .string()
  .trim()
  .min(1, "Description requise.")
  .max(3000, "Description trop longue (3000 caractères maximum).");

const moduleField = z
  .string()
  .trim()
  .min(1, "Module requis.")
  .max(60, "Module trop long (60 caractères maximum).");

const iconField = z
  .string()
  .trim()
  .max(60, "Nom d'icône trop long.")
  .optional()
  .or(z.literal(""));

const accentField = z
  .union([z.enum(PROJECT_ACCENTS), z.literal("")])
  .optional();

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export const createFeatureSchema = z.object({
  projectId: z.string().min(1, "Projet requis."),
  name: nameField,
  slug: slugField,
  description: descriptionField,
  module: moduleField,
  icon: iconField,
  accent: accentField,
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export const updateFeatureSchema = createFeatureSchema.extend({
  id: z.string().min(1, "Identifiant requis."),
});

export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;

/* ------------------------------------------------------------------ */
/*  Suppression                                                        */
/* ------------------------------------------------------------------ */

export const featureIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});

export type FeatureIdInput = z.infer<typeof featureIdSchema>;

/* ------------------------------------------------------------------ */
/*  Import en lot                                                      */
/* ------------------------------------------------------------------ */

/**
 * Item de bulk import — identique à createFeatureSchema SAUF que
 * `projectId` est fourni par la page via `.bind()`, pas par le JSON.
 */
const bulkFeatureItemSchema = z.object({
  name: nameField,
  slug: slugField,
  description: descriptionField,
  module: moduleField,
  icon: iconField,
  accent: accentField,
});

export const bulkImportFeaturesSchema = z
  .array(bulkFeatureItemSchema)
  .min(1, "Le tableau doit contenir au moins une feature.")
  .max(500, "500 features maximum par import.");

export type BulkImportFeatureInput = z.infer<typeof bulkImportFeaturesSchema>;