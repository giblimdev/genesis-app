/*
path :           lib/utils/normalizeToLowercase.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Normalisation d'une chaîne pour la recherche ou le matching : minuscules,
                 suppression des accents et des espaces superflus. Utilisé par les barres de
                 recherche, les filtres et les comparaisons insensibles à la casse.
flow:            normalizeToLowercase("Créer un Compte") → "creer un compte" ;
                 matches("Créer", "creer un compte") → true ;
                 normalizeToLowercase("  ÉLÈVE  ") → "eleve".
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
relatedFiles:    []
imports:         []
exports:         ["normalizeToLowercase", "matches"]
useBy:           []

userStories:     ["*en tant que développeur je veux normaliser une chaîne pour la recherche"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/**
 * Minuscules + suppression des accents + trim + espaces multiples réduits.
 * Idéal pour comparer des chaînes saisies par l'utilisateur.
 */
export function normalizeToLowercase(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Vrai si `haystack` contient `needle` après normalisation des deux côtés.
 * Insensible à la casse, aux accents et aux espaces multiples.
 *
 * @example matches("creer", "Créer un compte") → true
 */
export function matches(haystack: string, needle: string): boolean {
  const h = normalizeToLowercase(haystack);
  const n = normalizeToLowercase(needle);
  if (n.length === 0) return true;
  return h.includes(n);
}
