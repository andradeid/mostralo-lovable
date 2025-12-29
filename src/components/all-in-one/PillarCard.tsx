import { LucideIcon } from 'lucide-react';

interface PillarCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  stat?: string;
  delay?: number;
}

export const PillarCard = ({ icon: Icon, title, subtitle, description, stat, delay = 0 }: PillarCardProps) => {
  return (
    <div 
      className="group relative bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 cursor-pointer animate-card-entry"
      style={{ 
        animationDelay: `${delay}s`,
        animationFillMode: 'backwards',
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/15 group-hover:to-transparent transition-all duration-500" />
      
      {/* Moving border effect on hover */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-2xl animate-border-spin" style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.5) 60deg, transparent 120deg)',
          padding: '2px',
        }} />
      </div>
      
      <div className="relative z-10">
        {/* Icon with enhanced glow */}
        <div className="relative w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-500 group-hover:bg-primary/20 group-hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] group-hover:scale-110">
          {/* Pulse rings on hover */}
          <div className="absolute inset-0 rounded-xl bg-primary/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
          
          <Icon className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
        </div>
        
        {/* Content with stagger effect */}
        <p className="text-primary font-medium text-sm mb-1 transition-transform duration-300 group-hover:translate-x-1">{subtitle}</p>
        <h3 className="text-foreground font-display font-bold text-xl mb-3 transition-transform duration-300 group-hover:translate-x-1" style={{ transitionDelay: '0.05s' }}>{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed transition-transform duration-300 group-hover:translate-x-1" style={{ transitionDelay: '0.1s' }}>{description}</p>
        
        {/* Stat badge with enhanced animation */}
        {stat && (
          <div className="mt-4 inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded-full transition-all duration-300 group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <span className="text-primary font-bold text-sm">{stat}</span>
          </div>
        )}
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/20 rotate-45" />
      </div>
      
      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500" />

      <style>{`
        @keyframes card-entry {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-card-entry {
          animation: card-entry 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes border-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-border-spin {
          animation: border-spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
