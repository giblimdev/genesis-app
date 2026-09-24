/*
path :           app/back-studio/scrum/page.tsx
tag :            ["project", "list", "import", "page"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'entrée du module Scrum / Back-Studio. Liste les
                 projets actifs avec compteurs. Propose : export JSON complet
                 (avec features, personas, stories, sprints, tâches),
                 import de projets (bulk simple OU snapshot complet avec
                 enfants), accès à la corbeille et création unitaire.

flow:            Server Component async → prisma.project.findMany({ deletedAt:
                 null }) avec _count → rend soit <EmptyState>, soit une
                 grille de <ProjectCard />. Le bouton Export JSON ouvre un
                 <ExportJsonDialog> en mode "full" : le payload complet est
                 chargé à la demande via la Server Action exportProjectsFull.
                 Les Server Actions (bulkImportProjects, importProjectFull)
                 sont passées DIRECTEMENT à ImportJsonDialog (jamais enveloppées
                 dans une fonction inline — interdit entre Server et Client).

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/actions/project/importProjectFull.ts",
                   "@/app/back-studio/scrum/page.tsx",
                   "@/lib/validations/project.ts",
                 ]
relatedFiles:    ["@/components/project/ProjectCard.tsx",
                  "@/components/common/EmptyState.tsx",
                  "@/components/common/ExportJsonDialog.tsx",
                  "@/components/common/ImportJsonDialog.tsx",
                  "@/app/actions/project/bulkImportProjects.ts",
                  "@/app/actions/project/exportProjectsFull.ts",
                  "@/app/actions/project/importProjectFull.ts",
                  "@/lib/json-templates/project.ts"]
imports:         ["next", "next/link", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/EmptyState",
                  "@/components/common/ExportJsonDialog",
                  "@/components/common/ImportJsonDialog",
                  "@/components/project/ProjectCard",
                  "@/app/actions/project/bulkImportProjects",
                  "@/app/actions/project/exportProjectsFull",
                  "@/app/actions/project/importProjectFull",
                  "@/lib/json-templates/project"]
exports:         ["metadata", "default ScrumProjectsPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux lister et gérer les projets",
                  "*en tant que développeur je veux exporter tous mes projets avec dépendances",
                  "*en tant que développeur je veux importer des projets en lot",
                  "*en tant que développeur je veux restaurer un projet complet depuis JSON"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardPaste,
  Download,
  FolderKanban,
  FolderUp,
  Plus,
  Trash2,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ExportJsonDialog } from "@/components/common/ExportJsonDialog";
import { ImportJsonDialog } from "@/components/common/ImportJsonDialog";
import { ProjectCard } from "@/components/project/ProjectCard";
import { bulkImportProjects } from "@/app/actions/project/bulkImportProjects";
import { exportProjectsFull } from "@/app/actions/project/exportProjectsFull";
import { importProjectFull } from "@/app/actions/project/importProjectFull";
import { PROJECT_JSON_TEMPLATE } from "@/lib/json-templates/project";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Projets — Scrum",
  description:
    "Liste et gestion des projets : conception, personas, backlog, sprints.",
};

/* ------------------------------------------------------------------ */
/*  Template pour le mode « Restaurer un projet complet »             */
/* ------------------------------------------------------------------ */

const FULL_SNAPSHOT_TEMPLATE = `{
  "project": {
    "name": "Mon projet",
    "slug": "mon-projet",
    "tagline": null,
    "description": "Description du projet…",
    "status": "planned"
  },
  "features": [],
  "personas": [],
  "userStories": [],
  "sprints": [],
  "tasks": []
}`;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ScrumProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
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

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
              <FolderKanban className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Back-Studio · Scrum
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Projets
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {projects.length} projet(s) actif(s). Gère la conception, les
            personas, le backlog et les sprints.
          </p>
        </div>

        {/* ---------------------- Actions ---------------------- */}

        <div className="flex flex-wrap items-center gap-2">
          {/* Export JSON — payload COMPLET par défaut (toggle dispo pour léger) */}
          <ExportJsonDialog
            trigger={
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export JSON
              </button>
            }
            title="Export complet des projets"
            description="Tous les projets avec leurs dépendances (features, personas, stories, sprints, tâches). Le toggle permet de basculer vers le mode léger."
            fullFetcher={exportProjectsFull}
            defaultMode="full"
            fullToggleLabel="Inclure les dépendances"
            emptyMessage="Aucun projet à exporter."
          />

          {/* Import bulk simple — tableau de projets */}
          <ImportJsonDialog
            trigger={
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ClipboardPaste className="h-4 w-4" aria-hidden />
                Import JSON
              </button>
            }
            title="Importer des projets"
            description="Colle un tableau JSON de projets. Le slug est auto-généré s'il est vide. Les slugs dupliqués (dans le JSON ou en base) sont refusés."
            template={PROJECT_JSON_TEMPLATE}
            submitLabel="Importer"
            onSubmit={bulkImportProjects}
          />

          {/* Restaurer un projet complet (snapshot avec enfants) */}
          <ImportJsonDialog
            trigger={
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <FolderUp className="h-4 w-4" aria-hidden />
                Restaurer un projet
              </button>
            }
            title="Restaurer un projet complet depuis JSON"
            description="Colle un snapshot complet (format produit par l'export). Si le slug du projet existe déjà, son contenu sera mis à jour (features, personas, sprints, stories, tasks — upsert par slug et par titre de tâche). Sinon, un nouveau projet sera créé."
            template={FULL_SNAPSHOT_TEMPLATE}
            submitLabel="Restaurer"
            modes={["upsert"]}
            defaultMode="upsert"
            onSubmit={importProjectFull}
          />

          {/* Corbeille */}
          <Link
            href="/back-studio/scrum/trash"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Corbeille
          </Link>

          {/* Nouveau projet */}
          <Link
            href="/back-studio/scrum/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouveau projet
          </Link>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Contenu                                                      */}
      {/* ============================================================ */}

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Aucun projet pour l'instant"
          description="Crée ton premier projet, importe une liste, ou restaure un snapshot complet."
          accent="violet"
          action={
            <Link
              href="/back-studio/scrum/new"
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Créer un projet
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                tagline: p.tagline,
                description: p.description,
                status: p.status,
                counts: {
                  features: p._count.features,
                  personas: p._count.personas,
                  userStories: p._count.userStories,
                  sprints: p._count.sprints,
                },
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}