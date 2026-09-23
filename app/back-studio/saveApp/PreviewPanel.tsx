/*
path :           app/back-studio/saveApp/PreviewPanel.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Panneau d'aperçu live du document assemblé. Affiche exactement ce qui
                 sera copié dans le presse-papiers et écrit dans public/save-app/.
                 Compteur X/Y fichiers, taille totale, liste des fichiers ignorés,
                 liste des chemins inclus (en JSON) pour vérifier la complétude, et
                 bouton « Afficher tout » quand le document dépasse le seuil d'affichage.

flow:            Reçoit paths, format, disabled. useEffect debouncé (300 ms) → fetch
                 /preview → setDocument. AbortController pour annuler les requêtes
                 obsolètes. Le bouton Copier utilise TOUJOURS le document entier, jamais
                 la version tronquée.

ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/SaveAppView.tsx",
                   "@/app/back-studio/saveApp/PreviewPanel.tsx",
                   "@/app/api/back-studio/save-app/preview/route.ts",
                 ]
relatedFiles:    ["@/app/back-studio/saveApp/SaveAppView.tsx",
                  "@/app/api/back-studio/save-app/preview/route.ts",
                  "@/components/common/CopyButton.tsx"]
imports:         ["react", "lucide-react",
                  "@/components/common/CopyButton",
                  "props reçues : { paths: readonly string[]; format: \"md\" | \"json\"; disabled?: boolean; maxBytes: number; }"]
exports:         ["PreviewPanel", "PreviewPanelProps"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux voir le document avant de le copier"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useEffect + fetch + useState + AbortController.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";

export type PreviewPanelProps = {
  readonly paths: readonly string[];
  readonly format: "md" | "json";
  readonly disabled?: boolean;
  readonly maxBytes: number;
};

/* Cap par défaut : au-delà, on tronque et on propose « Afficher tout ». */
const SOFT_CAP_CHARS = 100_000;
/* Cap dur : jamais dépassé, même avec « Afficher tout » (protection perf). */
const HARD_CAP_CHARS = 2_000_000;
const DEBOUNCE_MS = 300;

type Skipped = { path: string; reason: string };

/* Extrait les chemins inclus depuis un document MD ou JSON. */
function extractIncludedPaths(
  document: string,
  format: "md" | "json",
): string[] {
  if (format === "json") {
    const out: string[] = [];
    // On tolère les 2 formats : "path": "…" (JSON) ou === path === (MD)
    const re = /^\s*"([^"]+)"\s*:/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(document)) !== null) out.push(m[1]);
    return out;
  }
  const out: string[] = [];
  const re = /^=== (.+) ===$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(document)) !== null) out.push(m[1]);
  return out;
}

