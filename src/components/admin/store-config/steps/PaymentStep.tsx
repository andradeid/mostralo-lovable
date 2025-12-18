import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, Smartphone, Globe, DollarSign, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface PaymentStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  efiAccountStatus?: string;
  efiAccountNumber?: string;
}

export function PaymentStep({ formData, updateFormData, efiAccountStatus, efiAccountNumber }: PaymentStepProps) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Valor Mínimo do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Qual valor de pedido mínimo?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Se não tiver um valor mínimo para pedidos, deixe "0", estabelecimento que trabalhem com agendamentos ou Orçamentos, Deixar 0,00.
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.min_order_value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                console.log('💰 Alterando min_order_value:', value);
                updateFormData({ min_order_value: value === '' ? 0 : parseFloat(value) });
              }}
              placeholder="0,00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Métodos de Pagamento Básicos */}
      <div className="space-y-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita dinheiro?</Label>
                </div>
                <RadioGroup 
                  value={formData.accepts_cash ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_cash: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="cash-sim" />
                    <Label htmlFor="cash-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="cash-nao" />
                    <Label htmlFor="cash-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita cartão de débito?</Label>
                </div>
                <RadioGroup 
                  value={formData.accepts_debit_card ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_debit_card: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="debit-sim" />
                    <Label htmlFor="debit-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="debit-nao" />
                    <Label htmlFor="debit-nao">Não</Label>
                  </div>
                </RadioGroup>
                
                {formData.accepts_debit_card && (
                  <div className="space-y-2 border-l-4 border-primary pl-4">
                    <Label>Quais bandeiras de cartão de débito aceitas?:</Label>
                    <Input
                      value={formData.debit_card_brands || ''}
                      onChange={(e) => updateFormData({ debit_card_brands: e.target.value })}
                      placeholder="Mastercard, Visa, Elo, Hipercard"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita cartão de crédito?</Label>
                </div>
                <RadioGroup 
                  value={formData.accepts_card ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_card: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="credit-sim" />
                    <Label htmlFor="credit-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="credit-nao" />
                    <Label htmlFor="credit-nao">Não</Label>
                  </div>
                </RadioGroup>
                
                {formData.accepts_card && (
                  <div className="space-y-2 border-l-4 border-primary pl-4">
                    <Label>Quais bandeiras de cartão de crédito aceitas?:</Label>
                    <Input
                      value={formData.credit_card_brands || ''}
                      onChange={(e) => updateFormData({ credit_card_brands: e.target.value })}
                      placeholder="Visa, Mastercard e Elo"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita PIX?</Label>
                </div>
                <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                  Este formato se trata de PIX manual, a comprovação do pagamento é feita pelo estabelecimento.
                </p>
                <RadioGroup 
                  value={formData.accepts_pix ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_pix: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="pix-sim" />
                    <Label htmlFor="pix-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="pix-nao" />
                    <Label htmlFor="pix-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* PIX Online (EFI) */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">PIX Online (QR Code automático)</Label>
                  </div>
                  {efiAccountStatus === 'active' ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Conta EFI Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Conta não configurada
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground border-l-4 border-primary pl-3">
                  O cliente gera QR Code PIX e paga instantaneamente. O pagamento é confirmado automaticamente e você recebe na sua conta EFI.
                  {efiAccountNumber && (
                    <span className="block mt-1 font-medium text-foreground">
                      Conta EFI: {efiAccountNumber}
                    </span>
                  )}
                </p>

                {efiAccountStatus === 'active' ? (
                  <RadioGroup 
                    value={formData.efi_pix_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ efi_pix_enabled: value === 'sim' })}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="efi-pix-sim" />
                      <Label htmlFor="efi-pix-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="efi-pix-nao" />
                      <Label htmlFor="efi-pix-nao">Não</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Configure sua conta EFI para aceitar PIX Online
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Vá em Conta → Pagamento Online para vincular sua conta
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/dashboard/online-payment')}
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Gateways de Pagamento Online */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Gateways de Pagamento Online
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Escolha qual Gateway de pagamento que você deseja utilizar para receber de seus clientes. Caso não trabalhe com pagamento online selecione a opção (Nenhum)
            </p>
            
            <RadioGroup 
              value={formData.payment_gateway || 'nenhum'} 
              onValueChange={(value) => updateFormData({ payment_gateway: value })}
              className="flex flex-wrap gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mercado-pago" id="mp" />
                <Label htmlFor="mp">Mercado Pago</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal">PayPal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pagar-me" id="pagarme" />
                <Label htmlFor="pagarme">Pagar.me</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe">Stripe</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nenhum" id="nenhum" />
                <Label htmlFor="nenhum">Nenhum</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.payment_gateway && formData.payment_gateway !== 'nenhum' && (
            <div className="space-y-4 border-l-4 border-primary pl-4">
              <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                Escolha quais formas de pagamento ficará visível no checkout da sua loja.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <Label className="text-base">PIX?</Label>
                  <RadioGroup 
                    value={formData.online_pix_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ online_pix_enabled: value === 'sim' })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="online-pix-sim" />
                      <Label htmlFor="online-pix-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="online-pix-nao" />
                      <Label htmlFor="online-pix-nao">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base">Cartão Crédito?</Label>
                  <RadioGroup 
                    value={formData.online_credit_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ online_credit_enabled: value === 'sim' })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="online-credit-sim" />
                      <Label htmlFor="online-credit-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="online-credit-nao" />
                      <Label htmlFor="online-credit-nao">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base">Cartão Débito?</Label>
                  <RadioGroup 
                    value={formData.online_debit_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ online_debit_enabled: value === 'sim' })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="online-debit-sim" />
                      <Label htmlFor="online-debit-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="online-debit-nao" />
                      <Label htmlFor="online-debit-nao">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base">Boleto?</Label>
                  <RadioGroup 
                    value={formData.online_boleto_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ online_boleto_enabled: value === 'sim' })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="online-boleto-sim" />
                      <Label htmlFor="online-boleto-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="online-boleto-nao" />
                      <Label htmlFor="online-boleto-nao">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base">Dinheiro?</Label>
                  <RadioGroup 
                    value={formData.online_cash_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ online_cash_enabled: value === 'sim' })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="online-cash-sim" />
                      <Label htmlFor="online-cash-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="online-cash-nao" />
                      <Label htmlFor="online-cash-nao">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Configurações específicas do gateway */}
              {formData.payment_gateway === 'mercado-pago' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modo Teste (Sandbox):</Label>
                    <Select 
                      value={formData.mp_sandbox_mode || 'nao'} 
                      onValueChange={(value) => updateFormData({ mp_sandbox_mode: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave Pública:</Label>
                    <Input
                      type="password"
                      value={formData.mp_public_key || ''}
                      onChange={(e) => updateFormData({ mp_public_key: e.target.value })}
                      placeholder="Sua chave pública do Mercado Pago"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave Secreta:</Label>
                    <Input
                      type="password"
                      value={formData.mp_secret_key || ''}
                      onChange={(e) => updateFormData({ mp_secret_key: e.target.value })}
                      placeholder="Sua chave secreta do Mercado Pago"
                    />
                  </div>
                </div>
              )}

              {formData.payment_gateway === 'stripe' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modo Teste:</Label>
                    <Select 
                      value={formData.stripe_test_mode || 'nao'} 
                      onValueChange={(value) => updateFormData({ stripe_test_mode: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave Pública (Publishable Key):</Label>
                    <Input
                      type="password"
                      value={formData.stripe_publishable_key || ''}
                      onChange={(e) => updateFormData({ stripe_publishable_key: e.target.value })}
                      placeholder="pk_test_... ou pk_live_..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave Secreta (Secret Key):</Label>
                    <Input
                      type="password"
                      value={formData.stripe_secret_key || ''}
                      onChange={(e) => updateFormData({ stripe_secret_key: e.target.value })}
                      placeholder="sk_test_... ou sk_live_..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}