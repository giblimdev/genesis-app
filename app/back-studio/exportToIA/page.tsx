/*
path :           app/back-studio/ExportToIA/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'export du contexte projet vers une IA. Lit prisma/schema.prisma,
                 package.json et CONTRIBUTING.md sur le disque, calcule le HTML coloré de
                 chacun via Shiki, puis rend ExportView côté client (sélection, copie,
                 sauvegarde).
flow:            Server Component async → readProjectFiles() → highlightCode() pour chaque
                 fichier → <ExportView files={files} defaultFilename="capture-YYYY-MM-DD.md" />.
ecosystem:       Dev = [
                   "@/app/back-studio/ExportToIA/page.tsx",
                   "@app/api/back-studio/export/save/route.ts"
                   "@/app/back-studio/ExportToIA/readProjectFiles.ts",
                   "@/app/back-studio/ExportToIA/ExportView.tsx"
                   "@/components/common/CopyButton.tsx"
                   "@/lib/highlighter.ts",
                 ]
relatedFiles:    ["@/app/back-studio/ExportToIA/ExportView.tsx",
                  "@/app/back-studio/ExportToIA/readProjectFiles.ts",
                  "@/lib/highlighter.ts"]
imports:         ["next", "lucide-react",
                  "@/app/back-studio/ExportToIA/readProjectFiles",
                  "@/app/back-studio/ExportToIA/ExportView",
                  "@/lib/highlighter"]
exports:         ["default ExportToIAPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux exporter un document pour une IA"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { FolderDown } from "lucide-react";

import { readProjectFiles } from "./readProjectFiles";
import { ExportView, type ExportFile } from "./ExportView";
import { highlightCode } from "@/lib/highlighter";

export const metadata: Metadata = {
  title: "Export vers IA",
  description:
    "Exporte le contexte du projet (schéma Prisma, package.json, CONTRIBUTING.md) dans un document unique, copiable ou sauvegardable.",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ExportToIAPage() {
  const files = await readProjectFiles();

  const enriched: ExportFile[] = await Promise.all(
    files.map(async (f) => ({
      path: f.path,
      label: f.label,
      lang: f.lang,
      content: f.content,
      html: f.missing
        ? null
        : await highlightCode({ code: f.content, lang: f.lang }),
      missing: f.missing,
      error: f.error,
    })),
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <FolderDown className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · Export IA
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Export du contexte projet
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Sélectionne un ou plusieurs fichiers, puis copie le document assemblé
          pour le coller dans une IA. Format&nbsp;: séparateurs simples
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            === chemin ===
          </code>
          . Tu peux aussi basculer en mode éditable et sauvegarder le document
          dans{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            /public
          </code>
          .
        </p>
      </header>

      <ExportView files={enriched} defaultFilename={`capture-${today()}.md`} />
    </main>
  );
}
