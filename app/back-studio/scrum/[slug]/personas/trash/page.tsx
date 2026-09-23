/*
path :           app/back-studio/scrum/[slug]/personas/trash/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Corbeille des personas d'un projet. Affiche les personas soft-deleted
                 et propose restauration + suppression définitive.
flow:            Server Component async → params → findFirst projet →
                 prisma.persona.findMany({ projectId, deletedAt: { not: null } }) →
                 liste avec <RestorePersonaButton /> + <HardDeletePersonaButton />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx",
                   "@/app/actions/persona/restorePersona.ts",
                   "@/app/actions/persona/hardDeletePersona.ts",
                 ]
relatedFiles:    ["@/components/persona/RestorePersonaButton.tsx",
                  "@/components/persona/HardDeletePersonaButton.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/common/EmptyState",
                  "@/components/persona/RestorePersonaButton",
                  "@/components/persona/HardDeletePersonaButton"]
exports:         ["metadata", "default PersonaTrashPage"]

userStories:     ["*en tant que développeur je veux restaurer ou purger un persona"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/common/EmptyState";
import { RestorePersonaButton } from "@/components/persona/RestorePersonaButton";
import { HardDeletePersonaButton } from "@/components/persona/HardDeletePersonaButton";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Corbeille personas — Scrum",
  description: "Personas supprimés restaurables ou purgeables.",
};

export default async function PersonaTrashPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const personas = await prisma.persona.findMany({
    where: { projectId: project.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      deletedAt: true,
    },
  });

  const base = `/back-studio/scrum/${project.slug}/personas`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux personas
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Trash2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Personas
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Corbeille
        </h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {personas.length} persona(s) supprimé(s). Tu peux les restaurer ou les
          supprimer définitivement.
        </p>
      </header>

      {personas.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-6 w-6" />}
          title="Corbeille vide"
          description="Aucun persona supprimé pour l'instant."
          accent="amber"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {personas.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">
                  {p.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /{p.slug} · supprimé le{" "}
                  {p.deletedAt?.toLocaleDateString("fr-FR")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <RestorePersonaButton id={p.id} name={p.name} />
                <HardDeletePersonaButton
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