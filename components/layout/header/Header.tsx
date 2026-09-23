/*
path :           components/layout/header/Header.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            En-tête global de l'application. Supporte plusieurs variantes de navigation
                 (main, backStudio) sélectionnées automatiquement depuis le pathname, ou
                 forcées via la prop variant. Réutilise Logo (interne), MainNav, UserMenu.
flow:            Client Component → usePathname détecte la variante → NAV_BY_VARIANT résout
                 le jeu de données → tri/filtre → rend header sticky avec backdrop-blur,
                 menu desktop + panneau mobile.
ecosystem:       Layout = [
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/mainNavData.ts",
                   "@/components/layout/header/backStudioNav.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/mainNavData.ts",
                  "@/components/layout/header/backStudioNav.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/UserMenu.tsx",
                  "@/components/ui/button.tsx"]
imports:         ["react", "next/link", "next/navigation", "lucide-react",
                  "@/components/ui/button",
                  "@/components/layout/header/MainNav",
                  "@/components/layout/header/UserMenu",
                  "@/components/layout/header/mainNavData",
                  "@/components/layout/header/backStudioNav",
                  "@/components/layout/header/navTypes"]
exports:         ["default Header", "HeaderProps", "HeaderVariant"]
useBy:           ["@/app/layout.tsx"]

userStories:     ["*en tant que développeur je veux un header multi-sections"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState (menu mobile) + usePathname (détection de variante).

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import MainNav from "./TopNav";
import UserMenu from "./UserMenu";
import { mainNavData } from "./nav/mainNavData";
import { backStudioNav } from "./nav/backStudioNav";
import type { NavItem } from "./navTypes";

/* ------------------------------------------------------------------ */
/*  Mapping des variantes                                              */
/* ------------------------------------------------------------------ */

const NAV_BY_VARIANT = {
  main: mainNavData,
  backStudio: backStudioNav,
} as const;

export type HeaderVariant = keyof typeof NAV_BY_VARIANT;

/**
 * Détecte la variante à partir du pathname.
 * Ajouter une nouvelle section = ajouter une condition ici
 * + une entrée dans NAV_BY_VARIANT + un fichier de nav.
 */
function variantFromPath(pathname: string): HeaderVariant {
  if (pathname.startsWith("/back-studio")) return "backStudio";
  return "main";
}

/* ------------------------------------------------------------------ */
/*  Logo (interne)                                                     */
/* ------------------------------------------------------------------ */

function Logo() {
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

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type HeaderProps = {
  /** Force une variante. Si omis, détectée depuis le pathname. */
  readonly variant?: HeaderVariant;
};

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export default function Header({ variant }: HeaderProps = {}) {
  const pathname = usePathname();
  const resolvedVariant: HeaderVariant = variant ?? variantFromPath(pathname);
  const navItems: readonly NavItem[] = NAV_BY_VARIANT[resolvedVariant];

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  const sortedItems = [...navItems]
    .filter((item) => item.visible !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Zone gauche : logo + navigation desktop */}
        <div className="flex items-center gap-6">
          <Logo />
          <MainNav items={navItems} />
        </div>

        {/* Zone droite : menu utilisateur + bouton burger mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <UserMenu />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={toggleMobile}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {/* Panneau mobile */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border/60 bg-background md:hidden"
        >
          <nav
            aria-label="Navigation mobile"
            className="mx-auto max-w-6xl px-4 py-4 sm:px-6"
          >
            <ul className="flex flex-col gap-1">
              {sortedItems.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <MobileGroup item={item} onNavigate={closeMobile} />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Groupe mobile (item avec children)                                 */
/* ------------------------------------------------------------------ */

interface MobileGroupProps {
  readonly item: NavItem;
  readonly onNavigate: () => void;
}

function MobileGroup({ item, onNavigate }: MobileGroupProps) {
  const children = (item.children ?? [])
    .filter((child) => child.visible !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex flex-col">
      <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {item.label}
      </span>
      <ul className="flex flex-col gap-0.5">
        {children.map((child) => (
          <li key={child.id}>
            {child.href ? (
              <Link
                href={child.href}
                onClick={onNavigate}
                target={child.external ? "_blank" : undefined}
                rel={child.external ? "noopener noreferrer" : undefined}
                className="flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium text-foreground">
                  {child.label}
                </span>
                {child.description && (
                  <span className="text-xs text-muted-foreground">
                    {child.description}
                  </span>
                )}
              </Link>
            ) : (
              <span className="block px-3 py-2 text-sm text-muted-foreground">
                {child.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
