/*
path :           components/user-story/UserStoryMiniCard.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Version compacte d'une user story, utilisée comme enfant d'un Epic
                 dans l'arbre. Affiche titre, statut, priorité, points + lien vers
                 le détail.
flow:            Client Component → rend un lien compact vers la story.
ecosystem:       Dev = [
                   "@/components/user-story/UserStoryMiniCard.tsx",
                   "@/components/user-story/UserStoryTree.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryStatusBadge.tsx",
                  "@/components/user-story/UserStoryPriorityBadge.tsx"]
imports:         ["react", "next/link",
                  "@/components/user-story/UserStoryStatusBadge",
                  "@/components/user-story/UserStoryPriorityBadge"]
exports:         ["UserStoryMiniCard", "UserStoryMiniCardProps"]

userStories:     ["*en tant que développeur je veux voir une story enfant en compact"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import Link from "next/link";

import { UserStoryStatusBadge } from "./UserStoryStatusBadge";
import { UserStoryPriorityBadge } from "./UserStoryPriorityBadge";

export type UserStoryMiniCardProps = {
  readonly story: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly status: string;
    readonly priority: number;
    readonly storyPoints: number | null;
  };
  readonly projectSlug: string;
};

export function UserStoryMiniCard({
  story,
  projectSlug,
}: UserStoryMiniCardProps) {
  return (
    <Link
      href={`/back-studio/scrum/${projectSlug}/backlog/${story.slug}`}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <UserStoryPriorityBadge priority={story.priority} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {story.title}
      </span>
      {story.storyPoints !== null && (
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {story.storyPoints} pt{story.storyPoints > 1 ? "s" : ""}
        </span>
      )}
      <UserStoryStatusBadge status={story.status} />
    </Link>
  );
}