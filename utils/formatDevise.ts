/*
path :           lib/utils/formatDevise.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Formatage des nombres, devises et pourcentages en français. Supporte
                 plusieurs devises avec leurs règles propres (EUR 2 décimales, COP 0
                 décimale, USD 2 décimales). Les valeurs stockées sont des ENTIERS en
                 unités (pas en centimes) ; l'affichage ajoute les décimales selon la
                 devise.
flow:            formatNumber(1200) → "1 200" ; formatCurrency(49, { currency: "EUR" }) →
                 "49,00 €" ; formatCurrency(4999, { currency: "COP" }) → "4 999 COP" ;
                 formatPercent(0.42) → "42 %" ; formatPoints(21) → "21 pts".
ecosystem:       Utils = [
                   "@/lib/utils/slugify.ts",
                   "@/lib/utils/initials.ts",
                   "@/lib/utils/date.ts",
                   "@/lib/utils/path.ts",
                   "@/lib/utils/keywords.ts",
                   "@/lib/utils/formatDevise.ts",
                   "@/lib/utils/id.ts",
                   "@/lib/utils/normalizeToLowercase.ts",
                 ]
relatedFiles:    ["@/components/sprint/SprintCard.tsx",
                  "@/app/user/project/[slug]/sprint/[sprintSlug]/page.tsx"]
imports:         ["paramètres reçus : formatNumber(value: number | null | undefined)",
                  "                   formatCurrency(value: number | null | undefined, options?: FormatCurrencyOptions)",]
exports:         ["SUPPORTED_CURRENCIES", "SupportedCurrency",
                  "formatNumber", "formatCurrency", "formatPercent", "formatPoints"]
useBy:           ["@/components/sprint/SprintCard.tsx",
                  "@/app/user/project/[slug]/sprint/[sprintSlug]/page.tsx"]

userStories:     ["*en tant que développeur je veux formater des nombres et devises"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Devises supportées                                                 */
/* ------------------------------------------------------------------ */

/**
 * Devises gérées par formatCurrency.
 * Pour ajouter une devise : ajouter son code ici + une entrée dans
 * CURRENCY_CONFIG ci-dessous. Aucune autre modification nécessaire.
 */
export const SUPPORTED_CURRENCIES = ["EUR", "COP", "USD", "GBP"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type CurrencyConfig = {
  /** Nombre de décimales affichées à l'écran. */
  readonly fractionDigits: number;
  /** "symbol" → "€" ; "code" → "COP" ; "name" → "euros". */
  readonly currencyDisplay: "symbol" | "code" | "name";
};

const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyConfig> = {
  EUR: { fractionDigits: 2, currencyDisplay: "symbol" },
  COP: { fractionDigits: 0, currencyDisplay: "code" },
  USD: { fractionDigits: 2, currencyDisplay: "symbol" },
  GBP: { fractionDigits: 2, currencyDisplay: "symbol" },
};

/* ------------------------------------------------------------------ */
/*  Nombres                                                            */
/* ------------------------------------------------------------------ */

/** 1200 → "1 200" ; 1200.5 → "1 200,5" ; null → "—". */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

/* ------------------------------------------------------------------ */
/*  Devises                                                            */
/* ------------------------------------------------------------------ */

export type FormatCurrencyOptions = {
  /** Code de devise. Défaut : "EUR". */
  readonly currency?: SupportedCurrency;
  /** true → "1,2 k€" au-delà de 1000. */
  readonly compact?: boolean;
};

/**
 * Formate un montant en unités (pas en centimes).
 *
 * - La locale reste "fr-FR" pour tous : espaces comme séparateurs de milliers,
 *   virgule comme séparateur décimal.
 * - Le nombre de décimales est FORCÉ selon la devise (EUR = 2, COP = 0),
 *   indépendamment de la convention ISO 4217 pour éviter les surprises.
 *
 * @example
 *   formatCurrency(49)                        → "49,00 €"
 *   formatCurrency(49, { currency: "EUR" })   → "49,00 €"
 *   formatCurrency(4999, { currency: "COP" }) → "4 999 COP"
 *   formatCurrency(1200, { currency: "EUR", compact: true }) → "1,2 k€"
 *   formatCurrency(null)                      → "—"
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: FormatCurrencyOptions,
): string {
  if (value === null || value === undefined) return "—";

  const currency: SupportedCurrency = options?.currency ?? "EUR";
  const config = CURRENCY_CONFIG[currency];

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: config.currencyDisplay,
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
    notation: options?.compact ? "compact" : "standard",
  }).format(value);
}

/* ------------------------------------------------------------------ */
/*  Pourcentages                                                       */
/* ------------------------------------------------------------------ */

/** 0.42 → "42 %" ; 0.425 → "42,5 %" ; null → "—". */
export function formatPercent(
  ratio: number | null | undefined,
  fractionDigits = 0,
): string {
  if (ratio === null || ratio === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

/* ------------------------------------------------------------------ */
/*  Points (story points, vélocité, capacité)                          */
/* ------------------------------------------------------------------ */

/** 21 → "21 pts" ; 1 → "1 pt" ; null → "—". */
export function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value} pt${value > 1 ? "s" : ""}`;
}
