/*
path :           lib/design/accents.ts
projectId:       <à fournir>
type :           helper
generic:         true

role:            Source unique de vérité pour les 10 accents projet. Exporte
                 la liste canonique, le type ProjectAccent, et TOUS les
                 mappings accent → classes Tailwind (dot, ring, bar, tag,
                 icon, glow, bullet, hover, before). Aucun composant, aucune
                 action, aucun schéma de validation ne doit redéfinir une
                 liste d'accents ou un mapping de classes : tout passe par
                 ce fichier.

flow:            Module TypeScript pur → export de constantes et de types.
                 Aucun runtime, aucun effet, aucune dépendance.

ecosystem:       DesignSystem = [
                   "@/lib/design/accents.ts",
                   "@/components/common/AccentPicker.tsx",
                   "@/components/common/EmptyState.tsx",
                   "@/lib/validations/feature.ts",
                   "@/lib/validations/persona.ts",
                   "@/lib/validations/sprint.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/app/globals.css",
                  "@/components/common/AccentPicker.tsx",
                  "@/components/common/EmptyState.tsx",
                  "@/components/feature/FeatureCard.tsx",
                  "@/components/persona/PersonaCard.tsx",
                  "@/components/sprint/SprintCard.tsx",
                  "@/components/common/TailwindPalette.tsx"]
imports:         []
exports:         ["PROJECT_ACCENTS", "ProjectAccent",
                  "ACCENT_DOT_CLASS", "ACCENT_RING_CLASS", "ACCENT_BAR_CLASS",
                  "ACCENT_BAR_BEFORE_CLASS", "ACCENT_TAG_CLASS",
                  "ACCENT_ICON_BG_CLASS", "ACCENT_ICON_BG_STRONG_CLASS",
                  "ACCENT_GLOW_CLASS", "ACCENT_RING_SOFT_CLASS",
                  "ACCENT_BULLET_CLASS", "ACCENT_HOVER_BORDER_CLASS"]
useBy:           ["@/components/common/AccentPicker.tsx",
                  "@/components/common/EmptyState.tsx",
                  "@/lib/validations/feature.ts",
                  "@/lib/validations/persona.ts",
                  "@/lib/validations/sprint.ts",
                  "@/lib/validations/user-story.ts",
                  "@/components/feature/FeatureCard.tsx",
                  "@/components/persona/PersonaCard.tsx",
                  "@/components/sprint/SprintCard.tsx"]

userStories:     ["*en tant que développeur je veux une source unique des accents",
                  "*en tant que développeur je veux ajouter un accent en touchant un seul fichier"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Liste canonique                                                    */
/* ------------------------------------------------------------------ */

/**
 * Les 10 accents disponibles. L'ordre est significatif : il pilote
 * l'ordre d'affichage dans AccentPicker et dans la palette.
 *
 * Chaque accent correspond au token CSS `--chart-N` (voir globals.css).
 *   1 : violet   2 : cyan     3 : amber   4 : emerald   5 : rose
 *   6 : blue     7 : indigo   8 : fuchsia 9 : teal     10 : orange
 */
export const PROJECT_ACCENTS = [
  "violet",
  "cyan",
  "amber",
  "emerald",
  "rose",
  "blue",
  "indigo",
  "fuchsia",
  "teal",
  "orange",
] as const;

export type ProjectAccent = (typeof PROJECT_ACCENTS)[number];

/* ------------------------------------------------------------------ */
/*  Mappings accent → classes Tailwind                                 */
/*  Toutes les classes sont écrites en clair pour que le JIT Tailwind  */
/*  v4 les détecte. Aucun template literal autorisé ici.               */
/* ------------------------------------------------------------------ */

/** Pastille de couleur pleine (AccentPicker, bullets). */
export const ACCENT_DOT_CLASS: Record<ProjectAccent, string> = {
  violet: "bg-chart-1",
  cyan: "bg-chart-2",
  amber: "bg-chart-3",
  emerald: "bg-chart-4",
  rose: "bg-chart-5",
  blue: "bg-chart-6",
  indigo: "bg-chart-7",
  fuchsia: "bg-chart-8",
  teal: "bg-chart-9",
  orange: "bg-chart-10",
};

/** Ring focus pour le bouton actif de l'AccentPicker. */
export const ACCENT_RING_CLASS: Record<ProjectAccent, string> = {
  violet: "ring-chart-1/40",
  cyan: "ring-chart-2/40",
  amber: "ring-chart-3/40",
  emerald: "ring-chart-4/40",
  rose: "ring-chart-5/40",
  blue: "ring-chart-6/40",
  indigo: "ring-chart-7/40",
  fuchsia: "ring-chart-8/40",
  teal: "ring-chart-9/40",
  orange: "ring-chart-10/40",
};

/** Barre latérale pleine (PersonaCard). */
export const ACCENT_BAR_CLASS: Record<ProjectAccent, string> = {
  violet: "bg-chart-1",
  cyan: "bg-chart-2",
  amber: "bg-chart-3",
  emerald: "bg-chart-4",
  rose: "bg-chart-5",
  blue: "bg-chart-6",
  indigo: "bg-chart-7",
  fuchsia: "bg-chart-8",
  teal: "bg-chart-9",
  orange: "bg-chart-10",
};

