import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Clipboard, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportTabProps {
  storeId: string;
  instance: {
    instance_name: string;
  };
  onRefresh: () => void;
}

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

export function ImportTab({ storeId, instance, onRefresh }: ImportTabProps) {
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [manualNumbers, setManualNumbers] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    fetchLabels();
  }, [storeId]);

  const fetchLabels = async () => {
    const { data } = await supabase
      .from('whatsapp_contact_labels')
      .select('id, name, color')
      .eq('store_id', storeId);
    
    setLabels(data || []);
  };

  const parseManualNumbers = (): string[] => {
    return manualNumbers
      .split(/[\n,;]/)
      .map(n => n.trim().replace(/\D/g, ''))
      .filter(n => n.length >= 10);
  };

  const parseCSV = async (file: File): Promise<Array<{ phone_number: string; name?: string }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(l => l.trim());
          const contacts: Array<{ phone_number: string; name?: string }> = [];

          // Detectar se tem cabeçalho
          const firstLine = lines[0].toLowerCase();
          const hasHeader = firstLine.includes('telefone') || firstLine.includes('phone') || firstLine.includes('nome');
          const startIndex = hasHeader ? 1 : 0;

          for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(/[,;]/).map(p => p.trim().replace(/"/g, ''));
            if (parts.length >= 1) {
              const phone = parts[0].replace(/\D/g, '');
              if (phone.length >= 10) {
                contacts.push({
                  phone_number: phone,
                  name: parts[1] || undefined,
                });
              }
            }
          }

          resolve(contacts);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleImportManual = async () => {
    const numbers = parseManualNumbers();
    if (numbers.length === 0) {
      toast.error('Nenhum número válido encontrado');
      return;
    }

    await importContacts(numbers.map(n => ({ phone_number: n })), 'manual');
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    try {
      const contacts = await parseCSV(csvFile);
      if (contacts.length === 0) {
        toast.error('Nenhum contato válido encontrado no CSV');
        return;
      }

      await importContacts(contacts, 'csv_import');
    } catch (error) {
      toast.error('Erro ao processar arquivo CSV');
    }
  };

  const importContacts = async (
    contacts: Array<{ phone_number: string; name?: string }>,
    source: string
  ) => {
    setImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'importContacts',
          store_id: storeId,
          contacts: contacts.map(c => ({
            phone_number: c.phone_number,
            name: c.name,
          })),
          label_id: selectedLabel && selectedLabel !== 'none' ? selectedLabel : undefined,
          source,
        },
      });

      if (response.error) throw response.error;

      setImportResult(response.data);
      setProgress(100);
      
      toast.success(`${response.data.imported} contatos importados!`);
      
      // Limpar campos
      setManualNumbers("");
      setCsvFile(null);
      onRefresh();
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar contatos');
    } finally {
      setImporting(false);
    }
  };

  const handleVerifyNumbers = async () => {
    const numbers = parseManualNumbers();
    if (numbers.length === 0) {
      toast.error('Nenhum número para verificar');
      return;
    }

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'checkIsWhatsApp',
          store_id: storeId,
          instance_name: instance.instance_name,
          phone_numbers: numbers,
        },
      });

      if (response.error) throw response.error;

      const validCount = response.data.valid?.length || 0;
      toast.success(`${validCount} de ${numbers.length} números são WhatsApp válidos`);
    } catch (error) {
      console.error('Erro ao verificar:', error);
      toast.error('Erro ao verificar números');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Contatos</CardTitle>
        <CardDescription>
          Importe contatos de um arquivo CSV ou cole uma lista de números
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              Colar Números
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Importar CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Números de Telefone</Label>
              <Textarea
                placeholder="Cole os números aqui, um por linha ou separados por vírgula..."
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
                rows={8}
              />
              <p className="text-sm text-muted-foreground">
                {parseManualNumbers().length} números válidos detectados
              </p>
            </div>

            <div className="space-y-2">
              <Label>Atribuir Etiqueta (opcional)</Label>
              <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {labels.map(label => (
                    <SelectItem key={label.id} value={label.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleVerifyNumbers}
                disabled={verifying || parseManualNumbers().length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {verifying ? 'Verificando...' : 'Verificar WhatsApp'}
              </Button>
              <Button 
                onClick={handleImportManual}
                disabled={importing || parseManualNumbers().length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Arquivo CSV</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">
                    {csvFile ? csvFile.name : 'Clique para selecionar arquivo'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV com colunas: telefone, nome (opcional)
                  </p>
                </label>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Formato esperado:</p>
              <code className="text-xs bg-background p-2 rounded block">
                telefone,nome<br/>
                5511999999999,João Silva<br/>
                5511888888888,Maria Santos
              </code>
            </div>

            <div className="space-y-2">
              <Label>Atribuir Etiqueta (opcional)</Label>
              <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {labels.map(label => (
                    <SelectItem key={label.id} value={label.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleImportCSV}
              disabled={importing || !csvFile}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importando...' : 'Importar CSV'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Resultado da importação */}
        {importResult && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Importação concluída</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{importResult.imported}</p>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{importResult.errors}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{importResult.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
