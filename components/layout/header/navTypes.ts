/*
path :           components/layout/header/navTypes.ts
projectId:       <à fournir>
type:            config
generic:         true

role:            Type NavItem partagé par toutes les navigations du header (main, back-studio,
                 futures). Extrait dans un fichier dédié pour éviter tout cycle d'import entre
                 mainNavData.ts, backStudioNav.ts et les composants de navigation.
flow:            Module TypeScript pur → export du type NavItem. Aucun état, aucun effet.
ecosystem:       Layout = [
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/mainNavData.ts",
                   "@/components/layout/header/backStudioNav.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/mainNavData.ts",
                  "@/components/layout/header/backStudioNav.ts",
                  "@/components/layout/header/MainNav.tsx"]
imports:         []
exports:         ["NavItem"]
useBy:           ["@/components/layout/header/mainNavData.ts",
                  "@/components/layout/header/backStudioNav.ts",
                  "@/components/layout/header/MainNav.tsx"]

userStories:     ["*en tant que développeur je veux un type de navigation partagé"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export interface NavItem {
  /** Identifiant unique (clé React) */
  readonly id: string;
  /** Libellé affiché */
  readonly label: string;
  /** URL cible (optionnelle) */
  readonly href?: string;
  /** Description courte (aria, tooltip, sous-menus) */
  readonly description?: string;
  /** Sous-menu récursif */
  readonly children?: readonly NavItem[];
  /** Ordre d'affichage (tri croissant) */
  readonly displayOrder: number;
  /** Visible ou non (défaut : true) */
  readonly visible?: boolean;
  /** Ouvrir dans un nouvel onglet */
  readonly external?: boolean;
  /** Désactivé (affiché mais non cliquable) */
  readonly disabled?: boolean;
}
