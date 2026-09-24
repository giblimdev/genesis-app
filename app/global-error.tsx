/*
path :           app/global-error.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Error boundary RACINE de l'application. Capture les erreurs
                 survenues dans le root layout lui-même (ThemeProvider,
                 TooltipProvider, Toaster, Header). Remplace entièrement le
                 layout : doit fournir <html> et <body>. Utilise uniquement
                 des styles inline — globals.css et Tailwind peuvent ne pas
                 être disponibles à ce niveau.

flow:            Client Component → rend <html><body> avec styles inline →
                 pastille destructive, titre, description, digest optionnel,
                 bouton « Recharger la page » qui appelle reset().

ecosystem:       AppShell = [
                   "@/app/layout.tsx",
                   "@/app/loading.tsx",
                   "@/app/error.tsx",
                   "@/app/not-found.tsx",
                   "@/app/global-error.tsx",
                   "@/app/template.tsx",
                   "@/app/default.tsx",
                 ]
relatedFiles:    ["@/app/layout.tsx"]
imports:         ["lucide-react"]
exports:         ["default GlobalError"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux un filet de sécurité racine"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : error boundary racine Next.js, doit être un
// Client Component. Styles inline volontaires — les styles globaux peuvent
// ne pas être chargés si le root layout a crashé.

import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#0f0f10",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center",
          }}
        >
          {/* Pastille erreur */}
          <span
            aria-hidden
            style={{
              display: "grid",
              placeItems: "center",
              width: "4rem",
              height: "4rem",
              borderRadius: "1rem",
              background: "rgba(220, 38, 38, 0.10)",
              color: "#dc2626",
            }}
          >
            <AlertOctagon size={28} />
          </span>

          {/* Texte */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Erreur critique
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "#52525b",
              }}
            >
              L&apos;application a rencontré une erreur au niveau racine.
              Recharge la page pour réessayer.
            </p>
          </div>

          {/* Digest */}
          {error.digest && (
            <code
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.625rem",
                padding: "0.25rem 0.625rem",
                borderRadius: "0.375rem",
                background: "#f4f4f5",
                color: "#52525b",
              }}
            >
              {error.digest}
            </code>
          )}

          {/* Action */}
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
            Recharger la page
          </button>
        </div>
      </body>
    </html>
  );
}