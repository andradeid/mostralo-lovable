import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, MessageCircle, QrCode, Package, Timer, Map, Bell, Phone, AlertTriangle, CheckCircle2, XCircle, Loader2, Send, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliveryZonesPicker, DeliveryZone } from "../DeliveryZonesPicker";
import { MapLocationPicker } from "../MapLocationPicker";
import { BusinessHoursManager } from "../BusinessHoursManager";
import { ScheduledOrdersManager } from "../ScheduledOrdersManager";
import { NavigationAppSelector } from "@/components/admin/NavigationAppSelector";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useWhatsAppStatus } from "@/hooks/useWhatsAppStatus";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DeliveryStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onSave: (showSuccessMessage?: boolean) => Promise<void>;
  storeId?: string;
}

export function DeliveryStep({ formData, updateFormData, onSave, storeId }: DeliveryStepProps) {
  const [showZonesPicker, setShowZonesPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Estado para validação de WhatsApp
  const [validatingPhone1, setValidatingPhone1] = useState(false);
  const [validatingPhone2, setValidatingPhone2] = useState(false);
  const [phone1Valid, setPhone1Valid] = useState<boolean | null>(null);
  const [phone2Valid, setPhone2Valid] = useState<boolean | null>(null);
  const [validationStep1, setValidationStep1] = useState('');
  const [validationStep2, setValidationStep2] = useState('');
  
  // Estado para teste de envio
  const [sendingTest, setSendingTest] = useState(false);
  
  // Ref para textarea de mensagem
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Verificar se existe instância WhatsApp conectada
  const { hasConnectedWhatsApp } = useWhatsAppStatus(storeId);
  
  const weekDays = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    const hours = formData.business_hours || {};
    if (!hours[day]) {
      hours[day] = { open: '08:00', close: '18:00', closed: false };
    }
    hours[day][field] = value;
    updateFormData({ business_hours: hours });
  };

  const handleOpenZonesPicker = () => {
    if (!formData.latitude || !formData.longitude) {
      toast.error('Configure a localização do estabelecimento primeiro na aba Geral');
      return;
    }
    setShowZonesPicker(true);
  };

  const handleSaveZones = async (zones: DeliveryZone[]) => {
    // 1. Atualizar estado local
    updateFormData({ delivery_zones: zones });
    
    // 2. Fechar modal
    setShowZonesPicker(false);
    
    // 3. Salvar no banco de dados automaticamente
    try {
      await onSave(false); // false = não mostrar mensagem de sucesso principal
      toast.success(`${zones.length} área(s) de entrega salva(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao salvar áreas de entrega');
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    updateFormData({
      address: address,
      latitude: lat,
      longitude: lng,
      google_maps_link: `https://www.google.com/maps?q=${lat},${lng}`,
    });
    setShowLocationPicker(false);
    toast.success('Localização configurada com sucesso!');
  };

  const deliveryZones = formData.delivery_zones || [];

  // Variáveis disponíveis para o template de mensagem
  const messageVariables = [
    { key: '{numero_pedido}', label: 'Nº Pedido', example: '#ABC12345' },
    { key: '{cliente_nome}', label: 'Cliente', example: 'João Silva' },
    { key: '{cliente_telefone}', label: 'Telefone', example: '61999999999' },
    { key: '{total}', label: 'Total', example: 'R$ 89,90' },
    { key: '{subtotal}', label: 'Subtotal', example: 'R$ 79,90' },
    { key: '{taxa_entrega}', label: 'Taxa Entrega', example: 'R$ 10,00' },
    { key: '{tipo_entrega}', label: 'Tipo', example: '🚗 Delivery' },
    { key: '{endereco}', label: 'Endereço', example: 'Rua X, 123' },
    { key: '{link_google_maps}', label: 'Link Maps', example: 'https://maps.google.com/...' },
    { key: '{forma_pagamento}', label: 'Pagamento', example: '💳 PIX' },
    { key: '{observacoes}', label: 'Obs', example: 'Sem cebola' },
    { key: '{data_hora}', label: 'Data/Hora', example: '20/12/2025 14:30' },
    { key: '{loja_nome}', label: 'Loja', example: 'Minha Loja' },
  ];

  // Mensagem padrão
  const defaultMessageTemplate = `📦 *NOVO PEDIDO!*

🔢 *Pedido:* {numero_pedido}
👤 *Cliente:* {cliente_nome}
📱 *Tel:* {cliente_telefone}
💰 *Total:* {total}
{tipo_entrega}
📍 *Endereço:* {endereco}
🗺️ *Navegação:* {link_google_maps}
💳 *Pagamento:* {forma_pagamento}
📝 *Obs:* {observacoes}

⏰ {data_hora}`;

  // Função para validar número WhatsApp
  const validateWhatsAppNumber = async (phoneNumber: string, countryCode: string, phoneIndex: 1 | 2) => {
    const setValidating = phoneIndex === 1 ? setValidatingPhone1 : setValidatingPhone2;
    const setValid = phoneIndex === 1 ? setPhone1Valid : setPhone2Valid;
    const setStep = phoneIndex === 1 ? setValidationStep1 : setValidationStep2;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Digite um número válido com DDD');
      return;
    }

    setValidating(true);
    setValid(null);
    
    try {
      // Animação de verificação
      setStep('Verificando WhatsApp...');
      await new Promise(r => setTimeout(r, 600));
      
      setStep('Conectando...');
      await new Promise(r => setTimeout(r, 500));
      
      setStep('Validando número...');
      
      // Formatar número
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const code = countryCode.replace('+', '');
      const fullPhone = cleanPhone.startsWith(code) ? cleanPhone : `${code}${cleanPhone}`;

      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone, sendWelcome: false }
      });

      if (error) throw error;

      await new Promise(r => setTimeout(r, 300));

      if (data?.valid) {
        setValid(true);
        setStep('WhatsApp válido!');
        toast.success('Número validado com sucesso!');
      } else {
        setValid(false);
        setStep('WhatsApp não encontrado');
        toast.error('Este número não possui WhatsApp ativo');
      }
    } catch (error) {
      console.error('Erro ao validar WhatsApp:', error);
      setValid(false);
      setStep('Erro na validação');
      toast.error('Erro ao validar número');
    } finally {
      setValidating(false);
      setTimeout(() => setStep(''), 3000);
    }
  };

  // Função para inserir variável na posição do cursor
  const insertVariable = (variable: string) => {
    const textarea = messageTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formData.new_order_message_template || defaultMessageTemplate;
    
    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    updateFormData({ new_order_message_template: newValue });
    
    // Reposicionar cursor após a variável inserida
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // Função para enviar teste
  const handleSendTest = async () => {
    const phone1 = formData.notification_phone;
    const phone2 = formData.notification_phone_2;
    
    if (!phone1 && !phone2) {
      toast.error('Configure pelo menos um número para receber o teste');
      return;
    }

    setSendingTest(true);

    try {
      // Dados fictícios para teste
      const testData = {
        store_id: storeId,
        order_id: 'TEST-' + Date.now(),
        store_name: formData.name || 'Minha Loja',
        notification_phone: phone1,
        notification_country_code: formData.notification_country_code || '+55',
        notification_phone_2: phone2,
        notification_country_code_2: formData.notification_country_code_2 || '+55',
        new_order_message_template: formData.new_order_message_template || defaultMessageTemplate,
        order_number: 'TESTE123',
        customer_name: 'Cliente Teste',
        customer_phone: '61999999999',
        customer_address: 'Rua de Teste, 123 - Centro',
        delivery_address: 'Rua de Teste, 123 - Centro',
        total: 89.90,
        subtotal: 79.90,
        delivery_fee: 10.00,
        delivery_type: 'delivery',
        payment_method: 'pix',
        notes: 'Esta é uma mensagem de TESTE',
        created_at: new Date().toISOString(),
        is_test: true
      };

      const { data, error } = await supabase.functions.invoke('send-store-notification', {
        body: testData
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Mensagem de teste enviada com sucesso!');
      } else {
        throw new Error(data?.reason || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast.error(error.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dados do Estabelecimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Dados do Estabelecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Endereço Completo do Estabelecimento</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3 mb-2">
              Digite o endereço completo do seu estabelecimento (rua, número, bairro, cidade, CEP) ou use o botão "Mapa" para selecionar a localização.
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => updateFormData({ address: e.target.value })}
                placeholder="Rua Botucatu, 09, Jardim do Ingá, Luziânia-GO, CEP: 72850-330"
                rows={3}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLocationPicker(true)}
                className="md:self-start"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Mapa
              </Button>
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-muted-foreground mt-1">
                Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="google_maps_link">Link do Google Maps</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3 mb-2">
              Link do Google Maps do seu estabelecimento (gerado automaticamente ao selecionar no mapa).
            </p>
            <Input
              id="google_maps_link"
              value={formData.google_maps_link || ''}
              onChange={(e) => updateFormData({ google_maps_link: e.target.value })}
              placeholder="https://www.google.com/maps?q=-15.123456,-47.123456"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone de Contato</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="(61) 99999-9999"
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp">WhatsApp para Pedidos</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={(e) => updateFormData({ whatsapp: e.target.value })}
                placeholder="(61) 99999-9999"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Tempo de Entrega e Retirada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delivery_fee">Taxa de Entrega Padrão (R$)</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3 mb-2">
              Taxa cobrada quando o cliente não seleciona localização específica ou está fora das zonas de entrega (se permitido).
            </p>
            <Input
              id="delivery_fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_fee || 0}
              onChange={(e) => updateFormData({ delivery_fee: parseFloat(e.target.value) || 0 })}
              placeholder="10.00"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-base">Informa tempo de Entrega e Retirada?</Label>
            </div>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Caso deseje mostrar o tempo estimado para entrega ou retirada do pedido, selecione "SIM" nesta opção. Essas informações serão exibidas na tela de checkout.
            </p>
            
            <RadioGroup 
              value={formData.show_delivery_time ? 'sim' : 'nao'} 
              onValueChange={(value) => updateFormData({ show_delivery_time: value === 'sim' })}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="time-sim" />
                <Label htmlFor="time-sim">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="time-nao" />
                <Label htmlFor="time-nao">Não</Label>
              </div>
            </RadioGroup>

            {formData.show_delivery_time && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-primary pl-4">
                <div>
                  <Label htmlFor="delivery_time">Tempo para entrega</Label>
                  <Input
                    id="delivery_time"
                    value={formData.delivery_time || ''}
                    onChange={(e) => updateFormData({ delivery_time: e.target.value })}
                    placeholder="Entre 40 e 60 minutos."
                  />
                </div>
                
                <div>
                  <Label htmlFor="pickup_time">Tempo para retirada</Label>
                  <Input
                    id="pickup_time"
                    value={formData.pickup_time || ''}
                    onChange={(e) => updateFormData({ pickup_time: e.target.value })}
                    placeholder="Entre 15 e 30 minutos."
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Áreas de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="w-4 h-4 mr-2" />
            Áreas de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground border-l-4 border-primary pl-3 mb-4">
              Configure as zonas de entrega do seu estabelecimento. Você pode criar áreas usando raio circular ou desenhar áreas personalizadas no mapa.
            </p>
            
            <Button onClick={handleOpenZonesPicker} className="w-full md:w-auto">
              <Map className="w-4 h-4 mr-2" />
              Configurar Áreas de Entrega
            </Button>

            {deliveryZones.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Zonas Configuradas: {deliveryZones.length}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deliveryZones.map((zone: DeliveryZone) => (
                    <div
                      key={zone.id}
                      className="p-3 bg-secondary rounded-lg border"
                    >
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {zone.type === 'radius' 
                          ? `Raio de ${zone.radius} km` 
                          : 'Área personalizada'}
                      </div>
                      <div className="text-sm font-medium mt-1 text-primary">
                        Taxa: R$ {zone.deliveryFee.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aceitar pedidos fora da área */}
          {deliveryZones.length > 0 && (
            <div className="flex items-center justify-between p-4 border rounded-lg mt-4">
              <div className="space-y-1 flex-1 pr-4">
                <Label className="text-base">Aceitar pedidos fora das áreas de entrega?</Label>
                <p className="text-sm text-muted-foreground">
                  Se SIM, pedidos de fora das áreas serão aceitos mas ficarão marcados para revisão.
                  Se NÃO, clientes não poderão finalizar pedidos de fora das áreas.
                </p>
              </div>
              <Switch 
                checked={formData.accept_outside_delivery_zone || false}
                onCheckedChange={(checked) => updateFormData({ accept_outside_delivery_zone: checked })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Delivery */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Texto Botão (Opção de Delivery):</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Aqui você pode alterar o texto do botão de pedido (entrega).
            </p>
            <Input
              value={formData.delivery_button_text || ''}
              onChange={(e) => updateFormData({ delivery_button_text: e.target.value })}
              placeholder="Delivery"
              className="mt-2"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base">Aceite Automático?</Label>
              <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                Marque SIM caso deseje que seus pedidos sejam aceitos automaticamente pelo Sistema.
              </p>
              <RadioGroup 
                value={formData.auto_accept_orders ? 'nao' : 'sim'} 
                onValueChange={(value) => updateFormData({ auto_accept_orders: value === 'nao' })}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="auto-sim" />
                  <Label htmlFor="auto-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="auto-nao" />
                  <Label htmlFor="auto-nao">Não</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Horário de Funcionamento Detalhado */}
            <div>
              <BusinessHoursManager
                value={formData.business_hours || {}}
                onChange={(hours) => updateFormData({ business_hours: hours })}
              />
            </div>

            <div>
              <Label className="text-base">Envia cópia de pedido no WhatsApp?</Label>
              <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                Se Marcado SIM, após o pedido a pagina é direcionada para WhatApp, se marcado Não, a pagina carrego com botões para o Cliente Acompanhar o pedido e Enviar para o WhatsApp.
              </p>
              <RadioGroup 
                value={formData.send_whatsapp_copy ? 'sim' : 'nao'} 
                onValueChange={(value) => updateFormData({ send_whatsapp_copy: value === 'sim' })}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="whatsapp-sim" />
                  <Label htmlFor="whatsapp-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="whatsapp-nao" />
                  <Label htmlFor="whatsapp-nao">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base">Estabelecimento faz Entregas?</Label>
              <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                Marque SIM, se seu estabelecimento faz Entregas.
              </p>
              <RadioGroup 
                value={formData.does_delivery ? 'sim' : 'nao'} 
                onValueChange={(value) => updateFormData({ does_delivery: value === 'sim' })}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="delivery-sim" />
                  <Label htmlFor="delivery-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="delivery-nao" />
                  <Label htmlFor="delivery-nao">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base">Permite Retirada no Local?</Label>
              <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                Marque SIM, se seu estabelecimento permite que os clientes façam retiradas no local.
              </p>
              <RadioGroup 
                value={formData.allows_pickup ? 'sim' : 'nao'} 
                onValueChange={(value) => updateFormData({ allows_pickup: value === 'sim' })}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="pickup-sim" />
                  <Label htmlFor="pickup-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="pickup-nao" />
                  <Label htmlFor="pickup-nao">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Texto Botão (Retirada Balcão):</Label>
              <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                Aqui você pode alterar o texto do botão de retirada (Quando Cliente escolhe por retirar seu pedido).
              </p>
              <Input
                value={formData.pickup_button_text || ''}
                onChange={(e) => updateFormData({ pickup_button_text: e.target.value })}
                placeholder="Retirada Balcão"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Agendados */}
      <ScheduledOrdersManager
        value={formData.scheduled_orders || {
          enabled: false,
          pickup_settings: {
            min_advance_value: 1,
            min_advance_unit: 'hours',
            max_advance_value: 7,
            max_advance_unit: 'days'
          },
          delivery_settings: {
            min_advance_value: 90,
            min_advance_unit: 'minutes',
            max_advance_value: 5,
            max_advance_unit: 'days',
            time_interval: 30
          },
          hide_asap: false
        }}
        onChange={(scheduledOrders) => updateFormData({ scheduled_orders: scheduledOrders })}
      />

      {/* QR Code e Configurações Especiais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Especiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base">Estabelecimento aceita Pedido por QrCode?</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              A entrega QR é um sistema Exclusivo, onde o cliente faz o pedido, exclusivamente por QrCode, com Checkout Simplificado (ideal para pedidos em Mesa) Mas também pode ser usado para (Quarto / Apto / Cabana/ pedidos de Empresas ou Pessoas cadastradas e muito mais) caso tenha dúvida, prossiga o cadastro (Marque Não) assista ao video tutorial e Entenda o funcionamento da ferramenta.
            </p>
            <RadioGroup 
              value={formData.qr_code_enabled ? 'sim' : 'nao'} 
              onValueChange={(value) => updateFormData({ qr_code_enabled: value === 'sim' })}
              className="flex space-x-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="qr-sim" />
                <Label htmlFor="qr-sim">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="qr-nao" />
                <Label htmlFor="qr-nao">Não</Label>
              </div>
            </RadioGroup>

            {formData.qr_code_enabled && (
              <div className="space-y-4 border-l-4 border-primary pl-4 mt-4">
                <div>
                  <Label>Defina o Modelo de entrega por QR:</Label>
                  <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                    Abaixo identifique o nome de seu Modelo de entrega por QrCode.
                  </p>
                  <Input
                    value={formData.qr_delivery_model || ''}
                    onChange={(e) => updateFormData({ qr_delivery_model: e.target.value })}
                    placeholder="Mesa"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Texto Botão QrCode Mesa:</Label>
                  <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                    Aqui você pode alterar o texto do botão da ferramenta QrCode Mesa (Botão que cliente final usa).
                  </p>
                  <Input
                    value={formData.qr_button_text || ''}
                    onChange={(e) => updateFormData({ qr_button_text: e.target.value })}
                    placeholder="Agendamento / Orçamento"
                    className="mt-2"
                  />
                </div>
              </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Notificações WhatsApp de Novos Pedidos */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          Notificações de Novos Pedidos via WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasConnectedWhatsApp ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>
                Para receber notificações de novos pedidos, você precisa configurar uma instância WhatsApp primeiro.
              </span>
              <Link 
                to="/dashboard/whatsapp" 
                className="text-sm font-medium underline hover:no-underline"
              >
                Configurar WhatsApp →
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-sm text-muted-foreground border-l-4 border-primary pl-3">
              Configure para receber notificações no WhatsApp sempre que um novo pedido for criado. 
              A mensagem será enviada automaticamente para os números configurados abaixo.
            </p>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/30">
              <div className="space-y-1 flex-1 pr-4">
                <Label className="text-base">Ativar notificações de novos pedidos</Label>
                <p className="text-sm text-muted-foreground">
                  Receba uma mensagem no WhatsApp sempre que um cliente fizer um pedido
                </p>
              </div>
              <Switch 
                checked={formData.notify_new_orders ?? false}
                onCheckedChange={(checked) => updateFormData({ notify_new_orders: checked })}
              />
            </div>
          </>
        )}

        {hasConnectedWhatsApp && formData.notify_new_orders && (
          <div className="space-y-6 border-l-4 border-primary pl-4 mt-4">
            
            {/* Número 1 - Principal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Número 1</Badge>
                <span className="text-sm font-medium">Principal</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-2">
                  <Label htmlFor="notification_country_code">País</Label>
                  <Select
                    value={formData.notification_country_code || '+55'}
                    onValueChange={(value) => updateFormData({ notification_country_code: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="+55" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+55">🇧🇷 +55</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+351">🇵🇹 +351</SelectItem>
                      <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      <SelectItem value="+54">🇦🇷 +54</SelectItem>
                      <SelectItem value="+595">🇵🇾 +595</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-5">
                  <Label htmlFor="notification_phone">Número</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="notification_phone"
                      value={formData.notification_phone || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        updateFormData({ notification_phone: value });
                        setPhone1Valid(null);
                      }}
                      placeholder="61999999999"
                      className="pl-10"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex items-end">
                  {formData.notification_phone && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        updateFormData({ 
                          notification_phone: '', 
                          notification_country_code: '+55' 
                        });
                        setPhone1Valid(null);
                        toast.info('Número removido');
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Limpar número"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="md:col-span-4 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => validateWhatsAppNumber(
                      formData.notification_phone || '',
                      formData.notification_country_code || '+55',
                      1
                    )}
                    disabled={validatingPhone1 || !formData.notification_phone}
                    className="w-full"
                  >
                    {validatingPhone1 ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {validationStep1}
                      </>
                    ) : phone1Valid === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Válido
                      </>
                    ) : phone1Valid === false ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Inválido
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Validar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Número 2 - Opcional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Número 2</Badge>
                <span className="text-sm font-medium">Opcional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-2">
                  <Label htmlFor="notification_country_code_2">País</Label>
                  <Select
                    value={formData.notification_country_code_2 || '+55'}
                    onValueChange={(value) => updateFormData({ notification_country_code_2: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="+55" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+55">🇧🇷 +55</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+351">🇵🇹 +351</SelectItem>
                      <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      <SelectItem value="+54">🇦🇷 +54</SelectItem>
                      <SelectItem value="+595">🇵🇾 +595</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-5">
                  <Label htmlFor="notification_phone_2">Número</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="notification_phone_2"
                      value={formData.notification_phone_2 || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        updateFormData({ notification_phone_2: value });
                        setPhone2Valid(null);
                      }}
                      placeholder="61888888888"
                      className="pl-10"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex items-end">
                  {formData.notification_phone_2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        updateFormData({ 
                          notification_phone_2: '', 
                          notification_country_code_2: '+55' 
                        });
                        setPhone2Valid(null);
                        toast.info('Número removido');
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Limpar número"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="md:col-span-4 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => validateWhatsAppNumber(
                      formData.notification_phone_2 || '',
                      formData.notification_country_code_2 || '+55',
                      2
                    )}
                    disabled={validatingPhone2 || !formData.notification_phone_2}
                    className="w-full"
                  >
                    {validatingPhone2 ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {validationStep2}
                      </>
                    ) : phone2Valid === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Válido
                      </>
                    ) : phone2Valid === false ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Inválido
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Validar
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione um segundo número para receber as notificações (ex: sócio, gerente)
              </p>
            </div>

            {/* Mensagem Personalizada */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Mensagem de Notificação</Label>
              <p className="text-sm text-muted-foreground">
                Personalize a mensagem que será enviada quando um novo pedido for recebido.
              </p>
              
              {/* Chips de variáveis */}
              <div className="space-y-2">
                <Label className="text-sm">Clique para inserir variáveis:</Label>
                <div className="flex flex-wrap gap-2">
                  {messageVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.key)}
                      className="text-xs h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {variable.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Textarea da mensagem */}
              <Textarea
                ref={messageTextareaRef}
                value={formData.new_order_message_template || defaultMessageTemplate}
                onChange={(e) => updateFormData({ new_order_message_template: e.target.value })}
                placeholder="Digite sua mensagem personalizada..."
                rows={12}
                className="font-mono text-sm"
              />

              {/* Botão restaurar padrão */}
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFormData({ new_order_message_template: defaultMessageTemplate })}
                  className="text-xs"
                >
                  Restaurar mensagem padrão
                </Button>
              </div>
            </div>

            {/* Botão de Teste */}
            <div className="pt-4 border-t">
              <Button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest || (!formData.notification_phone && !formData.notification_phone_2)}
                className="w-full md:w-auto"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando teste...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensagem de Teste
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Envia uma mensagem de teste com dados fictícios para verificar se está funcionando.
              </p>
            </div>
            
            {!formData.notification_phone && !formData.notification_phone_2 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Configure pelo menos um número acima para receber as notificações.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Navegação - Preferência de App */}
    {storeId && <NavigationAppSelector storeId={storeId} />}

    {showZonesPicker && formData.latitude && formData.longitude && (
        <DeliveryZonesPicker
          storeLat={formData.latitude}
          storeLng={formData.longitude}
          existingZones={deliveryZones}
          onClose={() => setShowZonesPicker(false)}
          onSave={handleSaveZones}
        />
      )}

      {showLocationPicker && (
        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          initialLat={formData.latitude}
          initialLng={formData.longitude}
        />
      )}
    </div>
  );
}