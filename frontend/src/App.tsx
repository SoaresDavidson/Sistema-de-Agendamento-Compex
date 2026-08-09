import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty"
import { ErrorState } from "@/components/ui/Error"
import { Skeleton } from "@/components/ui/Skeleton"
import "./App.css"

export default function App() {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-8 bg-foreground rounded-3xl">
      <section className="grid gap-3">
        <h2 className="text-xl font-bold">Skeleton</h2>
        <div className="flex items-center gap-4 rounded-card border border-border bg-card p-6">
          <Skeleton className="size-14 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-bold">Estado vazio</h2>
        <Empty className="rounded-3xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span aria-hidden="true">□</span>
            </EmptyMedia>
            <EmptyTitle>Nenhum projeto</EmptyTitle>
            <EmptyDescription>Crie primeiro projeto para começar.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <button className="border" type="button">Criar projeto</button>
            <button className="border" type="button">Importar projeto</button>
          </EmptyContent>
        </Empty>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-bold">Erro</h2>
        <ErrorState
          icon="!"
          message="Não foi possível carregar projetos. Tente novamente."
          onRetry={() => window.location.reload()}
        />
      </section>
    </main>
  )
}
