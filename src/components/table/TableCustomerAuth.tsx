import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTableComanda } from '@/hooks/useTableComanda';
import { useStoreModules } from '@/hooks/useStoreModules';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TableAuthPhoneStep } from './auth/TableAuthPhoneStep';
import { TableAuthRegisterStep } from './auth/TableAuthRegisterStep';
import { TableAuthLoginStep } from './auth/TableAuthLoginStep';
import { TableAuthCreatePasswordStep } from './auth/TableAuthCreatePasswordStep';
import { TableAuthIdentifyingStep } from './auth/TableAuthIdentifyingStep';
import { TableAuthIdentifiedStep } from './auth/TableAuthIdentifiedStep';
import { TableAuthWhatsAppStep } from './auth/TableAuthWhatsAppStep';

interface TableCustomerAuthProps {
  storeId: string;
  tableNumber: string;
  onSuccess: () => void;
}

type Step = 
  | 'phone' 
  | 'identifying' 
  | 'identified' 
  | 'validating_whatsapp' 
  | 'whatsapp_result' 
  | 'register' 
  | 'login' 
  | 'create_password';

interface CustomerCheckResult {
  exists: boolean;
  hasPassword: boolean;
  name?: string;
  previousStores?: { name: string; slug: string }[];
  isNewToThisStore?: boolean;
}

export function TableCustomerAuth({ storeId, tableNumber, onSuccess }: TableCustomerAuthProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [existingCustomerName, setExistingCustomerName] = useState('');
  const [customerCheckResult, setCustomerCheckResult] = useState<CustomerCheckResult | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');

  const { isLoading, error, checkCustomer, registerCustomer, loginCustomer, createComanda } = useTableComanda();
  const { hasModule, loading: modulesLoading } = useStoreModules(storeId);

  // Auto-advance from identifying step
  useEffect(() => {
    if (step === 'identifying' && customerCheckResult) {
      const timer = setTimeout(() => {
        setStep('identified');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, customerCheckResult]);

  // Auto-advance from identified step
  useEffect(() => {
    if (step === 'identified' && customerCheckResult) {
      const timer = setTimeout(() => {
        const shouldValidateWhatsApp = hasModule('whatsapp');
        
        if (shouldValidateWhatsApp) {
          setStep('validating_whatsapp');
          validateWhatsApp();
        } else {
          goToFinalStep();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, customerCheckResult]);

  // Auto-advance from whatsapp result step
  useEffect(() => {
    if (step === 'whatsapp_result') {
      const timer = setTimeout(() => {
        goToFinalStep();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const goToFinalStep = () => {
    if (!customerCheckResult) return;
    
    if (customerCheckResult.exists) {
      if (customerCheckResult.hasPassword) {
        setExistingCustomerName(customerCheckResult.name || '');
        setStep('login');
      } else {
        setExistingCustomerName(customerCheckResult.name || '');
        setName(customerCheckResult.name || '');
        setStep('create_password');
      }
    } else {
      setStep('register');
    }
  };

  const validateWhatsApp = async () => {
    const digits = phone.replace(/\D/g, '');
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: digits, sendWelcome: false }
      });

      if (error) throw error;

      if (data?.exists) {
        setWhatsappStatus('valid');
      } else {
        setWhatsappStatus('invalid');
      }
    } catch (err) {
      console.error('Erro ao validar WhatsApp:', err);
      setWhatsappStatus('invalid');
    } finally {
      setStep('whatsapp_result');
    }
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Digite um telefone válido');
      return;
    }

    // Start animated flow
    setStep('identifying');
    
    const result = await checkCustomer(digits, storeId, tableNumber);
    setCustomerCheckResult(result);
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
    setCustomerCheckResult(null);
    setWhatsappStatus('validating');
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone': return 'Identificação';
      case 'identifying':
      case 'identified':
      case 'validating_whatsapp':
      case 'whatsapp_result':
        return '';
      case 'register': return 'Cadastro Rápido';
      case 'login': return `Olá, ${existingCustomerName || 'Cliente'}!`;
      case 'create_password': return 'Criar Senha';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'phone': return 'Digite seu telefone para continuar';
      case 'identifying':
      case 'identified':
      case 'validating_whatsapp':
      case 'whatsapp_result':
        return '';
      case 'register': return 'Complete seu cadastro para fazer pedidos';
      case 'login': return 'Digite sua senha para acessar';
      case 'create_password': return 'Crie uma senha de 4 a 6 dígitos';
    }
  };

  const isAnimatedStep = ['identifying', 'identified', 'validating_whatsapp', 'whatsapp_result'].includes(step);

  return (
    <Card className="border-0 shadow-lg">
      {!isAnimatedStep && (
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
        </CardHeader>
      )}

      <CardContent className={isAnimatedStep ? 'py-4' : 'space-y-4'}>
        {error && !isAnimatedStep && (
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

        {step === 'identifying' && (
          <TableAuthIdentifyingStep phone={phone} />
        )}

        {step === 'identified' && customerCheckResult && (
          <TableAuthIdentifiedStep 
            isNewCustomer={!customerCheckResult.exists}
            customerName={customerCheckResult.name}
            previousStores={customerCheckResult.previousStores}
            isNewToThisStore={customerCheckResult.isNewToThisStore}
          />
        )}

        {step === 'validating_whatsapp' && (
          <TableAuthWhatsAppStep status="validating" phone={phone} />
        )}

        {step === 'whatsapp_result' && (
          <TableAuthWhatsAppStep status={whatsappStatus} phone={phone} />
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
            phone={phone}
            password={password}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            onBack={handleBack}
            isLoading={isLoading}
            showForgotPassword={true}
            loginError={error}
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
