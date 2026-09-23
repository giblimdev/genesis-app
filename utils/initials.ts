/*
path :           lib/utils/initials.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Extrait les initiales d'un nom complet (1 ou 2 lettres majuscules). Utilisé
                 par les avatars (UserMenu, RegisterForm, AvatarFallback) et tout composant
                 affichant un utilisateur sous forme condensée.
flow:            initialsOf("Jean Dupont") → "JD" ; initialsOf("Alice") → "AL" ;
                 initialsOf(null) → "?" ; initialsOf("  ") → "?".
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
relatedFiles:    ["@/components/layout/header/UserMenu.tsx",
                  "@/app/auth/register/RegisterForm.tsx"]
imports:         []
exports:         ["initialsOf"]
useBy:           ["@/components/layout/header/UserMenu.tsx",
                  "@/app/auth/register/RegisterForm.tsx"]

userStories:     ["*en tant que développeur je veux extraire les initiales d'un nom"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/**
 * Extrait 1 ou 2 initiales majuscules d'un nom.
 *
 * Règles :
 *   - null / undefined / chaîne vide → "?"
 *   - 1 seul mot → 2 premières lettres ("Alice" → "AL")
 *   - 2 mots ou plus → première lettre du premier + première lettre du dernier
 *     ("Jean Dupont" → "JD", "Marie Claire Dupont" → "MD")
 */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}
