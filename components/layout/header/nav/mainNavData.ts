/*
path :           components/layout/header/mainNavData.ts
projectId:       <à fournir>
type:            config
generic:         false

role:            Données de la navigation principale de l'application (pages métier,
                 conception, backlog, dev, r&d). Importe le type NavItem depuis navTypes.ts.
flow:            Importé par Header.tsx (variant "main") et par MainNav.tsx (défaut).
ecosystem:       Layout = [
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/mainNavData.ts",
                   "@/components/layout/header/backStudioNav.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx"]
imports:         ["@/components/layout/header/navTypes"]
exports:         ["mainNavData"]
useBy:           ["@/components/layout/header/Header.tsx",
                  "@/components/layout/header/MainNav.tsx"]

userStories:     ["*en tant que développeur je veux naviguer dans l'app"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { NavItem } from "../navTypes";

export const mainNavData: readonly NavItem[] = [
  {
    id: "nav-home",
    label: "Accueil",
    href: "/",
    displayOrder: 10,
    visible: true,
  },
  {
    id: "nav-genesis",
    label: "R&D",
    href: "/back-studio",
    description: "Conception et développement de projet",
    displayOrder: 30,
    visible: true,
    children: [
      {
        id: "bs-export-ia",
        label: "Export IA",
        href: "/back-studio/ExportToIA",
        description: "Exporter le contexte projet",
        displayOrder: 20,
        visible: true,
      },
      {
        id: "bs-palette",
        label: "Palette",
        href: "/back-studio/help-dev",
        description: "Palette Tailwind de référence",
        displayOrder: 30,
        visible: true,
      },
      {
        id: "bs-devtools",
        label: "DevTools",
        href: "/back-studio/saveApp",
        description: "Outils de développement",
        displayOrder: 40,
        visible: true,
      },
    ],
  },
];
