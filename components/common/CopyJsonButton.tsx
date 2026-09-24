/*
path :           components/common/CopyJsonButton.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Bouton client qui copie une chaîne JSON dans le presse-papiers,
                 avec fallback execCommand, toast Sonner et état "copied" pendant
                 1,5 s. Composant transversal, utilisé par ExportJsonDialog et
                 tout composant qui expose un payload JSON copiable.

flow:            Props { value, label?, toastLabel?, disabled?, className? }
                 → clic → navigator.clipboard (avec fallback execCommand) →
                 toast + reset d'état automatique après 1,5 s.

ecosystem:       UI = [
                   "@/components/common/CopyButton.tsx",
                   "@/components/common/CopyJsonButton.tsx",
                   "@/components/common/ExportJsonDialog.tsx",
                   "@/components/common/ImportJsonDialog.tsx",
                   "@/components/common/JsonEditor.tsx",
                 ]
relatedFiles:    ["@/components/common/ExportJsonDialog.tsx",
                  "@/components/ui/button"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/ui/button",
                  "@/lib/utils",
                  "props reçues : { value, label?, toastLabel?, disabled?, className? }"]
exports:         ["CopyJsonButton", "CopyJsonButtonProps"]
useBy:           ["@/components/common/ExportJsonDialog.tsx"]

userStories:     ["*auto-copy-json"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CopyJsonButtonProps = {
  readonly value: string;
  readonly label?: string;
  readonly toastLabel?: string;
  readonly disabled?: boolean;
  readonly className?: string;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function CopyJsonButton({
  value,
  label = "Copier JSON",
  toastLabel = "JSON copié dans le presse-papiers",
  disabled = false,
  className,
}: CopyJsonButtonProps) {
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
      toast.error("Copie impossible.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={disabled}
      className={cn("gap-2", className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" aria-hidden />
          Copié
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden />
          {label}
        </>
      )}
    </Button>
  );
}