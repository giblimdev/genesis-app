/*
path :           app/back-studio/ExportToIA/readProjectFiles.ts
projectId:       <à fournir>
type:            helper
generic:         false

role:            Lecture serveur des fichiers sources à exporter : prisma/schema.prisma,
                 package.json et CONTRIBUTING.md. Retourne un tableau de ProjectFile avec
                 contenu, indicateur missing et éventuel message d'erreur. Ne lève jamais :
                 un fichier absent est signalé par missing=true.
flow:            readProjectFiles() → Promise.all(FILES.map(readFile)) → pour chaque fichier,
                 fs.readFile depuis process.cwd(). ENOENT → missing=true, autres erreurs →
                 missing=true + error. Utilisé par page.tsx (Server Component).
ecosystem:       Dev = [
                   "@/app/back-studio/ExportToIA/page.tsx",
                   "@/app/back-studio/ExportToIA/readProjectFiles.ts",
                   "@/lib/highlighter.ts",
                 ]
relatedFiles:    ["@/app/back-studio/ExportToIA/page.tsx"]
imports:         ["server-only", "node:fs/promises", "node:path"]
exports:         ["readProjectFiles", "ProjectFile", "ProjectFileLang"]
useBy:           ["@/app/back-studio/ExportToIA/page.tsx"]

userStories:     ["*en tant que développeur je veux exporter le contexte du projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export type ProjectFileLang = "prisma" | "json" | "markdown";

export type ProjectFile = {
  readonly path: string;
  readonly label: string;
  readonly lang: ProjectFileLang;
  readonly content: string;
  readonly missing: boolean;
  readonly error?: string;
};

type FileSpec = {
  readonly path: string;
  readonly label: string;
  readonly lang: ProjectFileLang;
};

const FILES: readonly FileSpec[] = [
  {
    path: "prisma/schema.prisma",
    label: "Prisma Schema",
    lang: "prisma",
  },
  {
    path: "package.json",
    label: "package.json",
    lang: "json",
  },
  {
    path: "CONTRIBUTING.md",
    label: "CONTRIBUTING.md",
    lang: "markdown",
  },
];

async function readOne(spec: FileSpec): Promise<ProjectFile> {
  const abs = path.join(process.cwd(), spec.path);

  try {
    const content = await fs.readFile(abs, "utf8");
    return { ...spec, content, missing: false };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { ...spec, content: "", missing: true };
    }
    return {
      ...spec,
      content: "",
      missing: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function readProjectFiles(): Promise<ProjectFile[]> {
  return Promise.all(FILES.map(readOne));
}
