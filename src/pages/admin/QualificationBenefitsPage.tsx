import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Save, Zap, Scale, Briefcase, History, Calculator, Gift, Tag, RefreshCw, Eye, Copy, Check, Pencil, X } from 'lucide-react';
import { ScrollBar } from '@/components/ui/scroll-area';
import { useQualificationTiers } from '@/hooks/useQualificationTiers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function QualificationBenefitsPage() {
  const { 
    tiers, 
    templates, 
    history, 
    promotions, 
    loading, 
    saving, 
    updateTier, 
    applyTemplate,
    getPromotionById 
  } = useQualificationTiers();

  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [simulatedRevenue, setSimulatedRevenue] = useState<number>(15000);
  const [copiedPreview, setCopiedPreview] = useState<'table' | 'script' | null>(null);

  // Gera preview do prompt em tempo real
  const generateTierPreview = () => {
    if (!editValues.tier_name) return null;
    
    const promotion = editValues.promotion_id && editValues.promotion_id !== 'none' 
      ? promotions.find(p => p.id === editValues.promotion_id) 
      : null;
    
    const planPrice = 397.90;
    const ifoodTax = simulatedRevenue * 0.25;
    const monthlyEconomy = ifoodTax - planPrice;
    const freeDaysValue = (planPrice / 30) * (editValues.free_days || 0);
    
    let couponText = '';
    let couponValue = 0;
    if (promotion) {
      if (promotion.discount_type === 'percentage') {
        couponValue = planPrice * (promotion.discount_value / 100);
        couponText = `+ cupom ${promotion.code || promotion.name} (${promotion.discount_value}% OFF)`;
      } else {
        couponValue = promotion.discount_value;
        couponText = `+ cupom ${promotion.code || promotion.name} (${formatCurrency(promotion.discount_value)} OFF)`;
      }
    }
    
    const benefits = [];
    if (editValues.free_days > 0) benefits.push(`${editValues.free_days} dias grátis`);
    if (editValues.include_consulting) benefits.push('consultoria personalizada');
    if (editValues.include_followup) benefits.push(`${editValues.followup_days}d de acompanhamento`);
    if (couponText) benefits.push(couponText);
    
    const benefitText = benefits.length > 0 ? benefits.join(' + ') : 'benefício padrão';
    
    const tableRow = `| ${editValues.emoji || '⭐'} ${editValues.tier_name} | ${editValues.min_points || 0}-${editValues.max_points || 0} pts | ${benefitText} |`;
    
    const totalEconomy = monthlyEconomy + freeDaysValue + couponValue;
    
    const agentScript = `🎯 **Para leads ${editValues.tier_name}** (${editValues.min_points}-${editValues.max_points} pontos):

"Olha, com base no que você me contou, você se qualificou para nossa faixa ${editValues.emoji || '⭐'} ${editValues.tier_name}!

Isso significa que você vai receber: ${benefitText}.

Com um faturamento de ${formatCurrency(simulatedRevenue)}/mês, você está deixando ${formatCurrency(ifoodTax)}/mês no iFood. 
Com a Mostralo, são apenas ${formatCurrency(planPrice)}/mês - uma economia de ${formatCurrency(monthlyEconomy)}/mês!
${freeDaysValue > 0 ? `\nMais os ${editValues.free_days} dias grátis: ${formatCurrency(freeDaysValue)} de economia adicional.` : ''}
${couponValue > 0 ? `\nE com o cupom: mais ${formatCurrency(couponValue)} de desconto!` : ''}

**Economia total no primeiro ano: ${formatCurrency(totalEconomy * 12 + freeDaysValue + couponValue)}**"`;

    return { tableRow, agentScript };
  };

  const copyToClipboard = async (text: string, type: 'table' | 'script') => {
    await navigator.clipboard.writeText(text);
    setCopiedPreview(type);
    setTimeout(() => setCopiedPreview(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const startEditing = (tier: any) => {
    setEditingTierId(tier.id);
    setEditValues({
      tier_name: tier.tier_name,
      min_points: tier.min_points,
      max_points: tier.max_points,
      emoji: tier.emoji,
      benefit_description: tier.benefit_description,
      free_days: tier.free_days,
      include_consulting: tier.include_consulting,
      include_followup: tier.include_followup,
      followup_days: tier.followup_days,
      promotion_id: tier.promotion_id || 'none',
    });
  };

  const cancelEditing = () => {
    setEditingTierId(null);
    setEditValues({});
  };

  const saveEditing = async () => {
    if (!editingTierId) return;
    
    const updates = {
      ...editValues,
      promotion_id: editValues.promotion_id === 'none' ? null : editValues.promotion_id,
    };
    
    const success = await updateTier(editingTierId, updates);
    if (success) {
      setEditingTierId(null);
      setEditValues({});
    }
  };

  const handleApplyTemplate = async (template: any) => {
    await applyTemplate(template);
  };

  // Cálculo de economia
  const calculateEconomy = (tier: any) => {
    const ifoodTax = simulatedRevenue * 0.25;
    const planPrice = 397.90;
    const monthlyEconomy = ifoodTax - planPrice;
    const yearlyEconomy = monthlyEconomy * 12;
    
    const freeDaysValue = (planPrice / 30) * (tier.free_days || 0);
    const promotion = getPromotionById(tier.promotion_id);
    let couponValue = 0;
    
    if (promotion) {
      if (promotion.discount_type === 'percentage') {
        couponValue = planPrice * (promotion.discount_value / 100);
      } else {
        couponValue = promotion.discount_value;
      }
    }

    return {
      ifoodTax,
      planPrice,
      monthlyEconomy,
      yearlyEconomy,
      freeDaysValue,
      couponValue,
      totalFirstYear: yearlyEconomy + freeDaysValue + couponValue,
    };
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'agressivo': return <Zap className="h-5 w-5 text-orange-500" />;
      case 'moderado': return <Scale className="h-5 w-5 text-blue-500" />;
      case 'conservador': return <Briefcase className="h-5 w-5 text-gray-500" />;
      default: return null;
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'agressivo': return 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20';
      case 'moderado': return 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20';
      case 'conservador': return 'bg-gray-500/10 border-gray-500/30 hover:bg-gray-500/20';
      default: return '';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Gift className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <span className="hidden sm:inline">Faixas de </span>Qualificação
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Configure os benefícios para cada faixa
        </p>
      </div>

      <Tabs defaultValue="tiers" className="space-y-4 md:space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="w-max md:w-auto flex md:grid md:grid-cols-4 gap-1 p-1">
            <TabsTrigger value="tiers" className="shrink-0 text-xs md:text-sm px-2.5 md:px-4 py-2 gap-1 md:gap-2">
              <Gift className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Faixas</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="shrink-0 text-xs md:text-sm px-2.5 md:px-4 py-2 gap-1 md:gap-2">
              <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="shrink-0 text-xs md:text-sm px-2.5 md:px-4 py-2 gap-1 md:gap-2">
              <Calculator className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Calc.</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="shrink-0 text-xs md:text-sm px-2.5 md:px-4 py-2 gap-1 md:gap-2">
              <History className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Hist.</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="md:hidden" />
        </ScrollArea>

        {/* TAB: FAIXAS */}
        <TabsContent value="tiers" className="space-y-3 md:space-y-4">
          <div className="grid gap-3 md:gap-4">
            {tiers.map((tier) => {
              const isEditing = editingTierId === tier.id;
              const promotion = getPromotionById(tier.promotion_id);
              
              return (
                <Card key={tier.id} className={isEditing ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <span className="text-xl md:text-2xl shrink-0">{tier.emoji}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-base md:text-lg truncate">{tier.tier_name}</CardTitle>
                          <CardDescription className="text-xs md:text-sm">
                            {tier.min_points} - {tier.max_points} pts
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {promotion && (
                          <Badge variant="secondary" className="text-[10px] md:text-xs gap-1 shrink-0">
                            <Tag className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            <span className="hidden sm:inline">{promotion.code || promotion.name}</span>
                            <span className="sm:hidden">{(promotion.code || promotion.name).slice(0, 6)}</span>
                          </Badge>
                        )}
                        
                        {!isEditing ? (
                          <Button variant="outline" size="sm" onClick={() => startEditing(tier)} className="h-7 md:h-8 text-xs md:text-sm">
                            <Pencil className="h-3.5 w-3.5 md:mr-1" />
                            <span className="hidden md:inline">Editar</span>
                          </Button>
                        ) : (
                          <div className="flex gap-1.5 md:gap-2">
                            <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-7 md:h-8 text-xs">
                              <X className="h-3.5 w-3.5 md:mr-1" />
                              <span className="hidden sm:inline">Cancelar</span>
                            </Button>
                            <Button size="sm" onClick={saveEditing} disabled={saving} className="h-7 md:h-8 text-xs">
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 md:mr-1" />}
                              <span className="hidden sm:inline">Salvar</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 md:p-6 pt-0">
                    {!isEditing ? (
                      <div className="space-y-2 md:space-y-3">
                        <p className="text-xs md:text-sm">{tier.benefit_description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {tier.free_days > 0 && (
                            <Badge variant="outline" className="text-[10px] md:text-xs">{tier.free_days}d grátis</Badge>
                          )}
                          {tier.include_consulting && (
                            <Badge variant="outline" className="text-[10px] md:text-xs">Consultoria</Badge>
                          )}
                          {tier.include_followup && (
                            <Badge variant="outline" className="text-[10px] md:text-xs">{tier.followup_days}d acomp.</Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs md:text-sm">Nome</Label>
                          <Input
                            className="h-8 md:h-10 text-sm"
                            value={editValues.tier_name || ''}
                            onChange={(e) => setEditValues({ ...editValues, tier_name: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs md:text-sm">Emoji</Label>
                          <Input
                            className="h-8 md:h-10 text-sm"
                            value={editValues.emoji || ''}
                            onChange={(e) => setEditValues({ ...editValues, emoji: e.target.value })}
                            maxLength={4}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs md:text-sm">Pts Mín.</Label>
                          <Input
                            type="number"
                            className="h-8 md:h-10 text-sm"
                            value={editValues.min_points || 0}
                            onChange={(e) => setEditValues({ ...editValues, min_points: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs md:text-sm">Pts Máx.</Label>
                          <Input
                            type="number"
                            className="h-8 md:h-10 text-sm"
                            value={editValues.max_points || 0}
                            onChange={(e) => setEditValues({ ...editValues, max_points: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs md:text-sm">Dias Grátis</Label>
                          <Input
                            type="number"
                            className="h-8 md:h-10 text-sm"
                            value={editValues.free_days || 0}
                            onChange={(e) => setEditValues({ ...editValues, free_days: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs md:text-sm">Dias Acomp.</Label>
                          <Input
                            type="number"
                            className="h-8 md:h-10 text-sm"
                            value={editValues.followup_days || 0}
                            onChange={(e) => setEditValues({ ...editValues, followup_days: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="col-span-2 md:col-span-3 space-y-1.5">
                          <Label className="text-xs md:text-sm">Descrição</Label>
                          <Textarea
                            className="text-sm min-h-[60px] md:min-h-[80px]"
                            value={editValues.benefit_description || ''}
                            onChange={(e) => setEditValues({ ...editValues, benefit_description: e.target.value })}
                          />
                        </div>
                        
                        <div className="col-span-2 md:col-span-1 space-y-1.5">
                          <Label className="text-xs md:text-sm">Cupom</Label>
                          <Select
                            value={editValues.promotion_id || 'none'}
                            onValueChange={(val) => setEditValues({ ...editValues, promotion_id: val })}
                          >
                            <SelectTrigger className="h-8 md:h-10 text-sm">
                              <SelectValue placeholder="Cupom" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs md:text-sm">Nenhum</SelectItem>
                              {promotions.map((promo) => (
                                <SelectItem key={promo.id} value={promo.id} className="text-xs md:text-sm">
                                  {promo.name} ({promo.discount_type === 'percentage' ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2 md:col-span-3 flex flex-wrap items-center gap-3 md:gap-4 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editValues.include_consulting || false}
                              onCheckedChange={(val) => setEditValues({ ...editValues, include_consulting: val })}
                            />
                            <Label className="text-xs md:text-sm">Consultoria</Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editValues.include_followup || false}
                              onCheckedChange={(val) => setEditValues({ ...editValues, include_followup: val })}
                            />
                            <Label className="text-xs md:text-sm">Acompanhamento</Label>
                          </div>
                        </div>

                        {/* PREVIEW EM TEMPO REAL */}
                        {generateTierPreview() && (
                          <div className="col-span-2 md:col-span-3 mt-3 md:mt-4 border-t pt-3 md:pt-4">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                              <span className="font-medium text-xs md:text-sm">Preview</span>
                              <Badge variant="secondary" className="text-[10px] md:text-xs">Real-time</Badge>
                            </div>
                            
                            <Tabs defaultValue="table" className="w-full">
                              <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="table" className="text-[10px] md:text-xs h-7">Tabela</TabsTrigger>
                                <TabsTrigger value="script" className="text-[10px] md:text-xs h-7">Script</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="table" className="mt-2">
                                <div className="relative">
                                  <pre className="bg-muted/50 border rounded-md p-2 md:p-3 text-[10px] md:text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                    {generateTierPreview()?.tableRow}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(generateTierPreview()?.tableRow || '', 'table')}
                                  >
                                    {copiedPreview === 'table' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="script" className="mt-2">
                                <div className="relative">
                                  <pre className="bg-muted/50 border rounded-md p-2 md:p-3 text-[10px] md:text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-48 md:max-h-64 overflow-y-auto">
                                    {generateTierPreview()?.agentScript}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(generateTierPreview()?.agentScript || '', 'script')}
                                  >
                                    {copiedPreview === 'script' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB: TEMPLATES */}
        <TabsContent value="templates" className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Templates Pré-definidos</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Aplique configurações prontas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all ${getTemplateColor(template.template_type)}`}
                  >
                    <CardHeader className="p-3 md:p-4 pb-2">
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.template_type)}
                        <CardTitle className="text-sm md:text-base truncate">{template.template_name}</CardTitle>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Padrão</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0 space-y-3">
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                      
                      <div className="space-y-0.5 text-[10px] md:text-xs">
                        {(template.tier_configs as any[]).slice(0, 3).map((config, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{config.emoji} {config.tier_name}</span>
                            <span className="text-muted-foreground">{config.free_days}d</span>
                          </div>
                        ))}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                            Aplicar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base md:text-lg">Aplicar "{template.template_name}"?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs md:text-sm">
                              Isso irá sobrescrever todas as 5 faixas. Cupons não serão alterados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="text-xs md:text-sm">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleApplyTemplate(template)} className="text-xs md:text-sm">
                              Aplicar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CALCULADORA */}
        <TabsContent value="calculator" className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Calculadora de Economia
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Simule a economia por faixa
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 md:gap-4">
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <Label className="text-xs md:text-sm">Faturamento Mensal</Label>
                  <Input
                    type="number"
                    value={simulatedRevenue}
                    onChange={(e) => setSimulatedRevenue(Number(e.target.value))}
                    placeholder="Ex: 15000"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>
                <div className="p-2 md:pb-2 bg-destructive/10 rounded-lg">
                  <p className="text-xs md:text-sm text-destructive font-medium">
                    Taxa iFood (25%): {formatCurrency(simulatedRevenue * 0.25)}/mês
                  </p>
                </div>
              </div>
              
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {tiers.filter(t => t.free_days > 0).map((tier) => {
                  const economy = calculateEconomy(tier);
                  const promotion = getPromotionById(tier.promotion_id);
                  
                  return (
                    <Card key={tier.id} className="bg-muted/30">
                      <CardHeader className="p-3 md:p-4 pb-2">
                        <CardTitle className="text-sm md:text-base flex items-center gap-2">
                          <span>{tier.emoji}</span>
                          {tier.tier_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 pt-0 space-y-1.5 text-xs md:text-sm">
                        <div className="flex justify-between">
                          <span>Economia/mês:</span>
                          <span className="font-medium text-green-600">{formatCurrency(economy.monthlyEconomy)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Economia/ano:</span>
                          <span className="font-medium text-green-600">{formatCurrency(economy.yearlyEconomy)}</span>
                        </div>
                        <hr className="my-1.5" />
                        <div className="flex justify-between">
                          <span>{tier.free_days}d grátis:</span>
                          <span className="font-medium">{formatCurrency(economy.freeDaysValue)}</span>
                        </div>
                        {promotion && (
                          <div className="flex justify-between">
                            <span className="truncate mr-2">Cupom {(promotion.code || promotion.name).slice(0, 8)}:</span>
                            <span className="font-medium">{formatCurrency(economy.couponValue)}</span>
                          </div>
                        )}
                        <hr className="my-1.5" />
                        <div className="flex justify-between font-bold">
                          <span>Total 1º ano:</span>
                          <span className="text-green-600">{formatCurrency(economy.totalFirstYear)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: HISTÓRICO */}
        <TabsContent value="history" className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <History className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Auditoria de modificações
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Nenhuma alteração registrada
                </p>
              ) : (
                <>
                  {/* Mobile: Cards */}
                  <ScrollArea className="h-[400px] md:hidden">
                    <div className="space-y-3 pr-2">
                      {history.map((item) => (
                        <div key={item.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.edited_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </span>
                            <Badge 
                              variant={item.change_type === 'template_apply' ? 'default' : 'outline'}
                              className="text-[10px]"
                            >
                              {item.change_type === 'template_apply' 
                                ? `Tmpl: ${item.template_applied?.slice(0, 8)}` 
                                : item.change_type}
                            </Badge>
                          </div>
                          
                          {item.new_values && (
                            <div className="bg-muted/50 rounded p-2">
                              <code className="text-[10px] break-all">
                                {JSON.stringify(item.new_values).slice(0, 100)}...
                              </code>
                            </div>
                          )}
                          
                          {item.promotion_changed && (
                            <Badge variant="secondary" className="text-[10px]">
                              Cupom alterado
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Desktop: Tabela */}
                  <ScrollArea className="h-[500px] hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">Alterações</TableHead>
                          <TableHead className="text-xs">Cupom</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {format(new Date(item.edited_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.change_type === 'template_apply' ? 'default' : 'outline'} className="text-xs">
                                {item.change_type === 'template_apply' ? `Template: ${item.template_applied}` : item.change_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              {item.new_values && (
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {JSON.stringify(item.new_values).slice(0, 80)}...
                                </code>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.promotion_changed ? (
                                <Badge variant="secondary" className="text-xs">Sim</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
