/*
path :           app/back-studio/creatFiles/CreatFilesView.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Vue client de CreatFiles. Gère une liste ordonnée d'entrées { path,
                 content }, permet d'ajouter, supprimer, réordonner (↑ ↓), éditer
                 chaque champ, tout vider, et enregistrer sur disque.
                 Le path est OPTIONNEL : s'il est vide, il est déduit de l'en-tête
                 Helpdev du contenu (champ `path :`) et affiché en aperçu.
                 L'enregistrement est protégé par un contrôle de conflit serveur
                 (jamais d'écrasement par défaut).
                 Après une sauvegarde réussie, la liste est automatiquement
                 réinitialisée à une entrée vide.

flow:            useState(entries) → toolbar (ajouter / tout vider)
                 → liste de <EntryRow> contrôlées → <pre> de prévisualisation JSON
                 (avec chemins résolus) → barre d'action finale (récapitulatif +
                 bouton Enregistrer sur disque). handleSave(onConflict?) appelle
                 POST /api/back-studio/creat-files/save.
                 Si 409 → ouvre <ConflictDialog>. Si 200 → toast avec résumé + clearAll().

ecosystem:       Dev = [
                   "@/app/back-studio/creatFiles/page.tsx",
                   "@/app/back-studio/creatFiles/CreatFilesView.tsx",
                   "@/app/back-studio/creatFiles/ConflictDialog.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/creatFiles/page.tsx",
                  "@/app/back-studio/creatFiles/ConflictDialog.tsx",
                  "@/app/api/back-studio/creat-files/save/route.ts"]
imports:         ["react", "lucide-react", "sonner",
                  "@/app/back-studio/creatFiles/ConflictDialog",
                  "props reçues : aucune (composant autonome)"]
exports:         ["CreatFilesView"]
useBy:           ["@/app/back-studio/creatFiles/page.tsx"]

userStories:     ["*en tant que développeur je veux composer et créer un tableau de fichiers",
                  "*en tant que développeur je veux que le path soit déduit du contenu",
                  "*en tant que développeur je veux que les champs se vident après enregistrement"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  HardDriveDownload,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConflictDialog } from "./ConflictDialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FileEntry = {
  readonly id: string;
  path: string;
  content: string;
};

type SaveSummary = {
  readonly created: number;
  readonly overwritten: number;
  readonly renamed: number;
  readonly skipped: number;
  readonly failed: number;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nextId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyEntry(): FileEntry {
  return { id: nextId(), path: "", content: "" };
}

/**
 * Miroir client de la logique serveur : extrait `path : …` du premier
 * bloc /* … *\/ du contenu. Utilisé pour l'aperçu et le compteur.
 */
function extractPathHint(content: string): string | null {
  const start = content.indexOf("/*");
  if (start === -1) return null;
  const end = content.indexOf("*/", start + 2);
  if (end === -1) return null;
  const block = content.slice(start + 2, end);

  for (const rawLine of block.split(/\r?\n/)) {
    const m = rawLine.match(/^\s*path\s*:\s*(.+)$/);
    if (m) {
      const v = m[1]!.trim();
      return v.length > 0 ? v : null;
    }
  }
  return null;
}

/** Chemin effectif d'une entrée (explicite ou déduit du header). */
function effectivePath(entry: FileEntry): string | null {
  const explicit = entry.path.trim();
  if (explicit.length > 0) return explicit;
  return extractPathHint(entry.content);
}

/** Vrai si l'entrée produira une écriture (path explicite OU déduit). */
function isResolvable(entry: FileEntry): boolean {
  return effectivePath(entry) !== null;
}

