/*
path :           lib/dev/header-parser.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Parse le bloc d'en-tête entre commentaires d'un fichier source. Extrait les
                 champs Helpdev, y compris le nouveau champ `tag` (tableau de chaînes). Tolère
                 les alias (ecosystem/ecosysteme, useBy/usedBy) et les valeurs multi-lignes.
flow:            parseFile(absolutePath) → fs.readFile → extractHeaderBlock → parseHeaderBlock
                 → ParsedHeader. Si aucun en-tête : hasHeader=false + header vide. Ne lève
                 jamais : les erreurs sont capturées et signalées par parseError.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts"]
imports:         ["node:fs/promises", "node:path",
                  "@/lib/dev/types",
                  "paramètres reçus : extractHeaderBlock(content: string)",
                  "                   parseHeaderBlock(raw: string)",
                  "                   parseFile(absolutePath: string)"]
exports:         ["EMPTY_HEADER", "extractHeaderBlock", "parseHeaderBlock", "parseFile"]
useBy:           ["@/app/back-studio/saveApp/readAppFiles.ts"]

userStories:     ["*en tant que développeur je veux parser les en-têtes Helpdev"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { promises as fs } from "node:fs";
import path from "node:path";

import type { AppFile, ParsedHeader } from "@/lib/dev/types";

/* ------------------------------------------------------------------ */
/*  En-tête vide                                                       */
/* ------------------------------------------------------------------ */

export const EMPTY_HEADER: ParsedHeader = {
  path: null,
  projectId: null,
  type: null,
  tag: [],
  generic: null,
  role: null,
  flow: null,
  ecosystem: null,
  userStories: [],
  relatedFiles: [],
  imports: [],
  exports: [],
  useBy: [],
  status: null,
  pathChecked: null,
  metaDataChecked: null,
  scriptChecked: null,
};

/* ------------------------------------------------------------------ */
/*  Type mutable interne (contourne le readonly de ParsedHeader)       */
/* ------------------------------------------------------------------ */

type MutableHeader = {
  path: string | null;
  projectId: string | null;
  type: string | null;
  tag: string[];
  generic: boolean | null;
  role: string | null;
  flow: string | null;
  ecosystem: string | null;
  userStories: string[];
  relatedFiles: string[];
  imports: string[];
  exports: string[];
  useBy: string[];
  status: string | null;
  pathChecked: boolean | null;
  metaDataChecked: boolean | null;
  scriptChecked: boolean | null;
};

