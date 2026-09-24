/*
path :           app/back-studio/ExportToIA/ExportView.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Vue client de la page d'export vers une IA. Affiche les fichiers en cartes
                 avec case à cocher, contenu coloré (Shiki) ou éditable (textarea), boutons
                 "Tout sélectionner / désélectionner", bascule mode éditable, bouton Copier
                 global et bouton Sauvegarder dans /public.
flow:            Reçoit files: ExportFile[] (déjà lus + HTML coloré côté serveur). State local :
                 selected (Set<string>), editable (bool), edited (Record<path,string>).
                 - Copier : assemble les fichiers sélectionnés au format Option A et copie
                   dans le presse-papiers via navigator.clipboard.
                 - Sauvegarder : POST /api/back-studio/export/save avec { filename, content }.
ecosystem:       Dev = [
                   "@/app/back-studio/ExportToIA/page.tsx",
                   "@/app/back-studio/ExportToIA/readProjectFiles.ts",
                   "@/lib/highlighter.ts",
                 ]
relatedFiles:    ["@/app/back-studio/ExportToIA/page.tsx",
                  "@/components/common/CopyButton.tsx"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/common/CopyButton"]
exports:         ["ExportView", "ExportViewProps", "ExportFile"]
useBy:           ["@/app/back-studio/ExportToIA/page.tsx"]

userStories:     ["*en tant que développeur je veux exporter un document pour une IA"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState + clipboard + fetch + interactions utilisateur.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  Code2,
  Eye,
  FileJson,
  FileText,
  Loader2,
  Pencil,
  Save,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/common/CopyButton";

export type ExportFile = {
  readonly path: string;
  readonly label: string;
  readonly lang: "prisma" | "json" | "markdown";
  readonly content: string;
  readonly html: string | null;
  readonly missing: boolean;
  readonly error?: string;
};

export type ExportViewProps = {
  readonly files: readonly ExportFile[];
  readonly defaultFilename: string;
};

function buildDocument(
  parts: readonly { path: string; content: string }[],
): string {
  return parts
    .map((p) => `=== ${p.path} ===\n\n${p.content.trimEnd()}\n`)
    .join("\n");
}

function iconFor(lang: ExportFile["lang"]) {
  if (lang === "prisma") return Code2;
  if (lang === "json") return FileJson;
  return FileText;
}

export function ExportView({ files, defaultFilename }: ExportViewProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const f of files) {
      if (!f.missing) initial.add(f.path);
    }
    return initial;
  });
  const [editable, setEditable] = useState(false);
  const [edited, setEdited] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const f of files) map[f.path] = f.content;
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [filename, setFilename] = useState(defaultFilename);

  const available = useMemo(() => files.filter((f) => !f.missing), [files]);
  const selectedFiles = useMemo(
    () => files.filter((f) => selected.has(f.path)),
    [files, selected],
  );

  const documentText = useMemo(() => {
    return buildDocument(
      selectedFiles.map((f) => ({
        path: f.path,
        content: editable ? (edited[f.path] ?? f.content) : f.content,
      })),
    );
  }, [selectedFiles, editable, edited]);

  const allSelected =
    available.length > 0 && selected.size === available.length;

  function toggleOne(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(available.map((f) => f.path)));
    }
  }

  function updateContent(path: string, value: string) {
    setEdited((prev) => ({ ...prev, [path]: value }));
  }

  async function handleSave() {
    if (selected.size === 0) {
      toast.error("Aucun fichier sélectionné.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/back-studio/export/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: documentText }),
      });
      const data = (await res.json()) as {
        saved?: boolean;
        publicPath?: string;
        error?: string;
      };
      if (!res.ok || !data.publicPath) {
        throw new Error(data.error ?? "Erreur de sauvegarde.");
      }
      toast.success(`Sauvegardé : ${data.publicPath}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <button
          type="button"
          onClick={toggleAll}
          disabled={available.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {allSelected ? (
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
          onClick={() => setEditable((v) => !v)}
          aria-pressed={editable}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            editable
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          {editable ? (
            <>
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Mode lecture
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Mode éditable
            </>
          )}
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selected.size}/{available.length} sélectionné(s)
          </span>

          <CopyButton
            value={documentText}
            label="Copier la sélection"
            toastLabel={`${selected.size} fichier(s) copié(s)`}
            disabled={selected.size === 0}
          />

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              spellCheck={false}
              className="w-44 bg-transparent font-mono text-xs text-foreground outline-none"
              aria-label="Nom du fichier de sauvegarde"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selected.size === 0}
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

      {/* Cartes fichiers */}
      <div className="flex flex-col gap-4">
        {files.map((file) => {
          const Icon = iconFor(file.lang);
          const isSelected = selected.has(file.path);
          const currentContent = editable
            ? (edited[file.path] ?? file.content)
            : file.content;

          return (
            <section
              key={file.path}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isSelected
                  ? "border-primary/40 bg-card"
                  : "border-border bg-card/60"
              }`}
            >
              {/* En-tête de carte */}
              <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(file.path)}
                    disabled={file.missing}
                    className="h-4 w-4 accent-primary"
                  />
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {file.path}
                  </span>
                </label>

                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {file.lang}
                </span>

                {file.missing && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Fichier introuvable
                  </span>
                )}

                <div className="ml-auto">
                  <CopyButton
                    value={currentContent}
                    label="Copier"
                    toastLabel={`${file.path} copié`}
                    disabled={file.missing}
                  />
                </div>
              </header>

              {/* Contenu */}
              <div className="max-h-[480px] overflow-auto bg-[#0d1117]">
                {file.missing ? (
                  <p className="p-4 text-xs italic text-muted-foreground">
                    Ce fichier n&apos;existe pas à la racine du projet.
                    {file.error ? ` (${file.error})` : ""}
                  </p>
                ) : editable ? (
                  <textarea
                    value={currentContent}
                    onChange={(e) => updateContent(file.path, e.target.value)}
                    spellCheck={false}
                    rows={Math.min(30, currentContent.split("\n").length + 2)}
                    className="block w-full resize-y bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-gray-200 outline-none"
                  />
                ) : file.html ? (
                  <div
                    className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_code]:!font-mono [&_code]:!text-xs"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: file.html }}
                  />
                ) : (
                  <pre className="p-4 font-mono text-xs leading-relaxed text-gray-200">
                    {file.content}
                  </pre>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Aperçu du document assemblé */}
      <section className="flex flex-col gap-2">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">
              Aperçu du document assemblé
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground">
              {documentText.length.toLocaleString()} caractères
            </span>
          </div>

          {/* ↓ NOUVEAU : copie directement depuis l'aperçu */}
          <CopyButton
            value={documentText}
            label="Copier le document"
            toastLabel={`Document copié (${selected.size} fichier(s))`}
            disabled={documentText.length === 0}
          />
        </header>

        <div className="max-h-[320px] overflow-auto rounded-xl border border-border bg-muted/30 p-4">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/90">
            {documentText || "(aucun fichier sélectionné)"}
          </pre>
        </div>
      </section>
    </div>
  );
}