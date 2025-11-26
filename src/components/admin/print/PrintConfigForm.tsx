import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrintConfiguration } from "@/types/print";
import { Printer, Layout, Palette } from "lucide-react";

interface PrintConfigFormProps {
  config: Partial<PrintConfiguration>;
  onChange: (config: Partial<PrintConfiguration>) => void;
}

export function PrintConfigForm({ config, onChange }: PrintConfigFormProps) {
  const updateSections = (key: keyof PrintConfiguration['sections'], value: boolean) => {
    onChange({
      ...config,
      sections: { ...config.sections!, [key]: value }
    });
  };

  const updateStyles = (key: keyof PrintConfiguration['styles'], value: any) => {
    onChange({
      ...config,
      styles: { ...config.styles!, [key]: value }
    });
  };

  const updateCustomTexts = (key: keyof PrintConfiguration['custom_texts'], value: string) => {
    onChange({
      ...config,
      custom_texts: { ...config.custom_texts!, [key]: value }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Impressão</CardTitle>
        <CardDescription>
          Personalize como seus pedidos serão impressos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Printer className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="sections">
              <Layout className="h-4 w-4 mr-2" />
              Seções
            </TabsTrigger>
            <TabsTrigger value="styles">
              <Palette className="h-4 w-4 mr-2" />
              Estilos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select 
                value={config.document_type}
                onValueChange={(value) => onChange({ ...config, document_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">Pedido Completo</SelectItem>
                  <SelectItem value="kitchen">Cozinha</SelectItem>
                  <SelectItem value="delivery">Entregador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Impressora</Label>
              <Select 
                value={config.print_type}
                onValueChange={(value) => onChange({ ...config, print_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal_58mm">Térmica 58mm</SelectItem>
                  <SelectItem value="thermal_80mm">Térmica 80mm</SelectItem>
                  <SelectItem value="a4">A4 (Impressora Comum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Texto do Cabeçalho</Label>
              <Textarea
                placeholder="Ex: WhatsApp: (00) 0000-0000"
                value={config.custom_texts?.headerText || ''}
                onChange={(e) => updateCustomTexts('headerText', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Texto do Rodapé</Label>
              <Textarea
                placeholder="Ex: Obrigado pela preferência!"
                value={config.custom_texts?.footerText || ''}
                onChange={(e) => updateCustomTexts('footerText', e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecione quais seções devem aparecer na impressão
            </p>

            {Object.entries(config.sections || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="capitalize">
                  {key === 'orderInfo' && 'Dados do Pedido'}
                  {key === 'customerInfo' && 'Dados do Cliente'}
                  {key === 'header' && 'Cabeçalho'}
                  {key === 'items' && 'Itens'}
                  {key === 'totals' && 'Totais'}
                  {key === 'payment' && 'Pagamento'}
                  {key === 'footer' && 'Rodapé'}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => updateSections(key as any, checked)}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="styles" className="space-y-4">
            <div className="space-y-2">
              <Label>Tamanho da Fonte</Label>
              <Select 
                value={config.styles?.fontSize}
                onValueChange={(value) => updateStyles('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Fonte</Label>
              <Select 
                value={config.styles?.fontFamily}
                onValueChange={(value) => updateStyles('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monospace">Monospace (Cupom Fiscal)</SelectItem>
                  <SelectItem value="sans-serif">Sans Serif (Moderna)</SelectItem>
                  <SelectItem value="serif">Serif (Clássica)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento do Cabeçalho</Label>
              <Select 
                value={config.styles?.headerAlign}
                onValueChange={(value) => updateStyles('headerAlign', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento dos Itens</Label>
              <Select 
                value={config.styles?.itemsAlign}
                onValueChange={(value) => updateStyles('itemsAlign', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Títulos em Negrito</Label>
              <Switch
                checked={config.styles?.boldTitles}
                onCheckedChange={(checked) => updateStyles('boldTitles', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Linhas Separadoras</Label>
              <Switch
                checked={config.styles?.showSeparators}
                onCheckedChange={(checked) => updateStyles('showSeparators', checked)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
