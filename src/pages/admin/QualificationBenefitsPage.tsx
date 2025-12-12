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
import { Loader2, Save, Zap, Scale, Briefcase, History, Calculator, Gift, Tag, RefreshCw, Eye, Copy, Check } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faixas de Qualificação</h1>
        <p className="text-muted-foreground">
          Configure os benefícios oferecidos para cada faixa de qualificação de leads
        </p>
      </div>

      <Tabs defaultValue="tiers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tiers" className="gap-2">
            <Gift className="h-4 w-4" />
            Faixas
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* TAB: FAIXAS */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="grid gap-4">
            {tiers.map((tier) => {
              const isEditing = editingTierId === tier.id;
              const promotion = getPromotionById(tier.promotion_id);
              
              return (
                <Card key={tier.id} className={isEditing ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tier.emoji}</span>
                        <div>
                          <CardTitle className="text-lg">{tier.tier_name}</CardTitle>
                          <CardDescription>
                            {tier.min_points} - {tier.max_points} pontos
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {promotion && (
                          <Badge variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {promotion.code || promotion.name}
                          </Badge>
                        )}
                        
                        {!isEditing ? (
                          <Button variant="outline" size="sm" onClick={() => startEditing(tier)}>
                            Editar
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={cancelEditing}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={saveEditing} disabled={saving}>
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              Salvar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {!isEditing ? (
                      <div className="space-y-3">
                        <p className="text-sm">{tier.benefit_description}</p>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {tier.free_days > 0 && (
                            <Badge variant="outline">{tier.free_days} dias grátis</Badge>
                          )}
                          {tier.include_consulting && (
                            <Badge variant="outline">Consultoria</Badge>
                          )}
                          {tier.include_followup && (
                            <Badge variant="outline">{tier.followup_days}d acompanhamento</Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Nome da Faixa</Label>
                          <Input
                            value={editValues.tier_name || ''}
                            onChange={(e) => setEditValues({ ...editValues, tier_name: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Emoji</Label>
                          <Input
                            value={editValues.emoji || ''}
                            onChange={(e) => setEditValues({ ...editValues, emoji: e.target.value })}
                            maxLength={4}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Pontuação Mínima</Label>
                          <Input
                            type="number"
                            value={editValues.min_points || 0}
                            onChange={(e) => setEditValues({ ...editValues, min_points: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Pontuação Máxima</Label>
                          <Input
                            type="number"
                            value={editValues.max_points || 0}
                            onChange={(e) => setEditValues({ ...editValues, max_points: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Dias Grátis</Label>
                          <Input
                            type="number"
                            value={editValues.free_days || 0}
                            onChange={(e) => setEditValues({ ...editValues, free_days: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Dias de Acompanhamento</Label>
                          <Input
                            type="number"
                            value={editValues.followup_days || 0}
                            onChange={(e) => setEditValues({ ...editValues, followup_days: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label>Descrição do Benefício</Label>
                          <Textarea
                            value={editValues.benefit_description || ''}
                            onChange={(e) => setEditValues({ ...editValues, benefit_description: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Cupom/Promoção</Label>
                          <Select
                            value={editValues.promotion_id || 'none'}
                            onValueChange={(val) => setEditValues({ ...editValues, promotion_id: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cupom" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum cupom</SelectItem>
                              {promotions.map((promo) => (
                                <SelectItem key={promo.id} value={promo.id}>
                                  {promo.name} ({promo.discount_type === 'percentage' ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-4 md:col-span-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editValues.include_consulting || false}
                              onCheckedChange={(val) => setEditValues({ ...editValues, include_consulting: val })}
                            />
                            <Label>Consultoria</Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editValues.include_followup || false}
                              onCheckedChange={(val) => setEditValues({ ...editValues, include_followup: val })}
                            />
                            <Label>Acompanhamento</Label>
                          </div>
                        </div>

                        {/* PREVIEW EM TEMPO REAL */}
                        {generateTierPreview() && (
                          <div className="md:col-span-3 mt-4 border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Preview do Prompt</span>
                              <Badge variant="secondary" className="text-xs">Tempo Real</Badge>
                            </div>
                            
                            <Tabs defaultValue="table" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="table" className="text-xs">Tabela</TabsTrigger>
                                <TabsTrigger value="script" className="text-xs">Script do Agente</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="table" className="mt-2">
                                <div className="relative">
                                  <pre className="bg-muted/50 border rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                    {generateTierPreview()?.tableRow}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-7 w-7 p-0"
                                    onClick={() => copyToClipboard(generateTierPreview()?.tableRow || '', 'table')}
                                  >
                                    {copiedPreview === 'table' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="script" className="mt-2">
                                <div className="relative">
                                  <pre className="bg-muted/50 border rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                                    {generateTierPreview()?.agentScript}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-7 w-7 p-0"
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
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates Pré-definidos</CardTitle>
              <CardDescription>
                Aplique configurações prontas para todas as faixas de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all ${getTemplateColor(template.template_type)}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.template_type)}
                        <CardTitle className="text-base">{template.template_name}</CardTitle>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">Padrão</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="space-y-1 text-xs">
                        {(template.tier_configs as any[]).slice(0, 3).map((config, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{config.emoji} {config.tier_name}</span>
                            <span className="text-muted-foreground">{config.free_days}d grátis</span>
                          </div>
                        ))}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            Aplicar Template
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Aplicar template "{template.template_name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá sobrescrever as configurações atuais de todas as 5 faixas.
                              Os cupons vinculados não serão alterados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleApplyTemplate(template)}>
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
        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Economia</CardTitle>
              <CardDescription>
                Simule a economia para cada faixa baseado no faturamento do lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="space-y-2 flex-1 max-w-xs">
                  <Label>Faturamento Mensal do Lead</Label>
                  <Input
                    type="number"
                    value={simulatedRevenue}
                    onChange={(e) => setSimulatedRevenue(Number(e.target.value))}
                    placeholder="Ex: 15000"
                  />
                </div>
                <p className="text-sm text-muted-foreground pb-2">
                  Taxa iFood (25%): {formatCurrency(simulatedRevenue * 0.25)}/mês
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tiers.filter(t => t.free_days > 0).map((tier) => {
                  const economy = calculateEconomy(tier);
                  const promotion = getPromotionById(tier.promotion_id);
                  
                  return (
                    <Card key={tier.id} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span>{tier.emoji}</span>
                          {tier.tier_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Economia mensal em taxas:</span>
                          <span className="font-medium text-green-600">{formatCurrency(economy.monthlyEconomy)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Economia anual:</span>
                          <span className="font-medium text-green-600">{formatCurrency(economy.yearlyEconomy)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between">
                          <span>{tier.free_days} dias grátis:</span>
                          <span className="font-medium">{formatCurrency(economy.freeDaysValue)}</span>
                        </div>
                        {promotion && (
                          <div className="flex justify-between">
                            <span>Cupom {promotion.code || promotion.name}:</span>
                            <span className="font-medium">{formatCurrency(economy.couponValue)}</span>
                          </div>
                        )}
                        <hr className="my-2" />
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
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
              <CardDescription>
                Auditoria de todas as modificações nas faixas de benefícios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Alterações</TableHead>
                      <TableHead>Cupom Alterado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhuma alteração registrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(item.edited_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.change_type === 'template_apply' ? 'default' : 'outline'}>
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
                              <Badge variant="secondary">Sim</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
