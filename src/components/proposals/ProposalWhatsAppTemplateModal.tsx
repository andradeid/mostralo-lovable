import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Send, FileText, Loader2, Check, ExternalLink, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProposalData {
  client_name: string;
  client_phone: string;
  slug: string;
  final_monthly_price: number;
  billing_cycle: string;
  valid_until?: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface ProposalWhatsAppTemplateModalProps {
  open: boolean;
  onClose: () => void;
  proposal: ProposalData | null;
}

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  biannual: 'Semestral',
  annual: 'Anual',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ProposalWhatsAppTemplateModal({ open, onClose, proposal }: ProposalWhatsAppTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  useEffect(() => {
    if (selectedTemplate && proposal) {
      const processedMessage = processTemplate(selectedTemplate.content, proposal);
      setPreviewMessage(processedMessage);
      setIsEditing(false);
    }
  }, [selectedTemplate, proposal]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Buscar templates de proposta (globais e da loja)
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, name, content, category')
        .eq('category', 'proposta')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const templatesData = (data || []) as unknown as Template[];
      setTemplates(templatesData);
      
      // Selecionar o primeiro template por padrão
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTemplate = (content: string, prop: ProposalData): string => {
    const proposalUrl = `${window.location.origin}/proposta/${prop.slug}`;
    const firstName = prop.client_name.split(' ')[0];
    
    let validityDate = 'N/A';
    if (prop.valid_until) {
      try {
        validityDate = format(new Date(prop.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      } catch (e) {
        validityDate = prop.valid_until;
      }
    }

    const billingCycleMonths = {
      monthly: 1,
      quarterly: 3,
      biannual: 6,
      annual: 12,
    }[prop.billing_cycle] || 1;

    const totalValue = prop.final_monthly_price * billingCycleMonths;

    return content
      .replace(/\{nome\}/g, prop.client_name)
      .replace(/\{primeiro_nome\}/g, firstName)
      .replace(/\{valor_mensal\}/g, formatCurrency(prop.final_monthly_price))
      .replace(/\{valor_total\}/g, formatCurrency(totalValue))
      .replace(/\{ciclo_cobranca\}/g, BILLING_CYCLE_LABELS[prop.billing_cycle] || prop.billing_cycle)
      .replace(/\{link_proposta\}/g, proposalUrl)
      .replace(/\{validade\}/g, validityDate);
  };

  const handleSendWhatsApp = () => {
    if (!proposal || !previewMessage) return;

    const encodedMessage = encodeURIComponent(previewMessage);
    const phone = proposal.client_phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            Enviar Proposta via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Selecione um template e personalize a mensagem antes de enviar
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Selecionar Template</Label>
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-2">
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum template de proposta encontrado.
                      <br />
                      <a href="/dashboard/whatsapp/templates" className="text-primary hover:underline flex items-center justify-center gap-1 mt-2">
                        Criar templates <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  ) : (
                    templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`p-3 cursor-pointer transition-all hover:bg-accent ${
                          selectedTemplate?.id === template.id
                            ? 'ring-2 ring-primary bg-primary/5'
                            : ''
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{template.name}</span>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Message Preview/Edit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mensagem</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {isEditing ? 'Cancelar edição' : 'Personalizar'}
                </Button>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={previewMessage}
                  onChange={(e) => setPreviewMessage(e.target.value)}
                  rows={8}
                  placeholder="Digite sua mensagem..."
                />
              ) : (
                <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">
                  {previewMessage || 'Selecione um template para visualizar a mensagem'}
                </div>
              )}
            </div>

            {/* Proposal Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{proposal.client_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{proposal.client_phone}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <Badge variant="outline" className="font-medium">
                  {formatCurrency(proposal.final_monthly_price)}/mês
                </Badge>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            disabled={!previewMessage || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
