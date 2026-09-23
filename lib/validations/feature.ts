/*
path :           lib/validations/feature.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Feature : création, mise à jour, suppression.
                 Source unique de vérité pour la validation des entrées côté client
                 et côté serveur. Expose aussi les constantes de module et d'accent.
flow:            createFeatureSchema.safeParse(payload) → CreateFeatureInput.
                 updateFeatureSchema.safeParse(payload) → UpdateFeatureInput.
                 featureIdSchema.safeParse(payload) → { id }.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/features/page.tsx",
                   "@/app/actions/feature/createFeature.ts",
                   "@/lib/validations/feature.ts",
                 ]
relatedFiles:    ["@/app/actions/feature/createFeature.ts",
                  "@/app/actions/feature/updateFeature.ts",
                  "@/app/actions/feature/deleteFeature.ts",
                  "@/components/feature/FeatureForm.tsx"]
imports:         ["zod"]
exports:         ["FEATURE_MODULES", "FeatureModule", "FEATURE_MODULE_LABELS",
                  "FEATURE_ACCENTS", "FeatureAccent",
                  "createFeatureSchema", "CreateFeatureInput",
                  "updateFeatureSchema", "UpdateFeatureInput",
                  "featureIdSchema", "FeatureIdInput"]

userStories:     ["*en tant que développeur je veux valider les données d'une feature"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Modules (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

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

export type FeatureModule = (typeof FEATURE_MODULES)[number];

export const FEATURE_MODULE_LABELS: Record<FeatureModule, string> = {
  vision: "Vision",
  conception: "Conception",
  backlog: "Backlog",
  dev: "Développement",
  qualite: "Qualité",
  communication: "Communication",
  equipe: "Équipe",
  securite: "Sécurité",
};

/* ------------------------------------------------------------------ */
/*  Accents (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

export const FEATURE_ACCENTS = [
  "violet",
  "cyan",
  "amber",
  "emerald",
  "rose",
] as const;

export type FeatureAccent = (typeof FEATURE_ACCENTS)[number];

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

const moduleField = z.enum(FEATURE_MODULES);

const iconField = z
  .string()
  .trim()
  .max(60, "Nom d'icône trop long.")
  .optional()
  .or(z.literal(""));

const accentField = z
  .union([z.enum(FEATURE_ACCENTS), z.literal("")])
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