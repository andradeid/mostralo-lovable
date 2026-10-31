import { Bell, CheckCircle2, Truck } from 'lucide-react';

// Trecho único da página de Food Truck: simulador de acompanhamento do pedido.
const trackingSteps = [
  { label: 'Pedido Recebido', time: '19:32', completed: true },
  { label: 'Preparando', time: '19:35', completed: true },
  { label: 'Pronto para Retirada', time: '19:42', completed: false, current: true },
  { label: 'Retirado', time: '', completed: false },
];

const checklist = [
  'Notificação automática quando o pedido fica pronto',
  'Reduz aglomeração no balcão de retirada',
  'Cliente sabe exatamente quando ir buscar',
];

export const FoodTruckOrderTracking = () => (
  <section className="py-20 bg-zinc-900/50">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Seu cliente acompanha{" "}
              <span className="text-orange-400">cada etapa</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              O cliente faz o pedido pelo QR Code e acompanha o status em tempo real no próprio celular.
              Quando estiver pronto, recebe uma notificação. Menos gritaria, mais organização.
            </p>
            <ul className="space-y-4">
              {checklist.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center">
            <div className="bg-zinc-800 rounded-3xl p-4 shadow-2xl shadow-orange-500/10 border border-zinc-700">
              <div className="bg-zinc-950 rounded-2xl p-6 w-72">
                {/* Phone Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Truck Burger</div>
                    <div className="text-sm text-zinc-500">Pedido #127</div>
                  </div>
                </div>

                {/* Tracking Steps */}
                <div className="space-y-4">
                  {trackingSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          step.completed
                            ? "bg-orange-500 border-orange-500"
                            : step.current
                              ? "border-orange-500 animate-pulse"
                              : "border-zinc-600"
                        }`}>
                          {step.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                          {step.current && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                        </div>
                        {index < trackingSteps.length - 1 && (
                          <div className={`w-0.5 h-8 ${
                            step.completed ? "bg-orange-500" : "bg-zinc-700"
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          step.completed || step.current ? "text-white" : "text-zinc-500"
                        }`}>
                          {step.label}
                        </div>
                        {step.time && (
                          <div className="text-sm text-zinc-500">{step.time}</div>
                        )}
                        {step.current && (
                          <div className="text-xs text-orange-400 mt-1">(Você está no balcão)</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button className="w-full mt-6 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-orange-500/30 transition-colors">
                  <Bell className="w-4 h-4" />
                  Chamar quando estiver pronto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
