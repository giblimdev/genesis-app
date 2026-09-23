/*
path :          app/back-studio/page.tsx
projectId:      <à fournir>
type:           page
generic:        false

role:           Page des outils de développement (R&D) : accès aux feature flags, DevTools et autres outils internes.
flow:           Rendu statique de la page → affichage du titre et de la liste des outils R&D.
ecosystem:      DevHelp = [
                  "@/app/r&d/page.tsx",
                ]
relatedFiles:   []
imports:        []
exports:        ["default RnDPage"]
useBy:          []
userStories:    [r&d]
//"*en tant que développeur je veux accéder à la page R&D pour utiliser les outils de développement"
status:         planned
pathChecked:    ✘false
metaDataChecked:✘false
scriptChecked:  ✘false
*/

export default function RnDPage() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">R&D — Dev Help</h1>
        <p className="mt-2 text-muted-foreground">
          Outils de conception, features, DevTools…
        </p>
        <ul className="mt-6 space-y-2">
          <li className="rounded-lg border border-border p-4">Feature flags</li>
          <li className="rounded-lg border border-border p-4">DevTools</li>
          <li className="rounded-lg border border-border p-4">
            Documentation interne
          </li>
        </ul>
      </div>
    </main>
  );
}