export function PreviewPanel({
  paths,
  format,
  disabled = false,
  maxBytes,
}: PreviewPanelProps) {
  const [document, setDocument] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [skipped, setSkipped] = useState<Skipped[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  /* Clé stable : évite de relancer le fetch à chaque render si paths est
     reconstruit avec le même contenu. */
  const pathsKey = useMemo(() => paths.join("\n"), [paths]);

  useEffect(() => {
    if (disabled || paths.length === 0) {
      setDocument(null);
      setFileCount(0);
      setTotalBytes(0);
      setSkipped([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/back-studio/save-app/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths, format }),
          signal: ctrl.signal,
        });

        const data = (await res.json()) as {
          document?: string;
          fileCount?: number;
          totalBytes?: number;
          skipped?: Skipped[];
          error?: string;
        };

        if (!res.ok || typeof data.document !== "string") {
          throw new Error(data.error ?? "Prévisualisation impossible.");
        }

        setDocument(data.document);
        setFileCount(data.fileCount ?? 0);
        setTotalBytes(data.totalBytes ?? 0);
        setSkipped(data.skipped ?? []);
        setError(null);
        setShowAll(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
        setDocument(null);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey, format, disabled, reloadKey]);

  const overLimit = totalBytes > maxBytes;
  const missing = Math.max(0, paths.length - fileCount);
  const softTruncated = document !== null && document.length > SOFT_CAP_CHARS;
  const hardTruncated = document !== null && document.length > HARD_CAP_CHARS;
  const shouldTruncate = softTruncated && !showAll;
  const visible =
    document === null
      ? ""
      : shouldTruncate
        ? document.slice(0, SOFT_CAP_CHARS) + "\n\n… [tronqué]"
        : hardTruncated
          ? document.slice(0, HARD_CAP_CHARS) + "\n\n… [tronqué — limite dure]"
          : document;

  /* Chemins inclus — extraits du document complet côté client.
     Sert à vérifier visuellement que TOUS les fichiers attendus sont bien
     dans le document, même si l'affichage est tronqué. */
  const includedPaths = useMemo(
    () => (document ? extractIncludedPaths(document, format) : []),
    [document, format],
  );

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
      <header className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-bold text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
          Aperçu du document
        </button>

        <span className="text-xs text-muted-foreground">
          <span
            className={
              missing > 0
                ? "font-mono font-semibold text-amber-600 dark:text-amber-400"
                : "font-mono font-semibold text-foreground"
            }
          >
            {fileCount}
          </span>
          /{paths.length} fichier(s) ·{" "}
          <span className="font-mono">{(totalBytes / 1024).toFixed(1)} Ko</span>{" "}
          · format {format}
        </span>

        {loading && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Préparation…
          </span>
        )}

        {missing > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {missing} non lu(s)
          </span>
        )}

        {overLimit && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            Dépasse la limite
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading || disabled}
            aria-label="Rafraîchir l'aperçu"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
          </button>
          <CopyButton
            value={document ?? ""}
            label="Copier"
            toastLabel={`${fileCount} fichier(s) copié(s)`}
            disabled={document === null || fileCount === 0}
          />
        </div>
      </header>

      {expanded && (
        <>
          {error && (
            <p className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          {!error && disabled && (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs italic text-muted-foreground">
              Aucun fichier sélectionné — rien à prévisualiser.
            </p>
          )}

          {!error && !disabled && document === null && loading && (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-6 text-center text-xs italic text-muted-foreground">
              Chargement de l&apos;aperçu…
            </p>
          )}

          {!error && document !== null && (
            <>
              {skipped.length > 0 && (
                <details className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
                  <summary className="cursor-pointer font-medium text-amber-800 dark:text-amber-300">
                    {skipped.length} fichier(s) ignoré(s) par le serveur —
                    cliquez pour voir la liste
                  </summary>
                  <ul className="mt-2 space-y-0.5 font-mono text-[10px] text-amber-900/80 dark:text-amber-200/80">
                    {skipped.map((s) => (
                      <li key={s.path}>
                        <span className="text-amber-900 dark:text-amber-200">
                          {s.path}
                        </span>{" "}
                        — {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {shouldTruncate && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>
                    Aperçu tronqué à {SOFT_CAP_CHARS.toLocaleString()}{" "}
                    caractères (document complet :{" "}
                    {document.length.toLocaleString()}). Le bouton « Copier »
                    utilise toujours le document entier.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="ml-auto rounded-md border border-amber-500/40 bg-background px-2 py-1 text-[11px] font-medium text-amber-800 transition-colors hover:bg-amber-500/10 dark:text-amber-300"
                  >
                    Afficher tout
                  </button>
                </div>
              )}

              {showAll && softTruncated && !hardTruncated && (
                <p className="text-[10px] italic text-muted-foreground">
                  Affichage complet ({document.length.toLocaleString()}{" "}
                  caractères).
                </p>
              )}

              {hardTruncated && (
                <p className="text-[10px] italic text-amber-700 dark:text-amber-400">
                  Document trop volumineux pour l&apos;affichage (limite dure :{" "}
                  {HARD_CAP_CHARS.toLocaleString()} caractères). Utilisez «
                  Copier » pour récupérer le contenu entier.
                </p>
              )}

              {/* Sommaire des chemins inclus — sert à vérifier que TOUS les
                  fichiers attendus sont bien dans le document. */}
              {includedPaths.length > 0 && (
                <details className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Chemins inclus dans le document ({includedPaths.length})
                  </summary>
                  <ul className="mt-2 max-h-48 overflow-auto space-y-0.5 font-mono text-[10px] text-muted-foreground">
                    {includedPaths.map((p, i) => (
                      <li key={`${p}-${i}`} className="truncate">
                        {i + 1}. {p}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/90">
                  {visible}
                </pre>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
