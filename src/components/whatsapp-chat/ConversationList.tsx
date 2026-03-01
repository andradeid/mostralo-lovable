import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const term = search.toLowerCase();
    return (
      (c.contact_name || '').toLowerCase().includes(term) ||
      c.phone_number.includes(term)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header com busca */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={() => onSelect(conv)}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
