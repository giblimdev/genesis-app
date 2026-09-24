/*
path :           components/common/code-block.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Bloc de code inline avec libellé et bouton « Copier ». Utilisé
                 dans la page d'aide développeur pour afficher des commandes CLI
                 copiables. Réutilise CopyButton pour la logique de copie
                 (toast + fallback execCommand). Le bouton copier est discret
                 par défaut et s'illumine au survol du bloc ; il reste toujours
                 visible sur tactile (focus-visible) et en mode compact.

flow:            Rendu → affichage label (sauf en mode compact) + <code>{code}</code>
                 + CopyButton → clic sur CopyButton → copie dans le presse-papiers
                 → toast Sonner. Aucun état local dans CodeBlock.

ecosystem:       DevHelp = [
                   "@/app/back-studio/help-dev/page.tsx",
                   "@/app/back-studio/help-dev/cmd/page.tsx",
                   "@/components/common/code-block.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/help-dev/cmd/page.tsx",
                  "@/components/common/CopyButton.tsx"]
imports:         ["@/components/common/CopyButton"]
exports:         ["CodeBlock", "CodeBlockProps"]
useBy:           ["@/app/back-studio/help-dev/cmd/page.tsx"]

userStories:     ["*en tant que développeur je veux copier une commande en un clic"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : importe CopyButton qui utilise useState + navigator.clipboard.

import { CopyButton } from "@/components/common/CopyButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CodeBlockProps = {
  /** Libellé affiché au-dessus du code (masqué en mode compact). */
  readonly label: string;
  /** Contenu à copier. */
  readonly code: string;
  /** Mode compact : masque le label, réduit le padding. */
  readonly compact?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function CodeBlock({
  label,
  code,
  compact = false,
}: CodeBlockProps) {
  return (
    <div
      className={[
        "group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 transition-colors",
        "hover:border-primary/30 hover:bg-muted/60",
        compact ? "px-3 py-2" : "px-4 py-3",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}
        <code className="block truncate font-mono text-sm text-foreground">
          {code}
        </code>
      </div>

      <CopyButton
        value={code}
        label=""
        toastLabel={`${label} copié`}
        className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  );
}