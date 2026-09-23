/*
path :           components/dev-help/code-block.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Bloc de code inline avec libellé et bouton "Copier". Utilisé dans la page
                 d'aide développeur pour afficher des commandes CLI copiables. Réutilise
                 CopyButton pour la logique de copie (toast + fallback).
flow:            Rendu → affichage label (sauf en mode compact) + <code>{code}</code> +
                 CopyButton → clic sur CopyButton → copie dans le presse-papiers → toast
                 Sonner. Aucun état local dans CodeBlock.
ecosystem:       DevHelp = [
                   "@/app/back-studio/help-dev/page.tsx",
                   "@/components/common/CopyButton.tsx",
                   "@/components/dev-help/code-block.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/help-dev/page.tsx",
                  "@/components/common/CopyButton.tsx"]
imports:         ["@/components/common/CopyButton"]
exports:         ["CodeBlock", "CodeBlockProps"]
useBy:           ["@/app/back-studio/help-dev/page.tsx"]

userStories:     ["*en tant que développeur je veux copier une commande en un clic"]
status:          planned
pathChecked:     ✔false
metaDataChecked: ✔false
scriptChecked:   ✔false
*/

"use client";
// "use client" justifié : importe CopyButton qui utilise useState + navigator.clipboard.

import { CopyButton } from "@/components/common/CopyButton";

export type CodeBlockProps = {
  label: string;
  code: string;
  compact?: boolean;
};

export function CodeBlock({ label, code, compact = false }: CodeBlockProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
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
      <CopyButton value={code} label="" toastLabel={`${label} copié`} />
    </div>
  );
}
