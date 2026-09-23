/*
path :           components/project/ProjectModulesGrid.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Grille des 4 modules d'un projet (Features, Personas, User Stories,
                 Sprints). Chaque module est une carte cliquable qui pointe vers la
                 liste du module, avec un bouton « + » distinct qui pointe vers la
                 création. Composant purement présentationnel : reçoit les compteurs
                 et le slug du projet en props.
flow:            Rendu → pour chaque module → <ProjectModuleCard /> → carte
                 cliquable + lien « + » superposé.
ecosystem:       Dev = [
                   "@/components/project/ProjectModulesGrid.tsx",
                   "@/app/back-studio/scrum/[slug]/page.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/scrum/[slug]/page.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@/lib/utils"]
exports:         ["ProjectModulesGrid", "ProjectModulesGridProps",
                  "ProjectModuleCard", "ProjectModuleKey"]

userStories:     ["*en tant que développeur je veux voir et accéder aux 4 modules d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import Link from "next/link";
import {
  Layers,
  ListChecks,
  Plus,
  Timer,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Définition des modules                                             */
/* ------------------------------------------------------------------ */

export type ProjectModuleKey = "features" | "personas" | "backlog" | "sprints";

type Accent = "chart-1" | "chart-2" | "chart-3" | "chart-4";

type ModuleSpec = {
  readonly key: ProjectModuleKey;
  readonly label: string;
  readonly href: string;        // segment relatif à la base projet
  readonly createHref: string;  // idem, avec /new
  readonly icon: LucideIcon;
  readonly accent: Accent;
};

const MODULES: readonly ModuleSpec[] = [
  {
    key: "features",
    label: "Features",
    href: "features",
    createHref: "features/new",
    icon: Layers,
    accent: "chart-1",
  },
  {
    key: "personas",
    label: "Personas",
    href: "personas",
    createHref: "personas/new",
    icon: Users2,
    accent: "chart-2",
  },
  {
    key: "backlog",
    label: "User Stories",
    href: "backlog",
    createHref: "backlog/new",
    icon: ListChecks,
    accent: "chart-3",
  },
  {
    key: "sprints",
    label: "Sprints",
    href: "sprints",
    createHref: "sprints/new",
    icon: Timer,
    accent: "chart-4",
  },
];

/* ------------------------------------------------------------------ */
/*  Styles par accent                                                  */
/* ------------------------------------------------------------------ */

const ICON_BG: Record<Accent, string> = {
  "chart-1": "bg-chart-1/10 text-chart-1",
  "chart-2": "bg-chart-2/10 text-chart-2",
  "chart-3": "bg-chart-3/10 text-chart-3",
  "chart-4": "bg-chart-4/10 text-chart-4",
};

const PLUS_HOVER: Record<Accent, string> = {
  "chart-1": "hover:bg-chart-1/20 hover:text-chart-1",
  "chart-2": "hover:bg-chart-2/20 hover:text-chart-2",
  "chart-3": "hover:bg-chart-3/20 hover:text-chart-3",
  "chart-4": "hover:bg-chart-4/20 hover:text-chart-4",
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type ProjectModulesGridProps = {
  /** Slug du projet — sert à construire les URLs. */
  readonly projectSlug: string;
  /** Compteurs par module (typiquement project._count). */
  readonly counts: {
    readonly features: number;
    readonly personas: number;
    readonly userStories: number;
    readonly sprints: number;
  };
  readonly className?: string;
};

/* ------------------------------------------------------------------ */
/*  Grille                                                             */
/* ------------------------------------------------------------------ */

export function ProjectModulesGrid({
  projectSlug,
  counts,
  className,
}: ProjectModulesGridProps) {
  const base = `/back-studio/scrum/${projectSlug}`;

  const countByKey: Record<ProjectModuleKey, number> = {
    features: counts.features,
    personas: counts.personas,
    backlog: counts.userStories,
    sprints: counts.sprints,
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {MODULES.map((m) => (
        <ProjectModuleCard
          key={m.key}
          label={m.label}
          icon={m.icon}
          accent={m.accent}
          count={countByKey[m.key]}
          href={`${base}/${m.href}`}
          createHref={`${base}/${m.createHref}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte module                                                       */
/* ------------------------------------------------------------------ */

export type ProjectModuleCardProps = {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly accent: Accent;
  readonly count: number;
  readonly href: string;
  readonly createHref: string;
};

export function ProjectModuleCard({
  label,
  icon: Icon,
  accent,
  count,
  href,
  createHref,
}: ProjectModuleCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/30 transition-colors hover:border-primary/40">
      {/* Lien principal — occupe toute la carte */}
      <Link
        href={href}
        className="flex flex-1 flex-col gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-lg",
              ICON_BG[accent],
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>

        <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
          {count}
        </span>
      </Link>

      {/* Action "+" — lien distinct, superposé en haut à droite */}
      <Link
        href={createHref}
        aria-label={`Nouvelle entrée : ${label}`}
        className={cn(
          "absolute right-3 top-3 grid size-7 place-items-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors",
          PLUS_HOVER[accent],
        )}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}