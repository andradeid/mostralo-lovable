import { useState } from 'react';
import { Menu, Target, LucideIcon } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: LucideIcon;
}

interface FeaturesSidebarProps {
  sections: Section[];
}

export function FeaturesSidebar({ sections }: FeaturesSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Sidebar Toggle (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Navigation */}
      <aside className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-background border-r border-border overflow-y-auto z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Navegação</p>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-left"
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </button>
          ))}
          <button
            onClick={() => scrollToSection('comparativo')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors text-left mt-4"
          >
            <Target className="h-4 w-4" />
            Comparativo Final
          </button>
        </nav>
      </aside>
    </>
  );
}
