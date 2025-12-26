import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTableComanda } from '@/hooks/useTableComanda';
import { toast } from 'sonner';
import { TableAuthPhoneStep } from './auth/TableAuthPhoneStep';
import { TableAuthRegisterStep } from './auth/TableAuthRegisterStep';
import { TableAuthLoginStep } from './auth/TableAuthLoginStep';
import { TableAuthCreatePasswordStep } from './auth/TableAuthCreatePasswordStep';

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

  const getStepTitle = () => {
    switch (step) {
      case 'phone': return 'Identificação';
      case 'register': return 'Cadastro Rápido';
      case 'login': return `Olá, ${existingCustomerName || 'Cliente'}!`;
      case 'create_password': return 'Criar Senha';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'phone': return 'Digite seu telefone para continuar';
      case 'register': return 'Complete seu cadastro para fazer pedidos';
      case 'login': return 'Digite sua senha para acessar';
      case 'create_password': return 'Crie uma senha de 4 a 6 dígitos';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <CardDescription>{getStepDescription()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {step === 'phone' && (
          <TableAuthPhoneStep
            phone={phone}
            onPhoneChange={setPhone}
            onSubmit={handlePhoneSubmit}
            isLoading={isLoading}
          />
        )}

        {step === 'register' && (
          <TableAuthRegisterStep
            name={name}
            password={password}
            onNameChange={setName}
            onPasswordChange={setPassword}
            onSubmit={handleRegister}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}

        {step === 'login' && (
          <TableAuthLoginStep
            password={password}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}

        {step === 'create_password' && (
          <TableAuthCreatePasswordStep
            customerName={existingCustomerName}
            password={password}
            onPasswordChange={setPassword}
            onSubmit={handleCreatePassword}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
}
