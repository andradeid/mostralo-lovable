// Contatos manuais e busca de clientes.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Users,
  Shield,
  X,
  CheckCircle,
  XCircle,
  Search,
  Phone,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignManualContactsCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { manualContactsInput, setManualContactsInput, manualContacts, validatingManual, customerSearchQuery, setCustomerSearchQuery, customerSearchResults, searchingCustomers, formatPhone, parseManualContacts, validateManualContacts, removeManualContact, toggleManualContact, searchCustomers, addCustomerFromSearch } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Adicionar Contatos
          </CardTitle>
          <CardDescription>
            Busque clientes da base ou adicione manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscar cliente da base */}
          <div className="space-y-2">
            <Label className="text-sm">Buscar Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite nome ou telefone..."
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  searchCustomers(e.target.value);
                }}
                className="pl-9"
              />
              {searchingCustomers && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Resultados da busca */}
            {customerSearchResults.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                {customerSearchResults.map((customer, i) => (
                  <div
                    key={customer.id}
                    className={cn(
                      "flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer text-sm",
                      i > 0 && "border-t"
                    )}
                    onClick={() => addCustomerFromSearch(customer)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(customer.phone)}
                      </p>
                    </div>
                    {customer.whatsapp_valid === true && (
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    )}
                    {customer.whatsapp_valid === false && (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    {customer.whatsapp_valid === null && (
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>ou cole manualmente</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Maria Silva, 11999887766
      João Santos, 21988776655
      Ana Costa, 31977665544"
              value={manualContactsInput}
              onChange={(e) => setManualContactsInput(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formato: Nome, Telefone (aceita vírgula, ponto-e-vírgula ou traço como separador)
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={parseManualContacts}
            disabled={!manualContactsInput.trim()}
          >
            <Users className="h-4 w-4 mr-2" />
            Adicionar à Lista
          </Button>

          {manualContacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {manualContacts.length} contatos adicionados
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={validateManualContacts}
                  disabled={validatingManual || manualContacts.every(c => c.valid !== null)}
                >
                  {validatingManual ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Validar
                    </>
                  )}
                </Button>
              </div>

              {/* Stats de contatos manuais */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-green-500/10 rounded p-1.5">
                  <p className="font-bold text-green-600">{manualContacts.filter(c => c.valid === true).length}</p>
                  <p className="text-muted-foreground">Válidos</p>
                </div>
                <div className="bg-destructive/10 rounded p-1.5">
                  <p className="font-bold text-destructive">{manualContacts.filter(c => c.valid === false).length}</p>
                  <p className="text-muted-foreground">Inválidos</p>
                </div>
                <div className="bg-secondary rounded p-1.5">
                  <p className="font-bold">{manualContacts.filter(c => c.valid === null).length}</p>
                  <p className="text-muted-foreground">Pendentes</p>
                </div>
              </div>

              {/* Lista de contatos manuais */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {manualContacts.map((contact, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded border text-xs",
                      contact.valid === false && "opacity-50",
                      contact.selected ? "bg-primary/5 border-primary/20" : "bg-background"
                    )}
                  >
                    <Checkbox
                      checked={contact.selected}
                      onCheckedChange={() => toggleManualContact(contact.phone)}
                      disabled={contact.valid === false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(contact.phone)}
                      </p>
                    </div>
                    {contact.valid === true && (
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    )}
                    {contact.valid === false && (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    {contact.valid === null && (
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeManualContact(contact.phone)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {manualContacts.filter(c => c.selected && c.valid !== false).length > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {manualContacts.filter(c => c.selected && c.valid !== false).length} serão incluídos na campanha
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
