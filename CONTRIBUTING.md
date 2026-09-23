

# Règles de génération de scripts
//un script (contenue d'un fichier) est constituer d'une en-tête (contenue entre /*  */) et le code (typeScript).
## 1. Script en entier
Toujours (sauf demande explicite de l'utilisateur) Fournir l'intégralité / complet / en entier  du script : 
en-tête /* */  + code  Aucun placeholder (// ..., // TODO, //)

## 2. integration des script
Les script généré doivent utilisé au mieux les sript déja existant (exemple ! components/common
)


## 2. En-tête obligatoire
───────────────────────────────────────────
GROUPE « Classification »
───────────────────────────────────────────

## path — requis
## tag — requis
tableau de valeur permet de trier les fichier. le tag reflète le plus souvant la / les user story
## projectId — requis 
Ne pas laisser vide : écrire projectId: <à fournir> en attendant.
## type — requis : Nature du fichier. 
exemple de Valeurs : layout | page | component | action | route | helper | store | config | page d'entré ...

## generic — optionnel — Booléen, défaut false.
true si le fichier est réutilisable au-delà de son module (composant UI transverse, utilitaire, type partagé).

────────────────────────────────────────────
GROUPE « Helpdev » — métadonnées du code
────────────────────────────────────────────

## role — requis
Décrit le rôle fonctionnel ou aplicatif du fichier. 

## flow — requis
Décrit le flux de données / séquence d'exécution interne

## ecosystem — requis
Nom du domaine métier + tableau des fichiers qui le composent.

Format :
ecosystem: Auth = [
  "@/app/auth/login/page.tsx",
  "@/app/auth/register/page.tsx",
  "@/lib/auth/auth.ts",
]

Règles :
- Le tableau contient TOUS les fichiers du domaine (y compris le fichier courant).
- Tous les fichiers du même domaine portent EXACTEMENT le même tableau.
- Le tableau est trié alphabétiquement.
- Le tableau est la source de vérité du domaine.


## relatedFiles — requis
Fichiers fonctionellement liés directement — CHEMINS COMPLETS.
Format :   ["@/app/auth/login/page.tsx", "@/components/auth/LoginForm.tsx"]

## imports — requis
Imports  (libs npm, constante, fonction,  PROPS). tous ce que le script import ou recois (props, parametres)
Format : JSON.stringify(string[])

## exports — requis
Éléments exportés (fonctions, consts, types, parametre et props ). tous ce que le script expose ou transmet
Format : JSON.stringify(string[])

## useBy —  requis
 Fichiers qui importent ce script (relation inverse de imports). 
 Si aucun pour l'instant : [].



────────────────────────────────────────────
GROUPE « Scrum » — suivi qualité
────────────────────────────────────────────
## userStories — requis
User Stories rattachées. 
Format : liste des slugs, ou généré si aucune (*en tant que je veux pour)(signalé par *si généré).

## status —  requis 
planned | wip | done | deprecated.

## pathChecked
Le chemin du fichier a été vérifié. default (✘fale) ✔true

## metaDataChecked
Les métadonnées (imports / exports / role…) sont à jour. default (✘fale) ✔true

## scriptChecked
Le script lui-même a été relu / validé. default (✘fale) ✔true

────────────────────────────────────────────
EXEMPLE CONFORME
────────────────────────────────────────────


/*
path : ["auth", "form"]   
                           app/auth/login/page.tsx

tag : auth

type:            page
  generic:         false

  role:            Formulaire de connexion : email + mot de passe.
  flow:             Intégration useForm + zodResolver(loginSchema) → Soumission via Server Action (loginAction) → Gestion des états de chargement/erreur → Redirection vers /dashboard. 
  ecosystem:       Auth =   [
                  "@/app/file1.ts",
                  "@/app/file2.ts",
                  "@/app/file3.ts",
                  "@/app/file3.ts",
                  ]
  relatedFiles:    ["@/app/auth/login/page.tsx",
                    "@/components/auth/LoginForm.tsx",
                    "@/lib/auth/auth-client.ts"]
  imports:         ["next/navigation", "react",
                    "@/components/auth/LoginForm",
                    "@/lib/auth/auth-client", "types reçus (props)"]
  exports:         ["default page"]
  useBy:           ["@/app/auth/register/page.tsx"]
  userStories:     ["userStorie1"; userStori2].
  
  status:          wip
  pathChecked:     ✔true
  metaDataChecked: ✘false
  scriptChecked:   ✘false
*/

## 3. Chemins complets
Dans l'en-tête, tout fichier référencé (imports, usedBy, relatedFiles)
doit être mentionné par son CHEMIN COMPLET depuis la racine du projet.
  ✔ @/src/lib/auth/auth-client
  ✘ auth-client


## 4. Props typées
Chaque composant exporte son type de props :
  type LoginFormProps = { … }
  export function LoginForm({ … }: LoginFormProps) { … }

## 5. Séparation des responsabilités
- Pas de logique métier dans les composants de présentation.
- Mutations → Server Actions dans @/src/lib/actions/**.ts.
- Validation → Zod dans lib/validations/**.ts.
- "use client" justifié par un commentaire si présent.
 

 ## 6. inspire toi des script fournis en pj et note que dans cette nouvelle App j'ai abandonnér le dossoer src (ce dossier n'existe plus)

 ## 7 utiliser au mieux les valeur de @theme Tailwind . 
  utilise des classname spécifique si n'écesssaire.