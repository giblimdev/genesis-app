/*
path :           components/common/CopyButton.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Bouton client qui copie une chaîne dans le presse-papiers et affiche une
                 confirmation temporaire. Composant transversal, utilisable partout.
flow:            Reçoit la chaîne à copier en props → clic → navigator.clipboard (avec
                 fallback execCommand) → toast Sonner + état "copied" pendant 1,5 s. 
ecosystem:       UI = [
                   "@/components/common/CopyButton.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/ExportToIA/ExportView.tsx"]
imports:         ["react", "lucide-react", "sonner"]
exports:         ["CopyButton", "CopyButtonProps"]
useBy:           ["@/app/back-studio/ExportToIA/ExportView.tsx"]

userStories:     ["*en tant que développeur je veux copier une valeur en un clic"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState + navigator.clipboard + toast Sonner.

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export interface CopyButtonProps {
  readonly value: string;
  readonly label?: string;
  readonly toastLabel?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function CopyButton({
  value,
  label = "Copier",
  toastLabel = "Copié dans le presse-papiers",
  className = "",
  disabled = false,
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
      disabled={disabled}
      aria-label={copied ? "Copié" : label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        copied
          ? "border-chart-4/30 bg-chart-4/10 text-chart-4"
          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden />
          {label && "Copié"}
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
