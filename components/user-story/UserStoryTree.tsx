/*
path :           components/user-story/UserStoryTree.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Affichage hiérarchique des user stories : les Epics racines avec leurs
                 Stories enfants en dessous, indentées. Utilise <UserStoryCard /> pour
                 les Epics et une version compacte pour les enfants.
flow:            Client Component → reçoit une liste plate d'Epics + un map
                 epicId → enfants → rend l'arbre.
ecosystem:       Dev = [
                   "@/components/user-story/UserStoryTree.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryCard.tsx",
                  "@/components/user-story/UserStoryMiniCard.tsx"]
imports:         ["react", "next/link", "lucide-react",
                  "@/components/user-story/UserStoryCard",
                  "@/components/user-story/UserStoryMiniCard"]
exports:         ["UserStoryTree", "UserStoryTreeProps", "UserStoryTreeEpic",
                  "UserStoryTreeStory"]

userStories:     ["*en tant que développeur je veux voir les stories en arbre"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { UserStoryCard } from "./UserStoryCard";
import { UserStoryMiniCard } from "./UserStoryMiniCard";

export type UserStoryTreeStory = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: string;
  readonly priority: number;
  readonly storyPoints: number | null;
};

export type UserStoryTreeEpic = {
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
  readonly children: readonly UserStoryTreeStory[];
};

export type UserStoryTreeProps = {
  readonly epics: readonly UserStoryTreeEpic[];
  readonly projectSlug: string;
};

export function UserStoryTree({ epics, projectSlug }: UserStoryTreeProps) {
  return (
    <div className="flex flex-col gap-6">
      {epics.map((epic) => (
        <section key={epic.id} className="flex flex-col gap-3">
          <UserStoryCard
            projectSlug={projectSlug}
            story={{
              id: epic.id,
              title: epic.title,
              slug: epic.slug,
              asA: epic.asA,
              iWant: epic.iWant,
              soThat: epic.soThat,
              status: epic.status,
              priority: epic.priority,
              storyPoints: epic.storyPoints,
              acceptanceCount: epic.acceptanceCount,
              childrenCount: epic.children.length,
            }}
          />

          {epic.children.length > 0 && (
            <ul className="ml-4 flex flex-col gap-2 border-l-2 border-border/60 pl-4">
              {epic.children.map((child) => (
                <li key={child.id}>
                  <UserStoryMiniCard
                    projectSlug={projectSlug}
                    story={child}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}