/*
path :           app/back-studio/scrum/[slug]/personas/[personaSlug]/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de détail d'un persona : infos complètes + actions Éditer et
                 Supprimer (avec redirection vers la liste après suppression).
flow:            Server Component async → params → findFirst projet + persona →
                 notFound si absent → affichage + actions.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/page.tsx",
                 ]
relatedFiles:    ["@/components/persona/DeletePersonaButton.tsx",
                  "@/utils/keywords"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/persona/DeletePersonaButton",
                  "@/utils/keywords"]
exports:         ["default PersonaDetailPage"]

userStories:     ["*en tant que développeur je veux consulter le détail d'un persona"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { DeletePersonaButton } from "@/components/persona/DeletePersonaButton";
import { parseKeywordsJson } from "@/utils/keywords";

type Params = Promise<{ slug: string; personaSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, personaSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!project) return { title: "Persona introuvable" };

  const persona = await prisma.persona.findFirst({
    where: { projectId: project.id, slug: personaSlug, deletedAt: null },
    select: { name: true },
  });

  return persona
    ? { title: `${persona.name} — Persona` }
    : { title: "Persona introuvable" };
}

export default async function PersonaDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug, personaSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const persona = await prisma.persona.findFirst({
    where: { projectId: project.id, slug: personaSlug, deletedAt: null },
  });
  if (!persona) notFound();

  const keywords = parseKeywordsJson(persona.keywords);
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

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {persona.name}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            /{persona.slug}
          </p>
          {persona.value && (
            <p className="max-w-2xl text-sm italic text-muted-foreground">
              {persona.value}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${base}/${persona.slug}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Éditer
          </Link>
          <DeletePersonaButton
            id={persona.id}
            name={persona.name}
            projectSlug={project.slug}
            redirectToList
          />
        </div>
      </header>

      {keywords.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mots-clés
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <li
                key={k}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-foreground"
              >
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Icône" value={persona.icon ?? "—"} />
        <Meta label="Accent" value={persona.accent ?? "—"} />
        <Meta label="Ordre" value={String(persona.displayOrder)} />
        <Meta
          label="Créé le"
          value={persona.createdAt.toLocaleDateString("fr-FR")}
        />
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta (interne)                                                     */
/* ------------------------------------------------------------------ */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}