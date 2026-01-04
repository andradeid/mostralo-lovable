import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, BarChart3 } from "lucide-react";
import { ExternalClientsList } from "@/components/external-billing/ExternalClientsList";
import { ExternalServicesList } from "@/components/external-billing/ExternalServicesList";
import { ExternalInvoicesList } from "@/components/external-billing/ExternalInvoicesList";
import { RecurringInvoicesReport } from "@/components/external-billing/RecurringInvoicesReport";

export default function ExternalBillingPage() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faturamento Externo</h1>
        <p className="text-muted-foreground">
          Gerencie clientes, serviços e faturas para clientes externos (consultorias, projetos avulsos, etc.)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Serviços</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Relatório</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Externas</CardTitle>
              <CardDescription>
                Crie e gerencie faturas para clientes externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExternalInvoicesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Externos</CardTitle>
              <CardDescription>
                Cadastre clientes que não são lojistas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExternalClientsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Serviços</CardTitle>
              <CardDescription>
                Defina os serviços disponíveis para faturamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExternalServicesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Recorrências</CardTitle>
              <CardDescription>
                Histórico de execuções automáticas e faturas geradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringInvoicesReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
