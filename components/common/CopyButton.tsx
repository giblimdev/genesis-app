// src/components/CopyButton.tsx
/*
  role:           Bouton client qui copie une chaîne dans le presse-papier
                  et affiche une confirmation temporaire. Composant
                  transversal, utilisable partout.

  flow:           Reçoit la chaîne à copier en props → clic → écrit dans le
                  presse-papier via navigator.clipboard (avec fallback
                  execCommand) → toast Sonner + état "copied" pendant 1,5 s.

  imports:        react (useState), lucide-react (Check, Copy),
                  sonner (toast).

  structure:      - interface CopyButtonProps
                  - composant CopyButton (export par défaut)

  ecosysteme:     UI

  worksWith:      Tous les composants ayant besoin d'un bouton copier.

  usedBy:         src/conception/schema/page.tsx,
                  src/conception/stack/StackSelector.tsx,
                  et tout autre consommateur.

  notes:          - Aucun état partagé, aucune dépendance au serveur.
                  - Le fallback execCommand couvre les navigateurs anciens
                    et les contextes non-HTTPS.
                  - Le label et le toast sont personnalisables.
                  - Composant générique : ne dépend d'aucun module métier.
*/

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export interface CopyButtonProps {
  /** Contenu à copier */
  readonly value: string;
  /** Libellé au repos (défaut : "Copier") */
  readonly label?: string;
  /** Message du toast (défaut : "Copié dans le presse-papier") */
  readonly toastLabel?: string;
  /** Classe additionnelle */
  readonly className?: string;
}

export default function CopyButton({
  value,
  label = "Copier",
  toastLabel = "Copié dans le presse-papier",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success(toastLabel);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossible de copier");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copié" : label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        copied
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-gray-200 bg-white text-gray-700 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-violet-300"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden />
          Copié
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}