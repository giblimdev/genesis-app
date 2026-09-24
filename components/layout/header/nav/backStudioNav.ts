/*
path :           src/components/layout/header/nav/backStudioNav.ts
projectId:       <à fournir>
type:            config
generic:         false

role:            Données de navigation de la section Back-Studio. Help Dev
                 expose un sous-menu : Cmd (référence GitHub CLI / Prisma)
                 et Palette (charte graphique). Les autres items sont des
                 liens directs.

flow:            Importé par Header.tsx (variant "backStudio").

ecosystem:       Layout = [
                   "@/src/components/layout/header/navTypes.ts",
                   "@/src/components/layout/header/nav/mainNavData.ts",
                   "@/src/components/layout/header/nav/backStudioNav.ts",
                   "@/src/components/layout/header/MainNav.tsx",
                   "@/src/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/src/components/layout/header/navTypes.ts",
                  "@/src/components/layout/header/Header.tsx"]
imports:         ["@/src/components/layout/header/navTypes"]
exports:         ["backStudioNav"]
useBy:           ["@/src/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux naviguer dans les outils back-studio",
                  "*en tant que développeur je veux accéder aux sous-pages de Help Dev"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { NavItem } from "../navTypes";

export const backStudioNav: readonly NavItem[] = [
  {
    id: "bs-home",
    label: "Back-Studio",
    href: "/back-studio",
    displayOrder: 10,
    visible: true,
  },
  {
    id: "bs-scrum",
    label: "Scrum",
    href: "/back-studio/scrum",
    description: "Projets, features, personas, backlog, sprints",
    displayOrder: 20,
    visible: true,
  },
  {
    id: "bs-export-ia",
    label: "Export IA",
    href: "/back-studio/exportToIA",
    description: "Exporter le contexte projet",
    displayOrder: 30,
    visible: true,
  },
  {
    id: "bs-help-dev",
    label: "Help Dev",
    href: "/back-studio/help-dev",
    description: "Référence CLI, libs, polices, icônes",
    displayOrder: 40,
    visible: true,
    children: [
      {
        id: "bs-help-dev-cmd",
        label: "Cmd",
        href: "/back-studio/help-dev/cmd",
        description: "Commandes GitHub CLI et Prisma",
        displayOrder: 10,
        visible: true,
      },
      {
        id: "bs-help-dev-prompt-maker",
        label: "Prompt Maker",
        href: "/back-studio/help-dev/prompt",
        description: "Commandes GitHub CLI et Prisma",
        displayOrder: 20,
        visible: true,
      },
      {
        id: "bs-help-dev-theme-maker",
        label: "Theme Maker",
        href: "/back-studio/help-dev/thema",
        description: "Commandes GitHub CLI et Prisma",
        displayOrder: 30,
        visible: true,
      },
    ],
  },
  {
    id: "bs-save-app",
    label: "Save App",
    href: "/back-studio/saveApp",
    description: "Scanner, filtrer et exporter une sélection de fichiers",
    displayOrder: 50,
    visible: true,
  },
  {
    id: "bs-creat-files",
    label: "CreatFiles",
    href: "/back-studio/creatFiles",
    description: "Composer et écrire un lot de fichiers",
    displayOrder: 60,
    visible: true,
  },
];
