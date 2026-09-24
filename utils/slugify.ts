/*
path :           utils/slugify.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Génération de slug URL-safe à partir d'une chaîne libre. Minuscules,
                 suppression des accents, remplacement des caractères non alphanumériques
                 par des tirets, compression des tirets multiples, trim des tirets en
                 début/fin. Utilisé par tous les CRUD (Project, Feature, Persona,
                 UserStory, Sprint, Task) pour produire des slugs uniques et lisibles.
flow:            slugify("Créer un Compte") → "creer-un-compte" ;
                 slugify("  ÉLÈVE 2026 !") → "eleve-2026" ;
                 slugify("—") → "" ;
                 slugifyWithFallback("!!!", "item") → "item".
                 Aucun état, aucun effet de bord.

ecosystem:       Utils = [
                   "@/lib/utils/slugify.ts",
                   "@/lib/utils/initials.ts",
                   "@/lib/utils/date.ts",
                   "@/lib/utils/path.ts",
                   "@/lib/utils/keywords.ts",
                   "@/lib/utils/format.ts",
                   "@/lib/utils/id.ts",
                   "@/lib/utils/normalizeToLowercase.ts",
                 ]
relatedFiles:    ["@/lib/validations/project.ts",
                  "@/lib/validations/feature.ts",
                  "@/lib/validations/persona.ts",
                  "@/lib/validations/userStory.ts",
                  "@/lib/validations/sprint.ts",
                  "@/lib/validations/task.ts"]
imports:         []
exports:         ["slugify", "slugifyWithFallback"]
useBy:           ["@/lib/validations/project.ts",
                  "@/lib/validations/feature.ts",
                  "@/lib/validations/persona.ts",
                  "@/lib/validations/userStory.ts",
                  "@/lib/validations/sprint.ts",
                  "@/lib/validations/task.ts"]

userStories:     ["*en tant que développeur je veux générer un slug URL-safe"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Slug                                                               */
/* ------------------------------------------------------------------ */

/**
 * Transforme une chaîne libre en slug URL-safe.
 *
 * Étapes :
 *   1. NFD + suppression des diacritiques (é → e, ç → c, …)
 *   2. minuscules
 *   3. remplacement de tout caractère non [a-z0-9] par un tiret
 *   4. compression des tirets multiples
 *   5. trim des tirets en début et fin
 *
 * @example
 *   slugify("Créer un Compte")   → "creer-un-compte"
 *   slugify("Hello, World!")     → "hello-world"
 *   slugify("  ÉLÈVE 2026  ")    → "eleve-2026"
 *   slugify("a  --  b")          → "a-b"
 *   slugify("—")                 → ""
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------ */
/*  Slug avec repli                                                    */
/* ------------------------------------------------------------------ */

/**
 * Comme `slugify`, mais retourne `fallback` si le résultat est vide.
 * Utile pour les champs où un slug vide n'est pas acceptable (nom
 * composé uniquement d'emojis, de symboles, …).
 *
 * @example
 *   slugifyWithFallback("!!!", "item")       → "item"
 *   slugifyWithFallback("Créer", "item")     → "creer"
 *   slugifyWithFallback("", "untitled")      → "untitled"
 */
export function slugifyWithFallback(input: string, fallback: string): string {
  const slug = slugify(input);
  return slug.length > 0 ? slug : slugify(fallback);
}
