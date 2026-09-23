/*
path :           lib/validations/creat-files.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod pour le payload de création de fichiers (CreatFiles). Valide
                 le tableau { path?, content }, borne les tailles (max 999 fichiers,
                 2 Mo par fichier), et le choix de politique en cas de conflit.
                 Le path est désormais OPTIONNEL : s'il est absent, la route /save le
                 déduit de l'en-tête Helpdev présent dans le contenu.
flow:            creatFilesPayloadSchema.safeParse(body) → { files, onConflict? }.
                 safePath est exporté pour que la route puisse valider les chemins
                 résolus après déduction.
ecosystem:       Dev = [
                   "@/app/api/back-studio/creat-files/save/route.ts",
                   "@/lib/validations/creat-files.ts",
                 ]
relatedFiles:    ["@/app/api/back-studio/creat-files/save/route.ts",
                  "@/app/back-studio/creatFiles/CreatFilesView.tsx"]
imports:         ["zod"]
exports:         ["creatFilesPayloadSchema", "CreatFilesPayload",
                  "ConflictPolicy", "conflictPolicySchema", "safePath"]

userStories:     ["*en tant que développeur je veux valider les fichiers à créer"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Détection de traversée basée sur les segments                      */
/* ------------------------------------------------------------------ */

function hasPathTraversal(s: string): boolean {
  if (s === "..") return true;
  if (s.startsWith("../")) return true;
  if (s.endsWith("/..")) return true;
  if (s.includes("/../")) return true;
  if (s.includes("//")) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Chemin relatif sûr (exporté pour la route)                         */
/* ------------------------------------------------------------------ */

export const safePath = z
  .string()
  .trim()
  .min(1, "Chemin vide.")
  .max(500, "Chemin trop long.")
  .refine((s) => !s.startsWith("/"), "Chemin absolu interdit.")
  .refine((s) => !s.startsWith("\\"), "UNC interdit.")
  .refine((s) => !hasPathTraversal(s), "Traversée « .. » interdite.")
  .refine((s) => !s.includes("\\"), "Séparateur Windows interdit.")
  .refine(
    (s) => !/[<>:"|?*\x00-\x1f]/.test(s),
    "Caractères interdits dans le chemin.",
  );

/* ------------------------------------------------------------------ */
/*  Politique de conflit                                               */
/* ------------------------------------------------------------------ */

export const conflictPolicySchema = z.enum(["skip", "overwrite", "rename"]);
export type ConflictPolicy = z.infer<typeof conflictPolicySchema>;

/* ------------------------------------------------------------------ */
/*  Payload                                                            */
/* ------------------------------------------------------------------ */

/**
 * `path` est optionnel côté validation Zod : la route /save le résout
 * ensuite depuis l'en-tête Helpdev du contenu. Une chaîne vide est
 * acceptée (traitée comme absence).
 */
export const creatFilesPayloadSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().max(500, "Chemin trop long.").optional(),
        content: z
          .string()
          .max(2_000_000, "Contenu trop volumineux (2 Mo max par fichier)."),
      }),
    )
    .min(1, "Aucun fichier.")
    .max(999, "999 fichiers maximum."),
  onConflict: conflictPolicySchema.optional(),
});

export type CreatFilesPayload = z.infer<typeof creatFilesPayloadSchema>;