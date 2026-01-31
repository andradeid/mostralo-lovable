import { Store, Phone, Mail, MapPin, Linkedin, Instagram, MessageCircle, Shield, FileText, Cookie, Scale, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface MainFooterProps {
  showDisclaimer?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

export function MainFooter({ showDisclaimer = true, variant = 'auto' }: MainFooterProps) {
  const currentYear = new Date().getFullYear();
  
  const bgClass = variant === 'dark' 
    ? 'bg-slate-900' 
    : variant === 'light' 
      ? 'bg-slate-100' 
      : 'bg-slate-900';
  
  const textClass = variant === 'light' ? 'text-slate-800' : 'text-slate-300';
  const mutedClass = variant === 'light' ? 'text-slate-600' : 'text-slate-400';
  const headingClass = variant === 'light' ? 'text-slate-900' : 'text-white';

  return (
    <footer className={`${bgClass} border-t border-slate-800`}>
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1 - About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <span className={`text-xl font-bold ${headingClass}`}>Mostralo</span>
            </div>
            <p className={`text-sm ${mutedClass} leading-relaxed`}>
              Plataforma completa para delivery, gestão financeira e automação de negócios locais. 
              Economize até R$ 90.000/ano com nossa solução all-in-one.
            </p>
            <div className="space-y-3 pt-2">
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
              >
                <Phone className="w-4 h-4 text-primary" />
                <span>WhatsApp Comercial</span>
              </a>
              <a 
                href="mailto:contato@mostralo.app" 
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>contato@mostralo.app</span>
              </a>
              <div className={`flex items-center gap-2 text-sm ${mutedClass}`}>
                <MapPin className="w-4 h-4 text-primary" />
                <span>Brasil</span>
              </div>
            </div>
          </div>

          {/* Column 2 - Social Media */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${headingClass}`}>Redes Sociais</h3>
            <div className="space-y-3">
              <a 
                href="https://linkedin.com/company/mostralo" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
                aria-label="LinkedIn da Mostralo"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
              <a 
                href="https://instagram.com/mostralo.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
                aria-label="Instagram da Mostralo"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
                aria-label="WhatsApp da Mostralo"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Column 3 - Legal */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${headingClass}`}>Informações Legais</h3>
            <div className="space-y-3">
              <Link 
                to="/privacidade" 
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
              >
                <Shield className="w-4 h-4" />
                <span>Política de Privacidade</span>
              </Link>
              <Link 
                to="/termos" 
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
              >
                <FileText className="w-4 h-4" />
                <span>Termos de Uso</span>
              </Link>
              <Link 
                to="/lgpd" 
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
              >
                <Scale className="w-4 h-4" />
                <span>LGPD - Proteção de Dados</span>
              </Link>
              <Link 
                to="/cookies" 
                className={`flex items-center gap-2 text-sm ${textClass} hover:text-primary transition-colors`}
              >
                <Cookie className="w-4 h-4" />
                <span>Política de Cookies</span>
              </Link>
            </div>
          </div>

          {/* Column 4 - Company Info */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${headingClass}`}>Informações Empresariais</h3>
            <div className="space-y-3">
              <div className={`text-sm ${mutedClass}`}>
                <span className="font-medium">CNPJ:</span>
                <p>51.691.995/0001-15</p>
              </div>
              <div className={`text-sm ${mutedClass}`}>
                <span className="font-medium">Responsável:</span>
                <p>Marcos Henrique da Silva Andrade</p>
              </div>
              <div className={`text-sm ${mutedClass}`}>
                <span className="font-medium">Localização:</span>
                <p>Brasília - DF, Brasil</p>
              </div>
              <div className={`text-sm ${mutedClass}`}>
                <span className="font-medium">Experiência Internacional:</span>
                <p>Brasil, Estados Unidos e Suíça</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      {showDisclaimer && (
        <div className={`${variant === 'light' ? 'bg-slate-200/50' : 'bg-slate-800/50'}`}>
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="border-l-4 border-primary pl-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-primary text-sm">Aviso Legal Importante</h4>
              </div>
              <p className={`text-xs ${mutedClass} leading-relaxed max-w-4xl`}>
                Este site apresenta funcionalidades e resultados baseados em experiências reais de clientes. 
                Os resultados podem variar dependendo do segmento, tamanho do negócio, região de atuação e 
                implementação das estratégias. A economia mencionada de até R$ 90.000/ano é uma estimativa 
                baseada em casos específicos e não constitui garantia de resultados. Consulte nossos termos 
                de uso para mais informações.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Copyright Section */}
      <div className={`${variant === 'light' ? 'bg-slate-300' : 'bg-slate-950'} py-4`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 text-center">
            <p className={`text-xs ${mutedClass}`}>
              © {currentYear} Mostralo. Todos os direitos reservados.
            </p>
            <span className={`hidden sm:inline text-xs ${mutedClass}`}>•</span>
            <p className={`text-xs ${mutedClass}`}>
              Plataforma completa para delivery e gestão de negócios locais
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
