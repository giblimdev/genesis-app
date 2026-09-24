# Sprint 0
✘  non fait
✘✔ en cours
✔ fait

## 0. etat du sprint
State =✘✔    
(valeur par défaut à la creation State =✘)( seuls les sprints dont State =✘)


## 1. Fondations du projet 
✔- installer next
✔- installer les bibbliotheque
✔- instalation et de prisma et premiere migration.

✔ -Configurer les variables d’environnement (.env)
✔ -importer mes fichiers de base
✔- cree un premier repository


## 2. outils d'aide aux développement
✔- creer le prompt d'aide aux developement dans CONTRIBUTING.md
✔- cree app/back-studio/helpDev/page.tsx
✔- page de [CMD prisma, github; versel] [card des biblioteque cmd i bibliotheque][police][icon] [color]
✔- mise en place de la nav
✔- crer l'outil de copie "schema.prisma" et "package.json" et "CONTIBUTING.md"

✔ metre a jour l'achitecture les lib reutilisable sont dans un dossier utils nom  a discuter 




## 3. CONTRIBUTING Maker

✔- lis CONTRIBUTING/nd

✔- edit chaque section. avec boutton up/qown pur changer l'ordre

✔ -permet d' ajouter une section de modiffier 

✔ -remplace CONTRIBUTING.md existant

## 3. Authentification (Better Auth)
✔ Configurer Better Auth (email/password, sessions)
✔ Créer les routes d’auth (/api/auth/[...all])
✔ Créer les pages login / register / 
✔ Protéger les routes nécessaires via proxi.ts (midleware)
✔ Vérifier la cohérence avec le modèle User du schéma Prisma

## 4. ecriture en em masse 
✔ module d'ecriture . creation de nouveau fichier a partir d'un chemin



## 5. Srum
✔ crud Project
✔ crud Feature
✔ crud Persona
✔ crud UserStory
✔ crud Sprint
CRUD sprint. dans un sprint je veux pouvoir ajouter retirer par Dnd une user story. un sprint archivé ou encours est verrouillé impossible de le modifier 
✔ crud Task


## gestion par lot 
✘✔ gestion par lot des userstory : doit offrir un champs editable d'un tableau de json. permettre copier un exemple type. en registrer en db
✘✔ gestion par lot tache doit accepter un tableau de tache format json en accor avec la bd a parit d'un model copiable


## gestion par lot 
✘✔ generateur del'arboresence 

## gestion par lot 
✘✔bouton hard delet 

## generateur de contexte.
grere un json avec le project l'epic et l'user story pour tager les en-tête


## Factoriser 



CopyJsonButton



DegradedModeBanner
Déjà utilisé dans :

❌ Nulle part dans les fichiers que tu as fournis.

Pourrait être utilisé dans :

app/back-studio/scrum/[slug]/page.tsx : quand loadProjectBySlug retourne { source: "disk", warning }. C'est exactement le cas d'usage prévu par le header.

app/back-studio/scrum/[slug]/features/page.tsx : idem si tu adoptes le fallback disque sur cette page.

app/back-studio/scrum/[slug]/backlog/page.tsx : idem.

Toute page qui utilise loadProjectBySlug.

Verdict : composant orphelin alors qu'il a été créé pour load-project.ts. À intégrer en priorité.


EmptyState
Déjà utilisé dans :

app/back-studio/scrum/page.tsx

app/back-studio/scrum/trash/page.tsx

app/back-studio/scrum/[slug]/features/page.tsx

app/back-studio/scrum/[slug]/personas/page.tsx

app/back-studio/scrum/[slug]/personas/trash/page.tsx

app/back-studio/scrum/[slug]/backlog/page.tsx

app/back-studio/scrum/[slug]/backlog/trash/page.tsx

app/back-studio/scrum/[slug]/sprints/page.tsx

app/back-studio/scrum/[slug]/sprints/trash/page.tsx

Pourrait être utilisé dans :

app/back-studio/scrum/[slug]/page.tsx : si un projet n'a aucun module rempli, afficher un état vide.

components/task/TaskList.tsx : remplacer le <p> d'état vide actuel par <EmptyState> pour uniformiser.

app/back-studio/creatFiles/CreatFilesView.tsx : quand aucune entrée exploitable.

Verdict : bien utilisé. Deux endroits à uniformiser (TaskList, CreatFilesView).


8. ExportJsonDialog
Déjà utilisé dans :

app/back-studio/scrum/page.tsx

Pourrait être utilisé dans :

app/back-studio/scrum/[slug]/features/page.tsx : exporter les features d'un projet.

app/back-studio/scrum/[slug]/personas/page.tsx : exporter les personas.

app/back-studio/scrum/[slug]/backlog/page.tsx : exporter les user stories.

app/back-studio/scrum/[slug]/sprints/page.tsx : exporter les sprints.

app/back-studio/scrum/[slug]/page.tsx : exporter le projet complet (avec fullFetcher = serializeProjectForDisk).

Verdict : sous-utilisé. Tu n'as qu'un seul point d'export alors que tu as 4 modules exportables.


9. ImportJsonDialog
Déjà utilisé dans :

app/back-studio/scrum/page.tsx

Pourrait être utilisé dans :

app/back-studio/scrum/[slug]/features/page.tsx : importer des features en lot (nécessite une Server Action bulkImportFeatures).

app/back-studio/scrum/[slug]/personas/page.tsx : idem pour les personas.

app/back-studio/scrum/[slug]/backlog/page.tsx : idem pour les user stories.

app/back-studio/scrum/[slug]/sprints/page.tsx : idem pour les sprints.

Verdict : sous-utilisé. Nécessite de créer les Server Actions bulkImport* correspondantes.

10. JsonEditor
Déjà utilisé dans :

❌ Nulle part dans les fichiers que tu as fournis. Le header le référence dans relatedFiles de ImportJsonDialog, mais ImportJsonDialog utilise une <Textarea> simple.

Pourrait être utilisé dans :

components/common/ImportJsonDialog.tsx : remplacer la <Textarea> par <JsonEditor> pour avoir la validation syntaxique live.

app/back-studio/help-dev/prompt/PromptView.tsx : si tu veux ajouter une édition JSON de la config.

Toute page d'édition de config JSON (ex. excludes.json).

Verdict : composant orphelin. À intégrer dans ImportJsonDialog en priorité.


2. TailwindPalette
Déjà utilisé dans :

app/conception/graphic/page.tsx (référencé dans le header)

app/dev/palette/page.tsx (référencé dans le header)

⚠️ Ces deux pages n'existent pas dans les fichiers que tu as fournis. Le composant est donc probablement orphelin.

Pourrait être utilisé dans :

app/back-studio/help-dev/thema/page.tsx : la page Token Thema affiche déjà les tokens du thème. Ajouter TailwindPalette en dessous pour la palette brute serait cohérent.

app/back-studio/help-dev/page.tsx : section « Palette ».

app/back-studio/help-dev/cmd/page.tsx : section « Couleurs ».

Verdict : probablement orphelin. À intégrer dans help-dev/thema ou help-dev/cmd


## mise ajour des en-têtes








