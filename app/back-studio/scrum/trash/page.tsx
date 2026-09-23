/*
path :           app/back-studio/scrum/trash/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Corbeille des projets (soft-deleted). Affiche les projets avec
                 deletedAt != null et propose deux actions :
                   1. Restaurer (soft restore — deletedAt → null)
                   2. Supprimer définitivement (hard delete — prisma.delete)
flow:            Server Component async → findMany({ deletedAt: { not: null } }) →
                 liste avec <RestoreProjectButton /> et <HardDeleteProjectButton />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/trash/page.tsx",
                   "@/app/actions/project/restoreProject.ts",
                   "@/app/actions/project/hardDeleteProject.ts",
                 ]
relatedFiles:    ["@/app/actions/project/restoreProject.ts",
                  "@/app/actions/project/hardDeleteProject.ts",
                  "@/components/project/RestoreProjectButton.tsx",
                  "@/components/project/HardDeleteProjectButton.tsx",
                  "@/lib/validations/project.ts"]
imports:         ["next", "next/link", "lucide-react",
                  "@/lib/prisma",
                  "@/components/common/EmptyState",
                  "@/components/project/RestoreProjectButton",
                  "@/components/project/HardDeleteProjectButton"]
exports:         ["metadata", "default TrashPage"]

userStories:     ["*en tant que développeur je veux restaurer ou purger un projet supprimé"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/common/EmptyState";
import { RestoreProjectButton } from "@/components/project/RestoreProjectButton";
import { HardDeleteProjectButton } from "@/components/project/HardDeleteProjectButton";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Corbeille — Scrum",
  description: "Projets supprimés restaurables ou purgeables.",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function TrashPage() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      deletedAt: true,
    },
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href="/back-studio/scrum"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux projets
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Trash2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · Scrum
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Corbeille
        </h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {projects.length} projet(s) supprimé(s). Tu peux les restaurer ou les
          supprimer définitivement.
        </p>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-6 w-6" />}
          title="Corbeille vide"
          description="Aucun projet supprimé pour l'instant."
          accent="amber"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              {/* Infos projet */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">
                  {p.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /{p.slug} · supprimé le{" "}
                  {p.deletedAt?.toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <RestoreProjectButton id={p.id} name={p.name} />
                <HardDeleteProjectButton
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
