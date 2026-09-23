/*
path :           app/back-studio/saveApp/SaveAppView.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Vue client principale de SaveApp. Orchestre : arborescence, filtres, règles
                 de scan, sélection multiple, choix du format (MD / JSON), aperçu live
                 du document, copie et sauvegarde (via /preview et /save).
flow:            Reçoit files (AppFile[]) et config (ExcludesConfig). State : selected
                 (Set<string>, tout coché par défaut), expanded, activeTypes, activeTags,
                 format ("md" | "json"), basename. Le filename est calculé
                 (basename + "." + format). L'aperçu est délégué à <PreviewPanel>.
                 handleSave appelle /save → toast avec le nom réel retourné (anti-
                 écrasement côté serveur).
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/TreeView.tsx",
                   "@/app/back-studio/saveApp/PreviewPanel.tsx",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/buildTree.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts",
                  "@/lib/dev/buildTree.ts",
                  "@/app/back-studio/saveApp/TreeView.tsx",
                  "@/app/back-studio/saveApp/FiltersPanel.tsx",
                  "@/app/back-studio/saveApp/ExcludesPanel.tsx",
                  "@/app/back-studio/saveApp/PreviewPanel.tsx",
                  "@/app/api/back-studio/save-app/preview/route.ts",
                  "@/app/api/back-studio/save-app/save/route.ts"]
imports:         ["react", "lucide-react", "sonner",
                  "@/lib/dev/types",
                  "@/lib/dev/buildTree",
                  "props reçues : { files: readonly AppFile[]; config: ExcludesConfig; }"]
exports:         ["SaveAppView", "SaveAppViewProps"]
useBy:           ["@/app/back-studio/saveApp/page.tsx"]

userStories:     ["*en tant que développeur je veux sélectionner et exporter des fichiers"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState, useMemo, fetch, clipboard, interactions.

import { useMemo, useState } from "react";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileJson,
  FileText,
  FolderTree,
  Loader2,
  Save,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import type {
  AppFile,
  ExcludesConfig,
  TreeDir,
  TreeNode,
} from "@/lib/dev/types";
import { buildTree } from "@/lib/dev/buildTree";
import { TreeView } from "./TreeView";
import { FiltersPanel } from "./FiltersPanel";
import { ExcludesPanel } from "./ExcludesPanel";
import { PreviewPanel } from "./PreviewPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SaveAppViewProps = {
  readonly files: readonly AppFile[];
  readonly config: ExcludesConfig;
};

type Format = "md" | "json";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function collectDirPaths(nodes: readonly TreeNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.kind === "dir") {
      out.push(n.path);
      out.push(...collectDirPaths(n.children));
    }
  }
  return out;
}

function collectFilesFromDir(dir: TreeDir): AppFile[] {
  const out: AppFile[] = [];
  for (const child of dir.children) {
    if (child.kind === "file") out.push(child.file);
    else out.push(...collectFilesFromDir(child));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SaveAppView({ files, config }: SaveAppViewProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(files.map((f) => f.relativePath)),
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const tree = buildTree(files);
    return new Set(collectDirPaths(tree));
  });

  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const [format, setFormat] = useState<Format>("md");
  const [basename, setBasename] = useState(`save-${today()}`);
  const [saving, setSaving] = useState(false);

  /* Nom final = basename + extension du format courant. */
  const filename = `${basename}.${format}`;

  /* ---------- Valeurs dérivées ---------- */

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) if (f.header.type) set.add(f.header.type);
    return Array.from(set).sort();
  }, [files]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) for (const t of f.header.tag) set.add(t);
    return Array.from(set).sort();
  }, [files]);

  const visibleFiles = useMemo(() => {
    const filterByType = activeTypes.size > 0;
    const filterByTag = activeTags.size > 0;

    return files.filter((f) => {
      if (filterByType) {
        if (!f.header.type || !activeTypes.has(f.header.type)) return false;
      }
      if (filterByTag) {
        const has = f.header.tag.some((t) => activeTags.has(t));
        if (!has) return false;
      }
      return true;
    });
  }, [files, activeTypes, activeTags]);

  const tree = useMemo(() => buildTree(visibleFiles), [visibleFiles]);

  const visiblePaths = useMemo(
    () => new Set(visibleFiles.map((f) => f.relativePath)),
    [visibleFiles],
  );

  const visibleSelectedCount = useMemo(() => {
    let n = 0;
    for (const p of visiblePaths) if (selected.has(p)) n++;
    return n;
  }, [visiblePaths, selected]);

  const selectedFiles = useMemo(
    () => files.filter((f) => selected.has(f.relativePath)),
    [files, selected],
  );

  const selectedPaths = useMemo(
    () => selectedFiles.map((f) => f.relativePath),
    [selectedFiles],
  );

  const totalBytes = useMemo(
    () => selectedFiles.reduce((sum, f) => sum + f.size, 0),
    [selectedFiles],
  );

  const overSizeLimit = totalBytes > config.maxBytes;

  const allVisibleSelected =
    visibleFiles.length > 0 && visibleSelectedCount === visibleFiles.length;

  /* ---------- Actions sélection ---------- */

  function toggleFile(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleDir(dir: TreeDir) {
    const dirFiles = collectFilesFromDir(dir);
    const allSelected = dirFiles.every((f) => selected.has(f.relativePath));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const f of dirFiles) {
        if (allSelected) next.delete(f.relativePath);
        else next.add(f.relativePath);
      }
      return next;
    });
  }

  function toggleExpand(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const p of visiblePaths) next.delete(p);
      } else {
        for (const p of visiblePaths) next.add(p);
      }
      return next;
    });
  }

  function expandAll() {
    const tree = buildTree(files);
    setExpanded(new Set(collectDirPaths(tree)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  /* ---------- Actions filtres ---------- */

  function toggleType(type: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function clearFilters() {
    setActiveTypes(new Set());
    setActiveTags(new Set());
  }

  /* ---------- Sauvegarde (fetch /save) ---------- */

  async function handleSave() {
    if (selectedFiles.length === 0) {
      toast.error("Aucun fichier sélectionné.");
      return;
    }
    if (overSizeLimit) {
      toast.error("Sélection trop volumineuse.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/back-studio/save-app/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          paths: selectedPaths,
        }),
      });

      const data = (await res.json()) as {
        saved?: boolean;
        filename?: string;
        publicPath?: string;
        fileCount?: number;
        error?: string;
      };

      if (!res.ok || !data.publicPath) {
        throw new Error(data.error ?? "Erreur de sauvegarde.");
      }

      toast.success(
        `Sauvegardé : ${data.filename} (${data.fileCount ?? 0} fichier(s))`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Rendu ---------- */

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Colonne gauche : règles + filtres */}
      <aside className="flex flex-col gap-4">
        <ExcludesPanel initialConfig={config} />
        <FiltersPanel
          availableTypes={availableTypes}
          availableTags={availableTags}
          activeTypes={activeTypes}
          activeTags={activeTags}
          onToggleType={toggleType}
          onToggleTag={toggleTag}
          onClearFilters={clearFilters}
        />
      </aside>

      {/* Colonne droite : arbre + toolbar + aperçu + actions */}
      <section className="flex min-w-0 flex-col gap-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            disabled={visibleFiles.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allVisibleSelected ? (
              <>
                <CheckSquare className="h-3.5 w-3.5" aria-hidden />
                Tout désélectionner
              </>
            ) : (
              <>
                <Square className="h-3.5 w-3.5" aria-hidden />
                Tout sélectionner
              </>
            )}
          </button>

          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            Tout ouvrir
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            Tout fermer
          </button>

          <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-mono font-semibold text-foreground">
                {visibleSelectedCount}
              </span>
              /{visibleFiles.length} visibles
            </span>
            <span>
              <span className="font-mono font-semibold text-foreground">
                {selectedFiles.length}
              </span>
              /{files.length} au total
            </span>
            <span
              className={
                overSizeLimit ? "text-rose-600 dark:text-rose-400" : ""
              }
            >
              {(totalBytes / 1024).toFixed(1)} Ko /{" "}
              {(config.maxBytes / 1_048_576).toFixed(0)} Mo
            </span>
          </span>
        </div>

        {/* Arbre */}
        <div className="max-h-[560px] overflow-auto rounded-xl border border-border bg-card p-3">
          {visibleFiles.length === 0 ? (
            <p className="p-6 text-center text-xs italic text-muted-foreground">
              Aucun fichier ne correspond aux filtres actifs.
            </p>
          ) : (
            <TreeView
              nodes={tree}
              selected={selected}
              expanded={expanded}
              onToggleFile={toggleFile}
              onToggleDir={toggleDir}
              onToggleExpand={toggleExpand}
            />
          )}
        </div>

        {/* Aperçu live du document assemblé */}
        <PreviewPanel
          paths={selectedPaths}
          format={format}
          disabled={selectedFiles.length === 0 || overSizeLimit}
          maxBytes={config.maxBytes}
        />

        {/* Actions finales */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <FolderTree className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span>
              {selectedFiles.length} fichier(s) · format {format.toUpperCase()}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Toggle format MD / JSON */}
            <div
              role="group"
              aria-label="Format du document"
              className="inline-flex rounded-lg border border-border bg-background p-0.5"
            >
              <button
                type="button"
                onClick={() => setFormat("md")}
                aria-pressed={format === "md"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  format === "md"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                MD
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                aria-pressed={format === "json"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  format === "json"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileJson className="h-3.5 w-3.5" aria-hidden />
                JSON
              </button>
            </div>

            {/* Nom de fichier : basename + extension calculée */}
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
              <input
                type="text"
                value={basename}
                onChange={(e) => setBasename(e.target.value)}
                spellCheck={false}
                aria-label="Nom du fichier de sauvegarde (sans extension)"
                className="w-40 bg-transparent font-mono text-xs text-foreground outline-none"
              />
              <span className="font-mono text-xs text-muted-foreground">
                .{format}
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || selectedFiles.length === 0 || overSizeLimit}
                className="inline-flex items-center gap-1.5 rounded-md bg-chart-4/10 px-2.5 py-1 text-xs font-medium text-chart-4 transition-colors hover:bg-chart-4/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden />
                )}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
