/*
path :           lib/validations/persona.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Persona : création, mise à jour, soft delete,
                 restauration, suppression définitive. Source unique de vérité pour
                 la validation des entrées. Expose aussi les accents autorisés.
flow:            createPersonaSchema.safeParse(payload) → CreatePersonaInput.
                 updatePersonaSchema.safeParse(payload) → UpdatePersonaInput.
                 personaIdSchema.safeParse(payload) → { id }.
                 hardDeletePersonaSchema.safeParse(payload) → { id, slug }.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                   "@/app/actions/persona/createPersona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/app/actions/persona/createPersona.ts",
                  "@/app/actions/persona/updatePersona.ts",
                  "@/app/actions/persona/softDeletePersona.ts",
                  "@/app/actions/persona/restorePersona.ts",
                  "@/app/actions/persona/hardDeletePersona.ts",
                  "@/components/persona/PersonaForm.tsx"]
imports:         ["zod"]
exports:         ["PERSONA_ACCENTS", "PersonaAccent",
                  "createPersonaSchema", "CreatePersonaInput",
                  "updatePersonaSchema", "UpdatePersonaInput",
                  "personaIdSchema", "PersonaIdInput",
                  "hardDeletePersonaSchema", "HardDeletePersonaInput"]

userStories:     ["*en tant que développeur je veux valider les données d'un persona"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Accents (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

export const PERSONA_ACCENTS = [
  "violet",
  "cyan",
  "amber",
  "emerald",
  "rose",
] as const;

export type PersonaAccent = (typeof PERSONA_ACCENTS)[number];

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

const valueField = z
  .string()
  .trim()
  .max(160, "Valeur trop longue (160 caractères maximum).")
  .optional()
  .or(z.literal(""));

/**
 * `keywords` est reçu côté formulaire sous forme de chaîne séparée par
 * des virgules. La conversion en JSON stringifié se fait dans l'action
 * via parseKeywordsInput + stringifyKeywords (utils/keywords).
 */
const keywordsInputField = z
  .string()
  .max(1000, "Liste de mots-clés trop longue.")
  .optional()
  .or(z.literal(""));

const iconField = z
  .string()
  .trim()
  .max(60, "Nom d'icône trop long.")
  .optional()
  .or(z.literal(""));

const accentField = z
  .union([z.enum(PERSONA_ACCENTS), z.literal("")])
  .optional();

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export const createPersonaSchema = z.object({
  projectId: z.string().min(1, "Projet requis."),
  name: nameField,
  slug: slugField,
  value: valueField,
  keywordsInput: keywordsInputField,
  icon: iconField,
  accent: accentField,
});

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>;

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export const updatePersonaSchema = createPersonaSchema.extend({
  id: z.string().min(1, "Identifiant requis."),
});

export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>;

/* ------------------------------------------------------------------ */
/*  Soft delete / restauration                                         */
/* ------------------------------------------------------------------ */

export const personaIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});

export type PersonaIdInput = z.infer<typeof personaIdSchema>;

/* ------------------------------------------------------------------ */
/*  Suppression définitive                                             */
/* ------------------------------------------------------------------ */

export const hardDeletePersonaSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
  slug: z.string().min(1, "Slug de confirmation requis."),
});

export type HardDeletePersonaInput = z.infer<
  typeof hardDeletePersonaSchema
>;