/*
path :           components/persona/PersonaCard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte d'un persona dans la liste. Affiche nom, valeur, mots-clés,
                 badge accent, et actions (ouvrir, éditer, supprimer).
flow:            Client Component → reçoit les données sérialisées + projectSlug →
                 rend une article cliquable avec les actions.
ecosystem:       Dev = [
                   "@/components/persona/PersonaCard.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/scrum/[slug]/personas/page.tsx",
                  "@/components/persona/DeletePersonaButton.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@/components/persona/DeletePersonaButton",
                  "@/components/ui/button",
                  "@/utils"]
exports:         ["PersonaCard", "PersonaCardProps", "PersonaCardData"]

userStories:     ["*en tant que développeur je veux visualiser un persona dans une carte"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";
import { Pencil, Quote } from "lucide-react";

import { DeletePersonaButton } from "./DeletePersonaButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Accent → classes                                                   */
/* ------------------------------------------------------------------ */

const ACCENT_BAR: Record<string, string> = {
  violet: "bg-chart-1",
  cyan: "bg-chart-2",
  amber: "bg-chart-3",
  emerald: "bg-chart-4",
  rose: "bg-chart-5",
};

const ACCENT_TAG: Record<string, string> = {
  violet: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  cyan: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  amber: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  emerald: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  rose: "border-chart-5/30 bg-chart-5/10 text-chart-5",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PersonaCardData = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly value: string | null;
  readonly keywords: readonly string[];
  readonly icon: string | null;
  readonly accent: string | null;
};

export type PersonaCardProps = {
  readonly persona: PersonaCardData;
  readonly projectSlug: string;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function PersonaCard({ persona, projectSlug }: PersonaCardProps) {
  const href = `/back-studio/scrum/${projectSlug}/personas/${persona.slug}`;
  const barClass = persona.accent ? ACCENT_BAR[persona.accent] : "bg-border";
  const tagClass = persona.accent ? ACCENT_TAG[persona.accent] : "";

  return (
    <article className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 pl-6 transition-colors hover:border-primary/40">
      {/* Barre latérale accent */}
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 h-full w-1.5", barClass)}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {persona.name}
          </Link>
          <p className="font-mono text-[10px] text-muted-foreground">
            /{persona.slug}
          </p>
        </div>
      </header>

      {persona.value && (
        <p className="flex items-start gap-2 text-sm italic leading-relaxed text-muted-foreground">
          <Quote
            className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40"
            aria-hidden
          />
          <span className="line-clamp-3">{persona.value}</span>
        </p>
      )}

      {persona.keywords.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {persona.keywords.slice(0, 4).map((k) => (
            <li
              key={k}
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                tagClass || "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {k}
            </li>
          ))}
          {persona.keywords.length > 4 && (
            <li className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              +{persona.keywords.length - 4}
            </li>
          )}
        </ul>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Link
          href={href}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Ouvrir
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`${href}/edit`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label="Éditer"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
          <DeletePersonaButton
            id={persona.id}
            name={persona.name}
            projectSlug={projectSlug}
            compact
          />
        </div>
      </footer>
    </article>
  );
}
