/*
path :           app/layout.tsx
projectId:       <à fournir>
type:            layout
generic:         false

role:            Layout racine : html/body, polices (Inter, Fraunces, JetBrains Mono),
                 ThemeProvider (clair/sombre via next-themes), TooltipProvider, Toaster,
                 Header. Les variables de police sont posées sur <html> et consommées par
                 globals.css via des tokens sémantiques (--font-body, --font-heading,
                 --font-code) qui peuvent être réassignés par thème.
flow:            Server Component → next/font/google charge les 3 polices → injecte les
                 variables CSS --font-inter, --font-fraunces, --font-jetbrains-mono sur
                 <html> → ThemeProvider → TooltipProvider → Header + {children} + Toaster.
ecosystem:       Layout = [
                   "@/app/layout.tsx",
                   "@/components/layout/header/Header.tsx",
                 ]
relatedFiles:    ["@/components/layout/header/Header.tsx",
                  "@/app/globals.css"]
imports:         ["next", "next/font/google",
                  "next-themes",
                  "@/components/ui/tooltip",
                  "@/components/ui/sonner",
                  "./globals.css",
                  "@/components/layout/header/Header"]
exports:         ["metadata", "default RootLayout"]
useBy:           []

userStories:     ["*en tant que développeur je veux un layout racine avec polices thémables"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header/Header";

/* ------------------------------------------------------------------ */
/*  Polices — variables brutes posées sur <html>                       */
/* ------------------------------------------------------------------ */

/**
 * Chaque police expose UNIQUEMENT sa variable CSS.
 * Les tokens sémantiques (--font-body, --font-heading, --font-code)
 * sont définis dans globals.css et peuvent être réassignés par thème.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: {
    default: "Genesis — Concevoir et développer votre projet numérique",
    template: "%s · Genesis",
  },
  description:
    "Genesis est l'atelier de conception et de développement pour toute l'équipe projet.",
  applicationName: "Genesis",
};

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
