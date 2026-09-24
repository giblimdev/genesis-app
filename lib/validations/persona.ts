/*
path :           lib/validations/persona.ts
tag :            ["persona", "validation"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Persona : création, mise à jour, soft delete,
                 restauration, suppression définitive et import en lot. Les accents
                 sont importés du fichier central @/lib/design/accents.

flow:            createPersonaSchema.safeParse(payload) → CreatePersonaInput.
                 updatePersonaSchema.safeParse(payload) → UpdatePersonaInput.
                 personaIdSchema.safeParse(payload) → { id }.
                 hardDeletePersonaSchema.safeParse(payload) → { id, slug }.
                 bulkImportPersonasSchema.safeParse(payload) → BulkImportPersonaInput[].

ecosystem:       Persona = [
                   "@/app/actions/persona/bulkImportPersonas.ts",
                   "@/app/actions/persona/createPersona.ts",
                   "@/app/actions/persona/hardDeletePersona.ts",
                   "@/app/actions/persona/restorePersona.ts",
                   "@/app/actions/persona/softDeletePersona.ts",
                   "@/app/actions/persona/updatePersona.ts",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx",
                   "@/components/persona/DeletePersonaButton.tsx",
                   "@/components/persona/HardDeletePersonaButton.tsx",
                   "@/components/persona/PersonaCard.tsx",
                   "@/components/persona/PersonaForm.tsx",
                   "@/components/persona/RestorePersonaButton.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/persona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/lib/design/accents.ts",
                  "@/lib/json-templates/persona.ts",
                  "@/components/persona/PersonaForm.tsx"]
imports:         ["zod", "@/lib/design/accents"]
exports:         ["PERSONA_ACCENTS", "PersonaAccent",
                  "createPersonaSchema", "CreatePersonaInput",
                  "updatePersonaSchema", "UpdatePersonaInput",
                  "personaIdSchema", "PersonaIdInput",
                  "hardDeletePersonaSchema", "HardDeletePersonaInput",
                  "bulkImportPersonasSchema", "BulkImportPersonaInput"]
useBy:           ["@/app/actions/persona/createPersona.ts",
                  "@/app/actions/persona/updatePersona.ts",
                  "@/app/actions/persona/softDeletePersona.ts",
                  "@/app/actions/persona/restorePersona.ts",
                  "@/app/actions/persona/hardDeletePersona.ts",
                  "@/app/actions/persona/bulkImportPersonas.ts",
                  "@/components/persona/PersonaForm.tsx"]

userStories:     ["*en tant que développeur je veux valider les données d'un persona",
                  "*en tant que développeur je veux importer des personas en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

import { PROJECT_ACCENTS } from "@/lib/design/accents";

/* ------------------------------------------------------------------ */
/*  Accents — alias de la liste centrale                              */
/* ------------------------------------------------------------------ */

export const PERSONA_ACCENTS = PROJECT_ACCENTS;
export type PersonaAccent = (typeof PROJECT_ACCENTS)[number];

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
  .union([z.enum(PROJECT_ACCENTS), z.literal("")])
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

/* ------------------------------------------------------------------ */
/*  Import en lot                                                      */
/* ------------------------------------------------------------------ */

/**
 * Item de bulk import — identique à createPersonaSchema SAUF que
 * `projectId` est fourni par la page via `.bind()`, pas par le JSON.
 */
const bulkPersonaItemSchema = z.object({
  name: nameField,
  slug: slugField,
  value: valueField,
  keywordsInput: keywordsInputField,
  icon: iconField,
  accent: accentField,
});

export const bulkImportPersonasSchema = z
  .array(bulkPersonaItemSchema)
  .min(1, "Le tableau doit contenir au moins un persona.")
  .max(500, "500 personas maximum par import.");

export type BulkImportPersonaInput = z.infer<typeof bulkImportPersonasSchema>;