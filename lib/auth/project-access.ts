/*
path :           lib/auth/project-access.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Vérifie qu'un utilisateur a accès à un projet via la relation
                 M2M "OwnedProjects". Utilisé par toutes les Server Actions qui
                 opèrent sur des entités liées à un projet (Feature, Persona,
                 UserStory, Sprint, Task).
flow:            assertProjectAccess(projectId, userId) → prisma.project.findFirst
                 sur { id, users: { some: { id: userId } }, deletedAt: null } →
                 retourne boolean. Ne lève jamais.
ecosystem:       Lib = [
                   "@/lib/auth/project-access.ts",
                 ]
relatedFiles:    ["@/app/actions/feature/createFeature.ts",
                  "@/lib/prisma.ts",
                  "@/lib/auth/session.ts"]
imports:         ["server-only", "@/lib/prisma"]
exports:         ["assertProjectAccess"]

userStories:     ["*en tant que développeur je veux protéger l'accès aux projets"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { prisma } from "@/lib/prisma";

export async function assertProjectAccess(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const found = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      users: { some: { id: userId } },
    },
    select: { id: true },
  });
  return found !== null;
}