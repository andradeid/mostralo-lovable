import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Send, FileText, Loader2, Check, Edit2, User, Phone, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface ProposalData {
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_company?: string;
  slug: string;
  proposal_number?: string;
  final_monthly_price: number;
  billing_cycle: string;
  payment_method?: string;
  setup_fee?: number;
  discount_percentage?: number;
  discount_amount?: number;
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência Bancária',
  permuta: 'Permuta',
  a_combinar: 'A Combinar',
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
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, name, content, category')
        .eq('category', 'proposta')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const templatesData = (data || []) as unknown as Template[];
      setTemplates(templatesData);
      
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
    const paymentMethodLabel = prop.payment_method 
      ? (PAYMENT_METHOD_LABELS[prop.payment_method] || prop.payment_method) 
      : 'A Combinar';

    return content
      // Cliente
      .replace(/\{nome\}/g, prop.client_name)
      .replace(/\{primeiro_nome\}/g, firstName)
      .replace(/\{empresa\}/g, prop.client_company || 'N/A')
      .replace(/\{email\}/g, prop.client_email || 'N/A')
      // Valores
      .replace(/\{valor_mensal\}/g, formatCurrency(prop.final_monthly_price))
      .replace(/\{valor_total\}/g, formatCurrency(totalValue))
      .replace(/\{valor_setup\}/g, prop.setup_fee ? formatCurrency(prop.setup_fee) : 'Isento')
      .replace(/\{desconto_percentual\}/g, prop.discount_percentage ? `${prop.discount_percentage}%` : '0%')
      .replace(/\{desconto_valor\}/g, prop.discount_amount ? formatCurrency(prop.discount_amount) : 'R$ 0,00')
      // Proposta
      .replace(/\{numero_proposta\}/g, prop.proposal_number || 'N/A')
      .replace(/\{ciclo_cobranca\}/g, BILLING_CYCLE_LABELS[prop.billing_cycle] || prop.billing_cycle)
      .replace(/\{forma_pagamento\}/g, paymentMethodLabel)
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] flex flex-col rounded-t-2xl p-0"
      >
        {/* Header fixo */}
        <SheetHeader className="shrink-0 px-4 pt-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4 text-green-600" />
            Enviar via WhatsApp
          </SheetTitle>
          <SheetDescription className="text-xs">
            Escolha um template e personalize
          </SheetDescription>
        </SheetHeader>

        {/* Conteúdo com scroll */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-3">
            {/* Proposal Info - Compact */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5 p-2 bg-muted rounded-lg">
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate">{proposal.client_name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-muted rounded-lg">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate">{proposal.client_phone}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-xs font-semibold text-green-600 truncate">
                  {formatCurrency(proposal.final_monthly_price)}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Template Selection - Horizontal Scroll */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Selecionar Template</Label>
                  {templates.length === 0 ? (
                    <Card className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Nenhum template de proposta encontrado.
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Acesse a aba "Templates WhatsApp" para criar.
                      </p>
                    </Card>
                  ) : (
                    <ScrollArea className="w-full" type="scroll">
                      <div className="flex gap-2 pb-1">
                        {templates.map((template) => (
                          <Card
                            key={template.id}
                            className={`p-2.5 cursor-pointer transition-all hover:bg-accent shrink-0 min-w-[120px] max-w-[150px] ${
                              selectedTemplate?.id === template.id
                                ? 'ring-2 ring-primary bg-primary/5'
                                : ''
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="font-medium text-xs truncate">{template.name}</span>
                              </div>
                              {selectedTemplate?.id === template.id && (
                                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Message Preview/Edit */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Mensagem</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs h-6 px-2"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <Textarea
                      value={previewMessage}
                      onChange={(e) => setPreviewMessage(e.target.value)}
                      className="min-h-[140px] max-h-[160px] text-xs"
                      placeholder="Digite sua mensagem..."
                    />
                  ) : (
                    <div className="bg-muted rounded-lg p-3 whitespace-pre-wrap text-xs max-h-[160px] overflow-y-auto">
                      {previewMessage || 'Selecione um template para visualizar a mensagem'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer SEMPRE visível */}
        <SheetFooter className="shrink-0 px-4 py-3 border-t bg-background">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={!previewMessage || loading}
              className="flex-1 h-10 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
