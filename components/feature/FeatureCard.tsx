/*
path :           components/feature/FeatureCard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte d'une feature dans la liste. Affiche nom, description tronquée,
                 badge module, icône, accent, et actions (ouvrir, éditer, supprimer).
flow:            Client Component → reçoit les données sérialisées + projectSlug →
                 rend une article cliquable avec les actions.
ecosystem:       Dev = [
                   "@/components/feature/FeatureCard.tsx",
                   "@/app/back-studio/scrum/[slug]/features/page.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/scrum/[slug]/features/page.tsx",
                  "@/components/feature/DeleteFeatureButton.tsx",
                  "@/components/feature/FeatureModuleBadge.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@/components/feature/FeatureModuleBadge",
                  "@/components/feature/DeleteFeatureButton",
                  "@/components/ui/button"]
exports:         ["FeatureCard", "FeatureCardProps", "FeatureCardData"]

userStories:     ["*en tant que développeur je veux visualiser une feature dans une carte"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { FeatureModuleBadge } from "./FeatureModuleBadge";
import { DeleteFeatureButton } from "./DeleteFeatureButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCENT_RING: Record<string, string> = {
  violet: "before:bg-chart-1",
  cyan: "before:bg-chart-2",
  amber: "before:bg-chart-3",
  emerald: "before:bg-chart-4",
  rose: "before:bg-chart-5",
};

export type FeatureCardData = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly module: string;
  readonly icon: string | null;
  readonly accent: string | null;
};

export type FeatureCardProps = {
  readonly feature: FeatureCardData;
  readonly projectSlug: string;
};

export function FeatureCard({ feature, projectSlug }: FeatureCardProps) {
  const href = `/back-studio/scrum/${projectSlug}/features/${feature.slug}`;
  const accentClass = feature.accent ? ACCENT_RING[feature.accent] : undefined;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 pl-6 transition-colors hover:border-primary/40",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-transparent",
        accentClass,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {feature.name}
          </Link>
          <p className="font-mono text-[10px] text-muted-foreground">
            /{feature.slug}
          </p>
        </div>
        <FeatureModuleBadge module={feature.module} />
      </header>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {feature.description}
      </p>

      <footer className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
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
          <DeleteFeatureButton
            id={feature.id}
            name={feature.name}
            projectSlug={projectSlug}
            compact
          />
        </div>
      </footer>
    </article>
  );
}