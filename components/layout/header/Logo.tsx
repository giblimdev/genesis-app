/*
path :           components/layout/header/Logo.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Logo de l'application Genesis : icône Sparkles dans un carré en dégradé
                 (chart-1 → chart-2) + wordmark "Genesis". Sert de lien vers l'accueil.
flow:            Server Component → rend un <Link> vers "/" contenant l'icône (carré
                 dégradé) et le texte "Genesis". Aucun état, aucune interactivité
                 au-delà du survol CSS.
ecosystem:       Layout = [
                   "@/app/layout.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/mainNavData.ts",
                   "@/components/layout/header/UserMenu.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/Header.tsx"]
imports:         ["next/link", "lucide-react"]
exports:         ["default Logo"]
useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*auto-layout-logo"]
status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="Genesis — Accueil"
      className="group inline-flex items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Genesis
      </span>
    </Link>
  );
}
