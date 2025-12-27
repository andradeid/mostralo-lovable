import { useState } from 'react';
import { StoreInfo, TotemCartItem } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Phone, CreditCard } from 'lucide-react';
import { TotemNumericKeyboard } from './TotemNumericKeyboard';

interface TotemCartProps {
  store: StoreInfo;
  config: TotemConfig;
  cart: TotemCartItem[];
  cartTotal: number;
  customerInfo: { phone?: string; cpf?: string; name?: string };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateCustomerInfo: (info: { phone?: string; cpf?: string; name?: string }) => void;
  onBack: () => void;
  onCheckout: () => void;
}

export function TotemCart({
  store,
  config,
  cart,
  cartTotal,
  customerInfo,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomerInfo,
  onBack,
  onCheckout,
}: TotemCartProps) {
  const [activeField, setActiveField] = useState<'phone' | 'cpf' | null>(null);
  
  const identificationFields = config.identification_fields || ['phone'];
  const showIdentification = config.identification_type !== 'none';
  const isIdentificationRequired = config.identification_type === 'required';

  const canCheckout = () => {
    if (cart.length === 0) return false;
    if (!isIdentificationRequired) return true;

    // Verificar se pelo menos um campo obrigatório está preenchido
    return identificationFields.some(field => {
      const value = customerInfo[field as keyof typeof customerInfo];
      return value && value.trim().length > 0;
    });
  };

  const formatPhoneDisplay = (digits: string): string => {
    if (!digits) return '';
    const clean = digits.replace(/\D/g, '');
    if (clean.length === 0) return '';
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  const formatCPFDisplay = (digits: string): string => {
    if (!digits) return '';
    const clean = digits.replace(/\D/g, '');
    if (clean.length === 0) return '';
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const handleKeyboardChange = (value: string) => {
    if (activeField === 'phone') {
      onUpdateCustomerInfo({ ...customerInfo, phone: value });
    } else if (activeField === 'cpf') {
      onUpdateCustomerInfo({ ...customerInfo, cpf: value });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ShoppingCart className="h-6 w-6" style={{ color: config.theme_color }} />
          <span className="font-semibold text-lg">Seu Carrinho</span>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        {/* Items */}
        <div className="space-y-4 mb-6">
          {cart.map((item) => {
            const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
            const itemTotal = (item.price + addonsTotal) * item.quantity;

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-xl border"
                style={{
                  borderColor: config.dark_mode ? '#333' : '#e5e7eb',
                  backgroundColor: config.dark_mode ? '#262626' : '#fff',
                }}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.addons.length > 0 && (
                        <p className="text-sm mt-1" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
                          {item.addons.map(a => a.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm italic mt-1" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded border"
                        style={{ borderColor: config.theme_color, color: config.theme_color }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded text-white"
                        style={{ backgroundColor: config.theme_color }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold" style={{ color: config.theme_color }}>
                      R$ {itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Identificação do Cliente */}
        {showIdentification && (
          <div
            className="p-4 rounded-xl border mb-4"
            style={{
              borderColor: config.dark_mode ? '#333' : '#e5e7eb',
              backgroundColor: config.dark_mode ? '#262626' : '#fff',
            }}
          >
            <h3 className="font-semibold mb-4">
              Identificação {isIdentificationRequired ? '(Obrigatório)' : '(Opcional)'}
            </h3>
            <div className="space-y-4">
              {identificationFields.includes('name') && (
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={customerInfo.name || ''}
                    onChange={(e) => onUpdateCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="Seu nome"
                    className="mt-1"
                  />
                </div>
              )}
              {identificationFields.includes('phone') && (
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <button
                    onClick={() => setActiveField('phone')}
                    className="w-full mt-1 flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors"
                    style={{
                      borderColor: customerInfo.phone ? config.theme_color : (config.dark_mode ? '#333' : '#e5e7eb'),
                      backgroundColor: config.dark_mode ? '#1a1a1a' : '#f9fafb',
                    }}
                  >
                    <Phone 
                      className="h-5 w-5" 
                      style={{ color: customerInfo.phone ? config.theme_color : (config.dark_mode ? '#6b7280' : '#9ca3af') }}
                    />
                    <span
                      className="text-lg"
                      style={{ 
                        color: customerInfo.phone 
                          ? (config.dark_mode ? '#ffffff' : '#000000')
                          : (config.dark_mode ? '#6b7280' : '#9ca3af')
                      }}
                    >
                      {formatPhoneDisplay(customerInfo.phone || '') || '(00) 00000-0000'}
                    </span>
                  </button>
                </div>
              )}
              {identificationFields.includes('cpf') && (
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <button
                    onClick={() => setActiveField('cpf')}
                    className="w-full mt-1 flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors"
                    style={{
                      borderColor: customerInfo.cpf ? config.theme_color : (config.dark_mode ? '#333' : '#e5e7eb'),
                      backgroundColor: config.dark_mode ? '#1a1a1a' : '#f9fafb',
                    }}
                  >
                    <CreditCard 
                      className="h-5 w-5" 
                      style={{ color: customerInfo.cpf ? config.theme_color : (config.dark_mode ? '#6b7280' : '#9ca3af') }}
                    />
                    <span
                      className="text-lg"
                      style={{ 
                        color: customerInfo.cpf 
                          ? (config.dark_mode ? '#ffffff' : '#000000')
                          : (config.dark_mode ? '#6b7280' : '#9ca3af')
                      }}
                    >
                      {formatCPFDisplay(customerInfo.cpf || '') || '000.000.000-00'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div
        className="p-4 border-t space-y-4"
        style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
      >
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-xl" style={{ color: config.theme_color }}>
            R$ {cartTotal.toFixed(2)}
          </span>
        </div>
        <Button
          onClick={onCheckout}
          disabled={!canCheckout()}
          className="w-full h-14 text-lg font-semibold text-white"
          style={{ backgroundColor: config.theme_color }}
        >
          Ir para Pagamento
        </Button>
      </div>

      {/* Virtual Numeric Keyboard */}
      {activeField && (
        <TotemNumericKeyboard
          value={(activeField === 'phone' ? customerInfo.phone : customerInfo.cpf) || ''}
          onChange={handleKeyboardChange}
          onClose={() => setActiveField(null)}
          type={activeField}
          themeColor={config.theme_color}
          darkMode={config.dark_mode}
        />
      )}
    </div>
  );
}
