/*
path :           components/user-story/UserStoryCard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte compacte d'une user story. Affiche titre, format standard
                 (En tant que / Je veux / Afin de), statut, priorité, story points,
                 et actions (ouvrir, éditer, supprimer).
flow:            Client Component → reçoit les données sérialisées + projectSlug →
                 rend une article cliquable avec les actions.
ecosystem:       Dev = [
                   "@/components/user-story/UserStoryCard.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryStatusBadge.tsx",
                  "@/components/user-story/UserStoryPriorityBadge.tsx",
                  "@/components/user-story/DeleteUserStoryButton.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@/components/user-story/UserStoryStatusBadge",
                  "@/components/user-story/UserStoryPriorityBadge",
                  "@/components/user-story/DeleteUserStoryButton",
                  "@/components/ui/button"]
exports:         ["UserStoryCard", "UserStoryCardProps", "UserStoryCardData"]

userStories:     ["*en tant que développeur je veux visualiser une user story dans une carte"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";
import { ListChecks, Pencil } from "lucide-react";

import { UserStoryStatusBadge } from "./UserStoryStatusBadge";
import { UserStoryPriorityBadge } from "./UserStoryPriorityBadge";
import { DeleteUserStoryButton } from "./DeleteUserStoryButton";
import { buttonVariants } from "@/components/ui/button";

export type UserStoryCardData = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly asA: string;
  readonly iWant: string;
  readonly soThat: string;
  readonly status: string;
  readonly priority: number;
  readonly storyPoints: number | null;
  readonly acceptanceCount: number;
  readonly childrenCount: number;
};

export type UserStoryCardProps = {
  readonly story: UserStoryCardData;
  readonly projectSlug: string;
};

export function UserStoryCard({ story, projectSlug }: UserStoryCardProps) {
  const href = `/back-studio/scrum/${projectSlug}/backlog/${story.slug}`;

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="line-clamp-2 text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {story.title}
          </Link>
          <p className="font-mono text-[10px] text-muted-foreground">
            /{story.slug}
          </p>
        </div>
        <UserStoryPriorityBadge priority={story.priority} />
      </header>

      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/80">En tant que</span>{" "}
        {story.asA}{" "}
        <span className="font-medium text-foreground/80">je veux</span>{" "}
        {story.iWant}{" "}
        <span className="font-medium text-foreground/80">afin de</span>{" "}
        {story.soThat}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <UserStoryStatusBadge status={story.status} />
        {story.storyPoints !== null && (
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {story.storyPoints} pt{story.storyPoints > 1 ? "s" : ""}
          </span>
        )}
        {story.acceptanceCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            <ListChecks className="h-2.5 w-2.5" aria-hidden />
            {story.acceptanceCount} critère(s)
          </span>
        )}
        {story.childrenCount > 0 && (
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            {story.childrenCount} enfant(s)
          </span>
        )}
      </div>

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
          <DeleteUserStoryButton
            id={story.id}
            title={story.title}
            projectSlug={projectSlug}
            compact
          />
        </div>
      </footer>
    </article>
  );
}