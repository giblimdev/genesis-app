/*
path :           lib/project/queries.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Requêtes Prisma en lecture pour Project. Séparées des
                 Server Actions pour bien distinguer read / write. Expose
                 getProjectBySlug (utilisée par loadProjectBySlug pour le
                 fallback disque) et getProjectIdBySlug (utilitaire utilisé
                 par tous les modules enfants : Feature, Persona, Design
                 System…).

flow:            server-only → getUserProjects(userId) → liste filtrée par
                 ownerId, non soft-deleted, triée par displayOrder.
                 getProjectBySlug(slug, userId) → projet + _count relations.
                 getProjectSummaryList → version légère pour Zustand.
                 getProjectIdBySlug → { id, slug, name } minimal.

ecosystem:       Project
userStories:     ["*auto-project-crud"]
relatedFiles:    ["@/lib/prisma.ts", "@/lib/project/load-project.ts"]
imports:         ["server-only", "@/lib/prisma"]
exports:         ["getUserProjects", "getProjectBySlug",
                  "getProjectSummaryList", "getProjectIdBySlug"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Liste des projets de l'utilisateur                                 */
/* ------------------------------------------------------------------ */

export async function getUserProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Version ultra-légère pour alimenter le store Zustand. */
export async function getProjectSummaryList(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Détail d'un projet par slug                                        */
/* ------------------------------------------------------------------ */

export async function getProjectBySlug(slug: string, userId: string) {
  return prisma.project.findFirst({
    where: { slug, ownerId: userId, deletedAt: null },
    include: {
      _count: {
        select: {
          features: true,
          personas: true,
          userStories: true,
          sprints: true,
        },
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Résolution d'un projet à partir du slug (utilitaire)               */
/* ------------------------------------------------------------------ */

/**
 * Retourne { id, slug, name } d'un projet non supprimé appartenant à
 * l'utilisateur. Utilisé par les modules enfants (Feature, Persona,
 * Design System…) pour scoper leurs requêtes.
 */
export async function getProjectIdBySlug(slug: string, userId: string) {
  return prisma.project.findFirst({
    where: { slug, ownerId: userId, deletedAt: null },
    select: { id: true, slug: true, name: true },
  });
}