import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/use-auth';
import { CookieBanner } from '@/components/CookieBanner';
import { PrivacyConsent } from '@/components/PrivacyConsent';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { DiagnosticPopup } from '@/components/landing/DiagnosticPopup';

// Landing page sections
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhatsAppMarketingSection } from '@/components/landing/WhatsAppMarketingSection';
import { DigitalSignageSection } from '@/components/landing/DigitalSignageSection';
import { TableMenuSection } from '@/components/landing/TableMenuSection';
import { PasswordCallSection } from '@/components/landing/PasswordCallSection';
import { PDVComandasSection } from '@/components/landing/PDVComandasSection';
import { TotemSection } from '@/components/landing/TotemSection';
import { ProblemsSection } from '@/components/landing/ProblemsSection';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FinancialAutomationSection } from '@/components/landing/FinancialAutomationSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PlansSection } from '@/components/landing/PlansSection';
import { CTASection } from '@/components/landing/CTASection';

const Index = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 🎯 Capturar código de referência do vendedor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      localStorage.setItem('mostralo_referral_code', refCode);
      localStorage.setItem('mostralo_referral_timestamp', Date.now().toString());
    }
  }, []);

  // 🔒 PROTEÇÃO: Cliente NUNCA deve ver dashboard - apenas lojistas
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    if (userRole === 'customer') return;
    
    if (userRole === 'store_admin' || userRole === 'master_admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    if (userRole === 'delivery_driver') {
      navigate('/delivery-panel', { replace: true });
      return;
    }
  }, [user, userRole, authLoading, navigate]);

  usePageSEO({
    title: 'Mostralo - Plataforma Completa para Negócios Locais | Delivery, Marketing e Automação',
    description: 'Pare de depender de marketplaces. Gerencie seu delivery, automatize WhatsApp, fidelize clientes e economize até R$ 90.000/ano. Tudo em uma só plataforma para restaurantes, farmácias, pet shops e mais.',
    keywords: 'plataforma negócios locais, delivery próprio, automação whatsapp, cardápio digital, pdv restaurante, agendamentos online, marketing delivery, alternativa ifood, sistema gestão restaurante, gestão farmácia, gestão pet shop',
    image: '/favicon.png'
  });

  return (
    <div className="min-h-screen bg-background font-sans w-full overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <WhatsAppMarketingSection />
      <TableMenuSection />
      <DigitalSignageSection />
      <PasswordCallSection />
      <PDVComandasSection />
      <TotemSection />
      <ProblemsSection />
      <SavingsCalculator />
      <ComparisonSection />
      <FinancialAutomationSection />
      <TestimonialsSection />
      <FAQSection />
      <PlansSection />
      <CTASection />
      <DashboardFooter />
      <CookieBanner />
      <PrivacyConsent />
      <WhatsAppLeadButton />
      <DiagnosticPopup />
    </div>
  );
};

export default Index;
