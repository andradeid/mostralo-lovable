import { useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import type { LegacyPageData } from "@/types/legacyPage";

interface LegacyPageRendererProps {
  page: LegacyPageData;
  isPreview?: boolean;
}

/** Renderiza a página legacy com o visual do exemplo (card centralizado, gradiente, etc.) */
export function LegacyPageRenderer({ page, isPreview = false }: LegacyPageRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Efeito de confete
  useEffect(() => {
    if (!page.confetti_enabled || isPreview) return;
    
    const emojis = ['🎈', '🎉', '🎊', '✨', '⭐', '💥'];
    const elements: HTMLDivElement[] = [];
    
    for (let i = 0; i < 40; i++) {
      const div = document.createElement('div');
      div.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
      div.style.cssText = `
        position: fixed; left: ${Math.random() * 100}%; top: -20px;
        font-size: ${Math.random() * 20 + 20}px; pointer-events: none; z-index: 10000;
        animation: legacyConfettiFall ${Math.random() * 2 + 2}s linear forwards;
      `;
      document.body.appendChild(div);
      elements.push(div);
    }

    const timer = setTimeout(() => elements.forEach(el => el.remove()), 4000);
    return () => {
      clearTimeout(timer);
      elements.forEach(el => el.remove());
    };
  }, [page.confetti_enabled, isPreview]);

  const gradientParts = page.background_gradient.split(',').map(s => s.trim());
  const gradientCSS = gradientParts.length >= 3
    ? `linear-gradient(${gradientParts.join(', ')})`
    : `linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #667eea 100%)`;

  const infoCards = Array.isArray(page.info_cards) ? page.info_cards : [];
  const actionButtons = Array.isArray(page.action_buttons) ? page.action_buttons : [];

  const handleButtonClick = (url: string) => {
    if (!url || isPreview) return;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex justify-center items-center p-5 relative overflow-x-hidden"
      style={{
        background: gradientCSS,
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        ...(page.animated_gradient_enabled ? { backgroundSize: '400% 400%', animation: 'legacyGradientMove 8s ease infinite' } : {}),
      }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes legacyConfettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes legacyFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes legacyGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes legacyFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          25% { transform: translateY(-30px) translateX(10px); opacity: 1; }
          50% { transform: translateY(-15px) translateX(-10px); opacity: 0.8; }
          75% { transform: translateY(-40px) translateX(5px); opacity: 0.5; }
        }
        @keyframes legacyBubble {
          0% { transform: translateY(100vh) scale(0.4); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translateY(-20px) scale(1); opacity: 0; }
        }
        @keyframes legacySnowFall {
          0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; }
          50% { transform: translateY(50vh) translateX(30px) rotate(180deg); opacity: 0.8; }
          100% { transform: translateY(100vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* Partículas flutuantes */}
      {page.particles_enabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`p-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: 'rgba(255,255,255,0.7)',
                boxShadow: '0 0 6px rgba(255,255,255,0.5)',
                animation: `legacyFloat ${Math.random() * 4 + 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Bolhas animadas */}
      {page.bubbles_enabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`b-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
                left: `${Math.random() * 100}%`,
                bottom: '-30px',
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.1))',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: `legacyBubble ${Math.random() * 6 + 6}s ease-in infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Neve / Pétalas */}
      {page.snow_enabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={`s-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                fontSize: `${Math.random() * 10 + 10}px`,
                animation: `legacySnowFall ${Math.random() * 5 + 5}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: 0,
              }}
            >
              {['❄', '✿', '❀', '✾'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* Card principal */}
      <div
        className="max-w-[500px] w-full rounded-[20px] p-8 md:p-10 text-center relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'legacyFadeIn 0.5s ease-in',
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          {page.logo_url ? (
            <img
              src={page.logo_url}
              alt={page.store_name}
              className="w-[120px] h-[120px] rounded-full object-cover mx-auto mb-5"
              style={{
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                border: `3px solid ${page.logo_border_color}`,
              }}
            />
          ) : (
            <div
              className="w-[120px] h-[120px] rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: gradientCSS,
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                border: `3px solid ${page.logo_border_color}`,
              }}
            >
              <span className="text-[50px] text-white">🎈</span>
            </div>
          )}

          <h1 className="text-[#222] text-[28px] font-bold mb-2.5 leading-tight">
            {page.store_name || 'Nome da Loja'}
          </h1>
          {page.subtitle && (
            <p className="text-[#666] text-base leading-relaxed">
              {page.subtitle}
            </p>
          )}
        </div>

        {/* Info Cards */}
        {infoCards.length > 0 && (
          <div className="bg-[#f8f9fa] rounded-[15px] p-5 mb-8 text-left">
            {infoCards.map((card, idx) => (
              <div
                key={idx}
                className="flex items-center p-2.5 bg-white rounded-[10px] mb-4 last:mb-0"
                style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)' }}
              >
                <span className="text-2xl mr-4 min-w-[40px] text-center">{card.icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-[#999] uppercase tracking-wider">{card.label}</div>
                  <div className="text-base text-[#333] font-bold mt-0.5">{card.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-4">
          {actionButtons.map((btn, idx) => {
            if (btn.type === 'embed' && btn.embed_html) {
              return <EmbedButton key={idx} html={btn.embed_html} isPreview={isPreview} />;
            }
            if (btn.type === 'whatsapp') {
              return (
                <button
                  key={idx}
                  onClick={() => handleButtonClick(btn.url)}
                  className="w-full text-white border-none py-3 px-5 text-sm rounded-full cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: btn.color || '#25D366' }}
                >
                  {btn.label}
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleButtonClick(btn.url)}
                className="w-full text-white border-none py-[18px] px-10 text-lg font-bold rounded-full cursor-pointer transition-all duration-300 hover:-translate-y-0.5 mb-2"
                style={{
                  background: `linear-gradient(135deg, ${btn.color || '#ff758c'} 0%, ${lightenColor(btn.color || '#ff758c', 20)} 100%)`,
                  boxShadow: `0 5px 15px ${btn.color || '#ff758c'}66`,
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {page.footer_text && (
          <div className="mt-8 text-xs text-[#999]">
            {page.footer_text}
          </div>
        )}
      </div>
    </div>
  );
}

/** Componente que renderiza embed HTML com scripts externos */
function EmbedButton({ html, isPreview }: { html: string; isPreview?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || isPreview) return;

    // Sanitiza o HTML permitindo atributos data-* e classes específicas
    const clean = DOMPurify.sanitize(html, {
      ADD_TAGS: ['script'],
      ADD_ATTR: ['data-glf-cuid', 'data-glf-ruid', 'defer', 'async'],
      FORCE_BODY: true,
    });

    // Separa scripts do HTML
    const temp = document.createElement('div');
    temp.innerHTML = clean;

    const scripts = temp.querySelectorAll('script');
    const nonScriptHTML = clean.replace(/<script[\s\S]*?<\/script>/gi, '');

    ref.current.innerHTML = nonScriptHTML;

    // Carrega scripts dinamicamente
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.async = true;
        document.body.appendChild(s);
      }
    });
  }, [html, isPreview]);

  if (isPreview) {
    return (
      <div className="w-full text-white border-none py-[18px] px-10 text-lg font-bold rounded-full cursor-pointer text-center"
        style={{ background: 'linear-gradient(135deg, #ff758c 0%, #ff9a9e 100%)' }}>
        📋 Widget Embed (visível na página pública)
      </div>
    );
  }

  return <div ref={ref} className="w-full" />;
}

/** Clarear uma cor hex */
function lightenColor(hex: string, percent: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}