/** Barre latérale via pseudo-élément before (FeatureCard, SprintCard). */
export const ACCENT_BAR_BEFORE_CLASS: Record<ProjectAccent, string> = {
  violet: "before:bg-chart-1",
  cyan: "before:bg-chart-2",
  amber: "before:bg-chart-3",
  emerald: "before:bg-chart-4",
  rose: "before:bg-chart-5",
  blue: "before:bg-chart-6",
  indigo: "before:bg-chart-7",
  fuchsia: "before:bg-chart-8",
  teal: "before:bg-chart-9",
  orange: "before:bg-chart-10",
};

/** Badge / tag coloré discret (PersonaCard mots-clés). */
export const ACCENT_TAG_CLASS: Record<ProjectAccent, string> = {
  violet: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  cyan: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  amber: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  emerald: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  rose: "border-chart-5/30 bg-chart-5/10 text-chart-5",
  blue: "border-chart-6/30 bg-chart-6/10 text-chart-6",
  indigo: "border-chart-7/30 bg-chart-7/10 text-chart-7",
  fuchsia: "border-chart-8/30 bg-chart-8/10 text-chart-8",
  teal: "border-chart-9/30 bg-chart-9/10 text-chart-9",
  orange: "border-chart-10/30 bg-chart-10/10 text-chart-10",
};

/** Pastille icon (fond léger + texte coloré + ring). */
export const ACCENT_ICON_BG_CLASS: Record<ProjectAccent, string> = {
  violet: "bg-chart-1/10 text-chart-1 ring-chart-1/20",
  cyan: "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  amber: "bg-chart-3/10 text-chart-3 ring-chart-3/20",
  emerald: "bg-chart-4/10 text-chart-4 ring-chart-4/20",
  rose: "bg-chart-5/10 text-chart-5 ring-chart-5/20",
  blue: "bg-chart-6/10 text-chart-6 ring-chart-6/20",
  indigo: "bg-chart-7/10 text-chart-7 ring-chart-7/20",
  fuchsia: "bg-chart-8/10 text-chart-8 ring-chart-8/20",
  teal: "bg-chart-9/10 text-chart-9 ring-chart-9/20",
  orange: "bg-chart-10/10 text-chart-10 ring-chart-10/20",
};

/** Pastille icon en gradient (EmptyState). */
export const ACCENT_ICON_BG_STRONG_CLASS: Record<ProjectAccent, string> = {
  violet: "from-chart-1 to-chart-1/80 text-white",
  cyan: "from-chart-2 to-chart-2/80 text-white",
  amber: "from-chart-3 to-chart-3/80 text-white",
  emerald: "from-chart-4 to-chart-4/80 text-white",
  rose: "from-chart-5 to-chart-5/80 text-white",
  blue: "from-chart-6 to-chart-6/80 text-white",
  indigo: "from-chart-7 to-chart-7/80 text-white",
  fuchsia: "from-chart-8 to-chart-8/80 text-white",
  teal: "from-chart-9 to-chart-9/80 text-white",
  orange: "from-chart-10 to-chart-10/80 text-white",
};

/** Halo dégradé du haut (EmptyState). */
export const ACCENT_GLOW_CLASS: Record<ProjectAccent, string> = {
  violet: "from-chart-1/10 via-transparent to-transparent",
  cyan: "from-chart-2/10 via-transparent to-transparent",
  amber: "from-chart-3/10 via-transparent to-transparent",
  emerald: "from-chart-4/10 via-transparent to-transparent",
  rose: "from-chart-5/10 via-transparent to-transparent",
  blue: "from-chart-6/10 via-transparent to-transparent",
  indigo: "from-chart-7/10 via-transparent to-transparent",
  fuchsia: "from-chart-8/10 via-transparent to-transparent",
  teal: "from-chart-9/10 via-transparent to-transparent",
  orange: "from-chart-10/10 via-transparent to-transparent",
};

/** Ring léger pour la pastille icon (EmptyState). */
export const ACCENT_RING_SOFT_CLASS: Record<ProjectAccent, string> = {
  violet: "ring-chart-1/20",
  cyan: "ring-chart-2/20",
  amber: "ring-chart-3/20",
  emerald: "ring-chart-4/20",
  rose: "ring-chart-5/20",
  blue: "ring-chart-6/20",
  indigo: "ring-chart-7/20",
  fuchsia: "ring-chart-8/20",
  teal: "ring-chart-9/20",
  orange: "ring-chart-10/20",
};

/** Petit point coloré (tags, bullets). */
export const ACCENT_BULLET_CLASS: Record<ProjectAccent, string> = {
  violet: "bg-chart-1",
  cyan: "bg-chart-2",
  amber: "bg-chart-3",
  emerald: "bg-chart-4",
  rose: "bg-chart-5",
  blue: "bg-chart-6",
  indigo: "bg-chart-7",
  fuchsia: "bg-chart-8",
  teal: "bg-chart-9",
  orange: "bg-chart-10",
};

/** Hover de bordure (cartes cliquables). */
export const ACCENT_HOVER_BORDER_CLASS: Record<ProjectAccent, string> = {
  violet: "hover:border-chart-1/40",
  cyan: "hover:border-chart-2/40",
  amber: "hover:border-chart-3/40",
  emerald: "hover:border-chart-4/40",
  rose: "hover:border-chart-5/40",
  blue: "hover:border-chart-6/40",
  indigo: "hover:border-chart-7/40",
  fuchsia: "hover:border-chart-8/40",
  teal: "hover:border-chart-9/40",
  orange: "hover:border-chart-10/40",
};