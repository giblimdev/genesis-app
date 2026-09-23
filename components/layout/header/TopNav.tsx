/*
path :           components/layout/header/MainNav.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Navigation principale desktop. Affiche les items passés en prop (ou
                 mainNavData par défaut), triés par displayOrder, avec sous-menus au survol.
flow:            Client Component → useMemo trie et filtre les items → rend chaque item via
                 <NavItemRow>. usePathname détecte l'état actif. Récursif pour les sous-niveaux.
ecosystem:       Layout = [
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/mainNavData.ts",
                   "@/components/layout/header/backStudioNav.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/mainNavData.ts",
                  "@/components/layout/header/Header.tsx"]
imports:         ["react", "next/link", "next/navigation", "lucide-react",
                  "@/components/layout/header/navTypes",
                  "@/components/layout/header/mainNavData"]
exports:         ["default MainNav", "MainNavProps"]
useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux une nav desktop paramétrable"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : usePathname + useMemo + interactions au survol/clavier.

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";

import type { NavItem } from "./navTypes";
import { mainNavData } from "./nav/mainNavData";

function isHrefActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavItemRowProps {
  readonly item: NavItem;
}

function NavItemRow({ item }: NavItemRowProps) {
  const pathname = usePathname();
  const isActive = isHrefActive(pathname, item.href);

  const sortedChildren = useMemo(() => {
    if (!item.children) return [];
    return [...item.children]
      .filter((child) => child.visible !== false)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [item.children]);

  const hasChildren = sortedChildren.length > 0;

  const childrenList = hasChildren ? (
    <ul
      role="menu"
      className="invisible absolute left-0 top-full z-50 mt-1 min-w-[220px] translate-y-1 rounded-lg border border-border bg-popover p-1.5 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      {sortedChildren.map((child) => (
        <li key={child.id} role="none">
          {child.href ? (
            <Link
              href={child.href}
              role="menuitem"
              target={child.external ? "_blank" : undefined}
              rel={child.external ? "noopener noreferrer" : undefined}
              className={
                isHrefActive(pathname, child.href)
                  ? "flex items-start gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-sm text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "flex items-start gap-2 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              }
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-medium">{child.label}</span>
                {child.description && (
                  <span className="text-xs text-muted-foreground">
                    {child.description}
                  </span>
                )}
              </span>
              {child.external && (
                <ExternalLink
                  className="mt-0.5 h-3 w-3 shrink-0 opacity-60"
                  aria-hidden
                />
              )}
            </Link>
          ) : (
            <span className="block rounded-md px-2.5 py-2 text-sm text-muted-foreground">
              {child.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  ) : null;

  const commonClasses = isActive
    ? "inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    : "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <li className={hasChildren ? "group relative" : "relative"}>
      {item.href ? (
        <Link
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          className={commonClasses}
          aria-current={isActive ? "page" : undefined}
        >
          {item.label}
          {item.external && (
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          )}
          {hasChildren && (
            <ChevronDown
              className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180"
              aria-hidden
            />
          )}
        </Link>
      ) : (
        <button
          type="button"
          className={commonClasses}
          disabled={item.disabled}
          aria-haspopup={hasChildren ? "menu" : undefined}
        >
          {item.label}
          {hasChildren && (
            <ChevronDown
              className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180"
              aria-hidden
            />
          )}
        </button>
      )}

      {childrenList}
    </li>
  );
}

export type MainNavProps = {
  readonly items?: readonly NavItem[];
};

export default function MainNav({ items = mainNavData }: MainNavProps = {}) {
  const sortedItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.visible !== false)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [items],
  );

  return (
    <nav aria-label="Navigation principale" className="hidden md:block">
      <ul className="flex items-center gap-0.5">
        {sortedItems.map((item) => (
          <NavItemRow key={item.id} item={item} />
        ))}
      </ul>
    </nav>
  );
}
