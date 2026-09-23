/*
path :           lib/validations/save-app.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod pour les payloads des routes save-app (/preview et /save).
                 Valide les chemins relatifs, la liste (1..999) et le nom de sauvegarde
                 (.md ou .json). Le contrôle de traversée « .. » est désormais basé sur
                 les segments de chemin (…/../…) et non sur la sous-chaîne brute.
flow:            previewPayloadSchema.safeParse(body) → { paths, format }.
                 savePayloadSchema.safeParse(body) → { paths, filename }.
ecosystem:       Dev = [
                   "@/app/api/back-studio/save-app/preview/route.ts",
                   "@/app/api/back-studio/save-app/save/route.ts",
                   "@/lib/dev/assembleDocument.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/validations/save-app.ts",
                 ]
relatedFiles:    ["@/lib/dev/assembleDocument.ts",
                  "@/app/api/back-studio/save-app/preview/route.ts",
                  "@/app/api/back-studio/save-app/save/route.ts"]
imports:         ["zod",
                  "paramètres reçus : z.string() via safePath, z.array via previewPayloadSchema"]
exports:         ["safePath", "previewPayloadSchema", "savePayloadSchema",
                  "PreviewPayload", "SavePayload"]
useBy:           ["@/app/api/back-studio/save-app/preview/route.ts",
                  "@/app/api/back-studio/save-app/save/route.ts"]

userStories:     ["*en tant que développeur je veux valider les payloads d'export"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Détection de traversée basée sur les segments                      */
/* ------------------------------------------------------------------ */

/**
 * Détecte une tentative de traversée (..) uniquement quand « .. » apparaît
 * comme SEGMENT de chemin : "..", "../x", "a/..", "a/../b".
 * Autorise les noms comme "foo..bar.ts" ou "..cache" (fichiers cachés).
 */
function hasPathTraversal(s: string): boolean {
  if (s === "..") return true;
  if (s.startsWith("../")) return true;
  if (s.endsWith("/..")) return true;
  if (s.includes("/../")) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Chemin relatif sûr                                                 */
/* ------------------------------------------------------------------ */

export const safePath = z
  .string()
  .trim()
  .min(1, "Chemin vide.")
  .max(500, "Chemin trop long.")
  .refine((s) => !s.startsWith("/"), "Chemin absolu interdit.")
  .refine((s) => !hasPathTraversal(s), "Traversée « .. » interdite.")
  .refine((s) => !s.includes("\\"), "Séparateur Windows interdit.");

/* ------------------------------------------------------------------ */
/*  Aperçu (copie)                                                     */
/* ------------------------------------------------------------------ */

export const previewPayloadSchema = z.object({
  paths: z
    .array(safePath)
    .min(1, "Aucun fichier.")
    .max(999, "999 fichiers maximum."),
  format: z.enum(["md", "json"]).default("md"),
});

export type PreviewPayload = z.infer<typeof previewPayloadSchema>;

/* ------------------------------------------------------------------ */
/*  Sauvegarde disque                                                  */
/* ------------------------------------------------------------------ */

export const savePayloadSchema = z.object({
  paths: z
    .array(safePath)
    .min(1, "Aucun fichier.")
    .max(999, "999 fichiers maximum."),
  filename: z
    .string()
    .trim()
    .min(1, "Nom vide.")
    .max(120, "Nom trop long.")
    .regex(
      /^[a-zA-Z0-9_.-]+\.(md|json)$/,
      "Nom invalide : .md ou .json attendu, sans chemin.",
    ),
});

export type SavePayload = z.infer<typeof savePayloadSchema>;
