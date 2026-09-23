/*
path :           lib/user-story/json.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Sérialisation/désérialisation des 3 champs JSON du modèle UserStory :
                 acceptanceCriteria (AcceptanceCriterion[]), dodChecked (string[]),
                 linkedFiles (string[]). Tolérant aux données invalides (retourne []
                 au lieu de lever).
flow:            parseAcceptanceCriteria(raw) → AcceptanceCriterion[].
                 stringifyAcceptanceCriteria(list) → string | null.
                 parseStringList(raw) → string[].
                 stringifyStringList(list) → string | null.
ecosystem:       Dev = [
                   "@/lib/user-story/json.ts",
                   "@/app/actions/user-story/createUserStory.ts",
                 ]
relatedFiles:    ["@/lib/validations/user-story.ts",
                  "@/components/user-story/UserStoryForm.tsx"]
imports:         []
exports:         ["AcceptanceCriterion",
                  "parseAcceptanceCriteria", "stringifyAcceptanceCriteria",
                  "parseStringList", "stringifyStringList"]

userStories:     ["*en tant que développeur je veux sérialiser les champs JSON d'une user story"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AcceptanceCriterion = {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
};

/* ------------------------------------------------------------------ */
/*  Acceptance criteria                                                */
/* ------------------------------------------------------------------ */

function isAcceptanceCriterion(v: unknown): v is AcceptanceCriterion {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.text === "string" &&
    typeof o.done === "boolean"
  );
}

export function parseAcceptanceCriteria(raw: string | null): AcceptanceCriterion[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAcceptanceCriterion);
  } catch {
    return [];
  }
}

export function stringifyAcceptanceCriteria(
  list: readonly AcceptanceCriterion[],
): string | null {
  if (list.length === 0) return null;
  return JSON.stringify(list);
}

/* ------------------------------------------------------------------ */
/*  Listes de chaînes (dodChecked, linkedFiles)                        */
/* ------------------------------------------------------------------ */

export function parseStringList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function stringifyStringList(list: readonly string[]): string | null {
  const cleaned = list.map((s) => s.trim()).filter((s) => s.length > 0);
  if (cleaned.length === 0) return null;
  return JSON.stringify(cleaned);
}