import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return {
      hasError: true,
      errorMessage: message,
      errorStack: stack,
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] Render error:", error);
    console.error("[AppErrorBoundary] Component stack:", errorInfo?.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReload = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn("[AppErrorBoundary] Falha ao remover Service Worker:", e);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Ops… a página não carregou</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O app encontrou um erro de execução e interrompeu a renderização.
              </p>

              {this.state.errorMessage ? (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Erro:</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {this.state.errorMessage}
                  </p>
                </div>
              ) : null}

              {this.state.errorStack ? (
                <details className="rounded-md border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Detalhes técnicos
                  </summary>
                  <pre className="mt-3 max-h-64 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                    {this.state.errorStack}
                  </pre>
                </details>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={this.handleReload} className="w-full sm:w-auto">
                  Recarregar
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleHardReload}
                  className="w-full sm:w-auto"
                >
                  Recarregar (limpar cache)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
}
