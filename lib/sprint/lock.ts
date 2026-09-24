/*
path :           lib/sprint/lock.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Helper serveur : vérifie qu'un sprint peut être édité.
                 VERSION DÉBLOCQUÉE — le verrouillage par statut est
                 désactivé : un sprint peut toujours être modifié.
                 Le type `SprintEditability` conserve la raison "locked"
                 pour que les appelants (updateSprint, softDeleteSprint,
                 assignStoryToSprint…) n'aient pas à être modifiés lors
                 de la réactivation du verrouillage.

flow:            assertSprintEditable(sprintId) → vérifie seulement que
                 le sprint existe et n'est pas soft-deleted. Retourne
                 toujours { ok: true } si le sprint est trouvé.
                 La branche { ok: false, reason: "locked" } n'est
                 actuellement JAMAIS retournée — elle est conservée dans
                 le type pour compatibilité avec les appelants qui la
                 testent.

ecosystem:       Dev = [
                   "@/lib/sprint/lock.ts",
                   "@/app/actions/sprint/updateSprint.ts",
                   "@/app/actions/sprint/assignStoryToSprint.ts",
                 ]
imports:         ["server-only", "@/lib/prisma"]
exports:         ["SprintEditability", "assertSprintEditable"]
useBy:           ["@/app/actions/sprint/updateSprint.ts",
                  "@/app/actions/sprint/softDeleteSprint.ts",
                  "@/app/actions/sprint/assignStoryToSprint.ts",
                  "@/app/actions/sprint/unassignStoryFromSprint.ts",
                  "@/app/actions/sprint/reorderSprintStories.ts"]

userStories:     ["*en tant que développeur je veux modifier un sprint quel que soit son statut"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { prisma } from "@/lib/prisma";

export type SprintEditability =
  | { readonly ok: true; readonly status: string }
  | {
      readonly ok: false;
      readonly reason: "not-found" | "locked";
      readonly status?: string;
    };

export async function assertSprintEditable(
  sprintId: string,
): Promise<SprintEditability> {
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, deletedAt: null },
    select: { status: true },
  });

  if (!sprint) return { ok: false, reason: "not-found" };
  return { ok: true, status: sprint.status };
}