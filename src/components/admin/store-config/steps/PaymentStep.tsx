import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, Smartphone, Globe, DollarSign } from "lucide-react";

interface PaymentStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export function PaymentStep({ formData, updateFormData }: PaymentStepProps) {
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
                  value={formData.accepts_pix ? 'nao' : 'sim'} 
                  onValueChange={(value) => updateFormData({ accepts_pix: value === 'nao' })}
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