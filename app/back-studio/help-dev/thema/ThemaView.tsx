/*
path :           app/back-studio/help-dev/thema/ThemaView.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Vue client de la page Token Thema. Lit les valeurs calculées
                 des design tokens depuis document.documentElement via
                 getComputedStyle, affiche chaque token sous forme de carte
                 cliquable (copie la déclaration CSS), et propose un toggle
                 clair/sombre synchronisé avec next-themes. Affiche aussi une
                 section « À ajouter » listant les tokens sémantiques manquants
                 (success, warning, info, overlay, selection, disabled, code,
                 hover-surface, locked) et un aperçu composé (carte, boutons,
                 badges, alerte). Une action « Copier tous les tokens » produit
                 un bloc CSS complet, prêt à coller dans un fichier de thème.

flow:            Client Component → useEffect lit tous les tokens depuis
                 getComputedStyle(root) + MutationObserver sur l'attribut class
                 pour relire à chaque changement de thème → rend les groupes en
                 grilles de <TokenCard />. TokenCard copie
                 `--name: <valeur>;` au clic. Le bouton « Copier tous les
                 tokens » assemble un bloc CSS :root { … } avec tous les tokens
                 définis.

ecosystem:       DevHelp = [
                   "@/app/back-studio/help-dev/cmd/page.tsx",
                   "@/app/back-studio/help-dev/page.tsx",
                   "@/app/back-studio/help-dev/prompt/PromptView.tsx",
                   "@/app/back-studio/help-dev/prompt/page.tsx",
                   "@/app/back-studio/help-dev/thema/ThemaView.tsx",
                   "@/app/back-studio/help-dev/thema/page.tsx",
                   "@/components/common/code-block.tsx",
                 ]
relatedFiles:    ["@/app/globals.css",
                  "@/app/back-studio/help-dev/thema/page.tsx"]
imports:         ["react", "next-themes", "lucide-react", "sonner",
                  "@/lib/utils",
                  "props reçues : aucune (composant autonome)"]
exports:         ["ThemaView"]
useBy:           ["@/app/back-studio/help-dev/thema/page.tsx"]

userStories:     ["*en tant que développeur je veux visualiser et copier mes tokens de thème",
                  "*en tant que développeur je veux identifier les tokens sémantiques manquants",
                  "*en tant que développeur je veux copier tous les tokens d'un coup"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TokenKind = "color" | "font" | "length";

type TokenDef = {
  readonly name: string;
  readonly role: string;
  readonly kind: TokenKind;
  /** Marque un token qui n'est pas encore défini dans globals.css. */
  readonly status?: "to-add";
};

type TokenGroup = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tokens: readonly TokenDef[];
};

/* ------------------------------------------------------------------ */
/*  Données — inventaire des tokens                                    */
/* ------------------------------------------------------------------ */

