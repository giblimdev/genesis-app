/*
path :           app/back-studio/saveApp/ExcludesPanel.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Panneau d'édition des règles d'exclusion. Affiche les 6 sections
                 (roots, excludes, includeExtensions, excludePatterns, maxFiles, maxBytes)
                 en édition inline. Bouton "Enregistrer" → PUT /api/back-studio/save-app/
                 excludes. Bouton "Rescanner" → router.refresh() pour relancer le scan.
flow:            Client Component → useState(config) initialisé depuis les props → chaque
                 input modifie l'état local → "Enregistrer" PUT → toast → "Rescanner"
                 déclenche un refresh de la page (Server Component refait le scan).
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/TreeView.tsx",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/buildTree.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts",
                  "@/app/back-studio/saveApp/SaveAppView.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/lib/dev/types",
                  "props reçues : { initialConfig: ExcludesConfig }"]
exports:         ["ExcludesPanel", "ExcludesPanelProps"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux éditer les règles d'exclusion"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState + fetch PUT + router.refresh + toast.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";

import type { ExcludesConfig } from "@/lib/dev/types";

export type ExcludesPanelProps = {
  readonly initialConfig: ExcludesConfig;
};

type ListKey = "roots" | "excludes" | "includeExtensions" | "excludePatterns";

/* ------------------------------------------------------------------ */
/*  Éditeur de liste                                                   */
/* ------------------------------------------------------------------ */

function ListEditor({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: readonly string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (v.length === 0) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  function remove(v: string) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label} ({values.length})
        </span>
        {hint && (
          <span className="text-[10px] italic text-muted-foreground">
            {hint}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-foreground"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              aria-label={`Retirer ${v}`}
              className="text-muted-foreground transition-colors hover:text-rose-600"
            >
              <X className="h-2.5 w-2.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          className="h-7 flex-1 rounded-md border border-border bg-background px-2 font-mono text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={add}
          disabled={draft.trim().length === 0}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3 w-3" aria-hidden />
          Ajouter
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Panneau                                                            */
/* ------------------------------------------------------------------ */

export function ExcludesPanel({ initialConfig }: ExcludesPanelProps) {
  const router = useRouter();
  const [config, setConfig] = useState<ExcludesConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  function updateList(key: ListKey, next: string[]) {
    setConfig((prev) => ({ ...prev, [key]: next }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/back-studio/save-app/excludes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok || !data.saved) {
        throw new Error(data.error ?? "Erreur d'enregistrement.");
      }
      toast.success("Règles enregistrées.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function handleRescan() {
    setRescanning(true);
    router.refresh();
    // Le refresh est synchrone côté navigation ; on relâche après un court délai.
    window.setTimeout(() => setRescanning(false), 800);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">Règles de scan</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRescan}
            disabled={rescanning}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${rescanning ? "animate-spin" : ""}`}
              aria-hidden
            />
            Rescanner
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3 w-3" aria-hidden />
            )}
            Enregistrer
          </button>
        </div>
      </header>

      <ListEditor
        label="Dossiers à scanner"
        hint="Relatifs à la racine"
        values={config.roots}
        onChange={(v) => updateList("roots", v)}
        placeholder="app, components, lib…"
      />

      <ListEditor
        label="Dossiers à exclure"
        hint="Ignorés au scan"
        values={config.excludes}
        onChange={(v) => updateList("excludes", v)}
        placeholder="node_modules, .next…"
      />

      <ListEditor
        label="Extensions incluses"
        hint="Avec le point"
        values={config.includeExtensions}
        onChange={(v) => updateList("includeExtensions", v)}
        placeholder=".ts, .tsx…"
      />

      <ListEditor
        label="Motifs de fichiers exclus"
        hint="Suffixes"
        values={config.excludePatterns}
        onChange={(v) => updateList("excludePatterns", v)}
        placeholder=".test.ts, .d.ts…"
      />

      <section className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Fichiers max
          </span>
          <input
            type="number"
            min={1}
            max={9999}
            value={config.maxFiles}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                maxFiles: Number.parseInt(e.target.value, 10) || 1,
              }))
            }
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Taille max (Mo)
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={Math.round(config.maxBytes / 1_048_576)}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                maxBytes:
                  (Number.parseInt(e.target.value, 10) || 1) * 1_048_576,
              }))
            }
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/50"
          />
        </label>
      </section>
    </div>
  );
}
