/*
path :           app/blog/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de documentation interne affichant le document de
                 cadrage du module Blog (version 1.0). Rend l'intégralité
                 du contenu — vue d'ensemble, mode d'emploi par rôle,
                 workflow de publication, types de blocs, taxonomies,
                 tags, médias, interactions, liste des 72 fichiers à
                 créer, ecosystem Blog, migration Prisma et ordre
                 d'exécution. Sert de référence unique avant et pendant
                 le développement du module.

flow:            Server Component → rend un sommaire cliquable puis les
                 13 sections numérotées. Chaque section utilise des
                 composants internes (SectionHeader, DocTable, DocCode,
                 DocList) pour uniformiser le rendu. Aucune donnée
                 serveur : tout est statique.

ecosystem:       Blog = [
                   "@/app/blog/page.tsx",
                 ]
relatedFiles:    ["@/components/common/Reveal.tsx",
                  "@/components/ui/button.tsx"]
imports:         ["next", "lucide-react",
                  "@/components/common/Reveal",
                  "@/components/ui/button"]
exports:         ["metadata", "default BlogPlanPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux consulter le cadrage complet du module Blog",
                  "*en tant que développeur je veux naviguer rapidement entre les sections du cadrage"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileCode2,
  FileText,
  ListChecks,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Plan — Module Blog",
  description:
    "Document de cadrage complet du module Blog : mode d'emploi, workflow, blocs typés, taxonomies, fichiers à créer.",
};

/* ------------------------------------------------------------------ */
/*  Données statiques — Sommaire                                       */
/* ------------------------------------------------------------------ */

type TocEntry = { id: string; label: string };

const TOC: readonly TocEntry[] = [
  { id: "vue-ensemble", label: "Vue d'ensemble" },
  { id: "mode-emploi", label: "Mode d'emploi" },
  { id: "workflow", label: "Workflow de publication" },
  { id: "blocs", label: "Types de contenu (blocs)" },
  { id: "taxonomies", label: "Taxonomies" },
  { id: "tags", label: "Tags" },
  { id: "medias", label: "Médias" },
  { id: "interactions", label: "Interactions" },
  { id: "fichiers", label: "Liste des fichiers" },
  { id: "ecosystem", label: "Ecosystem Blog" },
  { id: "migration", label: "Migration Prisma" },
  { id: "ordre", label: "Ordre d'exécution" },
];

/* ------------------------------------------------------------------ */
/*  Composants internes                                                */
/* ------------------------------------------------------------------ */

