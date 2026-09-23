/*
path :           app/back-studio/saveApp/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'entrée de SaveApp. Lit les fichiers de l'app via readAppFiles()
                 (scan disque + parsing d'en-tête), puis délègue tout le rendu interactif
                 à SaveAppView (arborescence, filtres, règles, sélection, copie, save).
flow:            Server Component async → readAppFiles() → <SaveAppView files config />.
                 Affiche les statistiques COMPLÈTES du scan en en-tête (7 indicateurs :
                 total, avec en-tête, sans en-tête, dossiers exclus, fichiers exclus,
                 poids total, tronqué).
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/TreeView.tsx",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/buildTree.ts",
                 ]
relatedFiles:    ["@/app/back-studio/saveApp/readAppFiles.ts",
                  "@/app/back-studio/saveApp/SaveAppView.tsx"]
imports:         ["next", "lucide-react",
                  "@/app/back-studio/saveApp/readAppFiles",
                  "@/app/back-studio/saveApp/SaveAppView"]
exports:         ["default SaveAppPage", "metadata"]
useBy:           []

userStories:     ["*en tant que développeur je veux exporter une sélection de fichiers"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { AlertTriangle, FolderTree } from "lucide-react";

import { readAppFiles } from "./readAppFiles";
import { SaveAppView } from "./SaveAppView";

export const metadata: Metadata = {
  title: "SaveApp — Export de fichiers",
  description:
    "Sélectionne des fichiers de l'app, filtre par type ou tag, copie ou sauvegarde un document assemblé.",
};

export default async function SaveAppPage() {
  const { files, config, stats } = await readAppFiles();

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      {/* En-tête */}
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <FolderTree className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · SaveApp
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Sélection de fichiers
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Scanne les dossiers configurés, sélectionne les fichiers à exporter,
          filtre par type ou tag, puis copie ou sauvegarde un document unique au
          format
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            === chemin ===
          </code>
          .
        </p>

        {/* Stats du scan — 6 indicateurs + poids */}
        <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatBlock label="Fichiers scannés" value={stats.total} />
          <StatBlock label="Avec en-tête" value={stats.withHeader} tone="ok" />
          <StatBlock
            label="Sans en-tête"
            value={stats.withoutHeader}
            tone={stats.withoutHeader > 0 ? "warn" : "muted"}
          />
          <StatBlock label="Dossiers exclus" value={stats.skippedDirs} />
          <StatBlock label="Fichiers exclus" value={stats.skippedFiles} />
          <StatBlock
            label="Poids total"
            value={`${(stats.totalBytes / 1024).toFixed(0)} Ko`}
          />
        </dl>

        {stats.truncated && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              Le scan a été tronqué à {config.maxFiles} fichiers. Augmente la
              limite dans les règles de scan ou affine les exclusions.
            </p>
          </div>
        )}
      </header>

      {/* UI interactive */}
      <SaveAppView files={files} config={config} />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  StatBlock                                                          */
/* ------------------------------------------------------------------ */

type StatTone = "default" | "ok" | "warn" | "muted";

const TONE_CLASS: Record<StatTone, string> = {
  default: "text-foreground",
  ok: "text-chart-4",
  warn: "text-amber-600 dark:text-amber-400",
  muted: "text-muted-foreground",
};

function StatBlock({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-mono text-xl font-bold tabular-nums ${TONE_CLASS[tone]}`}
      >
        {value}
      </dd>
    </div>
  );
}
