import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/use-auth';
import { CookieBanner } from '@/components/CookieBanner';
import { PrivacyConsent } from '@/components/PrivacyConsent';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';

// Landing page sections
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhatsAppMarketingSection } from '@/components/landing/WhatsAppMarketingSection';
import { DigitalSignageSection } from '@/components/landing/DigitalSignageSection';
import { PasswordCallSection } from '@/components/landing/PasswordCallSection';
import { ProblemsSection } from '@/components/landing/ProblemsSection';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { MarketingDigitalSection } from '@/components/landing/MarketingDigitalSection';
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
    title: 'Mostralo - Pare de Financiar o iFood com Seus Clientes | Sistema de Delivery Próprio',
    description: 'Cada pedido no marketplace constrói o negócio deles, não o seu. Economize até R$ 90.000/ano e tenha 100% dos seus clientes e dados.',
    keywords: 'alternativa ifood, sistema delivery próprio, economizar taxas delivery, cardápio digital sem taxa, delivery sem comissão, parar de pagar ifood',
    image: '/favicon.png'
  });

  return (
    <div className="min-h-screen bg-background font-sans w-full overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <WhatsAppMarketingSection />
      <DigitalSignageSection />
      <PasswordCallSection />
      <ProblemsSection />
      <SavingsCalculator />
      <MarketingDigitalSection />
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
    </div>
  );
};

export default Index;
