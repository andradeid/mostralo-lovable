import { Link } from "react-router-dom";
import { Store, MessageCircle, Instagram, Linkedin, Mail, Phone, Shield, Cloud } from "lucide-react";

const navegacao = [
  { label: "Pilares", href: "#pilares" },
  { label: "Tecnologia", href: "#tecnologia" },
  { label: "FAQ", href: "#faq" },
  { label: "Comece Agora", href: "/signup", isRoute: true },
];

const legal = [
  { label: "Termos de Uso", href: "/terms" },
  { label: "Política de Privacidade", href: "/privacy" },
  { label: "LGPD", href: "/lgpd" },
];

const redes = [
  { 
    icon: MessageCircle, 
    label: "WhatsApp", 
    href: "https://wa.me/5511999999999",
    cor: "hover:text-green-400"
  },
  { 
    icon: Instagram, 
    label: "Instagram", 
    href: "https://instagram.com/mostralo",
    cor: "hover:text-pink-400"
  },
  { 
    icon: Linkedin, 
    label: "LinkedIn", 
    href: "https://linkedin.com/company/mostralo",
    cor: "hover:text-blue-400"
  },
];

export function Footer360() {
  const scrollToSection = (href: string) => {
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Main Footer */}
      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Coluna 1 - Sobre */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <Store className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">Mostralo</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Sistema All-in-One para gestão de lucro. 
              Atração, conversão, eficiência e gestão de talentos em uma única plataforma.
            </p>
            {/* Redes Sociais */}
            <div className="flex items-center gap-3">
              {redes.map((rede) => (
                <a
                  key={rede.label}
                  href={rede.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 transition-all hover:border-slate-600 ${rede.cor}`}
                  aria-label={rede.label}
                >
                  <rede.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Coluna 2 - Navegação */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navegação</h4>
            <ul className="space-y-3">
              {navegacao.map((item) => (
                <li key={item.label}>
                  {item.isRoute ? (
                    <Link
                      to={item.href}
                      className="text-slate-400 hover:text-orange-400 transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => scrollToSection(item.href)}
                      className="text-slate-400 hover:text-orange-400 transition-colors text-sm"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 - Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-slate-400 hover:text-orange-400 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4 - Contato */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp Comercial
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@mostralo.com.br"
                  className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  contato@mostralo.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-slate-500 text-sm text-center md:text-left">
              © {currentYear} Mostralo. Todos os direitos reservados.
            </p>

            {/* Selos de Segurança */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">LGPD</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                <Cloud className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-400">AWS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
