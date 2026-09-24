/*
path :           components/common/DegradedModeBanner.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Bandeau d'avertissement affiché en mode dégradé (lecture
                 depuis le disque, base de données inaccessible). Explique
                 la situation et empêche l'utilisateur de croire que ses
                 modifications sont persistées.

flow:            Composant pur → reçoit `message`. Rend un bandeau ambre
                 avec icône d'avertissement.

ecosystem:       UI / Common
userStories:     ["*auto-degraded-mode"]
relatedFiles:    ["@/lib/project/load-project.ts"]
imports:         ["react", "lucide-react"]
exports:         ["DegradedModeBanner", "DegradedModeBannerProps"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { AlertTriangle } from "lucide-react";

export type DegradedModeBannerProps = {
  readonly message: string;
};

export function DegradedModeBanner({ message }: DegradedModeBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
          Mode dégradé
        </p>
        <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
          {message}
        </p>
      </div>
    </div>
  );
}