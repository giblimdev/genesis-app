/*
path :           app/back-studio/help-dev/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Hub de la section Help Dev du Back-Studio. Présente les
                 outils internes disponibles (Cmd, Prompt Maker, Theme Maker,
                 Palette Tailwind) sous forme de cartes cliquables avec
                 description, icône et accent. Sert de point d'entrée
                 unique pour les développeurs.

flow:            Server Component → rend une grille de cartes à partir de
                 la constante locale SECTIONS → chaque carte est un <Link>
                 vers la sous-page correspondante. Animations d'apparition
                 déléguées à <Reveal /> (Client Component transverse).

ecosystem:       DevHelp = [
                   "@/app/back-studio/help-dev/page.tsx",
                   "@/app/back-studio/help-dev/cmd/page.tsx",
                   "@/app/back-studio/help-dev/prompt/page.tsx",
                   "@/app/back-studio/help-dev/thema/page.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/help-dev/cmd/page.tsx",
                  "@/app/back-studio/help-dev/prompt/page.tsx",
                  "@/app/back-studio/help-dev/thema/page.tsx",
                  "@/components/common/Reveal.tsx",
                  "@/components/ui/button.tsx"]
imports:         ["next", "next/link", "lucide-react",
                  "@/components/common/Reveal",
                  "@/components/ui/button"]
exports:         ["metadata", "default HelpDevPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux accéder aux outils Help Dev depuis un hub unique",
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
  FileText,
  Palette,
  Terminal,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Help Dev — Outils développeur",
  description:
    "Hub des outils internes : commandes CLI, éditeur de CONTRIBUTING, design tokens, palette Tailwind.",
};

/* ------------------------------------------------------------------ */
/*  Données statiques                                                  */
/* ------------------------------------------------------------------ */

type Accent = "chart-1" | "chart-2" | "chart-3" | "chart-4";

type HelpSection = {
  readonly id: string;
  readonly href: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly accent: Accent;
  readonly tags: readonly string[];
};

const SECTIONS: readonly HelpSection[] = [
  {
    id: "cmd",
    href: "/back-studio/help-dev/cmd",
    label: "Commandes CLI",
    description:
      "Référence centralisée des commandes Prisma, GitHub et Vercel. Blocs copiables en un clic, plus la liste des bibliothèques installées.",
    icon: Terminal,
    accent: "chart-1",
    tags: ["Prisma", "GitHub", "Vercel", "Libs"],
  },
  {
    id: "prompt",
    href: "/back-studio/help-dev/prompt",
    label: "Prompt Maker",
    description:
      "Éditeur du fichier CONTRIBUTING.md à la racine du projet. Ajoute des thèmes, copie le contenu, sauvegarde directement sur disque.",
    icon: FileText,
    accent: "chart-2",
    tags: ["CONTRIBUTING", "Conventions", "Markdown"],
  },
  {
    id: "thema",
    href: "/back-studio/help-dev/thema",
    label: "Theme Maker",
    description:
      "Référence visuelle des design tokens : surfaces, actions, états, accents, polices, radius, sidebar. Copie la déclaration CSS d'un token en un clic.",
    icon: Wand2,
    accent: "chart-3",
    tags: ["Tokens", "Thème", "Design system"],
  },
  {
    id: "palette",
    href: "/back-studio/help-dev/palette",
    label: "Palette Tailwind",
    description:
      "Palette Tailwind v4 complète (22 familles × 11 nuances). Clique sur un swatch pour copier le code hexadécimal. Les 5 accents du projet sont mis en évidence.",
    icon: Palette,
    accent: "chart-4",
    tags: ["Couleurs", "Hex", "Tailwind"],
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
};

const ACCENT_HOVER: Record<Accent, string> = {
  "chart-1": "hover:border-chart-1/40",
  "chart-2": "hover:border-chart-2/40",
  "chart-3": "hover:border-chart-3/40",
  "chart-4": "hover:border-chart-4/40",
};

const ACCENT_BULLET: Record<Accent, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HelpDevPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-12">
      {/* ============================================================ */}
      {/*  En-tête                                                      */}
      {/* ============================================================ */}

      <Reveal>
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-3 text-white shadow-sm">
              <Wand2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Back-Studio · Help Dev
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Aide développeur
          </h1>

          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Tous les outils internes de l&apos;atelier, réunis en un seul
            endroit. Choisis un outil pour ouvrir sa page dédiée.
          </p>
        </header>
      </Reveal>

      {/* ============================================================ */}
      {/*  Grille des outils                                            */}
      {/* ============================================================ */}

      <section className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, i) => (
          <Reveal key={section.id} delay={0.05 * i}>
            <Link
              href={section.href}
              className={`group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors ${ACCENT_HOVER[section.accent]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
            >
              {/* En-tête de carte */}
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${ACCENT_ICON_BG[section.accent]}`}
                >
                  <section.icon className="size-5" aria-hidden />
                </span>

                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden
                />
              </div>

              {/* Titre + description */}
              <div className="flex flex-1 flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {section.label}
                </h2>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
              </div>

              {/* Tags */}
              <ul className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                {section.tags.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className={`inline-block size-1.5 rounded-full ${ACCENT_BULLET[section.accent]}`}
                    />
                    {tag}
                  </li>
                ))}
              </ul>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ============================================================ */}
      {/*  Note de bas de page                                          */}
      {/* ============================================================ */}

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ces outils sont réservés au développement. Ils écrivent
            directement sur le disque du projet.
          </p>

          <Link
            href="/back-studio"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} gap-2`}
          >
            Retour au Back-Studio
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </Reveal>
    </main>
  );
}