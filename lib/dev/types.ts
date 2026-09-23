/*
path :           lib/dev/types.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Types partagés du module Dev : en-tête parsé, fichier scanné, configuration
                 d'exclusion, nœud d'arborescence. Utilisé par le parser, le walker et la
                 page SaveApp.
flow:            Module TypeScript pur → export de types. Aucun import runtime, aucun effet.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                 ]
relatedFiles:    ["@/lib/dev/header-parser.ts",
                  "@/lib/dev/fs-walker.ts",
                  "@/app/back-studio/saveApp/readAppFiles.ts"]
imports:         []
exports:         ["ScannedFile", "ParsedHeader", "AppFile",
                  "ExcludesConfig", "TreeDir", "TreeFile", "TreeNode"]
useBy:           ["@/lib/dev/header-parser.ts",
                  "@/lib/dev/fs-walker.ts",
                  "@/app/back-studio/saveApp/readAppFiles.ts"]

userStories:     ["*en tant que développeur je veux typer les fichiers scannés"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Scan                                                               */
/* ------------------------------------------------------------------ */

export type ScannedFile = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly size: number;
};

/* ------------------------------------------------------------------ */
/*  En-tête parsé                                                      */
/* ------------------------------------------------------------------ */

export type ParsedHeader = {
  readonly path: string | null;
  readonly projectId: string | null;
  readonly type: string | null;
  readonly tag: readonly string[];
  readonly generic: boolean | null;
  readonly role: string | null;
  readonly flow: string | null;
  readonly ecosystem: string | null;
  readonly userStories: readonly string[];
  readonly relatedFiles: readonly string[];
  readonly imports: readonly string[];
  readonly exports: readonly string[];
  readonly useBy: readonly string[];
  readonly status: string | null;
  readonly pathChecked: boolean | null;
  readonly metaDataChecked: boolean | null;
  readonly scriptChecked: boolean | null;
};

/* ------------------------------------------------------------------ */
/*  Fichier app enrichi (scan + en-tête)                               */
/* ------------------------------------------------------------------ */

export type AppFile = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly size: number;
  readonly extension: string;
  readonly hasHeader: boolean;
  readonly header: ParsedHeader;
  readonly parseError?: string;
};

/* ------------------------------------------------------------------ */
/*  Excludes                                                           */
/* ------------------------------------------------------------------ */

export type ExcludesConfig = {
  /** Dossiers racine à scanner, relatifs à process.cwd(). */
  readonly roots: readonly string[];
  /** Chemins ou dossiers à ignorer, relatifs à la racine du projet. */
  readonly excludes: readonly string[];
  /** Extensions à inclure (avec le point). */
  readonly includeExtensions: readonly string[];
  /** Motifs de fichiers à exclure (suffixes). */
  readonly excludePatterns: readonly string[];
  /** Limite du nombre de fichiers scannés. */
  readonly maxFiles: number;
  /** Limite en octets pour l'export (50 Mo par défaut). */
  readonly maxBytes: number;
};

/* ------------------------------------------------------------------ */
/*  Arborescence (UI)                                                  */
/* ------------------------------------------------------------------ */

export type TreeDir = {
  readonly kind: "dir";
  readonly name: string;
  readonly path: string;
  readonly children: readonly TreeNode[];
};

export type TreeFile = {
  readonly kind: "file";
  readonly name: string;
  readonly path: string;
  readonly file: AppFile;
};

export type TreeNode = TreeDir | TreeFile;
