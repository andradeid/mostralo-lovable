import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useEffect } from 'react';

type OrderStatus = Database['public']['Enums']['order_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  deliveryType: DeliveryType;
  createdAt: string;
  completedAt?: string | null;
  assignedDriverName?: string;
}

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: string;
  description: string;
}

export const OrderStatusTimeline = ({
  currentStatus,
  deliveryType,
  createdAt,
  completedAt,
}: OrderStatusTimelineProps) => {
  // Log para debug - sempre que o componente renderizar
  useEffect(() => {
    console.log('📊 OrderStatusTimeline renderizado:', {
      currentStatus,
      deliveryType,
      createdAt,
      completedAt,
      timestamp: new Date().toISOString()
    });
  }, [currentStatus, deliveryType, createdAt, completedAt]);
  
  // Log dos steps criados
  useEffect(() => {
    console.log('📋 Steps criados:', {
      deliveryType,
      stepsCount: steps.length,
      steps: steps.map(s => ({ status: s.status, label: s.label }))
    });
    console.log('📋 StatusOrder:', statusOrder);
    console.log('📋 CurrentStatus:', currentStatus);
  }, [deliveryType, currentStatus]);

  // Definir os passos da timeline baseado no tipo de entrega
  const steps: TimelineStep[] = deliveryType === 'pickup'
    ? [
        {
          status: 'entrada',
          label: 'Pedido Recebido',
          icon: '📥',
          description: 'Seu pedido foi confirmado'
        },
        {
          status: 'em_preparo',
          label: 'Preparando',
          icon: '👨‍🍳',
          description: 'Preparando com carinho'
        },
        {
          status: 'aguarda_retirada',
          label: 'Aguarda Retirada',
          icon: '📦',
          description: 'Seu pedido está pronto para retirada'
        },
        {
          status: 'concluido',
          label: 'Concluído',
          icon: '✅',
          description: 'Pedido finalizado'
        }
      ]
    : [
        {
          status: 'entrada',
          label: 'Pedido Recebido',
          icon: '📥',
          description: 'Seu pedido foi confirmado'
        },
        {
          status: 'em_preparo',
          label: 'Preparando',
          icon: '👨‍🍳',
          description: 'Preparando com carinho'
        },
        {
          status: 'aguarda_retirada',
          label: 'Aguardando Entregador',
          icon: '📦',
          description: 'Pedido pronto, aguardando entregador'
        },
        {
          status: 'em_transito',
          label: 'A Caminho',
          icon: '🚴',
          description: 'Entregador saiu para entrega'
        },
        {
          status: 'concluido',
          label: 'Entregue',
          icon: '✅',
          description: 'Pedido finalizado'
        }
      ];

  const statusOrder: OrderStatus[] = deliveryType === 'pickup'
    ? ['entrada', 'em_preparo', 'aguarda_retirada', 'concluido']
    : ['entrada', 'em_preparo', 'aguarda_retirada', 'em_transito', 'concluido'];

  // Encontrar índice do status atual
  let currentIndex = statusOrder.indexOf(currentStatus);
  
  console.log('🔍 Calculando currentIndex:', {
    currentStatus,
    deliveryType,
    statusOrder,
    currentIndex,
    stepsLength: steps.length
  });
  
  // Se não encontrou, usar 0 (primeiro status)
  if (currentIndex === -1) {
    console.warn('⚠️ Status não encontrado em statusOrder, usando índice 0');
    currentIndex = 0;
  }
  
  // Garantir que está nos limites
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= steps.length) currentIndex = steps.length - 1;
  
  console.log('✅ currentIndex final:', currentIndex, 'de', steps.length, 'steps');

  const getStepStatus = (stepIndex: number) => {
    // Pedido cancelado = todos cancelled
    if (currentStatus === 'cancelado') {
      return 'cancelled';
    }
    
    // Pedido concluído = todos completed
    if (currentStatus === 'concluido') {
      return 'completed';
    }
    
    // SIMPLIFICADO: Comparar posição do step com currentIndex
    if (stepIndex < currentIndex) {
      return 'completed'; // Passos anteriores = completos
    }
    if (stepIndex === currentIndex) {
      return 'current'; // Passo atual = current
    }
    return 'pending'; // Passos futuros = pendentes
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-primary';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getIconComponent = (stepStatus: string) => {
    if (stepStatus === 'completed') {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    }
    if (stepStatus === 'current') {
      return <Circle className="h-6 w-6 text-primary fill-primary animate-pulse" />;
    }
    return <Circle className="h-6 w-6 text-muted-foreground" />;
  };

  // Se o pedido foi cancelado, mostrar mensagem especial
  if (currentStatus === 'cancelado') {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-5xl">❌</div>
        <h3 className="text-xl font-semibold text-red-600">Pedido Cancelado</h3>
        <p className="text-sm text-muted-foreground">
          Entre em contato com a loja para mais informações
        </p>
      </div>
    );
  }

  // Log antes de renderizar
  useEffect(() => {
    console.log('🎨 Renderizando timeline:', {
      stepsCount: steps.length,
      currentIndex,
      currentStatus,
      deliveryType,
      stepsLabels: steps.map(s => s.label)
    });
  }, [steps.length, currentIndex, currentStatus, deliveryType]);

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(index);
        const isLast = index === steps.length - 1;
        
        return (
          <div key={`${step.status}-${index}-${deliveryType}`} className="relative">
            <div className="flex items-start gap-4 pb-6">
              {/* Ícone */}
              <div className="relative flex-shrink-0 pt-1">
                {getIconComponent(stepStatus)}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={`font-semibold text-sm ${getStepColor(stepStatus)}`}>
                      {step.icon} {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Horário */}
                  {stepStatus === 'completed' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {index === 0 && format(new Date(createdAt), 'HH:mm', { locale: ptBR })}
                      {index === steps.length - 1 && completedAt && 
                        format(new Date(completedAt), 'HH:mm', { locale: ptBR })
                      }
                    </div>
                  )}
                  
                  {stepStatus === 'current' && (
                    <div className="text-xs font-medium text-primary">
                      Agora
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linha conectora */}
            {!isLast && (
              <div 
                className={`absolute left-3 top-8 w-0.5 h-6 -ml-px ${
                  stepStatus === 'completed' ? 'bg-green-600' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