function DocSection({
  id,
  number,
  title,
  icon: Icon,
  children,
}: {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  readonly children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Reveal>
        <div className="flex flex-col gap-4">
          <header className="flex items-center gap-3 border-b border-border/60 pb-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Section {number}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h2>
            </div>
          </header>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90">
            {children}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function DocSubSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DocTable({
  headers,
  rows,
}: {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-muted/40">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                scope="col"
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/20">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 align-top ${
                    j === 0
                      ? "font-mono text-xs text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocCode({ code }: { readonly code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-muted/30 px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground/90">
      <code>{code}</code>
    </pre>
  );
}

function DocList({
  items,
  variant = "bullet",
}: {
  readonly items: readonly React.ReactNode[];
  readonly variant?: "bullet" | "number";
}) {
  const Tag = variant === "number" ? "ol" : "ul";
  return (
    <Tag
      className={`ml-5 flex flex-col gap-1.5 ${
        variant === "number" ? "list-decimal" : "list-disc"
      } marker:text-chart-1`}
    >
      {items.map((item, i) => (
        <li key={i} className="text-foreground/90">
          {item}
        </li>
      ))}
    </Tag>
  );
}

function InfoCallout({
  children,
  variant = "info",
}: {
  readonly children: React.ReactNode;
  readonly variant?: "info" | "warning";
}) {
  const styles =
    variant === "warning"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
      : "border-chart-1/30 bg-chart-1/5 text-foreground/90";
  return (
    <div
      className={`rounded-lg border px-4 py-2.5 text-xs leading-relaxed ${styles}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BlogPlanPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 md:py-12">
      {/* ============================================================ */}
      {/*  En-tête                                                      */}
      {/* ============================================================ */}

      <Reveal>
        <header className="flex flex-col gap-4">
          <Link
            href="/back-studio/blog"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Retour au module Blog
          </Link>

          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 text-white shadow-sm">
              <BookOpen className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Back-Studio · Blog
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Document de cadrage — Module Blog
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-chart-2/30 bg-chart-2/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-chart-2">
              Version 1.0
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400">
              À valider avant code
            </span>
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              72 fichiers · 1 migration
            </span>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Référence unique pour le développement du module éditorial de
            Genesis. Aucun script ne doit être écrit avant validation des 10
            points listés en fin de document.
          </p>
        </header>
      </Reveal>

      {/* ============================================================ */}
      {/*  Sommaire                                                     */}
      {/* ============================================================ */}

      <Reveal>
        <nav
          aria-label="Sommaire du document"
          className="rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5 text-chart-1" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sommaire
            </h2>
          </div>
          <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {TOC.map((entry, i) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="group inline-flex items-baseline gap-2 rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-mono text-[10px] text-chart-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="group-hover:underline">{entry.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Reveal>

      {/* ============================================================ */}
      {/*  1. Vue d'ensemble                                            */}
      {/* ============================================================ */}

      <DocSection
        id="vue-ensemble"
        number={1}
        title="Vue d'ensemble"
        icon={BookOpen}
      >
        <p>
          Le module Blog ajoute à Genesis une capacité éditoriale complète :
        </p>
        <DocList
          items={[
            <>
              <strong>Publication publique</strong> — articles consultables par
              tous (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                /blog
              </code>
              )
            </>,
            <>
              <strong>Rédaction privée</strong> — espace admin dans le
              Back-Studio (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                /back-studio/blog
              </code>
              )
            </>,
            <>
              <strong>Workflow modéré</strong> — brouillon → modération →
              publication
            </>,
            <>
              <strong>Contenu structuré</strong> — blocs typés (paragraphe,
              titre, code, citation, image, liste, section)
            </>,
            <>
              <strong>Taxonomie arborescente</strong> — Thèmes → Catégories →
              Sous-catégories
            </>,
            <>
              <strong>Tags transverses</strong> — mots-clés libres
            </>,
            <>
              <strong>Interactions</strong> — likes et favoris
            </>,
            <>
              <strong>Médias</strong> — upload local sur disque + URL externe
            </>,
            <>
              <strong>Corbeille</strong> — soft delete avec restauration et
              purge définitive
            </>,
          ]}
        />
      </DocSection>

      {/* ============================================================ */}
      {/*  2. Mode d'emploi                                             */}
      {/* ============================================================ */}

      <DocSection
        id="mode-emploi"
        number={2}
        title="Mode d'emploi"
        icon={FileText}
      >
        {/* 2.1 */}
        <DocSubSection title="2.1 — Visiteur (non connecté)">
          <DocTable
            headers={["Action", "Où"]}
            rows={[
              ["Parcourir la liste des articles publiés", "/blog"],
              ["Lire un article", "/blog/[slug]"],
              ["Filtrer par tag", "/blog/tag/[slug]"],
              ["Naviguer dans une taxonomie", "/blog/categorie/[...slug]"],
            ]}
          />
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs leading-relaxed">
            <p className="mb-2 font-semibold text-foreground">
              Ce que voit le visiteur :
            </p>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground marker:text-chart-1">
              <li>
                Titre, extrait, image de couverture, auteur, date de publication
              </li>
              <li>Catégorie et tags</li>
              <li>Contenu rendu (blocs typés)</li>
              <li>Temps de lecture estimé</li>
              <li>
                Bouton like (désactivé tant que non connecté → invite à se
                connecter)
              </li>
              <li>Bouton favori (idem)</li>
            </ul>
          </div>
        </DocSubSection>

        {/* 2.2 */}
        <DocSubSection title="2.2 — Utilisateur connecté (lecteur)">
          <p className="text-sm text-muted-foreground">
            En plus de ce que voit le visiteur :
          </p>
          <DocTable
            headers={["Action", "Où"]}
            rows={[
              [
                "Liker / unliker un article",
                "Bouton sur la carte ou la page détail",
              ],
              [
                "Ajouter / retirer un favori",
                "Bouton sur la carte ou la page détail",
              ],
              ["Consulter ses favoris", "/user/favorites"],
            ]}
          />
        </DocSubSection>

        {/* 2.3 */}
        <DocSubSection title="2.3 — Auteur (utilisateur connecté qui rédige)">
          <DocTable
            headers={["Action", "Où"]}
            rows={[
              [
                "Créer un article (brouillon)",
                "/back-studio/blog/articles/new",
              ],
              [
                "Éditer ses brouillons",
                "/back-studio/blog/articles/[slug]/edit",
              ],
              [
                "Soumettre à modération",
                "Bouton « Soumettre » → PENDING_MODERATION",
              ],
              ["Retirer une soumission", "Bouton « Repasser en brouillon »"],
              [
                "Corriger un article rejeté",
                "Édition → statut repasse à DRAFT",
              ],
              [
                "Demander une modification d'article publié",
                "Édition → statut PENDING_EDIT",
              ],
              [
                "Voir ses articles",
                "/back-studio/blog/articles (filtré par auteur)",
              ],
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-chart-4/30 bg-chart-4/5 px-4 py-3 text-xs leading-relaxed">
              <p className="mb-2 font-semibold text-chart-4">
                Ce que l&apos;auteur peut faire :
              </p>
              <ul className="ml-4 list-disc space-y-1 text-foreground/80 marker:text-chart-4">
                <li>Ajouter / supprimer / réordonner des blocs de contenu</li>
                <li>Uploader des images ou coller des URL externes</li>
                <li>Sélectionner une sous-catégorie (obligatoire)</li>
                <li>Ajouter des tags</li>
                <li>Définir un extrait, une image de couverture</li>
              </ul>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs leading-relaxed">
              <p className="mb-2 font-semibold text-destructive">
                Ce que l&apos;auteur ne peut pas faire :
              </p>
              <ul className="ml-4 list-disc space-y-1 text-foreground/80 marker:text-destructive">
                <li>Publier directement (sauf si aussi modérateur)</li>
                <li>Modifier un article publié sans passer par PENDING_EDIT</li>
                <li>Supprimer définitivement (seul un admin peut purger)</li>
              </ul>
            </div>
          </div>
        </DocSubSection>

        {/* 2.4 */}
        <DocSubSection title="2.4 — Modérateur (rôle OWNER, ADMIN ou MANAGER)">
          <DocTable
            headers={["Action", "Où"]}
            rows={[
              [
                "Voir tous les articles en attente",
                "/back-studio/blog/articles (filtre statut)",
              ],
              ["Publier un article", "Bouton « Publier » → PUBLISHED"],
              ["Rejeter un article", "Bouton « Rejeter » → REJECTED + motif"],
              ["Éditer n'importe quel article", "Édition directe autorisée"],
              ["Modérer les interactions", "(v2)"],
              ["Voir le dashboard", "/back-studio/blog"],
            ]}
          />
        </DocSubSection>

        {/* 2.5 */}
        <DocSubSection title="2.5 — Admin">
          <p className="text-sm text-muted-foreground">
            En plus du modérateur :
          </p>
          <DocTable
            headers={["Action", "Où"]}
            rows={[
              ["Corbeille articles", "/back-studio/blog/articles/trash"],
              ["Restaurer un article", "Bouton « Restaurer »"],
              [
                "Supprimer définitivement",
                "Bouton « Supprimer définitivement » (confirmation par slug)",
              ],
              ["Gérer les taxonomies", "/back-studio/blog/taxonomies"],
              ["Gérer les tags", "/back-studio/blog/tags"],
              ["Voir le dashboard complet", "/back-studio/blog"],
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  3. Workflow                                                  */}
      {/* ============================================================ */}

      <DocSection
        id="workflow"
        number={3}
        title="Workflow de publication"
        icon={ListChecks}
      >
        <DocSubSection title="3.1 — États d'un article">
          <DocCode
            code={`DRAFT ────────► PENDING_MODERATION ──┬──► PUBLISHED ────► PENDING_EDIT ──┬──► PUBLISHED
  ▲                                   │                                    │
  │                                   └──► REJECTED ────► DRAFT            └──► REJECTED
  │                                                                              │
  └──────────────────────────────────────────────────────────────────────────────┘`}
          />
        </DocSubSection>

        <DocSubSection title="3.2 — Matrice des transitions">
          <DocTable
            headers={["Depuis", "Vers", "Qui", "Quand"]}
            rows={[
              ["DRAFT", "DRAFT", "Auteur", "Édition libre"],
              ["DRAFT", "PENDING_MODERATION", "Auteur", "Bouton « Soumettre »"],
              ["PENDING_MODERATION", "DRAFT", "Auteur", "Bouton « Retirer »"],
              [
                "PENDING_MODERATION",
                "PUBLISHED",
                "Modérateur",
                "Bouton « Publier »",
              ],
              [
                "PENDING_MODERATION",
                "REJECTED",
                "Modérateur",
                "Bouton « Rejeter » + motif",
              ],
              ["REJECTED", "DRAFT", "Auteur", "Édition automatique"],
              [
                "PUBLISHED",
                "PENDING_EDIT",
                "Auteur",
                "Édition → demande de modif",
              ],
              ["PUBLISHED", "PUBLISHED", "Modérateur", "Édition directe"],
              ["PUBLISHED", "DRAFT", "Modérateur", "Dépublier"],
              [
                "PENDING_EDIT",
                "PUBLISHED",
                "Modérateur",
                "Validation de la modif",
              ],
              ["PENDING_EDIT", "REJECTED", "Modérateur", "Refus de la modif"],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="3.3 — Règles automatiques">
          <DocList
            items={[
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  publishedAt
                </code>{" "}
                est setté la <strong>première fois</strong> qu'un article passe
                en{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  PUBLISHED
                </code>
                . Il n'est jamais réécrit ensuite.
              </>,
              <>
                Un article <strong>PUBLISHED</strong> n'est plus visible dans la
                liste publique si{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  deletedAt
                </code>{" "}
                est non null.
              </>,
              <>
                Un article <strong>DRAFT</strong> ou{" "}
                <strong>PENDING_MODERATION</strong> n'est{" "}
                <strong>jamais</strong> visible publiquement.
              </>,
              <>
                La suppression (soft delete) d'un article{" "}
                <strong>PUBLISHED</strong> le retire immédiatement de la liste
                publique.
              </>,
              <>
                Les transitions invalides sont refusées côté Server Action avec
                un message explicite.
              </>,
            ]}
          />
        </DocSubSection>

        <DocSubSection title="3.4 — Helper assertCanModerate">
          <p className="text-sm text-muted-foreground">
            Un helper{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              lib/blog/access.ts
            </code>{" "}
            expose :
          </p>
          <DocList
            items={[
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  assertCanModerate(userId): Promise&lt;boolean&gt;
                </code>{" "}
                → vrai si l'utilisateur a un rôle <strong>OWNER</strong>,{" "}
                <strong>ADMIN</strong> ou <strong>MANAGER</strong> dans
                n'importe quel groupe actif.
              </>,
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  assertIsAuthor(articleId, userId): Promise&lt;boolean&gt;
                </code>{" "}
                → vrai si l'utilisateur est l'auteur.
              </>,
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  assertCanEdit(articleId, userId): Promise&lt;
                  {
                    "{ canEdit: boolean; canModerate: boolean; reason?: string }"
                  }
                  &gt;
                </code>{" "}
                → logique combinée.
              </>,
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  4. Types de contenu (blocs)                                  */}
      {/* ============================================================ */}

      <DocSection
        id="blocs"
        number={4}
        title="Types de contenu (blocs)"
        icon={FileCode2}
      >
        <DocSubSection title="4.1 — Migration Prisma requise">
          <p className="text-sm text-muted-foreground">
            Ajouter un champ{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              blockType
            </code>{" "}
            au modèle{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              ContentBlock
            </code>{" "}
            :
          </p>
          <DocCode
            code={`model ContentBlock {
  id           String      @id @default(cuid())
  articleId    String
  parentId     String?
  blockType    String      @default("paragraph")  // ← NOUVEAU
  contentType  ContentType @default(MARKDOWN)
  body         String
  displayOrder Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  // ... relations inchangées
}`}
          />
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              blockType
            </code>{" "}
            est un{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              String
            </code>{" "}
            (comme les autres champs catégoriels du schéma :{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              status
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              module
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              accent
            </code>
            ). Valeurs possibles :
          </p>
          <DocTable
            headers={["blockType", "Rôle", "body contient"]}
            rows={[
              ["section", "Conteneur logique", "Vide ou titre de section"],
              ["paragraph", "Paragraphe de texte", "Markdown ou HTML"],
              ["heading", "Titre H2/H3/H4", "Markdown ou HTML"],
              ["code", "Bloc de code", "Code brut + langage (JSON dans body)"],
              ["quote", "Citation", "Texte + auteur (JSON dans body)"],
              ["image", "Image", "URL + alt + légende (JSON dans body)"],
              ["list", "Liste", "Items en JSON dans body"],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="4.2 — Hiérarchie : 2 niveaux">
          <DocCode
            code={`Article
├── Section "Introduction" (blockType: section, parentId: null)
│   ├── Bloc heading (parentId: section)
│   ├── Bloc paragraph (parentId: section)
│   └── Bloc image (parentId: section)
├── Section "Mise en place" (blockType: section, parentId: null)
│   ├── Bloc paragraph (parentId: section)
│   └── Bloc code (parentId: section)
└── Bloc quote orphelin (parentId: null, blockType: quote)`}
          />
          <p className="text-sm font-semibold text-foreground">Règles :</p>
          <DocList
            items={[
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  section
                </code>{" "}
                ne peut exister qu'à la racine (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  parentId: null
                </code>
                )
              </>,
              <>
                Les autres types peuvent être à la racine ou dans une section
              </>,
              <>
                Impossible d'imbriquer une section dans une section (validation
                Zod)
              </>,
              <>
                Impossible d'imbriquer un bloc dans un bloc non-section
                (validation Zod)
              </>,
            ]}
          />
        </DocSubSection>

        <DocSubSection title="4.3 — Affichage public">
          <p className="text-sm text-muted-foreground">
            Chaque type a un rendu dédié dans{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              ContentBlockRenderer.tsx
            </code>{" "}
            :
          </p>
          <DocTable
            headers={["Type", "Rendu"]}
            rows={[
              [
                "section",
                "<section> avec titre optionnel, ancre auto (#section-slug)",
              ],
              ["paragraph", "<p> avec markdown inline (gras, italique, liens)"],
              ["heading", "<h2>, <h3> ou <h4> selon niveau"],
              [
                "code",
                "<pre><code> colorisé via Shiki (déjà en place dans lib/highlighter.ts)",
              ],
              ["quote", "<blockquote> avec auteur"],
              ["image", "<figure> + <Image> Next.js + légende"],
              ["list", "<ul> ou <ol>"],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="4.4 — Édition">
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              ContentBlockEditor.tsx
            </code>{" "}
            :
          </p>
          <DocList
            items={[
              <>
                Liste verticale des blocs avec drag & drop (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  @dnd-kit/sortable
                </code>
                )
              </>,
              <>
                Bouton « + Ajouter un bloc » entre chaque bloc (choix du type)
              </>,
              <>Bouton « + Ajouter une section » en haut et en bas</>,
              <>
                Chaque bloc a un{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  &lt;textarea&gt;
                </code>{" "}
                markdown + preview live
              </>,
              <>
                Les blocs{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  image
                </code>{" "}
                ont un bouton « Uploader » (route API) ou « Coller une URL »
              </>,
              <>
                Les blocs{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  code
                </code>{" "}
                ont un sélecteur de langage
              </>,
              <>
                Les blocs{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  quote
                </code>{" "}
                ont un champ auteur optionnel
              </>,
              <>
                Les blocs{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  list
                </code>{" "}
                ont un mode « éditer en JSON » ou « éditer en markdown »
              </>,
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  5. Taxonomies                                                */}
      {/* ============================================================ */}

      <DocSection
        id="taxonomies"
        number={5}
        title="Taxonomies"
        icon={ListChecks}
      >
        <DocSubSection title="5.1 — Structure">
          <p className="text-sm text-muted-foreground">
            Trois niveaux, matérialisés par{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              TaxonomyType
            </code>{" "}
            :
          </p>
          <DocCode
            code={`THEME (racine)
└── CATEGORY (enfant de THEME)
    └── SUBCATEGORY (enfant de CATEGORY, sélectionnable sur Article)`}
          />
        </DocSubSection>

        <DocSubSection title="5.2 — Seed en JSON en dur">
          <p className="text-sm text-muted-foreground">
            Pas de{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              prisma/seed.ts
            </code>
            . À la place, un fichier{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              lib/blog/taxonomy-seed.ts
            </code>{" "}
            exporte une constante JSON :
          </p>
          <DocCode
            code={`export const TAXONOMY_SEED: readonly SeedTaxonomy[] = [
  {
    name: "Tech",
    slug: "tech",
    children: [
      {
        name: "Frontend",
        slug: "frontend",
        children: [
          { name: "React", slug: "react" },
          { name: "Vue", slug: "vue" },
          { name: "CSS", slug: "css" },
        ],
      },
      {
        name: "Backend",
        slug: "backend",
        children: [
          { name: "Node", slug: "node" },
          { name: "Python", slug: "python" },
          { name: "Base de données", slug: "base-de-donnees" },
        ],
      },
      {
        name: "DevOps",
        slug: "devops",
        children: [
          { name: "CI/CD", slug: "ci-cd" },
          { name: "Docker", slug: "docker" },
        ],
      },
    ],
  },
  {
    name: "Produit",
    slug: "produit",
    children: [
      {
        name: "Découverte",
        slug: "decouverte",
        children: [
          { name: "Recherche utilisateur", slug: "recherche-utilisateur" },
          { name: "Interviews", slug: "interviews" },
        ],
      },
      {
        name: "Roadmap",
        slug: "roadmap",
        children: [
          { name: "Priorisation", slug: "priorisation" },
          { name: "OKR", slug: "okr" },
        ],
      },
    ],
  },
  {
    name: "Design",
    slug: "design",
    children: [
      {
        name: "UI",
        slug: "ui",
        children: [
          { name: "Typographie", slug: "typographie" },
          { name: "Couleur", slug: "couleur" },
        ],
      },
      {
        name: "UX",
        slug: "ux",
        children: [
          { name: "Parcours utilisateur", slug: "parcours-utilisateur" },
          { name: "Accessibilité", slug: "accessibilite" },
        ],
      },
    ],
  },
];`}
          />
        </DocSubSection>

        <DocSubSection title="5.3 — Import initial">
          <p className="text-sm text-muted-foreground">
            Une <strong>Server Action</strong>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              importTaxonomySeed
            </code>{" "}
            (dans{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              app/actions/taxonomy/importTaxonomySeed.ts
            </code>
            ) permet à un admin de charger le seed en un clic depuis{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              /back-studio/blog/taxonomies
            </code>
            . Elle :
          </p>
          <DocList
            variant="number"
            items={[
              <>Vérifie que l'utilisateur est modérateur</>,
              <>
                Vérifie que la base n'a pas déjà des taxonomies (ou demande
                confirmation pour fusionner)
              </>,
              <>Crée les THEME, CATEGORY, SUBCATEGORY en respectant l'ordre</>,
              <>
                Retourne{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {"{ imported: number }"}
                </code>
              </>,
            ]}
          />
        </DocSubSection>

        <DocSubSection title="5.4 — Règles">
          <DocList
            items={[
              <>
                <strong>Slug global unique</strong> :{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  react
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  node
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  tech
                </code>{" "}
                ne peuvent apparaître qu'une fois dans toute la table
              </>,
              <>
                <strong>Suppression refusée</strong> si la taxonomie a des
                enfants ou des articles (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  onDelete: Restrict
                </code>
                )
              </>,
              <>
                <strong>Édition</strong> : nom, slug, description, ordre
              </>,
              <>
                <strong>Déplacement interdit en v1</strong> (changer un{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  parentId
                </code>{" "}
                casserait les articles liés)
              </>,
            ]}
          />
        </DocSubSection>

        <DocSubSection title="5.5 — Sélection sur un article">
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              TaxonomyPicker.tsx
            </code>{" "}
            :
          </p>
          <DocList
            items={[
              <>
                Affiche un arbre dépliable THEME &gt; CATEGORY &gt; SUBCATEGORY
              </>,
              <>
                Seules les <strong>SUBCATEGORY</strong> sont sélectionnables
              </>,
              <>
                Un clic sur une SUBCATEGORY met à jour{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  subCategoryId
                </code>
              </>,
              <>
                Affiche la branche sélectionnée en breadcrumb (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Tech &gt; Frontend &gt; React
                </code>
                )
              </>,
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  6. Tags                                                      */}
      {/* ============================================================ */}

      <DocSection id="tags" number={6} title="Tags" icon={ListChecks}>
        <DocSubSection title="6.1 — Modèle">
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              Tag
            </code>{" "}
            est déjà défini dans le schéma :{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              name @unique
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              slug @unique
            </code>
            .
          </p>
        </DocSubSection>
        <DocSubSection title="6.2 — Usage">
          <DocList
            items={[
              <>Création libre par l'auteur depuis le formulaire Article</>,
              <>
                Sélection multiple via{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  TagPicker.tsx
                </code>{" "}
                (autocomplete + création inline)
              </>,
              <>Pas de hiérarchie, pas de catégorie</>,
            ]}
          />
        </DocSubSection>
        <DocSubSection title="6.3 — Édition admin">
          <p className="text-sm text-muted-foreground">
            Page{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              /back-studio/blog/tags
            </code>{" "}
            :
          </p>
          <DocList
            items={[
              <>Liste tous les tags avec compteur d'articles</>,
              <>Renommer un tag</>,
              <>Supprimer un tag (détache des articles, ne les supprime pas)</>,
              <>Fusionner deux tags (v2)</>,
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  7. Médias                                                    */}
      {/* ============================================================ */}

      <DocSection id="medias" number={7} title="Médias" icon={ListChecks}>
        <DocSubSection title="7.1 — Stockage">
          <DocList
            items={[
              <>
                <strong>Local</strong> :{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  public/uploads/blog/&lt;articleId&gt;/&lt;uuid&gt;.&lt;ext&gt;
                </code>
              </>,
              <>
                <strong>Externe</strong> : URL complète dans{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Media.url
                </code>
              </>,
            ]}
          />
        </DocSubSection>
        <DocSubSection title="7.2 — Route API">
          <p className="text-sm font-semibold text-foreground">
            POST{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              /api/back-studio/blog/upload
            </code>{" "}
            :
          </p>
          <DocList
            items={[
              <>
                Body :{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  FormData
                </code>{" "}
                (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  file
                </code>{" "}
                +{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  articleId
                </code>
                )
              </>,
              <>
                Validation : type MIME (image ou vidéo), taille max (image 10
                Mo, vidéo 100 Mo)
              </>,
              <>
                Écriture via{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  fs.writeFile
                </code>
              </>,
              <>
                Création d'un{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Media
                </code>{" "}
                en base
              </>,
              <>
                Retour :{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {"{ id, url, type, altText }"}
                </code>
              </>,
            ]}
          />
          <p className="mt-2 text-sm font-semibold text-foreground">
            DELETE{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              /api/back-studio/blog/upload/[mediaId]
            </code>{" "}
            :
          </p>
          <DocList
            items={[
              <>
                Suppression du fichier disque + de l'entrée{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Media
                </code>
              </>,
            ]}
          />
        </DocSubSection>
        <DocSubSection title="7.3 — Composant">
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              MediaUploader.tsx
            </code>{" "}
            :
          </p>
          <DocList
            items={[
              <>Bouton « Choisir un fichier »</>,
              <>Aperçu après upload</>,
              <>
                Champ{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  altText
                </code>{" "}
                éditable
              </>,
              <>Bouton « Coller une URL » (bascule en mode URL externe)</>,
            ]}
          />
        </DocSubSection>
        <DocSubSection title="7.4 — Sécurité">
          <DocList
            items={[
              <>Vérification de session obligatoire</>,
              <>
                Vérification que l'utilisateur est auteur ou modérateur de
                l'article
              </>,
              <>
                Refus des chemins hors de{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  public/uploads/blog/
                </code>
              </>,
              <>Refus des extensions non whitelistées</>,
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  8. Interactions                                              */}
      {/* ============================================================ */}

      <DocSection
        id="interactions"
        number={8}
        title="Interactions (likes + favoris)"
        icon={ListChecks}
      >
        <DocSubSection title="8.1 — Likes">
          <DocList
            items={[
              <>
                Sur un article :{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Like
                </code>{" "}
                avec{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  articleId
                </code>{" "}
                +{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  userId
                </code>
              </>,
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  @@unique([userId, articleId])
                </code>{" "}
                → un seul like par utilisateur
              </>,
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  toggleArticleLike
                </code>{" "}
                : transaction → si existe supprime + décrémente{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  likesCount
                </code>
                , sinon crée + incrémente
              </>,
              <>
                Affiché sur{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  ArticleCard
                </code>{" "}
                et{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  ArticleReader
                </code>
              </>,
            ]}
          />
        </DocSubSection>
        <DocSubSection title="8.2 — Favoris">
          <DocList
            items={[
              <>
                Sur un article :{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Favorite
                </code>{" "}
                avec{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  articleId
                </code>{" "}
                +{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  userId
                </code>
              </>,
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  @@unique([userId, articleId])
                </code>
              </>,
              <>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  toggleArticleFavorite
                </code>{" "}
                : pas de compteur
              </>,
              <>
                Affiché sur{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  ArticleCard
                </code>{" "}
                et{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  ArticleReader
                </code>
              </>,
              <>
                Page{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  /user/favorites
                </code>{" "}
                liste les articles favoris
              </>,
            ]}
          />
        </DocSubSection>
        <DocSubSection title="8.3 — État optimiste">
          <p className="text-sm text-muted-foreground">
            Les boutons utilisent un état local optimiste (comme{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              SprintBoard
            </code>
            ) :
          </p>
          <DocList
            items={[
              <>Clic → UI mise à jour immédiatement</>,
              <>Appel serveur en arrière-plan</>,
              <>Rollback + toast erreur si échec</>,
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  9. Liste des fichiers                                        */}
      {/* ============================================================ */}

      <DocSection
        id="fichiers"
        number={9}
        title="Liste complète des fichiers"
        icon={FileText}
      >
        <InfoCallout variant="warning">
          <strong>Total : 72 fichiers + 1 migration Prisma.</strong> Chaque
          fichier devra porter l&apos;écosystème{" "}
          <code className="font-mono">Blog</code> à l&apos;identique (voir
          section 10).
        </InfoCallout>

        <DocSubSection title="Phase 0 — Setup partagé (4 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "lib/blog/json.ts",
                "Sérialisation/désérialisation des champs JSON (displayStyle, body des blocs code/quote/image/list)",
              ],
              [
                "lib/blog/reading-time.ts",
                "Calcul du temps de lecture d'un article (basé sur le nombre de mots)",
              ],
              [
                "lib/blog/access.ts",
                "Helpers d'autorisation : assertCanModerate, assertIsAuthor, assertCanEdit",
              ],
              [
                "lib/blog/taxonomy-seed.ts",
                "Constante JSON du seed taxonomique par défaut (Tech, Produit, Design)",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 1 — Taxonomies (12 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "lib/validations/taxonomy.ts",
                "Schémas Zod : createTaxonomySchema, updateTaxonomySchema, taxonomyIdSchema, deleteTaxonomySchema",
              ],
              [
                "app/actions/taxonomy/createTaxonomy.ts",
                "Création d'une taxonomie (vérifie parent valide, slug unique global)",
              ],
              [
                "app/actions/taxonomy/updateTaxonomy.ts",
                "Édition (nom, slug, description, ordre)",
              ],
              [
                "app/actions/taxonomy/deleteTaxonomy.ts",
                "Suppression (refusée si enfants ou articles liés)",
              ],
              [
                "app/actions/taxonomy/importTaxonomySeed.ts",
                "Import du seed JSON en un clic depuis l'admin",
              ],
              [
                "components/blog/TaxonomyPicker.tsx",
                "Arbre dépliable THEME > CATEGORY > SUBCATEGORY pour sélection sur Article",
              ],
              [
                "components/blog/TaxonomyCard.tsx",
                "Carte d'une taxonomie dans la liste admin",
              ],
              [
                "components/blog/TaxonomyForm.tsx",
                "Formulaire de création/édition d'une taxonomie",
              ],
              [
                "components/blog/ImportTaxonomySeedButton.tsx",
                "Bouton « Importer la taxonomie par défaut »",
              ],
              [
                "app/back-studio/blog/taxonomies/page.tsx",
                "Liste admin des taxonomies (arbre complet)",
              ],
              [
                "app/back-studio/blog/taxonomies/new/page.tsx",
                "Page de création",
              ],
              [
                "app/back-studio/blog/taxonomies/[slug]/edit/page.tsx",
                "Page d'édition",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 2 — Tags (8 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "lib/validations/tag.ts",
                "Schémas Zod : createTagSchema, updateTagSchema, tagIdSchema",
              ],
              [
                "app/actions/tag/createTag.ts",
                "Création (nom + slug uniques globaux)",
              ],
              [
                "app/actions/tag/updateTag.ts",
                "Édition (renommage, changement de slug)",
              ],
              [
                "app/actions/tag/deleteTag.ts",
                "Suppression (détache des articles)",
              ],
              [
                "components/blog/TagPicker.tsx",
                "Autocomplete + création inline de tags sur le formulaire Article",
              ],
              ["components/blog/TagForm.tsx", "Formulaire d'édition d'un tag"],
              [
                "app/back-studio/blog/tags/page.tsx",
                "Liste admin des tags avec compteur d'articles",
              ],
              [
                "app/back-studio/blog/tags/[slug]/edit/page.tsx",
                "Page d'édition d'un tag",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 3 — Articles (18 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "lib/validations/article.ts",
                "Schémas Zod : création, mise à jour, changement de statut, id, hard delete",
              ],
              [
                "app/actions/article/createArticle.ts",
                "Création d'un brouillon (vérifie sous-catégorie valide, slug unique global)",
              ],
              [
                "app/actions/article/updateArticle.ts",
                "Édition (titre, slug, sous-catégorie, tags, displayStyle)",
              ],
              [
                "app/actions/article/changeArticleStatus.ts",
                "Changement de statut selon matrice + vérif rôle",
              ],
              [
                "app/actions/article/softDeleteArticle.ts",
                "Corbeille (soft delete)",
              ],
              [
                "app/actions/article/restoreArticle.ts",
                "Restauration depuis la corbeille",
              ],
              [
                "app/actions/article/hardDeleteArticle.ts",
                "Purge définitive (confirmation par slug)",
              ],
              [
                "components/blog/ArticleCard.tsx",
                "Carte d'un article dans une liste publique ou admin",
              ],
              [
                "components/blog/ArticleForm.tsx",
                "Formulaire principal (métadonnées + éditeur de blocs)",
              ],
              [
                "components/blog/ArticleStatusBadge.tsx",
                "Badge coloré du statut",
              ],
              [
                "components/blog/ArticleMeta.tsx",
                "Bandeau auteur + date + temps de lecture + catégorie",
              ],
              [
                "components/blog/DeleteArticleButton.tsx",
                "Bouton soft delete avec ConfirmDialog",
              ],
              [
                "components/blog/RestoreArticleButton.tsx",
                "Bouton restauration",
              ],
              [
                "components/blog/HardDeleteArticleButton.tsx",
                "Bouton purge avec confirmation par slug",
              ],
              [
                "app/back-studio/blog/articles/page.tsx",
                "Liste admin (filtres statut + auteur)",
              ],
              [
                "app/back-studio/blog/articles/new/page.tsx",
                "Création d'un article",
              ],
              [
                "app/back-studio/blog/articles/[slug]/page.tsx",
                "Détail admin (preview + actions)",
              ],
              [
                "app/back-studio/blog/articles/[slug]/edit/page.tsx",
                "Édition complète",
              ],
              ["app/back-studio/blog/articles/trash/page.tsx", "Corbeille"],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 4 — Pages publiques (6 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "app/blog/page.tsx",
                "Liste publique paginée (12 par page, tri publishedAt desc)",
              ],
              ["app/blog/[slug]/page.tsx", "Lecture d'un article publié"],
              ["app/blog/tag/[slug]/page.tsx", "Articles filtrés par tag"],
              [
                "app/blog/categorie/[...slug]/page.tsx",
                "Articles filtrés par taxonomie (slug = chemin complet)",
              ],
              [
                "components/blog/ArticleReader.tsx",
                "Rendu complet d'un article (métadonnées + blocs + interactions)",
              ],
              [
                "components/blog/ArticleList.tsx",
                "Grille d'articles avec pagination",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 5 — ContentBlocks (9 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "lib/validations/content-block.ts",
                "Schémas Zod par blockType + règles de hiérarchie",
              ],
              [
                "app/actions/content-block/createContentBlock.ts",
                "Création d'un bloc (vérifie position et hiérarchie)",
              ],
              [
                "app/actions/content-block/updateContentBlock.ts",
                "Édition du body + métadonnées du bloc",
              ],
              [
                "app/actions/content-block/deleteContentBlock.ts",
                "Suppression (cascade sur les enfants)",
              ],
              [
                "app/actions/content-block/reorderContentBlocks.ts",
                "Réordonnancement + changement de parent (drag & drop)",
              ],
              [
                "components/blog/ContentBlockEditor.tsx",
                "Éditeur principal avec drag & drop et ajout/suppression",
              ],
              [
                "components/blog/ContentBlockList.tsx",
                "Liste des blocs éditables",
              ],
              [
                "components/blog/ContentBlockRenderer.tsx",
                "Rendu public d'un bloc selon son type",
              ],
              [
                "components/blog/ContentBlockShell.tsx",
                "Wrapper commun (bordures, boutons drag/supprimer, menu type)",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 6 — Médias (5 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "lib/validations/media.ts",
                "Schémas Zod pour upload et URL externe",
              ],
              [
                "app/actions/media/createMedia.ts",
                "Création d'un Media après upload ou collage d'URL",
              ],
              [
                "app/actions/media/deleteMedia.ts",
                "Suppression d'un Media (fichier + entrée base)",
              ],
              [
                "app/api/back-studio/blog/upload/route.ts",
                "Route POST (upload) et DELETE (suppression)",
              ],
              [
                "components/blog/MediaUploader.tsx",
                "Composant d'upload avec aperçu et altText",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 7 — Interactions (5 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "app/actions/interaction/toggleArticleLike.ts",
                "Bascule like + mise à jour likesCount en transaction",
              ],
              [
                "app/actions/interaction/toggleArticleFavorite.ts",
                "Bascule favori",
              ],
              [
                "components/blog/LikeButton.tsx",
                "Bouton like avec état optimiste et compteur",
              ],
              [
                "components/blog/FavoriteButton.tsx",
                "Bouton favori avec état optimiste",
              ],
              [
                "app/user/favorites/page.tsx",
                "Liste des articles favoris de l'utilisateur connecté",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 8 — Dashboard admin (2 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "app/back-studio/blog/page.tsx",
                "Dashboard : compteurs par statut, derniers articles, raccourcis",
              ],
              [
                "components/blog/BlogDashboardStats.tsx",
                "Bloc de statistiques réutilisable",
              ],
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Phase 9 — Intégration nav + SEO (3 fichiers)">
          <DocTable
            headers={["Fichier", "But"]}
            rows={[
              [
                "components/layout/header/nav/backStudioNav.ts",
                "Ajout des entrées Blog (Articles, Taxonomies, Tags)",
              ],
              ["app/robots.ts", "Autoriser /blog, bloquer /back-studio/blog"],
              [
                "app/sitemap.ts",
                "Ajouter les articles publiés et les pages de taxonomie",
              ],
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* ============================================================ */}
      {/*  10. Ecosystem Blog                                           */}
      {/* ============================================================ */}

      <DocSection
        id="ecosystem"
        number={10}
        title="Ecosystem Blog — version finale"
        icon={FileCode2}
      >
        <InfoCallout>
          Ce tableau devra apparaître <strong>à l&apos;identique</strong> dans
          l&apos;en-tête de chaque fichier listé à la section 9, plus les
          fichiers de validation.
        </InfoCallout>
        <DocCode
          code={`ecosystem: Blog = [
  "@/app/actions/article/changeArticleStatus.ts",
  "@/app/actions/article/createArticle.ts",
  "@/app/actions/article/hardDeleteArticle.ts",
  "@/app/actions/article/restoreArticle.ts",
  "@/app/actions/article/softDeleteArticle.ts",
  "@/app/actions/article/updateArticle.ts",
  "@/app/actions/content-block/createContentBlock.ts",
  "@/app/actions/content-block/deleteContentBlock.ts",
  "@/app/actions/content-block/reorderContentBlocks.ts",
  "@/app/actions/content-block/updateContentBlock.ts",
  "@/app/actions/interaction/toggleArticleFavorite.ts",
  "@/app/actions/interaction/toggleArticleLike.ts",
  "@/app/actions/media/createMedia.ts",
  "@/app/actions/media/deleteMedia.ts",
  "@/app/actions/tag/createTag.ts",
  "@/app/actions/tag/deleteTag.ts",
  "@/app/actions/tag/updateTag.ts",
  "@/app/actions/taxonomy/createTaxonomy.ts",
  "@/app/actions/taxonomy/deleteTaxonomy.ts",
  "@/app/actions/taxonomy/importTaxonomySeed.ts",
  "@/app/actions/taxonomy/updateTaxonomy.ts",
  "@/app/api/back-studio/blog/upload/route.ts",
  "@/app/back-studio/blog/articles/[slug]/edit/page.tsx",
  "@/app/back-studio/blog/articles/[slug]/page.tsx",
  "@/app/back-studio/blog/articles/new/page.tsx",
  "@/app/back-studio/blog/articles/page.tsx",
  "@/app/back-studio/blog/articles/trash/page.tsx",
  "@/app/back-studio/blog/page.tsx",
  "@/app/back-studio/blog/tags/[slug]/edit/page.tsx",
  "@/app/back-studio/blog/tags/page.tsx",
  "@/app/back-studio/blog/taxonomies/[slug]/edit/page.tsx",
  "@/app/back-studio/blog/taxonomies/new/page.tsx",
  "@/app/back-studio/blog/taxonomies/page.tsx",
  "@/app/blog/[slug]/page.tsx",
  "@/app/blog/categorie/[...slug]/page.tsx",
  "@/app/blog/page.tsx",
  "@/app/blog/tag/[slug]/page.tsx",
  "@/app/user/favorites/page.tsx",
  "@/components/blog/ArticleCard.tsx",
  "@/components/blog/ArticleForm.tsx",
  "@/components/blog/ArticleList.tsx",
  "@/components/blog/ArticleMeta.tsx",
  "@/components/blog/ArticleReader.tsx",
  "@/components/blog/ArticleStatusBadge.tsx",
  "@/components/blog/BlogDashboardStats.tsx",
  "@/components/blog/ContentBlockEditor.tsx",
  "@/components/blog/ContentBlockList.tsx",
  "@/components/blog/ContentBlockRenderer.tsx",
  "@/components/blog/ContentBlockShell.tsx",
  "@/components/blog/DeleteArticleButton.tsx",
  "@/components/blog/FavoriteButton.tsx",
  "@/components/blog/HardDeleteArticleButton.tsx",
  "@/components/blog/ImportTaxonomySeedButton.tsx",
  "@/components/blog/LikeButton.tsx",
  "@/components/blog/MediaUploader.tsx",
  "@/components/blog/RestoreArticleButton.tsx",
  "@/components/blog/TagForm.tsx",
  "@/components/blog/TagPicker.tsx",
  "@/components/blog/TaxonomyCard.tsx",
  "@/components/blog/TaxonomyForm.tsx",
  "@/components/blog/TaxonomyPicker.tsx",
  "@/lib/blog/access.ts",
  "@/lib/blog/json.ts",
  "@/lib/blog/reading-time.ts",
  "@/lib/blog/taxonomy-seed.ts",
  "@/lib/validations/article.ts",
  "@/lib/validations/content-block.ts",
  "@/lib/validations/media.ts",
  "@/lib/validations/tag.ts",
  "@/lib/validations/taxonomy.ts",
]`}
        />
      </DocSection>

      {/* ============================================================ */}
      {/*  11. Migration Prisma                                         */}
      {/* ============================================================ */}

      <DocSection
        id="migration"
        number={11}
        title="Migration Prisma requise"
        icon={FileCode2}
      >
        <p className="text-sm text-muted-foreground">
          Une seule modification du schéma :
        </p>
        <DocCode
          code={`model ContentBlock {
  id           String      @id @default(cuid())
  articleId    String
  parentId     String?
  blockType    String      @default("paragraph")  // ← AJOUT
  contentType  ContentType @default(MARKDOWN)
  body         String
  displayOrder Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  article  Article        @relation(fields: [articleId], references: [id], onDelete: Cascade)
  parent   ContentBlock?  @relation("ContentTree", fields: [parentId], references: [id], onDelete: Cascade)
  children ContentBlock[] @relation("ContentTree")

  @@index([articleId, parentId, displayOrder])
  @@index([blockType])
  @@map("article_content")
}`}
        />
        <p className="text-sm text-muted-foreground">
          Commande à lancer après modification :
        </p>
        <DocCode
          code={`npx prisma migrate dev --name add_block_type_to_content_block
npx prisma generate`}
        />
      </DocSection>

      {/* ============================================================ */}
      {/*  12. Ordre d'exécution                                        */}
      {/* ============================================================ */}

      <DocSection
        id="ordre"
        number={12}
        title="Ordre d'exécution proposé"
        icon={ListChecks}
      >
        <DocList
          variant="number"
          items={[
            <>
              Migration Prisma (ajout{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                blockType
              </code>
              )
            </>,
            <>Phase 0 — Setup (4 fichiers)</>,
            <>Phase 1 — Taxonomies (12 fichiers)</>,
            <>Phase 2 — Tags (8 fichiers)</>,
            <>Phase 3 — Articles (18 fichiers)</>,
            <>Phase 4 — Pages publiques (6 fichiers)</>,
            <>Phase 5 — ContentBlocks (9 fichiers)</>,
            <>Phase 6 — Médias (5 fichiers)</>,
            <>Phase 7 — Interactions (5 fichiers)</>,
            <>Phase 8 — Dashboard admin (2 fichiers)</>,
            <>Phase 9 — Intégration nav + SEO (3 fichiers)</>,
          ]}
        />
        <InfoCallout variant="warning">
          <strong>Total : 72 fichiers + 1 migration Prisma.</strong> Aucun
          script ne sera écrit avant validation des 10 points de la section 13.
        </InfoCallout>
      </DocSection>

      {/* ============================================================ */}
      {/*  Pied de page                                                 */}
      {/* ============================================================ */}

      <Reveal>
        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Document de référence du module Blog. Version 1.0.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#vue-ensemble"
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} gap-2`}
            >
              Retour en haut
            </a>
            <Link
              href="/back-studio/blog"
              className={`${buttonVariants({ variant: "outline", size: "sm" })} gap-2`}
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Module Blog
            </Link>
          </div>
        </footer>
      </Reveal>
    </main>
  );
}
