/*
path :           lib/sprint/transitions.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Matrice de transitions autorisées entre statuts de sprint.
                 Extrait dans un fichier séparé car un fichier "use server"
                 ne peut pas exporter d'objet — uniquement des fonctions async.

flow:            ALLOWED_TRANSITIONS[from] → liste des cibles autorisées.
                 isValidTransition(from, to) → booléen.

ecosystem:       Dev = [
                   "@/lib/sprint/transitions.ts",
                   "@/app/actions/sprint/changeSprintStatus.ts",
                 ]
imports:         ["@/lib/validations/sprint"]
exports:         ["ALLOWED_TRANSITIONS", "isValidTransition"]

userStories:     ["*en tant que développeur je veux interdire certaines transitions de statut"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { SprintStatus } from "@/lib/validations/sprint";

/**
 * Pour chaque statut source, la liste des statuts cibles autorisés.
 *
 *   planned   → composed, active, cancelled
 *   composed  → planned, active, cancelled
 *   active    → completed, cancelled
 *   completed → (terminal : aucune sortie)
 *   cancelled → planned (réouverture)
 *
 * Pour modifier une règle : ajouter/retirer une valeur dans les tableaux.
 * Les transitions ne sont PAS symétriques par défaut — c'est voulu.
 */
export const ALLOWED_TRANSITIONS: Record<
  SprintStatus,
  readonly SprintStatus[]
> = {
  planned: ["composed", "active", "cancelled"],
  composed: ["planned", "active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: ["planned"],
};

export function isValidTransition(
  from: SprintStatus,
  to: SprintStatus,
): boolean {
  if (from === to) return true; // no-op, géré séparément
  return ALLOWED_TRANSITIONS[from].includes(to);
}