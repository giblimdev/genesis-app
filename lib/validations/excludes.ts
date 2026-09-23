/*
path :           lib/validations/excludes.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod pour la validation de la configuration d'exclusion
                 (public/save-app/excludes.json). Utilisé par la route API
                 /api/back-studio/save-app/excludes pour valider le payload entrant.
flow:            excludesConfigSchema.safeParse(payload) → { success, data } ou
                 { success: false, error }. Les tableaux sont bornés (longueur max) et
                 filtrés (chaînes non vides). Les nombres sont bornés (maxFiles 1..9999,
                 maxBytes 1 Mo..500 Mo).
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                   "@/lib/validations/excludes.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts",
                  "@/app/api/back-studio/save-app/excludes/route.ts"]
imports:         ["zod"]
exports:         ["excludesConfigSchema", "ExcludesConfigInput"]
useBy:           ["@/app/api/back-studio/save-app/excludes/route.ts"]

userStories:     ["*en tant que développeur je veux valider les règles d'exclusion"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const cleanString = z
  .string()
  .trim()
  .min(1, "Chaîne vide interdite.")
  .max(200, "Chaîne trop longue (200 caractères maximum).")
  .refine(
    (s) => !s.includes(".."),
    "Les chemins relatifs « .. » sont interdits.",
  )
  .refine((s) => !s.startsWith("/"), "Les chemins absolus sont interdits.");

const cleanStringArray = z
  .array(cleanString)
  .max(200, "Trop d'entrées (200 maximum).")
  .transform((arr) => Array.from(new Set(arr)));

const extension = z
  .string()
  .trim()
  .regex(/^\.[a-z0-9]+$/i, 'Extension invalide (ex. ".ts").')
  .max(15, "Extension trop longue.");

const excludePattern = z
  .string()
  .trim()
  .min(1, "Motif vide.")
  .max(80, "Motif trop long.")
  .refine(
    (s) => !s.includes(".."),
    "Les chemins relatifs « .. » sont interdits.",
  );

/* ------------------------------------------------------------------ */
/*  Schéma                                                             */
/* ------------------------------------------------------------------ */

export const excludesConfigSchema = z.object({
  roots: cleanStringArray,
  excludes: cleanStringArray,
  includeExtensions: z
    .array(extension)
    .max(50, "Trop d'extensions (50 maximum).")
    .transform((arr) => Array.from(new Set(arr))),
  excludePatterns: z
    .array(excludePattern)
    .max(100, "Trop de motifs (100 maximum).")
    .transform((arr) => Array.from(new Set(arr))),
  maxFiles: z.coerce
    .number()
    .int("Nombre entier requis.")
    .min(1, "Au moins 1 fichier.")
    .max(9999, "Maximum 9999 fichiers."),
  maxBytes: z.coerce
    .number()
    .int("Nombre entier requis.")
    .min(1_048_576, "Au moins 1 Mo.")
    .max(524_288_000, "Maximum 500 Mo."),
});

export type ExcludesConfigInput = z.infer<typeof excludesConfigSchema>;
