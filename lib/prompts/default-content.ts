/*
path :           lib/prompts/default-content.ts
tag :            ["prompt", "contributing"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Contenu initial de CONTRIBUTING.md, utilisé quand le
                 fichier n'existe pas encore sur disque. Reproduit les
                 règles de rédaction des scripts (en-tête Helpdev + code)
                 telles que définies dans la convention du projet.

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       Prompts = [
                   "@/lib/prompts/default-content.ts",
                   "@/lib/prompts/read-contributing.ts",
                 ]
relatedFiles:    ["@/lib/prompts/read-contributing.ts"]
imports:         []
exports:         ["DEFAULT_CONTRIBUTING_CONTENT"]
useBy:           ["@/lib/prompts/read-contributing.ts"]

userStories:     ["*en tant que développeur je veux un CONTRIBUTING par défaut"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const DEFAULT_CONTRIBUTING_CONTENT = `# Contributing — Genesis

Ce document décrit les règles et conventions à respecter pour tout
script produit dans le projet (par un humain ou une IA).

---

## Règles de génération de scripts

Un script (contenu d'un fichier) est constitué d'une **en-tête** (entre
\`/* */\`) et de son **code** (TypeScript, TSX, etc.).

### 1. Script en entier

Toujours (sauf demande explicite de l'utilisateur) fournir
**l'intégralité / complet / en entier** du script :
en-tête \`/* */\` + code. Aucun placeholder (\`// ...\`, \`// TODO\`, \`//\`).

### 2. Intégration des scripts

Les scripts générés doivent utiliser au mieux les scripts déjà existants
(exemple : \`components/common\`).

### 3. En-tête obligatoire

───────────────────────────────────────────
GROUPE « Classification »
───────────────────────────────────────────

#### path — requis
Chemin complet depuis la racine du projet.

#### tag — requis
Tableau de valeurs permet de trier les fichiers. Le tag reflète le plus
souvent la ou les user stories concernées.

#### projectId — requis
Ne pas laisser vide : écrire \`projectId: <à fournir>\` en attendant.

#### type — requis
Nature du fichier. Valeurs possibles : \`layout | page | component |
action | route | helper | store | config | page d'entrée\`.

#### generic — optionnel (booléen, défaut \`false\`)
\`true\` si le fichier est réutilisable au-delà de son module
(composant UI transverse, utilitaire, type partagé).

───────────────────────────────────────────
GROUPE « Helpdev » — métadonnées du code
───────────────────────────────────────────

#### role — requis
Rôle fonctionnel ou applicatif du fichier.

#### flow — requis
Flux de données / séquence d'exécution interne.

#### ecosystem — requis
Nom du domaine métier + tableau des fichiers qui le composent.

Format :
\`\`\`
ecosystem: Auth = [
  "@/app/auth/login/page.tsx",
  "@/app/auth/register/page.tsx",
  "@/lib/auth/auth.ts",
]
\`\`\`

Règles :
- Le tableau contient TOUS les fichiers du domaine (y compris le courant).
- Tous les fichiers du même domaine portent EXACTEMENT le même tableau.
- Le tableau est trié alphabétiquement.
- Le tableau est la source de vérité du domaine.

#### relatedFiles — requis
Fichiers fonctionnellement liés — CHEMINS COMPLETS.

#### imports — requis
Imports (libs npm, constantes, fonctions, props, paramètres reçus).

#### exports — requis
Éléments exportés (fonctions, consts, types, props, paramètres transmis).

#### useBy — requis
Fichiers qui importent ce script (relation inverse). Si aucun : \`[]\`.

───────────────────────────────────────────
GROUPE « Scrum » — suivi qualité
───────────────────────────────────────────

#### userStories — requis
User stories rattachées. Format : liste de slugs, ou généré si aucune
(\`*en tant que je veux pour\`, signalé par \`*\` si généré).

#### status — requis
\`planned | wip | done | deprecated\`.

#### pathChecked
Le chemin du fichier a été vérifié. Défaut : \`✘false\` → \`✔true\`.

#### metaDataChecked
Les métadonnées (imports / exports / role…) sont à jour. Défaut : \`✘false\`.

#### scriptChecked
Le script a été relu / validé. Défaut : \`✘false\`.

---

## 4. Chemins complets

Dans l'en-tête, tout fichier référencé (imports, useBy, relatedFiles)
doit être mentionné par son **CHEMIN COMPLET** depuis la racine du projet.

- ✔ \`@/lib/auth/auth-client\`
- ✘ \`auth-client\`

## 5. Props typées

Chaque composant exporte son type de props :

\`\`\`ts
type LoginFormProps = { … }
export function LoginForm({ … }: LoginFormProps) { … }
\`\`\`

## 6. Séparation des responsabilités

- Pas de logique métier dans les composants de présentation.
- Mutations → Server Actions dans \`lib/actions/**\`.
- Validation → Zod dans \`lib/validations/**\`.
- \`"use client"\` justifié par un commentaire si présent.

## 7. Design system

Utiliser au mieux les valeurs de \`@theme\` Tailwind. Créer des classes
spécifiques uniquement si nécessaire.
`;