// Enviar mensagem com template.
// JSX movido da WhatsAppInstancePage sem mudança.
import { brl } from "@/lib/brl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, XCircle, Send, Search, MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Template } from "@/lib/whatsappInstance/types";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function SendTemplateCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { instance, templates, selectedTemplateId, setSelectedTemplateId, customerSearch, setCustomerSearch, customers, setCustomers, selectedCustomer, setSelectedCustomer, sendTestLoading, searchLoading, searchCustomers, renderMessagePreview, sendTestMessage, selectedTemplate } = ctx;

  return (
    <>
      {instance.status === 'connected' && (
        <Card className="hidden sm:block">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Enviar Mensagem
            </CardTitle>
            <CardDescription>
              Selecione um cliente e um template
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {/* Busca de Cliente */}
            <div className="space-y-2">
              <Label>Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou telefone do cliente..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  className="pl-10"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* Resultados da busca */}
              {customers.length > 0 && !selectedCustomer && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch(customer.name);
                        setCustomers([]);
                      }}
                      className="w-full p-3 text-left hover:bg-muted transition-colors"
                    >
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.phone} • {customer.total_orders} pedidos
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Cliente selecionado */}
              {selectedCustomer && (
                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.phone} • {selectedCustomer.total_orders} pedidos • 
                      {brl(selectedCustomer.total_spent)} gasto
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Seleção de Template */}
            <div className="space-y-2">
              <Label>Template de Mensagem</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum template configurado
                    </div>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Preview da Mensagem */}
            {selectedTemplate && selectedCustomer && (
              <div className="space-y-2">
                <Label>Preview da Mensagem</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                  {renderMessagePreview(selectedTemplate.content, selectedCustomer)}
                </div>
              </div>
            )}

            {/* Botão de Envio */}
            <Button 
              onClick={sendTestMessage} 
              disabled={sendTestLoading || !selectedCustomer || !selectedTemplateId}
              className="w-full"
            >
              {sendTestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem de Teste
                </>
              )}
            </Button>

            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Configure templates de mensagem na seção de Campanhas para poder enviar mensagens de teste.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
