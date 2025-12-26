import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Phone, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTableComanda } from '@/hooks/useTableComanda';
import { toast } from 'sonner';

interface TableCustomerAuthProps {
  storeId: string;
  tableNumber: string;
  onSuccess: () => void;
}

type Step = 'phone' | 'register' | 'login' | 'create_password';

export function TableCustomerAuth({ storeId, tableNumber, onSuccess }: TableCustomerAuthProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [existingCustomerName, setExistingCustomerName] = useState('');

  const { isLoading, error, checkCustomer, registerCustomer, loginCustomer, createComanda } = useTableComanda();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Digite um telefone válido');
      return;
    }

    const result = await checkCustomer(digits, storeId, tableNumber);
    
    if (result.exists) {
      if (result.hasPassword) {
        setExistingCustomerName(result.name || '');
        setStep('login');
      } else {
        setExistingCustomerName(result.name || '');
        setName(result.name || '');
        setStep('create_password');
      }
    } else {
      setStep('register');
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error('Digite seu nome');
      return;
    }
    if (password.length < 4 || password.length > 6) {
      toast.error('Senha deve ter entre 4 e 6 dígitos');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    const success = await registerCustomer({
      phone: digits,
      name: name.trim(),
      password,
      storeId,
      tableNumber
    });

    if (success) {
      await handleCreateComanda(digits);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      toast.error('Digite sua senha');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    const success = await loginCustomer({
      phone: digits,
      password,
      storeId,
      tableNumber
    });

    if (success) {
      await handleCreateComanda(digits);
    }
  };

  const handleCreatePassword = async () => {
    if (password.length < 4 || password.length > 6) {
      toast.error('Senha deve ter entre 4 e 6 dígitos');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    const success = await registerCustomer({
      phone: digits,
      name: name || existingCustomerName,
      password,
      storeId,
      tableNumber
    });

    if (success) {
      await handleCreateComanda(digits);
    }
  };

  const handleCreateComanda = async (phoneDigits: string) => {
    const success = await createComanda({
      phone: phoneDigits,
      storeId,
      tableNumber
    });

    if (success) {
      toast.success('Bem-vindo! Sua comanda foi criada.');
      onSuccess();
    }
  };

  const handleBack = () => {
    setStep('phone');
    setPassword('');
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">
          {step === 'phone' && 'Identificação'}
          {step === 'register' && 'Cadastro Rápido'}
          {step === 'login' && `Olá, ${existingCustomerName || 'Cliente'}!`}
          {step === 'create_password' && 'Criar Senha'}
        </CardTitle>
        <CardDescription>
          {step === 'phone' && 'Digite seu telefone para continuar'}
          {step === 'register' && 'Complete seu cadastro para fazer pedidos'}
          {step === 'login' && 'Digite sua senha para acessar'}
          {step === 'create_password' && 'Crie uma senha de 4 a 6 dígitos'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Step: Phone */}
        {step === 'phone' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="text-lg h-12"
                autoFocus
              />
            </div>
            <Button 
              onClick={handlePhoneSubmit} 
              className="w-full h-12 text-lg"
              disabled={isLoading || phone.replace(/\D/g, '').length < 10}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continuar <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </>
        )}

        {/* Step: Register */}
        {step === 'register' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Seu Nome
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Como podemos te chamar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Senha (4-6 dígitos)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••"
                maxLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                className="text-lg h-12 tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="h-12">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                onClick={handleRegister} 
                className="flex-1 h-12 text-lg"
                disabled={isLoading || !name.trim() || password.length < 4}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Cadastrar e Pedir'
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step: Login */}
        {step === 'login' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Sua Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••"
                maxLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                className="text-lg h-12 tracking-widest"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="h-12">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                onClick={handleLogin} 
                className="flex-1 h-12 text-lg"
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar'
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step: Create Password (existing customer without password) */}
        {step === 'create_password' && (
          <>
            <div className="p-3 rounded-lg bg-primary/5 text-sm text-center mb-4">
              Olá, <strong>{existingCustomerName}</strong>! Crie uma senha para facilitar seus próximos acessos.
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Nova Senha (4-6 dígitos)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••"
                maxLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                className="text-lg h-12 tracking-widest"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="h-12">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                onClick={handleCreatePassword} 
                className="flex-1 h-12 text-lg"
                disabled={isLoading || password.length < 4}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Criar e Continuar'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
