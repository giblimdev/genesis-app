/*
path :           app/back-studio/saveApp/FiltersPanel.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Panneau de filtres par type et par tag. Affiche des "pills" cliquables
                 pour chaque valeur unique trouvée dans les fichiers scannés. Un ensemble
                 vide = pas de filtre (tout est affiché).
flow:            Reçoit availableTypes, availableTags (déjà calculés par le parent) et les
                 sets de filtres actifs + callbacks. Le composant est purement contrôlé.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/TreeView.tsx",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/buildTree.ts",
                 ]
relatedFiles:    ["@/app/back-studio/saveApp/SaveAppView.tsx"]
imports:         ["react", "lucide-react",
                  "props reçues : { availableTypes: readonly string[]; availableTags: readonly string[]; activeTypes: Set<string>; activeTags: Set<string>; onToggleType: (type: string) => void; onToggleTag: (tag: string) => void; onClearFilters: () => void; }"]
exports:         ["FiltersPanel", "FiltersPanelProps"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux filtrer les fichiers par type et tag"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : interactions utilisateur (toggle filtres).

import { Filter, X } from "lucide-react";

export type FiltersPanelProps = {
  readonly availableTypes: readonly string[];
  readonly availableTags: readonly string[];
  readonly activeTypes: Set<string>;
  readonly activeTags: Set<string>;
  readonly onToggleType: (type: string) => void;
  readonly onToggleTag: (tag: string) => void;
  readonly onClearFilters: () => void;
};

const NOTHING = "—";

export function FiltersPanel({
  availableTypes,
  availableTags,
  activeTypes,
  activeTags,
  onToggleType,
  onToggleTag,
  onClearFilters,
}: FiltersPanelProps) {
  const hasActive = activeTypes.size > 0 || activeTags.size > 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-primary" aria-hidden />
          <h2 className="text-sm font-bold text-foreground">Filtres</h2>
        </div>
        {hasActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden />
            Effacer
          </button>
        )}
      </header>

      {/* Types */}
      <section className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Type ({availableTypes.length})
        </span>
        {availableTypes.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">{NOTHING}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availableTypes.map((t) => {
              const active = activeTypes.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleType(t)}
                  aria-pressed={active}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Tags */}
      <section className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tag ({availableTags.length})
        </span>
        {availableTags.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">{NOTHING}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((t) => {
              const active = activeTags.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleTag(t)}
                  aria-pressed={active}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                    active
                      ? "border-chart-1/40 bg-chart-1/10 text-chart-1"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
