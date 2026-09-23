/*
path :           components/layout/header/backStudioNav.ts
projectId:       <à fournir>
type:            config
generic:         false

role:            Données de navigation de la section Back-Studio (outils internes : Scrum,
                 DevTools, Export IA, Palette, Cmd…). Importe le type NavItem depuis
                 navTypes.ts.
flow:            Importé par Header.tsx (variant "backStudio").
ecosystem:       Layout = [
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/mainNavData.ts",
                   "@/components/layout/header/backStudioNav.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/Header.tsx"]
imports:         ["@/components/layout/header/navTypes"]
exports:         ["backStudioNav"]
useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux naviguer dans les outils back-studio"]
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
