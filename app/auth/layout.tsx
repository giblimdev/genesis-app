// src/app/auth/layout.tsx
/*
  role:           Layout commun aux pages /auth/* : panneau de marque à
                  gauche (desktop), zone formulaire à droite.

  flow:           Server Component → rend les enfants (page de login ou
                  register) au centre.

  imports:        next/link, lucide-react (Sparkles).

  ecosysteme:     Auth
*/

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 size-[28rem] rounded-full bg-orange-300/20 blur-3xl"
        />

        <Link
          href="/"
          className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Sparkles className="size-5" aria-hidden />
          </span>
          Genesis
        </Link>

        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            L&apos;atelier qui structure vos projets.
          </h2>
          <p className="text-white/80">
            Conception, planification, développement. De l&apos;idée au
            produit, toute l&apos;équipe alignée.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/70">© Genesis</p>
      </aside>

      <main className="flex flex-col items-center justify-center gap-6 bg-muted/30 p-6 sm:p-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold lg:hidden"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
            <Sparkles className="size-4" aria-hidden />
          </span>
          Genesis
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}