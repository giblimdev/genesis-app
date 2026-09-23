/*
path :           lib/dev/buildTree.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Construit une arborescence de dossiers/fichiers à partir d'une liste plate
                 d'AppFile, triée alphabétiquement. Utilisé par la page SaveApp pour
                 afficher l'arborescence de sélection.
flow:            buildTree(files) → groupe par segments de chemin → retourne TreeNode[].
                 Les dossiers sont triés avant les fichiers, puis par ordre alphabétique.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/TreeView.tsx",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/buildTree.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts"]
imports:         ["@/lib/dev/types",
                  "paramètres reçus : buildTree(files: readonly AppFile[])"]
exports:         ["buildTree"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux afficher une arborescence de fichiers"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { AppFile, TreeDir, TreeFile, TreeNode } from "@/lib/dev/types";

type MutableDir = {
  kind: "dir";
  name: string;
  path: string;
  dirs: Map<string, MutableDir>;
  files: TreeFile[];
};

function makeDir(name: string, path: string): MutableDir {
  return { kind: "dir", name, path, dirs: new Map(), files: [] };
}

function freezeDir(dir: MutableDir): TreeDir {
  const children: TreeNode[] = [];

  const dirs = Array.from(dir.dirs.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const d of dirs) children.push(freezeDir(d));

  const files = [...dir.files].sort((a, b) => a.name.localeCompare(b.name));
  for (const f of files) children.push(f);

  return {
    kind: "dir",
    name: dir.name,
    path: dir.path,
    children,
  };
}

export function buildTree(files: readonly AppFile[]): readonly TreeNode[] {
  const root = makeDir("", "");

  for (const file of files) {
    const segments = file.relativePath.split("/");
    const fileName = segments.pop();
    if (!fileName) continue;

    let cursor = root;
    let acc = "";

    for (const seg of segments) {
      acc = acc ? `${acc}/${seg}` : seg;
      let next = cursor.dirs.get(seg);
      if (!next) {
        next = makeDir(seg, acc);
        cursor.dirs.set(seg, next);
      }
      cursor = next;
    }

    cursor.files.push({
      kind: "file",
      name: fileName,
      path: file.relativePath,
      file,
    });
  }

  return freezeDir(root).children;
}
