import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LeadChatForm } from './LeadChatForm';
import { trackClick } from '@/utils/trackClick';

export function WhatsAppLeadButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (whatsappNumber: string, message: string) => {
    // Limpar referral após conversão
    localStorage.removeItem('mostralo_referral_code');
    localStorage.removeItem('mostralo_referral_timestamp');
    
    // Abrir WhatsApp com mensagem personalizada
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => {
          trackClick('click_whatsapp', 'botao-flutuante-lead');
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Abrir chat"
      >
        {/* Badge */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Tire suas dúvidas!
        </div>
        
        {/* Botão */}
        <div className="relative">
          {/* Pulse animation */}
          <div className="absolute inset-0 bg-[#25d366] rounded-full animate-ping opacity-25" />
          
          {/* Button */}
          <div className="relative w-14 h-14 bg-[#25d366] hover:bg-[#1ebe5c] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
        </div>
      </button>

      {/* Modal do Chat */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-transparent border-none shadow-2xl">
          <LeadChatForm 
            onComplete={handleComplete}
            onClose={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}