const GROUPS: readonly TokenGroup[] = [
  {
    id: "surfaces",
    title: "Surfaces",
    description: "Fonds et textes des zones principales",
    tokens: [
      { name: "--background", role: "Fond global", kind: "color" },
      { name: "--foreground", role: "Texte principal", kind: "color" },
      { name: "--card", role: "Fond des cartes", kind: "color" },
      { name: "--card-foreground", role: "Texte sur carte", kind: "color" },
      { name: "--popover", role: "Fond des menus / dropdowns", kind: "color" },
      { name: "--popover-foreground", role: "Texte sur menu", kind: "color" },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    description: "Couleurs d'action (boutons, liens actifs, hover)",
    tokens: [
      { name: "--primary", role: "Action principale", kind: "color" },
      { name: "--primary-foreground", role: "Texte sur primary", kind: "color" },
      { name: "--secondary", role: "Action secondaire", kind: "color" },
      { name: "--secondary-foreground", role: "Texte sur secondary", kind: "color" },
      { name: "--accent", role: "Surbrillance / hover de menu", kind: "color" },
      { name: "--accent-foreground", role: "Texte sur accent", kind: "color" },
    ],
  },
  {
    id: "states",
    title: "États",
    description: "Zones discrètes et erreurs",
    tokens: [
      { name: "--muted", role: "Fond discret", kind: "color" },
      { name: "--muted-foreground", role: "Texte secondaire", kind: "color" },
      { name: "--destructive", role: "Erreur / suppression", kind: "color" },
      { name: "--destructive-foreground", role: "Texte sur destructive", kind: "color" },
    ],
  },
  {
    id: "borders",
    title: "Bordures & focus",
    description: "Contours standards et focus visible",
    tokens: [
      { name: "--border", role: "Bordures standard", kind: "color" },
      { name: "--input", role: "Bordure des inputs", kind: "color" },
      { name: "--ring", role: "Focus visible (clavier)", kind: "color" },
    ],
  },
  {
    id: "accents",
    title: "Accents projet",
    description: "Palette à 10 accents utilisée par les modules, badges et cartes",
    tokens: [
      { name: "--chart-1",  role: "Violet — accent principal", kind: "color" },
      { name: "--chart-2",  role: "Cyan — accent secondaire",  kind: "color" },
      { name: "--chart-3",  role: "Amber — attention",         kind: "color" },
      { name: "--chart-4",  role: "Emerald — succès",          kind: "color" },
      { name: "--chart-5",  role: "Rose — danger léger",       kind: "color" },
      { name: "--chart-6",  role: "Blue — information",        kind: "color" },
      { name: "--chart-7",  role: "Indigo — profondeur",       kind: "color" },
      { name: "--chart-8",  role: "Fuchsia — créativité",      kind: "color" },
      { name: "--chart-9",  role: "Teal — équilibre",          kind: "color" },
      { name: "--chart-10", role: "Orange — énergie",          kind: "color" },
    ],
  },
  {
    id: "fonts",
    title: "Polices",
    description: "Tokens sémantiques réassignables par thème",
    tokens: [
      { name: "--font-body", role: "Corps (défaut : Inter)", kind: "font" },
      { name: "--font-heading", role: "Titres (défaut : Fraunces)", kind: "font" },
      { name: "--font-code", role: "Code (défaut : JetBrains Mono)", kind: "font" },
    ],
  },
  {
    id: "shape",
    title: "Forme",
    description: "Rayon global — dérive --radius-sm/md/lg/xl/2xl/3xl/4xl",
    tokens: [{ name: "--radius", role: "Rayon global", kind: "length" }],
  },
  {
    id: "sidebar",
    title: "Sidebar",
    description: "Tokens de la barre latérale (optionnels)",
    tokens: [
      { name: "--sidebar", role: "Fond sidebar", kind: "color" },
      { name: "--sidebar-foreground", role: "Texte sidebar", kind: "color" },
      { name: "--sidebar-primary", role: "Action principale sidebar", kind: "color" },
      { name: "--sidebar-primary-foreground", role: "Texte sur sidebar-primary", kind: "color" },
      { name: "--sidebar-accent", role: "Hover sidebar", kind: "color" },
      { name: "--sidebar-accent-foreground", role: "Texte sur sidebar-accent", kind: "color" },
      { name: "--sidebar-border", role: "Bordure sidebar", kind: "color" },
      { name: "--sidebar-ring", role: "Focus sidebar", kind: "color" },
    ],
  },
  {
    id: "to-add",
    title: "À ajouter",
    description:
      "Tokens sémantiques absents — aujourd'hui codés en dur (amber-500, rose-500, #0d1117, black/50…)",
    tokens: [
      { name: "--success", role: "Confirmation / écriture réussie", kind: "color", status: "to-add" },
      { name: "--success-foreground", role: "Texte sur success", kind: "color", status: "to-add" },
      { name: "--warning", role: "Avertissement non bloquant", kind: "color", status: "to-add" },
      { name: "--warning-foreground", role: "Texte sur warning", kind: "color", status: "to-add" },
      { name: "--info", role: "Information neutre", kind: "color", status: "to-add" },
      { name: "--info-foreground", role: "Texte sur info", kind: "color", status: "to-add" },
      { name: "--overlay", role: "Fond derrière les modals", kind: "color", status: "to-add" },
      { name: "--selection", role: "Fond de sélection texte", kind: "color", status: "to-add" },
      { name: "--selection-foreground", role: "Texte sélectionné", kind: "color", status: "to-add" },
      { name: "--disabled", role: "Éléments désactivés", kind: "color", status: "to-add" },
      { name: "--disabled-foreground", role: "Texte désactivé", kind: "color", status: "to-add" },
      { name: "--hover-surface", role: "Survol neutre (lignes, cartes)", kind: "color", status: "to-add" },
      { name: "--code-background", role: "Fond des blocs de code", kind: "color", status: "to-add" },
      { name: "--code-foreground", role: "Texte des blocs de code", kind: "color", status: "to-add" },
      { name: "--locked", role: "État verrouillé (sprint)", kind: "color", status: "to-add" },
    ],
  },
];

/** Liste plate — pratique pour la lecture des valeurs. */
const ALL_TOKENS: readonly TokenDef[] = GROUPS.flatMap((g) => g.tokens);

/* ------------------------------------------------------------------ */
/*  Helper — copie presse-papiers avec fallback execCommand            */
/* ------------------------------------------------------------------ */

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export function ThemaView() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copyingAll, setCopyingAll] = useState(false);

  /* Attend le montage pour éviter tout écart d'hydratation. */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Lit les valeurs calculées + observe les changements de thème. */
  useEffect(() => {
    if (!mounted) return;

    function readAll() {
      const cs = getComputedStyle(document.documentElement);
      const next: Record<string, string> = {};
      for (const t of ALL_TOKENS) {
        next[t.name] = cs.getPropertyValue(t.name).trim();
      }
      setValues(next);
    }

    readAll();

    const observer = new MutationObserver(readAll);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [mounted, resolvedTheme]);

  const isDark = mounted && resolvedTheme === "dark";

  /* Bloc CSS complet des tokens définis (hors "to-add"). */
  const allTokensCss = useMemo(() => {
    const lines: string[] = [];
    for (const group of GROUPS) {
      if (group.id === "to-add") continue;
      for (const t of group.tokens) {
        const v = values[t.name];
        if (!v) continue;
        lines.push(`  ${t.name}: ${v};`);
      }
    }
    return `:root {\n${lines.join("\n")}\n}`;
  }, [values]);

  async function handleCopyAll() {
    if (allTokensCss.trim().length === 0) {
      toast.error("Aucun token à copier.");
      return;
    }
    setCopyingAll(true);
    try {
      await copyToClipboard(allTokensCss);
      toast.success("Tous les tokens copiés", {
        description: `${allTokensCss.length.toLocaleString()} caractères dans le presse-papiers.`,
      });
    } catch {
      toast.error("Copie impossible.");
    } finally {
      window.setTimeout(() => setCopyingAll(false), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ============================ Toggle thème ============================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">
          Les valeurs ci-dessous sont lues en direct depuis le thème{" "}
          <span className="font-mono font-semibold text-foreground">
            {mounted ? (isDark ? "dark" : "light") : "…"}
          </span>
          .
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copier tous les tokens */}
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={!mounted || copyingAll}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              copyingAll
                ? "border-chart-4/30 bg-chart-4/10 text-chart-4"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
            )}
          >
            {copyingAll ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copier tous les tokens
              </>
            )}
          </button>

          {/* Toggle thème */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            disabled={!mounted}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5" aria-hidden />
                Passer en clair
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" aria-hidden />
                Passer en sombre
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================ Groupes ============================ */}
      {GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {group.title}
              </h2>
              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {group.tokens.length}
              </span>
              {group.id === "to-add" && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  à ajouter
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {group.tokens.map((token) => (
              <TokenCard
                key={token.name}
                token={token}
                value={values[token.name]}
              />
            ))}
          </div>
        </section>
      ))}

      {/* ============================ Aperçu appliqué ============================ */}
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Aperçu appliqué
          </h2>
          <p className="text-xs text-muted-foreground">
            Composition des tokens dans une mini-UI (typographie, boutons,
            badges, alerte).
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Carte typographique */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Titre en{" "}
              <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-transparent">
                font-heading
              </span>
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Paragraphe en <strong>font-body</strong>. Le texte secondaire
              utilise <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">--muted-foreground</code>{" "}
              pour rester discret tout en gardant un contraste lisible.
            </p>
            <pre className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-[11px] text-foreground/90">
{`const genesis = {
  project: "Genesis",
  tokens: 54,
};`}
            </pre>
            <div className="flex flex-wrap gap-2 pt-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-110">
                Primary
              </button>
              <button className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground transition hover:brightness-95">
                Secondary
              </button>
              <button className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted">
                Outline
              </button>
              <button className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition hover:brightness-110">
                Destructive
              </button>
            </div>
          </div>

          {/* Badges + alerte */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    i === 1 && "border-chart-1/30 bg-chart-1/10 text-chart-1",
                    i === 2 && "border-chart-2/30 bg-chart-2/10 text-chart-2",
                    i === 3 && "border-chart-3/30 bg-chart-3/10 text-chart-3",
                    i === 4 && "border-chart-4/30 bg-chart-4/10 text-chart-4",
                    i === 5 && "border-chart-5/30 bg-chart-5/10 text-chart-5",
                    i === 6 && "border-chart-6/30 bg-chart-6/10 text-chart-6",
                    i === 7 && "border-chart-7/30 bg-chart-7/10 text-chart-7",
                    i === 8 && "border-chart-8/30 bg-chart-8/10 text-chart-8",
                    i === 9 && "border-chart-9/30 bg-chart-9/10 text-chart-9",
                    i === 10 && "border-chart-10/30 bg-chart-10/10 text-chart-10",
                  )}
                >
                  chart-{i}
                </span>
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-destructive" />
              <p className="text-xs leading-relaxed text-destructive">
                Alerte destructive — utilise <code>--destructive</code> et{" "}
                <code>--destructive-foreground</code>.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" />
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                Cette alerte devrait utiliser{" "}
                <code>--warning</code> une fois le token ajouté.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Note neutre — <code>--muted</code> + <code>--muted-foreground</code>.
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2 pt-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                66 %
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte de token                                                     */
/* ------------------------------------------------------------------ */

