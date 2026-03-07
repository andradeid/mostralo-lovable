import { usePageSEO } from '@/hooks/useSEO';
import { MainFooter } from '@/components/MainFooter';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { MostraloChatHero } from '@/components/mostralo-chat/MostraloChatHero';
import { MostraloChatProblems } from '@/components/mostralo-chat/MostraloChatProblems';
import { MostraloChatSolution } from '@/components/mostralo-chat/MostraloChatSolution';
import { MostraloChatHowItWorks } from '@/components/mostralo-chat/MostraloChatHowItWorks';
import { MostraloChatROI } from '@/components/mostralo-chat/MostraloChatROI';
import { MostraloChatCTA } from '@/components/mostralo-chat/MostraloChatCTA';

const MostraloChatPage = () => {
  usePageSEO({
    title: 'Mostralo Chat - Atendimento Híbrido Invisível via WhatsApp | Mostralo',
    description: 'Transforme o WhatsApp da sua equipe em um vendedor de elite. Sistema invisível que tira pedidos, transcreve áudios e gera relatórios. Sem treinamento, sem resistência.',
    keywords: 'atendimento whatsapp, chat delivery, sistema invisível, whatsapp delivery, automação whatsapp, atendimento híbrido',
    image: '/favicon.png'
  });

  return (
    <div className="min-h-screen bg-white font-sans w-full overflow-x-hidden">
      <MostraloChatHero />
      <MostraloChatProblems />
      <MostraloChatSolution />
      <MostraloChatHowItWorks />
      <MostraloChatROI />
      <MostraloChatCTA />
      <MainFooter />
      <WhatsAppLeadButton />
    </div>
  );
};

export default MostraloChatPage;