function makeEmptyMutableHeader(): MutableHeader {
  return {
    path: null,
    projectId: null,
    type: null,
    tag: [],
    generic: null,
    role: null,
    flow: null,
    ecosystem: null,
    userStories: [],
    relatedFiles: [],
    imports: [],
    exports: [],
    useBy: [],
    status: null,
    pathChecked: null,
    metaDataChecked: null,
    scriptChecked: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Extraction                                                         */
/* ------------------------------------------------------------------ */

/** Retourne le contenu du premier bloc de commentaire du fichier, ou null. */
export function extractHeaderBlock(content: string): string | null {
  const start = content.indexOf("/*");
  if (start === -1) return null;
  const end = content.indexOf("*/", start + 2);
  if (end === -1) return null;
  return content.slice(start + 2, end);
}

/* ------------------------------------------------------------------ */
/*  Helpers de parsing                                                 */
/* ------------------------------------------------------------------ */

const FIELD_ALIASES: Record<string, string> = {
  ecosysteme: "ecosystem",
  usedby: "useBy",
};

function normalizeKey(raw: string): string {
  const key = raw.trim();
  return FIELD_ALIASES[key.toLowerCase()] ?? key;
}

function parseBool(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (v.includes("✔") || v === "true") return true;
  if (v.includes("✘") || v === "false") return false;
  return null;
}

function parseStringArray(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed === "[]") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function parseString(raw: string): string | null {
  const v = raw.trim();
  return v.length === 0 ? null : v;
}

/* ------------------------------------------------------------------ */
/*  Parsing du bloc                                                    */
/* ------------------------------------------------------------------ */

/**
 * Parse le contenu brut d'un bloc d'en-tête en ParsedHeader.
 * Les valeurs multi-lignes sont fusionnées sur la ligne du label.
 */
export function parseHeaderBlock(raw: string): ParsedHeader {
  const result: MutableHeader = makeEmptyMutableHeader();

  const lines = raw.split(/\r?\n/);
  const labelRegex = /^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*(.*)$/;

  type Entry = { key: string; value: string };
  const entries: Entry[] = [];
  let current: Entry | null = null;

  for (const line of lines) {
    const m = line.match(labelRegex);
    if (m) {
      if (current) entries.push(current);
      current = { key: normalizeKey(m[1]!), value: m[2]!.trim() };
    } else if (current && line.trim().length > 0) {
      current.value = `${current.value} ${line.trim()}`.trim();
    }
  }
  if (current) entries.push(current);

  for (const { key, value } of entries) {
    switch (key) {
      case "path":
        result.path = parseString(value);
        break;
      case "projectId":
        result.projectId = parseString(value);
        break;
      case "type":
        result.type = parseString(value);
        break;
      case "tag":
        result.tag = parseStringArray(value);
        break;
      case "generic":
        result.generic = parseBool(value);
        break;
      case "role":
        result.role = parseString(value);
        break;
      case "flow":
        result.flow = parseString(value);
        break;
      case "ecosystem":
        result.ecosystem = parseString(value);
        break;
      case "userStories":
        result.userStories = parseStringArray(value);
        break;
      case "relatedFiles":
        result.relatedFiles = parseStringArray(value);
        break;
      case "imports":
        result.imports = parseStringArray(value);
        break;
      case "exports":
        result.exports = parseStringArray(value);
        break;
      case "useBy":
        result.useBy = parseStringArray(value);
        break;
      case "status":
        result.status = parseString(value);
        break;
      case "pathChecked":
        result.pathChecked = parseBool(value);
        break;
      case "metaDataChecked":
        result.metaDataChecked = parseBool(value);
        break;
      case "scriptChecked":
        result.scriptChecked = parseBool(value);
        break;
      default:
        break;
    }
  }

  // Un objet mutable satisfait une interface readonly.
  return result;
}

/* ------------------------------------------------------------------ */
/*  Lecture d'un fichier                                               */
/* ------------------------------------------------------------------ */

/**
 * Lit un fichier et retourne un AppFile avec son en-tête parsé.
 * Ne lève jamais : en cas d'erreur, hasHeader=false + parseError.
 */
export async function parseFile(absolutePath: string): Promise<AppFile> {
  const relativePath = path
    .relative(process.cwd(), absolutePath)
    .split(path.sep)
    .join("/");
  const extension = path.extname(absolutePath);

  let content: string;
  let size = 0;
  try {
    const stat = await fs.stat(absolutePath);
    size = stat.size;
    content = await fs.readFile(absolutePath, "utf8");
  } catch (err) {
    return {
      absolutePath,
      relativePath,
      size: 0,
      extension,
      hasHeader: false,
      header: EMPTY_HEADER,
      parseError: err instanceof Error ? err.message : String(err),
    };
  }

  const block = extractHeaderBlock(content);
  if (!block) {
    return {
      absolutePath,
      relativePath,
      size,
      extension,
      hasHeader: false,
      header: EMPTY_HEADER,
    };
  }

  try {
    return {
      absolutePath,
      relativePath,
      size,
      extension,
      hasHeader: true,
      header: parseHeaderBlock(block),
    };
  } catch (err) {
    return {
      absolutePath,
      relativePath,
      size,
      extension,
      hasHeader: true,
      header: EMPTY_HEADER,
      parseError: err instanceof Error ? err.message : String(err),
    };
  }
}