function summarize(summary: SaveSummary): string {
  const parts: string[] = [];
  if (summary.created) parts.push(`${summary.created} créé(s)`);
  if (summary.overwritten) parts.push(`${summary.overwritten} écrasé(s)`);
  if (summary.renamed) parts.push(`${summary.renamed} renommé(s)`);
  if (summary.skipped) parts.push(`${summary.skipped} ignoré(s)`);
  if (summary.failed) parts.push(`${summary.failed} échec(s)`);
  return parts.length > 0 ? parts.join(", ") : "Aucune écriture";
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function CreatFilesView() {
  const [entries, setEntries] = useState<FileEntry[]>(() => [makeEmptyEntry()]);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<readonly string[] | null>(null);

  /* Entrées qui produiront une écriture (path résolu, explicite ou déduit). */
  const filled = useMemo(() => entries.filter(isResolvable), [entries]);

  /* Nombre d'entrées dont le path est déduit (pour le badge informatif). */
  const deducedCount = useMemo(
    () =>
      filled.filter((e) => e.path.trim().length === 0 && extractPathHint(e.content))
        .length,
    [filled],
  );

  const json = useMemo(
    () =>
      JSON.stringify(
        filled.map((e) => {
          const p = effectivePath(e) ?? "";
          return { path: p, content: e.content };
        }),
        null,
        2,
      ),
    [filled],
  );

  /* ---------- Actions liste ---------- */

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }

  function addEntry() {
    setEntries((prev) => [...prev, makeEmptyEntry()]);
  }

  function removeEntry(id: string) {
    setEntries((prev) => {
      if (prev.length <= 1) return [makeEmptyEntry()];
      return prev.filter((e) => e.id !== id);
    });
  }

  function moveEntry(id: string, dir: -1 | 1) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function clearAll() {
    setEntries([makeEmptyEntry()]);
  }

  /* ---------- Enregistrement ---------- */

  async function handleSave(onConflict?: "skip" | "overwrite" | "rename") {
    if (filled.length === 0) {
      toast.error("Aucune entrée exploitable (path ou en-tête Helpdev requis).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/back-studio/creat-files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filled.map((e) => ({
            // On envoie le path explicite s'il existe, sinon le serveur déduit.
            path: e.path.trim(),
            content: e.content,
          })),
          ...(onConflict ? { onConflict } : {}),
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { conflicts?: string[] };
        setConflicts(data.conflicts ?? []);
        return;
      }

      const data = (await res.json()) as {
        saved?: boolean;
        summary?: SaveSummary;
        forbidden?: string[];
        error?: string;
        hint?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.error
            ? `${data.error}${data.hint ? ` — ${data.hint}` : ""}`
            : "Écriture impossible.",
        );
      }

      const summary = data.summary;
      const allOk = !summary || summary.failed === 0;

      /* Toast récapitulatif */
      if (summary) {
        if (summary.failed > 0) {
          toast.warning(summarize(summary), {
            description:
              "Certaines entrées ont échoué — la liste est conservée pour réessai.",
          });
        } else {
          toast.success(summarize(summary), {
            description: "Liste réinitialisée.",
          });
        }
      } else {
        toast.success("Fichiers enregistrés.", {
          description: "Liste réinitialisée.",
        });
      }

      setConflicts(null);

      /* Reset garanti après une sauvegarde 100% réussie.
         Si au moins une écriture a échoué, on conserve les entrées pour
         permettre un nouvel essai (l'utilisateur garde le contexte). */
      if (allOk) {
        clearAll();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Rendu ---------- */

  const isEmpty = filled.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ============================================================ */}
      {/*  Toolbar supérieure — composition                           */}
      {/* ============================================================ */}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <button
          type="button"
          onClick={addEntry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Ajouter un fichier
        </button>

        <button
          type="button"
          onClick={clearAll}
          disabled={
            entries.length === 1 &&
            entries[0]?.path === "" &&
            entries[0]?.content === ""
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Tout vider
        </button>

        <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-mono font-semibold text-foreground">
              {filled.length}
            </span>
            /{entries.length} fichier(s) exploitable(s)
          </span>

          {deducedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-chart-1/30 bg-chart-1/10 px-2 py-0.5 text-[10px] font-medium text-chart-1">
              <Sparkles className="h-3 w-3" aria-hidden />
              {deducedCount} path déduit(s) du header
            </span>
          )}
        </span>
      </div>

      {/* ============================================================ */}
      {/*  Liste des entrées                                          */}
      {/* ============================================================ */}

      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            index={index}
            total={entries.length}
            onUpdate={(patch) => updateEntry(entry.id, patch)}
            onRemove={() => removeEntry(entry.id)}
            onMoveUp={() => moveEntry(entry.id, -1)}
            onMoveDown={() => moveEntry(entry.id, 1)}
          />
        ))}
      </div>

      {/* ============================================================ */}
      {/*  Aperçu du JSON                                             */}
      {/* ============================================================ */}

      <section className="flex flex-col gap-2">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-foreground">
            <ListChecks className="h-3.5 w-3.5 text-primary" aria-hidden />
            JSON résultant
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {json.length.toLocaleString()} caractères
          </span>
        </header>
        <div className="max-h-[400px] overflow-auto rounded-xl border border-border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/90">
            {isEmpty ? "(aucune entrée exploitable)" : json}
          </pre>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Barre d'action inférieure — Enregistrer sur disque         */}
      {/* ============================================================ */}

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-chart-4/30 bg-card/95 p-3 shadow-lg shadow-chart-4/5 backdrop-blur">
        {/* Récapitulatif */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
            <span className="font-bold tabular-nums">{filled.length}</span>
            fichier(s) prêt(s)
          </span>

          {deducedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-chart-1/30 bg-chart-1/10 px-2 py-0.5 text-[10px] font-medium text-chart-1">
              <Sparkles className="h-3 w-3" aria-hidden />
              {deducedCount} déduit(s)
            </span>
          )}

          {!isEmpty && (
            <span className="hidden sm:inline">
              Les champs seront réinitialisés après enregistrement.
            </span>
          )}
        </div>

        {/* Bouton principal */}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving || isEmpty}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-chart-4 to-chart-2 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-chart-4/30 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-4/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <HardDriveDownload className="h-4 w-4" aria-hidden />
          )}
          {saving ? "Enregistrement…" : "Enregistrer sur disque"}
        </button>
      </div>

      {/* ============================================================ */}
      {/*  Dialogue de conflit                                        */}
      {/* ============================================================ */}

      {conflicts !== null && (
        <ConflictDialog
          conflicts={conflicts}
          busy={saving}
          onCancel={() => setConflicts(null)}
          onResolve={(policy) => handleSave(policy)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne d'entrée                                                     */
/* ------------------------------------------------------------------ */

function EntryRow({
  entry,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  entry: FileEntry;
  index: number;
  total: number;
  onUpdate: (patch: Partial<FileEntry>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const explicit = entry.path.trim();
  const deduced = extractPathHint(entry.content);
  const effective = explicit || deduced || null;
  const isDeduced = explicit.length === 0 && deduced !== null;
  const isEmpty = effective === null;

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-card transition-colors ${
        isEmpty
          ? "border-border/60"
          : isDeduced
            ? "border-chart-1/40"
            : "border-primary/30"
      }`}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
          #{index + 1}
        </span>

        {isEmpty && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            ni path ni en-tête Helpdev — ignoré
          </span>
        )}

        {isDeduced && (
          <span className="inline-flex items-center gap-1 rounded-full border border-chart-1/30 bg-chart-1/10 px-2 py-0.5 text-[10px] font-medium text-chart-1">
            <Sparkles className="h-2.5 w-2.5" aria-hidden />
            path déduit : {deduced}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Monter"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Descendre"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDown className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Supprimer cette entrée"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            path{" "}
            <span className="font-normal normal-case text-muted-foreground/70">
              (optionnel — déduit du header si vide)
            </span>
          </span>
          <input
            type="text"
            value={entry.path}
            onChange={(e) => onUpdate({ path: e.target.value })}
            spellCheck={false}
            placeholder={
              deduced
                ? `(vide → ${deduced})`
                : "app/foo/bar.tsx ou vide si le contenu contient /* path : … */"
            }
            className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            content
          </span>
          <textarea
            value={entry.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            spellCheck={false}
            placeholder="// contenu du fichier…"
            rows={6}
            className="resize-y rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
          />
        </label>
      </div>
    </section>
  );
}