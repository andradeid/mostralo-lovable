import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PrintConfiguration } from "@/types/print";
import { PrintConfigForm } from "@/components/admin/print/PrintConfigForm";
import { PrintPreview } from "@/components/admin/print/PrintPreview";
import { PrintTemplates } from "@/components/admin/print/PrintTemplates";
import { Save, Download, Loader2, Info, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CutMethodSelector } from "@/components/admin/print/CutMethodSelector";
import { QZTraySetup } from "@/components/admin/print/QZTraySetup";
import { useState as useStateLocal } from "react";

export default function PrintConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("Minha Loja");
  const [autoPrint, setAutoPrint] = useState(false);
  const [cutMethod, setCutMethod] = useState<'driver' | 'visual' | 'qz_tray'>('visual');
  const [qzPrinter, setQzPrinter] = useState<string>('');
  const [showQZConfig, setShowQZConfig] = useStateLocal(false);
  
  const [config, setConfig] = useState<Partial<PrintConfiguration>>({
    document_type: "complete",
    print_type: "thermal_80mm",
    sections: {
      header: true,
      orderInfo: true,
      customerInfo: true,
      items: true,
      totals: true,
      payment: true,
      footer: true,
    },
    styles: {
      fontSize: "medium",
      fontFamily: "monospace",
      headerAlign: "center",
      itemsAlign: "left",
      boldTitles: true,
      showSeparators: true,
    },
    custom_texts: {
      headerText: "",
      footerText: "Obrigado pela preferência!",
    },
    print_copies: {
      complete: true,
      kitchen: false,
      delivery: false,
    },
    is_active: true,
  });

  useEffect(() => {
    loadStoreInfo();
  }, []);

  useEffect(() => {
    if (storeId && config.document_type && config.print_type) {
      loadConfig();
    }
  }, [storeId, config.document_type, config.print_type]);

  const loadStoreInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();

      if (stores) {
        setStoreId(stores.id);
        setStoreName(stores.name);
      }
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
    }
  };

  const loadConfig = async () => {
    if (!storeId || !config.document_type || !config.print_type) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('print_configurations')
        .select('*')
        .eq('store_id', storeId)
        .eq('document_type', config.document_type)
        .eq('print_type', config.print_type)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          store_id: data.store_id,
          document_type: data.document_type as any,
          print_type: data.print_type as any,
          sections: data.sections as any,
          styles: data.styles as any,
          custom_texts: data.custom_texts as any,
          print_copies: (data as any).print_copies || {
            complete: true,
            kitchen: false,
            delivery: false,
          },
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
        setAutoPrint((data as any).auto_print_on_accept || false);
        setCutMethod((data as any).cut_method || 'visual');
        setQzPrinter((data as any).qz_tray_printer || '');
      }
    } catch (error: any) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) {
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        store_id: storeId,
        document_type: config.document_type!,
        print_type: config.print_type!,
        sections: config.sections as any,
        styles: config.styles as any,
        custom_texts: config.custom_texts as any,
        print_copies: config.print_copies as any,
        is_active: config.is_active ?? true,
        auto_print_on_accept: autoPrint,
        cut_method: cutMethod,
        qz_tray_printer: qzPrinter,
      };

      const { error } = await supabase
        .from('print_configurations')
        .upsert(payload, {
          onConflict: 'store_id,document_type,print_type'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Configuração de impressão salva com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (template: Partial<PrintConfiguration>) => {
    setConfig({ ...config, ...template });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const previewElement = document.querySelector('.print-preview-content');
      if (previewElement) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Impressão - ${storeName}</title>
              <style>
                @page { margin: 0; }
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: monospace;
                }
                @media print {
                  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${previewElement.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Impressão</h1>
          <p className="text-muted-foreground">
            Configure como seus pedidos serão impressos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handlePrint} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Imprimir Teste
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <PrintTemplates onSelectTemplate={handleTemplateSelect} />

        {/* Seleção de Vias */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Vias de Impressão</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione quais vias deseja imprimir automaticamente
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="complete"
                  checked={config.print_copies?.complete}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      print_copies: {
                        ...config.print_copies!,
                        complete: checked as boolean,
                      },
                    })
                  }
                />
                <label htmlFor="complete" className="cursor-pointer flex-1">
                  <div className="font-medium">Via Completa</div>
                  <p className="text-sm text-muted-foreground">
                    Pedido completo com todos os dados (arquivo, controle)
                  </p>
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="kitchen"
                  checked={config.print_copies?.kitchen}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      print_copies: {
                        ...config.print_copies!,
                        kitchen: checked as boolean,
                      },
                    })
                  }
                />
                <label htmlFor="kitchen" className="cursor-pointer flex-1">
                  <div className="font-medium">Via Cozinha</div>
                  <p className="text-sm text-muted-foreground">
                    Apenas itens e observações (sem valores financeiros)
                  </p>
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="delivery"
                  checked={config.print_copies?.delivery}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      print_copies: {
                        ...config.print_copies!,
                        delivery: checked as boolean,
                      },
                    })
                  }
                />
                <label htmlFor="delivery" className="cursor-pointer flex-1">
                  <div className="font-medium">Via Entregador</div>
                  <p className="text-sm text-muted-foreground">
                    Endereço e itens (telefone oculto para segurança)
                  </p>
                </label>
              </div>
            </div>
            
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <strong>🔒 Segurança:</strong> O telefone do cliente é automaticamente 
                ocultado na via do entregador por questões de privacidade e proteção de dados (LGPD).
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        {/* Impressão Automática */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-print" className="text-base font-semibold">
                  Impressão Automática ao Aceitar Pedido
                </Label>
                <p className="text-sm text-muted-foreground">
                  Abre automaticamente o diálogo de impressão quando você aceitar um novo pedido
                </p>
              </div>
              <Switch
                id="auto-print"
                checked={autoPrint}
                onCheckedChange={setAutoPrint}
              />
            </div>
            
            {autoPrint && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Como funciona:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Ao aceitar um pedido, todas as vias selecionadas acima serão impressas automaticamente</li>
                    <li>As vias saem em sequência com quebra de página</li>
                    <li>Você pode confirmar ou cancelar a impressão</li>
                    <li>O pedido seguirá para "Em Preparo" independente da impressão</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Método de Corte */}
        <CutMethodSelector
          value={cutMethod}
          onChange={setCutMethod}
          onConfigureQZ={() => setShowQZConfig(!showQZConfig)}
        />

        {/* QZ Tray Setup (condicional) */}
        {cutMethod === 'qz_tray' && showQZConfig && (
          <QZTraySetup
            selectedPrinter={qzPrinter}
            onPrinterSelect={setQzPrinter}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrintConfigForm
            config={config}
            onChange={setConfig}
          />

          <PrintPreview
            config={config}
            storeName={storeName}
          />
        </div>
      </div>
    </div>
  );
}
