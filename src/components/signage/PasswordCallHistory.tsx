import { PasswordCall } from '@/hooks/usePublicPasswordCalls';
import { PasswordCallConfig } from '@/hooks/usePasswordCallConfig';

interface PasswordCallHistoryProps {
  calls: PasswordCall[];
  config: PasswordCallConfig | null;
  latestCallId?: string | null;
}

const callTypeLabels: Record<string, string> = {
  password: 'Senha',
  order: 'Pedido',
  table: 'Mesa'
};

export function PasswordCallHistory({ calls, config, latestCallId }: PasswordCallHistoryProps) {
  if (!config?.is_enabled || !config?.show_history || calls.length === 0) {
    return null;
  }

  const color = config.primary_color || '#f97316';

  return (
    <div className="fixed right-0 top-0 bottom-0 w-48 bg-black/60 backdrop-blur-sm flex flex-col z-40">
      {/* Header */}
      <div 
        className="p-4 text-center text-white font-semibold text-sm uppercase tracking-wider"
        style={{ backgroundColor: `${color}cc` }}
      >
        Últimas Chamadas
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-hidden">
        {calls.map((call, index) => {
          const isLatest = call.id === latestCallId;
          const isFirst = index === 0;

          return (
            <div
              key={call.id}
              className={`
                p-4 border-b border-white/10 transition-all duration-500
                ${isLatest ? 'animate-pulse' : ''}
                ${isFirst ? 'bg-white/10' : ''}
              `}
              style={{
                borderLeftWidth: isFirst ? 4 : 0,
                borderLeftColor: color
              }}
            >
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                {callTypeLabels[call.call_type]}
              </p>
              <p 
                className={`text-white font-bold ${isFirst ? 'text-4xl' : 'text-2xl'}`}
                style={{ color: isFirst ? color : undefined }}
              >
                {call.call_number}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
