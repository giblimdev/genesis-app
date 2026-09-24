/*
path :           app/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'accueil publique de Genesis. Landing de présentation
                 de l'atelier : hero avec double CTA (connexion / Back-Studio),
                 grille des 3 piliers (Conception, Planification, Développement),
                 bandeau de chiffres, CTA final. Aucune donnée serveur : rendu
                 100 % statique. Les animations d'apparition au scroll sont
                 déléguées à <Reveal /> (Client Component transverse).

flow:            Server Component → rend <main> composé de sections :
                 1. Hero (badge + h1 gradient + sous-titre + 2 CTA)
                 2. Piliers (3 cartes accent chart-1..chart-4)
                 3. Chiffres clés (4 stats)
                 4. CTA final
                 Chaque bloc est enveloppé dans <Reveal /> pour un fade-in
                 à l'entrée dans le viewport.

ecosystem:       Landing = [
                   "@/app/page.tsx",
                 ]
relatedFiles:    ["@/components/common/Reveal.tsx",
                  "@/components/ui/button.tsx",
                  "@/app/auth/login/page.tsx",
                  "@/app/back-studio/page.tsx"]
imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/common/Reveal"]
exports:         ["metadata", "default HomePage"]
useBy:           []

userStories:     ["*en tant que visiteur je veux comprendre ce qu'est Genesis",
                  "*en tant que visiteur je veux pouvoir me connecter ou explorer le Back-Studio"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Layers,
  ListChecks,
  Rocket,
  Sparkles,
  Timer,
  Users2,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Genesis — L'atelier qui structure vos projets",
  description:
    "Conception, planification, développement. De l'idée au produit, toute l'équipe alignée.",
};

/* ------------------------------------------------------------------ */
/*  Données statiques                                                  */
/* ------------------------------------------------------------------ */

type Accent = "chart-1" | "chart-2" | "chart-3" | "chart-4";

type Pillar = {
  readonly icon: LucideIcon;
  readonly accent: Accent;
  readonly title: string;
  readonly description: string;
  readonly bullets: readonly string[];
};

const PILLARS: readonly Pillar[] = [
  {
    icon: Users2,
    accent: "chart-2",
    title: "Conception",
    description:
      "Décris tes utilisateurs et les capacités du produit avant d'écrire une ligne de code.",
    bullets: ["Personas", "Features", "Modules"],
  },
  {
    icon: ListChecks,
    accent: "chart-3",
    title: "Planification",
    description:
      "Structure le backlog en Epics et Stories, organise les sprints et leur composition.",
    bullets: ["Backlog hiérarchique", "Sprints", "Plateau DnD"],
  },
  {
    icon: Rocket,
    accent: "chart-4",
    title: "Développement",
    description:
      "Découpe les stories en tâches concrètes, suis l'avancement et exporte le contexte.",
    bullets: ["Tâches", "Export IA", "Sauvegarde disque"],
  },
];

type Stat = {
  readonly value: string;
  readonly label: string;
};

const STATS: readonly Stat[] = [
  { value: "6", label: "Entités métier" },
  { value: "5", label: "Accents projet" },
  { value: "100%", label: "Typé TypeScript" },
  { value: "0", label: "Placeholder" },
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

const ACCENT_BULLET: Record<Accent, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <main className="relative flex flex-col overflow-hidden">
      {/* ============================================================ */}
      {/*  Fonds décoratifs globaux                                     */}
      {/* ============================================================ */}

      <span
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 size-[36rem] rounded-full bg-chart-1/10 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 size-[32rem] rounded-full bg-chart-2/10 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/3 size-[28rem] rounded-full bg-chart-5/10 blur-3xl"
      />

      {/* ============================================================ */}
      {/*  1. HERO                                                      */}
      {/* ============================================================ */}

      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 md:pt-32">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-chart-1/30 bg-chart-1/5 px-3 py-1 text-xs font-medium text-chart-1">
            <Wand2 className="size-3.5" aria-hidden />
            Atelier de conception &amp; développement
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            De l&apos;idée au produit,{" "}
            <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-transparent">
              toute l&apos;équipe alignée.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Genesis structure vos projets du premier persona jusqu&apos;au
            dernier sprint. Conception, backlog, planification, tâches — un seul
            atelier, une seule vérité.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className={`${buttonVariants({ size: "lg" })} gap-2 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 text-white shadow-lg shadow-chart-2/25 transition hover:brightness-110`}
            >
              <Sparkles className="size-4" aria-hidden />
              Commencer
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            <Link
              href="/back-studio"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} gap-2`}
            >
              <Layers className="size-4" aria-hidden />
              Explorer le Back-Studio
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/*  2. PILIERS                                                   */}
      {/* ============================================================ */}

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <header className="mb-10 flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trois piliers
            </span>
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Un atelier complet pour toute l&apos;équipe projet
            </h2>
          </header>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={0.05 * i}>
              <article className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
                <span
                  className={`grid size-11 place-items-center rounded-xl ring-1 ${ACCENT_ICON_BG[pillar.accent]}`}
                >
                  <pillar.icon className="size-5" aria-hidden />
                </span>

                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {pillar.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>

                <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {pillar.bullets.map((b) => (
                    <li
                      key={b}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      <span
                        aria-hidden
                        className={`inline-block size-1.5 rounded-full ${ACCENT_BULLET[pillar.accent]}`}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  3. CHIFFRES CLÉS                                             */}
      {/* ============================================================ */}

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-4 sm:p-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 rounded-xl bg-muted/30 px-3 py-4 text-center"
              >
                <dt className="order-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="order-1 bg-gradient-to-br from-chart-1 to-chart-5 bg-clip-text font-mono text-3xl font-black tabular-nums text-transparent sm:text-4xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/*  4. CTA FINAL                                                 */}
      {/* ============================================================ */}

      <section className="relative mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-chart-1/30 bg-gradient-to-br from-chart-1/10 via-chart-2/5 to-transparent p-8 text-center sm:p-12">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-chart-2/20 blur-3xl"
            />

            <div className="relative flex flex-col items-center gap-5">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 text-white shadow-lg shadow-chart-2/30">
                <BookOpen className="size-5" aria-hidden />
              </span>

              <h2 className="max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Prêt à structurer ton premier projet ?
              </h2>

              <p className="max-w-lg text-balance text-sm leading-relaxed text-muted-foreground">
                Crée un compte, ouvre le Back-Studio et pose les fondations en
                quelques minutes.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link
                  href="/auth/register"
                  className={`${buttonVariants({ size: "lg" })} gap-2 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 text-white shadow-lg shadow-chart-2/25 transition hover:brightness-110`}
                >
                  <Sparkles className="size-4" aria-hidden />
                  Créer un compte
                  <ArrowRight className="size-4" aria-hidden />
                </Link>

                <Link
                  href="/auth/login"
                  className={`${buttonVariants({ variant: "ghost", size: "lg" })} gap-2`}
                >
                  <Timer className="size-4" aria-hidden />
                  J&apos;ai déjà un compte
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
