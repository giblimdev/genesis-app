/*
path :           app/back-studio/saveApp/TreeView.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Arborescence récursive avec cases à cocher tri-état pour les dossiers
                 (coché / partiel / vide). Affiche le type et les tags de chaque fichier
                 sous forme de badges. Utilisée par SaveAppView.
flow:            Reçoit nodes (TreeNode[]), selected (Set<string>), expanded (Set<string>)
                 et des callbacks. Le parent contrôle l'état : le composant est purement
                 contrôlé. Récursion sur TreeDir.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/TreeView.tsx",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/buildTree.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts",
                  "@/app/back-studio/saveApp/SaveAppView.tsx"]
imports:         ["react", "lucide-react",
                  "@/lib/dev/types",
                  "props reçues : { nodes: readonly TreeNode[]; selected: Set<string>; expanded: Set<string>; onToggleFile: (path: string) => void; onToggleDir: (dir: TreeDir) => void; onToggleExpand: (path: string) => void; }"]
exports:         ["TreeView", "TreeViewProps"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux sélectionner des fichiers dans une arborescence"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : interactions utilisateur (clic, toggle).

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
} from "lucide-react";

import type { AppFile, TreeDir, TreeFile, TreeNode } from "@/lib/dev/types";

export type TreeViewProps = {
  readonly nodes: readonly TreeNode[];
  readonly selected: Set<string>;
  readonly expanded: Set<string>;
  readonly onToggleFile: (path: string) => void;
  readonly onToggleDir: (dir: TreeDir) => void;
  readonly onToggleExpand: (path: string) => void;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectFiles(node: TreeNode): AppFile[] {
  if (node.kind === "file") return [node.file];
  const out: AppFile[] = [];
  for (const child of node.children) out.push(...collectFiles(child));
  return out;
}

function dirState(
  dir: TreeDir,
  selected: Set<string>,
): "all" | "none" | "partial" {
  const files = collectFiles(dir);
  if (files.length === 0) return "none";
  let sel = 0;
  for (const f of files) if (selected.has(f.relativePath)) sel++;
  if (sel === 0) return "none";
  if (sel === files.length) return "all";
  return "partial";
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TreeView({
  nodes,
  selected,
  expanded,
  onToggleFile,
  onToggleDir,
  onToggleExpand,
}: TreeViewProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <li key={node.kind === "dir" ? `d:${node.path}` : `f:${node.path}`}>
          {node.kind === "dir" ? (
            <DirRow
              dir={node}
              selected={selected}
              expanded={expanded}
              onToggleDir={onToggleDir}
              onToggleExpand={onToggleExpand}
              onToggleFile={onToggleFile}
            />
          ) : (
            <FileRow file={node} selected={selected} onToggle={onToggleFile} />
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne dossier                                                      */
/* ------------------------------------------------------------------ */

function DirRow({
  dir,
  selected,
  expanded,
  onToggleDir,
  onToggleExpand,
  onToggleFile,
}: {
  dir: TreeDir;
  selected: Set<string>;
  expanded: Set<string>;
  onToggleDir: (dir: TreeDir) => void;
  onToggleExpand: (path: string) => void;
  onToggleFile: (path: string) => void;
}) {
  const state = dirState(dir, selected);
  const isOpen = expanded.has(dir.path);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted/40">
        <button
          type="button"
          onClick={() => onToggleExpand(dir.path)}
          aria-label={isOpen ? "Replier" : "Déplier"}
          className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        <input
          type="checkbox"
          checked={state === "all"}
          ref={(el) => {
            if (el) el.indeterminate = state === "partial";
          }}
          onChange={() => onToggleDir(dir)}
          className="h-3.5 w-3.5 shrink-0 accent-primary"
        />

        {isOpen ? (
          <FolderOpen
            className="h-4 w-4 shrink-0 text-primary/70"
            aria-hidden
          />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
        )}

        <span className="font-mono text-xs font-semibold text-foreground">
          {dir.name}
        </span>
      </div>

      {isOpen && (
        <div className="ml-5 border-l border-border/60 pl-2">
          <TreeView
            nodes={dir.children}
            selected={selected}
            expanded={expanded}
            onToggleFile={onToggleFile}
            onToggleDir={onToggleDir}
            onToggleExpand={onToggleExpand}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne fichier                                                      */
/* ------------------------------------------------------------------ */

function FileRow({
  file,
  selected,
  onToggle,
}: {
  file: TreeFile;
  selected: Set<string>;
  onToggle: (path: string) => void;
}) {
  const isSelected = selected.has(file.path);
  const header = file.file.header;

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40">
      <span className="w-5 shrink-0" aria-hidden />

      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(file.path)}
        className="h-3.5 w-3.5 shrink-0 accent-primary"
      />

      <FileText
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />

      <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
        {file.name}
      </span>

      {header.type && (
        <span className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          {header.type}
        </span>
      )}

      {header.tag.length > 0 &&
        header.tag.slice(0, 2).map((t) => (
          <span
            key={t}
            className="shrink-0 rounded-full border border-chart-1/30 bg-chart-1/10 px-1.5 py-0.5 font-mono text-[9px] text-chart-1"
          >
            {t}
          </span>
        ))}

      {header.tag.length > 2 && (
        <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
          +{header.tag.length - 2}
        </span>
      )}
    </label>
  );
}
