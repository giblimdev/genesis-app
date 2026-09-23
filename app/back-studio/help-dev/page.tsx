/*
path :           app/back-studio/help-dev/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'aide développeur (Back-Studio) : référence centralisée des commandes CLI (Prisma, GitHub, Vercel), bibliothèques installées avec leurs commandes, polices, icônes et couleurs du design system.
flow:            Rendu statique → sections Prisma / GitHub / Vercel / Bibliothèques / Polices / Icônes / Couleurs → chaque bloc de commande est rendu via CodeBlock (copie presse-papiers).
ecosystem:       DevHelp = [
                   "@/app/back-studio/help-dev/page.tsx",
                   "@/components/dev-help/code-block.tsx",
                 ]
relatedFiles:    ["@/components/dev-help/code-block.tsx"]
imports:         ["react", "@/components/dev-help/code-block.tsx"]
exports:         ["default HelpDevPage"]
useBy:           []
userStories:     ["*en tant que développeur je veux une page de référence avec toutes les commandes et ressources du projet"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { CodeBlock } from "@/components/common/code-block";

type Section = {
  id: string;
  title: string;
  description: string;
  commands: { label: string; command: string }[];
};

const SECTIONS: Section[] = [
  {
    id: "prisma",
    title: "Prisma",
    description:
      "Migrations, génération client, seed et inspection de la base SQLite.",
    commands: [
      { label: "Générer le client", command: "npx prisma generate" },
      {
        label: "Créer une migration",
        command: "npx prisma migrate dev --name init",
      },
      { label: "Appliquer en prod", command: "npx prisma migrate deploy" },
      { label: "Reset complet", command: "npx prisma migrate reset" },
      { label: "Ouvrir Prisma Studio", command: "npx prisma studio" },
      {
        label: "Pousser le schéma sans migration",
        command: "npx prisma db push",
      },
      { label: "Seeder la base", command: "npx prisma db seed" },
      { label: "Formater le schéma", command: "npx prisma format" },
    ],
  },
  {
    id: "github",
    title: "GitHub",
    description: "Commandes Git essentielles pour le workflow quotidien.",
    commands: [
      { label: "Cloner", command: "git clone git@github.com:user/repo.git" },
      { label: "Nouvelle branche", command: "git checkout -b feat/ma-feature" },
      { label: "Commit rapide", command: 'git commit -m "feat: ajout de X"' },
      { label: "Push", command: "git push origin feat/ma-feature" },
      { label: "Rebase sur main", command: "git rebase main" },
      {
        label: "Annuler dernier commit (garder changes)",
        command: "git reset --soft HEAD~1",
      },
      { label: "Voir les branches distantes", command: "git branch -r" },
    ],
  },
  {
    id: "vercel",
    title: "Vercel",
    description: "Déploiement, logs et gestion d'environnement.",
    commands: [
      { label: "Dev local (Vercel)", command: "vercel dev" },
      { label: "Déployer en preview", command: "vercel" },
      { label: "Déployer en prod", command: "vercel --prod" },
      { label: "Voir les logs", command: "vercel logs" },
      { label: "Lister les env vars", command: "vercel env ls" },
      { label: "Ajouter une env var", command: "vercel env add MA_CLE" },
      { label: "Puller les env vars", command: "vercel env pull .env.local" },
    ],
  },
];

type Library = {
  name: string;
  version: string;
  command: string;
  role: string;
};

const LIBRARIES: Library[] = [
  {
    name: "next",
    version: "16.3.5",
    command: "npx create-next-app@latest",
    role: "Framework React full-stack",
  },
  {
    name: "react",
    version: "19.2.8",
    command: "npm i react react-dom",
    role: "UI library",
  },
  {
    name: "prisma",
    version: "7.10.0",
    command: "npm i -D prisma && npm i @prisma/client",
    role: "ORM base de données",
  },
  {
    name: "better-auth",
    version: "1.7.5",
    command: "npm i better-auth",
    role: "Auth (email, OAuth)",
  },
  {
    name: "resend",
    version: "6.28.1",
    command: "npm i resend",
    role: "Envoi d'emails",
  },
  {
    name: "react-email",
    version: "6.9.5",
    command: "npm i react-email",
    role: "Templates email React",
  },
  {
    name: "tailwindcss",
    version: "4.0.0",
    command: "npm i -D tailwindcss @tailwindcss/postcss",
    role: "CSS utilitaire",
  },
  {
    name: "shadcn",
    version: "4.21.0",
    command: "npx shadcn@latest init",
    role: "Composants UI",
  },
  {
    name: "motion",
    version: "13.4.0",
    command: "npm i motion",
    role: "Animations React",
  },
  {
    name: "zustand",
    version: "5.0.15",
    command: "npm i zustand",
    role: "State management",
  },
  {
    name: "zod",
    version: "4.6.5",
    command: "npm i zod",
    role: "Validation de schémas",
  },
  {
    name: "react-hook-form",
    version: "7.88.0",
    command: "npm i react-hook-form @hookform/resolvers",
    role: "Formulaires",
  },
  {
    name: "lucide-react",
    version: "1.47.0",
    command: "npm i lucide-react",
    role: "Icônes",
  },
  {
    name: "recharts",
    version: "3.8.0",
    command: "npm i recharts",
    role: "Graphiques",
  },
  { name: "sonner", version: "2.0.8", command: "npm i sonner", role: "Toasts" },
  {
    name: "date-fns",
    version: "4.4.0",
    command: "npm i date-fns",
    role: "Dates",
  },
  {
    name: "@dnd-kit/core",
    version: "6.3.1",
    command: "npm i @dnd-kit/core @dnd-kit/sortable",
    role: "Drag & drop",
  },
  {
    name: "@tiptap/react",
    version: "3.31.3",
    command: "npm i @tiptap/react @tiptap/starter-kit",
    role: "Éditeur riche",
  },
];

type Token = { name: string; value: string; usage: string };

const COLORS: Token[] = [
  { name: "background", value: "var(--background)", usage: "Fond principal" },
  { name: "foreground", value: "var(--foreground)", usage: "Texte principal" },
  { name: "primary", value: "var(--primary)", usage: "Couleur d'action" },
  {
    name: "primary-foreground",
    value: "var(--primary-foreground)",
    usage: "Texte sur primary",
  },
  { name: "muted", value: "var(--muted)", usage: "Fond secondaire" },
  {
    name: "muted-foreground",
    value: "var(--muted-foreground)",
    usage: "Texte discret",
  },
  { name: "accent", value: "var(--accent)", usage: "Accent UI" },
  { name: "border", value: "var(--border)", usage: "Bordures" },
  {
    name: "destructive",
    value: "var(--destructive)",
    usage: "Erreurs / danger",
  },
];

const FONTS = [
  { name: "Geist Sans", var: "--font-sans", usage: "Texte courant" },
  { name: "Geist Mono", var: "--font-mono", usage: "Code / CLI" },
  { name: "Inter (alt)", var: "--font-inter", usage: "Alternative UI" },
];

const ICONS = [
  {
    set: "lucide-react",
    command: "npm i lucide-react",
    usage: "Icônes UI générales",
  },
  {
    set: "react-icons",
    command: "npm i react-icons",
    usage: "Logos marques (GitHub, Vercel…)",
  },
  {
    set: "simple-icons",
    command: "npm i simple-icons",
    usage: "Logos de marques officiels",
  },
];

export default function HelpDevPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Back-Studio · Dev Help
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Aide développeur
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Référence centralisée : commandes CLI, bibliothèques, polices,
            icônes et design tokens.
          </p>
        </header>

        {/* CLI Sections */}
        <section className="mb-16 space-y-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Commandes CLI
          </h2>
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{section.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {section.commands.map((cmd) => (
                  <CodeBlock
                    key={cmd.command}
                    label={cmd.label}
                    code={cmd.command}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Libraries */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            Bibliothèques
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LIBRARIES.map((lib) => (
              <div
                key={lib.name}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-semibold">
                    {lib.name}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    v{lib.version}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{lib.role}</p>
                <div className="mt-4">
                  <CodeBlock label="install" code={lib.command} compact />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fonts */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            Polices
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {FONTS.map((font) => (
              <div
                key={font.name}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="text-2xl font-semibold">{font.name}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {font.var}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {font.usage}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Icons */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Icônes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ICONS.map((icon) => (
              <div
                key={icon.set}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="font-mono text-sm font-semibold">{icon.set}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {icon.usage}
                </p>
                <div className="mt-4">
                  <CodeBlock label="install" code={icon.command} compact />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            Couleurs (design tokens)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COLORS.map((color) => (
              <div
                key={color.name}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-xl border border-border"
                  style={{ background: color.value }}
                />
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold">
                    {color.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {color.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
