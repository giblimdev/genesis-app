/*
path :           components/common/ExportJsonDialog.tsx
tag :            ["common", "export", "json", "dialog"]
projectId:       <à fournir>
type:            component
generic:         true

role:            Dialog d'export JSON générique. Affiche une donnée déjà
                 sérialisable dans une <Textarea> en lecture seule, avec un
                 compteur de caractères et un bouton Copier. Si une
                 `fullFetcher` est fournie, un toggle « Inclure les
                 dépendances » apparaît. Le mode initial est configurable
                 via `defaultMode`.

flow:            Client Component → useState(open, mode, isPending) →
                 useEffect déclenché par [open, mode] UNIQUEMENT → appelle
                 fullFetcher() → stocke dans fullData → useMemo calcule
                 le contenu. Le bouton de copie est un CopyJsonButton.

                 ⚠️ Le useEffect n'a PAS loadingFull/fullData dans ses deps
                 pour éviter la boucle infinie (cleanup → cancelled=true →
                 promesse annulée).

ecosystem:       UI = [
                   "@/components/common/CopyButton.tsx",
                   "@/components/common/CopyJsonButton.tsx",
                   "@/components/common/ExportJsonDialog.tsx",
                   "@/components/common/ImportJsonDialog.tsx",
                   "@/components/common/JsonEditor.tsx",
                 ]
relatedFiles:    ["@/components/common/CopyJsonButton.tsx",
                  "@/components/ui/dialog",
                  "@/components/ui/button",
                  "@/components/ui/textarea"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/common/CopyJsonButton",
                  "@/components/ui/dialog",
                  "@/components/ui/button",
                  "@/components/ui/textarea",
                  "props reçues : { trigger, title, description?, data?, fullFetcher?, defaultMode?, fullToggleLabel?, emptyMessage?, rows? }"]
exports:         ["ExportJsonDialog", "ExportJsonDialogProps"]
useBy:           ["@/app/back-studio/scrum/page.tsx"]

userStories:     ["*en tant que développeur je veux exporter du JSON",
                  "*en tant que développeur je veux forcer le payload complet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CopyJsonButton } from "@/components/common/CopyJsonButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Mode = "light" | "full";

export type ExportJsonDialogProps = {
  readonly trigger: ReactElement;
  readonly title: string;
  readonly description?: string;

  /** Payload léger. Optionnel si `defaultMode === "full"`. */
  readonly data?: unknown;

  /** Server Action qui retourne le payload complet (avec dépendances). */
  readonly fullFetcher?: () => Promise<unknown>;

  /** Libellé du toggle quand `fullFetcher` est fourni. */
  readonly fullToggleLabel?: string;

  /** Mode initial : "light" (défaut) ou "full". */
  readonly defaultMode?: Mode;

  readonly emptyMessage?: string;
  readonly rows?: number;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ExportJsonDialog({
  trigger,
  title,
  description,
  data,
  fullFetcher,
  fullToggleLabel = "Inclure les dépendances",
  defaultMode = "light",
  emptyMessage = "Aucune donnée à exporter.",
  rows = 20,
}: ExportJsonDialogProps) {
  const [open, setOpen] = useState(false);

  /**
   * Si `defaultMode === "full"` mais pas de `fullFetcher`, repli sur "light"
   * (sinon on afficherait vide).
   */
  const effectiveDefaultMode: Mode =
    defaultMode === "full" && !fullFetcher ? "light" : defaultMode;

  const [mode, setMode] = useState<Mode>(effectiveDefaultMode);
  const [fullData, setFullData] = useState<unknown>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Reset à la fermeture                                            */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      setMode(effectiveDefaultMode);
      setFullData(null);
      setLoadingFull(false);
      setError(null);
    }
  }, [open, effectiveDefaultMode]);

  /* ---------------------------------------------------------------- */
  /*  Chargement du payload complet                                   */
  /*                                                                  */
  /*  ⚠️ Dépendances = [open, mode] UNIQUEMENT.                       */
  /*  Si on mettait loadingFull/fullData/fullFetcher, on aurait la     */
  /*  même boucle infinie que ImportJsonDialog : setLoadingFull(true)  */
  /*  → re-run → cleanup → cancelled = true → promesse annulée.        */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!open) return;
    if (mode !== "full" || !fullFetcher) return;

    let cancelled = false;
    setLoadingFull(true);
    setError(null);

    fullFetcher()
      .then((result) => {
        if (cancelled) return;
        setFullData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Chargement impossible.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingFull(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  /* ---------------------------------------------------------------- */
  /*  Contenu calculé                                                 */
  /* ---------------------------------------------------------------- */

  const json = useMemo(() => {
    const source = mode === "full" ? fullData : data;
    if (source === null || source === undefined) return "";
    if (Array.isArray(source) && source.length === 0) return "";
    return JSON.stringify(source, null, 2);
  }, [mode, fullData, data]);

  const isEmpty = json.length === 0;
  const showLoading = mode === "full" && loadingFull;

  /* ---------------------------------------------------------------- */
  /*  Toggle                                                          */
  /* ---------------------------------------------------------------- */

  function toggleMode() {
    if (!fullFetcher) return;
    setMode((m) => (m === "light" ? "full" : "light"));
    /* Reset des données complètes → permettra un re-fetch si on revient. */
    if (mode === "full") {
      setFullData(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Rendu                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Toggle "Inclure les dépendances" */}
        {fullFetcher && (
          <button
            type="button"
            onClick={toggleMode}
            disabled={loadingFull}
            aria-pressed={mode === "full"}
            className={[
              "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "full"
                ? "border-chart-1/40 bg-chart-1/10 text-chart-1"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
              loadingFull && "cursor-wait opacity-60",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {loadingFull ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            )}
            {mode === "full" ? "Dépendances incluses" : fullToggleLabel}
          </button>
        )}

        {/* Contenu JSON */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {showLoading ? (
            <div className="flex items-center justify-center rounded-md border border-dashed bg-muted/20 p-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2
                  className="h-5 w-5 animate-spin text-muted-foreground"
                  aria-hidden
                />
                <p className="text-xs italic text-muted-foreground">
                  Chargement des dépendances…
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <p className="text-xs leading-relaxed text-destructive">
                {error}
              </p>
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center rounded-md border border-dashed bg-muted/20 p-8">
              <p className="text-xs italic text-muted-foreground">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <Textarea
              value={json}
              readOnly
              rows={rows}
              spellCheck={false}
              className="font-mono text-xs leading-relaxed"
            />
          )}
        </div>

        {/* Pied — copie déléguée à CopyJsonButton */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t pt-4">
          <span className="font-mono text-[10px] text-muted-foreground">
            {json.length.toLocaleString()} caractères
          </span>
          <CopyJsonButton
            value={json}
            label="Copier le JSON"
            toastLabel="JSON copié dans le presse-papiers"
            disabled={isEmpty || showLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}