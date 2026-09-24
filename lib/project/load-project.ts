/*
path :           lib/project/load-project.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Orchestrateur de lecture avec fallback. Essaie la DB
                 d'abord (source de vérité) ; en cas d'échec, lit depuis
                 data/save-prog/ en mode dégradé. Retourne un objet
                 discriminé qui permet à l'UI de savoir d'où viennent les
                 données et d'afficher un bandeau si nécessaire.

flow:            loadProjectBySlug(slug, userId) → try getProjectBySlug
                 → si succès : { source: "db", project }
                 → si erreur : readProjectFromDisk(slug)
                 → si trouvé : { source: "disk", project, warning }
                 → sinon : { source: "none" }.

ecosystem:       Dev = [
                   "@/lib/project/load-project.ts",
                   "@/lib/project/queries.ts",
                   "@/lib/project/disk-fallback.ts",
                 ]
relatedFiles:    ["@/lib/project/queries.ts",
                  "@/lib/project/disk-fallback.ts",
                  "@/lib/project/serialize-for-disk.ts"]
imports:         ["server-only",
                  "@/lib/project/queries",
                  "@/lib/project/disk-fallback"]
exports:         ["loadProjectBySlug", "ProjectLoadResult"]

userStories:     ["*en tant que développeur je veux un fallback disque en lecture"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { getProjectBySlug } from "@/lib/project/queries";
import { readProjectFromDisk } from "@/lib/project/disk-fallback";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DbProject = NonNullable<
  Awaited<ReturnType<typeof getProjectBySlug>>
>;

/**
 * Project minimal reconstruit depuis le disque. Reproduit la forme
 * attendue par les pages, avec des compteurs à 0 (inconnus en mode
 * dégradé) et un flag `_isDiskProject`.
 */
export type DiskProject = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly tagline: string | null;
  readonly description: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly _count: {
    readonly features: number;
    readonly personas: number;
    readonly userStories: number;
    readonly sprints: number;
    readonly files: number;
    readonly stacks: number;
  };
  readonly _isDiskProject: true;
};

export type ProjectLoadResult =
  | { readonly source: "db"; readonly project: DbProject }
  | {
      readonly source: "disk";
      readonly project: DiskProject;
      readonly warning: string;
    }
  | { readonly source: "none" };

/* ------------------------------------------------------------------ */
/*  Lecture avec fallback                                              */
/* ------------------------------------------------------------------ */

export async function loadProjectBySlug(
  slug: string,
  userId: string,
): Promise<ProjectLoadResult> {
  /* --- Tentative DB --- */

  try {
    const project = await getProjectBySlug(slug, userId);

    if (project) {
      return { source: "db", project };
    }

    /* DB répond, mais le projet n'existe pas → pas de fallback
       (si l'utilisateur voit une DB vide, c'est qu'il n'a pas ce
       projet, inutile de chercher sur disque). */
    return { source: "none" };
  } catch (err) {
    console.error("[loadProjectBySlug] DB error, falling back to disk:", err);
  }

  /* --- Fallback disque --- */

  const snapshot = await readProjectFromDisk(slug);

  if (!snapshot) {
    return { source: "none" };
  }

  const now = new Date();

  const project: DiskProject = {
    id: `disk:${snapshot.project.slug}`,
    slug: snapshot.project.slug,
    name: snapshot.project.name,
    tagline: snapshot.project.tagline,
    description: snapshot.project.description,
    status: snapshot.project.status,
    createdAt: now,
    updatedAt: now,
    _count: {
      features: snapshot.features.length,
      personas: snapshot.personas.length,
      userStories: snapshot.userStories.length,
      sprints: snapshot.sprints.length,
      files: 0,
      stacks: 0,
    },
    _isDiskProject: true,
  };

  return {
    source: "disk",
    project,
    warning:
      "Mode dégradé : base de données inaccessible. Lecture depuis le dernier export disque. Les modifications sont désactivées.",
  };
}