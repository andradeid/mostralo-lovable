import { LucideIcon } from 'lucide-react';

interface PillarCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  stat?: string;
}

export const PillarCard = ({ icon: Icon, title, subtitle, description, stat }: PillarCardProps) => {
  return (
    <div 
      className="group relative bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(var(--primary),0.3)]"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Icon with neon glow */}
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-shadow duration-300">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        
        {/* Content */}
        <p className="text-primary font-medium text-sm mb-1">{subtitle}</p>
        <h3 className="text-foreground font-display font-bold text-xl mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        
        {/* Stat badge */}
        {stat && (
          <div className="mt-4 inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
            <span className="text-primary font-bold text-sm">{stat}</span>
          </div>
        )}
      </div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/40 transition-colors duration-300" />
    </div>
  );
};
