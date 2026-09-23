/*
path :           lib/utils/id.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Génération d'identifiants uniques côté client. Utilise crypto.randomUUID
                 quand disponible (Node 19+, navigateurs modernes), avec fallback basé sur
                 Math.random pour les environnements très anciens.
flow:            generateId() → UUID v4 (ex. "a3f8c1d9-4e7b-4065-9f2a-c8d1e4b7f0a6") ;
                 shortId(8) → chaîne alphanumérique de 8 caractères (ex. "k7fq2mxp").
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
exports:         ["generateId", "shortId"]
useBy:           []

userStories:     ["*en tant que développeur je veux générer un identifiant unique"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  UUID                                                               */
/* ------------------------------------------------------------------ */

/**
 * Retourne un UUID v4.
 * - navigateur moderne / Node 19+ : utilise crypto.randomUUID
 * - fallback : chaîne pseudo-aléatoire au format UUID v4
 */
export function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback — pas cryptographiquement sûr, suffisant pour un ID local.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ------------------------------------------------------------------ */
/*  ID court                                                           */
/* ------------------------------------------------------------------ */

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Retourne une chaîne alphanumérique courte (minuscules + chiffres).
 * Utile pour les clés locales, les identifiants de formulaire, les drafts.
 *
 * @example shortId() → "k7fq2mxp" ; shortId(16) → "k7fq2mxp9vlzr4tn"
 */
export function shortId(length = 8): string {
  if (length <= 0) return "";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[(Math.random() * ALPHABET.length) | 0];
  }
  return out;
}
