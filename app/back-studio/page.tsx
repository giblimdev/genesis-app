/*
path :           app/back-studio/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Hub du Back-Studio. Présente les 5 grands outils internes
                 (Scrum, Export IA, Help Dev, Save App, CreatFiles) sous
                 forme de cartes cliquables, avec description, icône,
                 accent et tags. Sert de point d'entrée unique pour tout
                 le Back-Studio.

flow:            Server Component → rend une grille à partir de la
                 constante locale TOOLS → chaque carte est un <Link> vers
                 l'outil correspondant. Animations d'apparition déléguées
                 à <Reveal />. Aucune donnée serveur.

ecosystem:       BackStudio = [
                   "@/app/back-studio/page.tsx",
                   "@/components/layout/header/nav/backStudioNav.ts",
                 ]
relatedFiles:    ["@/components/layout/header/nav/backStudioNav.ts",
                  "@/components/common/Reveal.tsx",
                  "@/components/ui/button.tsx",
                  "@/app/back-studio/scrum/page.tsx",
                  "@/app/back-studio/exportToIA/page.tsx",
                  "@/app/back-studio/help-dev/page.tsx",
                  "@/app/back-studio/saveApp/page.tsx",
                  "@/app/back-studio/creatFiles/page.tsx"]
imports:         ["next", "next/link", "lucide-react",
                  "@/components/common/Reveal",
                  "@/components/ui/button"]
exports:         ["metadata", "default BackStudioPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux accéder à tous les outils Back-Studio depuis un hub unique",
                  "*en tant que développeur je veux comprendre ce que fait chaque outil avant de l'ouvrir"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  FolderTree,
  FilePlus2,
  FileText,
  FolderDown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Back-Studio — Outils de développement",
  description:
    "Hub des outils internes : gestion de projets Scrum, export IA, aide développeur, sauvegarde de fichiers, création de fichiers.",
};

/* ------------------------------------------------------------------ */
/*  Données statiques                                                  */
/* ------------------------------------------------------------------ */

type Accent = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

type Tool = {
  readonly id: string;
  readonly href: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly accent: Accent;
  readonly tags: readonly string[];
};

const TOOLS: readonly Tool[] = [
  {
    id: "scrum",
    href: "/back-studio/scrum",
    label: "Scrum",
    description:
      "Gère tes projets : features, personas, backlog hiérarchique, sprints et tâches. Le cœur métier de l'atelier.",
    icon: FolderKanban,
    accent: "chart-1",
    tags: ["Projets", "Backlog", "Sprints", "Features", "Personas"],
  },
  {
    id: "export-ia",
    href: "/back-studio/exportToIA",
    label: "Export IA",
    description:
      "Exporte le contexte du projet (schéma Prisma, package.json, CONTRIBUTING) dans un document unique, copiable ou sauvegardable.",
    icon: FolderDown,
    accent: "chart-2",
    tags: ["Contexte", "Copie", "Sauvegarde"],
  },
  {
    id: "help-dev",
    href: "/back-studio/help-dev",
    label: "Help Dev",
    description:
      "Référence développeur : commandes CLI (Prisma, GitHub, Vercel), éditeur de CONTRIBUTING, design tokens, palette Tailwind.",
    icon: FileText,
    accent: "chart-3",
    tags: ["Cmd", "CONTRIBUTING", "Tokens", "Palette"],
  },
  {
    id: "save-app",
    href: "/back-studio/saveApp",
    label: "Save App",
    description:
      "Scanne les dossiers du projet, filtre les fichiers par type ou tag, puis copie ou sauvegarde un document assemblé au format MD ou JSON.",
    icon: FolderTree,
    accent: "chart-4",
    tags: ["Scan", "Filtres", "Arborescence", "Export"],
  },
  {
    id: "creat-files",
    href: "/back-studio/creatFiles",
    label: "CreatFiles",
    description:
      "Compose un tableau de fichiers { path, content }, édite chaque entrée, réordonne, puis écrit sur disque avec contrôle des conflits.",
    icon: FilePlus2,
    accent: "chart-5",
    tags: ["Bulk", "Anti-écrasement", "Header Helpdev"],
  },
];

/* ------------------------------------------------------------------ */
/*  Styles par accent                                                  */
/* ------------------------------------------------------------------ */

const ACCENT_ICON_BG: Record<Accent, string> = {
  "chart-1": "bg-chart-1/10 text-chart-1 ring-chart-1/20",
  "chart-2": "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  "chart-3": "bg-chart-3/10 text-chart-3 ring-chart-3/20",
  "chart-4": "bg-chart-4/10 text-chart-4 ring-chart-4/20",
  "chart-5": "bg-chart-5/10 text-chart-5 ring-chart-5/20",
};

const ACCENT_HOVER: Record<Accent, string> = {
  "chart-1": "hover:border-chart-1/40",
  "chart-2": "hover:border-chart-2/40",
  "chart-3": "hover:border-chart-3/40",
  "chart-4": "hover:border-chart-4/40",
  "chart-5": "hover:border-chart-5/40",
};

const ACCENT_BULLET: Record<Accent, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BackStudioPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-12">
      {/* ============================================================ */}
      {/*  En-tête                                                      */}
      {/* ============================================================ */}

      <Reveal>
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 text-white shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Back-Studio
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Outils de développement
          </h1>

          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            L&apos;atelier interne : gestion de projets Scrum, export de
            contexte, aide développeur, sauvegarde et création de fichiers.
            Choisis un outil pour l&apos;ouvrir.
          </p>
        </header>
      </Reveal>

      {/* ============================================================ */}
      {/*  Grille des outils                                            */}
      {/* ============================================================ */}

      <section className="grid gap-4 md:grid-cols-2">
        {TOOLS.map((tool, i) => (
          <Reveal
            key={tool.id}
            delay={0.05 * i}
            className={tool.id === "scrum" ? "md:col-span-2" : undefined}
          >
            <ToolCard tool={tool} featured={tool.id === "scrum"} />
          </Reveal>
        ))}
      </section>

      {/* ============================================================ */}
      {/*  Note de bas de page                                          */}
      {/* ============================================================ */}

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ces outils écrivent directement sur le disque du projet.
            Utilise-les avec discernement.
          </p>

          <Link
            href="/"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} gap-2`}
          >
            Retour à l&apos;accueil
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </Reveal>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte outil                                                        */
/* ------------------------------------------------------------------ */

function ToolCard({
  tool,
  featured = false,
}: {
  readonly tool: Tool;
  readonly featured?: boolean;
}) {
  return (
    <Link
      href={tool.href}
      className={`group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors ${ACCENT_HOVER[tool.accent]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        featured ? "md:flex-row md:items-start md:gap-6" : ""
      }`}
    >
      {/* Icône */}
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${ACCENT_ICON_BG[tool.accent]}`}
      >
        <tool.icon className="size-5" aria-hidden />
      </span>

      {/* Corps */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2
            className={`font-semibold tracking-tight text-foreground ${
              featured ? "text-xl" : "text-lg"
            }`}
          >
            {tool.label}
          </h2>

          <ArrowRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </div>

        <p
          className={`leading-relaxed text-muted-foreground ${
            featured ? "text-sm sm:text-base" : "text-sm"
          }`}
        >
          {tool.description}
        </p>

        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {tool.tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              <span
                aria-hidden
                className={`inline-block size-1.5 rounded-full ${ACCENT_BULLET[tool.accent]}`}
              />
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}