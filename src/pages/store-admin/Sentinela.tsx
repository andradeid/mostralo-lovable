import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useSentinela } from "@/hooks/useSentinela";
import { useStoreModules } from "@/hooks/useStoreModules";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Bell, BellOff, Calendar, CheckCircle2, Clock, Eye, MessageSquare, Package, Plus, RefreshCw, Settings, Target, Trash2, TrendingUp, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DEFAULT_TEMPLATE = `Olá {primeiro_nome}! 👋

Lembrete amigável da {loja}! 

Seu *{produto}* deve estar acabando, né? 🏃‍♂️

🛒 Aproveite para repor agora:
{link_loja}

Qualquer dúvida, é só chamar! 💬`;

const RECURRENCE_OPTIONS = [
  { value: 7, label: '7 dias (semanal)' },
  { value: 15, label: '15 dias (quinzenal)' },
  { value: 30, label: '30 dias (mensal)' },
  { value: 45, label: '45 dias' },
  { value: 60, label: '60 dias (bimestral)' },
  { value: 90, label: '90 dias (trimestral)' },
];

export default function Sentinela() {
  const { storeId } = useStoreAccess();
  const { 
    storeConfig, 
    rules, 
    reminders, 
    stats, 
    isLoading,
    updateConfig,
    createRule,
    updateRule,
    deleteRule,
    cancelReminder
  } = useSentinela(storeId || null);

  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [template, setTemplate] = useState(storeConfig?.sentinela_default_template || DEFAULT_TEMPLATE);

  // Buscar produtos da loja
  const { data: products } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  // Buscar categorias da loja
  const { data: categories } = useQuery({
    queryKey: ['store-categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  // State para novo regra
  const [newRule, setNewRule] = useState({
    type: 'product' as 'product' | 'category',
    product_id: '',
    category_id: '',
    recurrence_days: 30,
    reminder_days_before: 3,
    message_template: ''
  });

  const handleToggleEnabled = () => {
    updateConfig.mutate({ 
      sentinela_enabled: !storeConfig?.sentinela_enabled 
    });
  };

  const handleSaveTemplate = () => {
    updateConfig.mutate({ sentinela_default_template: template });
    setEditingTemplate(false);
  };

  const handleCreateRule = () => {
    if (!storeId) return;

    createRule.mutate({
      store_id: storeId,
      product_id: newRule.type === 'product' ? newRule.product_id : null,
      category_id: newRule.type === 'category' ? newRule.category_id : null,
      recurrence_days: newRule.recurrence_days,
      reminder_days_before: newRule.reminder_days_before,
      message_template: newRule.message_template || null
    }, {
      onSuccess: () => {
        setIsNewRuleOpen(false);
        setNewRule({
          type: 'product',
          product_id: '',
          category_id: '',
          recurrence_days: 30,
          reminder_days_before: 3,
          message_template: ''
        });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case 'converted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><TrendingUp className="w-3 h-3 mr-1" /> Convertido</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><BellOff className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            SENTINELA
          </h1>
          <p className="text-muted-foreground">
            Lembretes inteligentes de recompra
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sentinela-enabled">Ativar SENTINELA</Label>
            <Switch
              id="sentinela-enabled"
              checked={storeConfig?.sentinela_enabled || false}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeRules}</p>
                <p className="text-sm text-muted-foreground">Regras ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReminders}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sentReminders}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="w-4 h-4" />
            Lembretes
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Template
          </TabsTrigger>
        </TabsList>

        {/* Regras */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure quando enviar lembretes de recompra para cada produto ou categoria
            </p>
            <Dialog open={isNewRuleOpen} onOpenChange={setIsNewRuleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Regra de Recompra</DialogTitle>
                  <DialogDescription>
                    Configure quando enviar lembretes para reposição de produtos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newRule.type}
                      onValueChange={(v) => setNewRule(prev => ({ ...prev, type: v as 'product' | 'category' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Produto específico</SelectItem>
                        <SelectItem value="category">Categoria inteira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRule.type === 'product' ? (
                    <div className="space-y-2">
                      <Label>Produto</Label>
                      <Select
                        value={newRule.product_id}
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, product_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={newRule.category_id}
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, category_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Ciclo de recompra</Label>
                    <Select
                      value={newRule.recurrence_days.toString()}
                      onValueChange={(v) => setNewRule(prev => ({ ...prev, recurrence_days: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Lembrar X dias antes de acabar</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={newRule.reminder_days_before}
                      onChange={(e) => setNewRule(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) || 3 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Template personalizado (opcional)</Label>
                    <Textarea
                      placeholder="Deixe em branco para usar o template padrão"
                      value={newRule.message_template}
                      onChange={(e) => setNewRule(prev => ({ ...prev, message_template: e.target.value }))}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {'{nome}'}, {'{primeiro_nome}'}, {'{produto}'}, {'{loja}'}, {'{link_loja}'}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewRuleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateRule}
                    disabled={createRule.isPending || (!newRule.product_id && !newRule.category_id)}
                  >
                    {createRule.isPending ? 'Criando...' : 'Criar Regra'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {rules && rules.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto/Categoria</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Lembrete</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{rule.product?.name || rule.category?.name || '-'}</span>
                          {rule.category_id && (
                            <Badge variant="outline" className="text-xs">Categoria</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{rule.recurrence_days} dias</TableCell>
                      <TableCell>{rule.reminder_days_before} dias antes</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma regra configurada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie regras para começar a enviar lembretes de recompra
                </p>
                <Button onClick={() => setIsNewRuleOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira regra
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lembretes */}
        <TabsContent value="reminders" className="space-y-4">
          {reminders && reminders.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Agendado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reminder.customer?.name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{reminder.customer?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reminder.product?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(reminder.scheduled_for), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reminder.status)}</TableCell>
                      <TableCell className="text-right">
                        {reminder.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelReminder.mutate(reminder.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                        {reminder.message_sent && (
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum lembrete ainda</p>
                <p className="text-sm text-muted-foreground">
                  Os lembretes aparecerão aqui quando forem agendados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Template */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Template Padrão de Mensagem
              </CardTitle>
              <CardDescription>
                Esta mensagem será usada quando uma regra não tiver template personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
                disabled={!editingTemplate}
              />
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <ul className="grid grid-cols-2 gap-1">
                    <li><code className="bg-background px-1 rounded">{'{nome}'}</code> - Nome completo</li>
                    <li><code className="bg-background px-1 rounded">{'{primeiro_nome}'}</code> - Primeiro nome</li>
                    <li><code className="bg-background px-1 rounded">{'{produto}'}</code> - Nome do produto</li>
                    <li><code className="bg-background px-1 rounded">{'{loja}'}</code> - Nome da loja</li>
                    <li><code className="bg-background px-1 rounded">{'{link_loja}'}</code> - Link da loja</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingTemplate ? (
                  <>
                    <Button variant="outline" onClick={() => {
                      setTemplate(storeConfig?.sentinela_default_template || DEFAULT_TEMPLATE);
                      setEditingTemplate(false);
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={updateConfig.isPending}>
                      {updateConfig.isPending ? 'Salvando...' : 'Salvar Template'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditingTemplate(true)}>
                    Editar Template
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