function TokenCard({
  token,
  value,
}: {
  token: TokenDef;
  value: string | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const isMissing = token.status === "to-add" || !value;

  async function handleCopy() {
    const declaration = isMissing
      ? `${token.name}: <valeur>;`
      : `${token.name}: ${value};`;
    try {
      await copyToClipboard(declaration);
      setCopied(true);
      toast.success(`Copié — ${token.name}`, {
        description: declaration,
      });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copier ${token.name}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-card p-3 text-left transition-colors",
        isMissing
          ? "border-dashed border-amber-500/40 bg-amber-500/[0.03] hover:border-amber-500/60"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* ---------- Prévisualisation ---------- */}
      <TokenPreview token={token} />

      {/* ---------- Métadonnées ---------- */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-xs font-semibold text-foreground">
            {token.name}
          </span>
          <span
            className={cn(
              "shrink-0 text-muted-foreground transition-opacity",
              copied ? "opacity-100 text-chart-4" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
          </span>
        </div>

        <span className="truncate text-[10px] text-muted-foreground">
          {token.role}
        </span>

        <span
          className={cn(
            "mt-1 truncate font-mono text-[10px]",
            isMissing
              ? "italic text-amber-700 dark:text-amber-400"
              : "text-muted-foreground/70",
          )}
          title={isMissing ? "Token non défini" : value}
        >
          {isMissing ? "— à définir —" : value}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Aperçu d'un token                                                  */
/* ------------------------------------------------------------------ */

function TokenPreview({ token }: { token: TokenDef }) {
  const isMissing = token.status === "to-add";

  if (token.kind === "font") {
    return (
      <div
        className="grid h-16 place-items-center rounded-lg border border-border/60 bg-muted/30"
        style={{ fontFamily: `var(${token.name})` }}
      >
        <span className="text-lg font-semibold text-foreground">
          Aa Bb 123
        </span>
      </div>
    );
  }

  if (token.kind === "length") {
    return (
      <div className="grid h-16 place-items-center rounded-lg border border-border/60 bg-muted/30">
        <div
          className="h-10 w-10 bg-gradient-to-br from-chart-1 to-chart-2"
          style={{ borderRadius: `var(${token.name}, 0.625rem)` }}
        />
      </div>
    );
  }

  /* color */
  return (
    <div className="relative h-16 w-full overflow-hidden rounded-lg border border-border/60">
      <div
        className="absolute inset-0"
        style={{ background: `var(${token.name})` }}
        aria-hidden
      />
      {isMissing && (
        <div
          aria-hidden
          className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_8px,rgba(251,191,36,0.12)_8px_16px)]"
        />
      )}
    </div>
  );
}