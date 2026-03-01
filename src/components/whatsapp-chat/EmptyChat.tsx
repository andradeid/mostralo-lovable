import { MessageSquare } from 'lucide-react';

export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <MessageSquare className="w-8 h-8" />
      </div>
      <div className="text-center">
        <h3 className="font-medium text-foreground">Chat WhatsApp</h3>
        <p className="text-sm mt-1">Selecione uma conversa para começar</p>
      </div>
    </div>
  );
}
