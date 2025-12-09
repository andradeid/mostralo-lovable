import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadButtonsProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename: string;
  onPrint?: () => void;
}

// Função para clonar elemento com estilos computados inline
const cloneWithComputedStyles = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  
  const copyComputedStyles = (source: Element, target: Element) => {
    if (source instanceof HTMLElement && target instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(source);
      
      // PRIMEIRO: Preservar estilos inline originais (gradientes, etc.)
      if (source.style.cssText) {
        target.style.cssText = source.style.cssText;
      }
      
      // Lista de propriedades CSS importantes para preservar
      const cssProperties = [
        'display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content',
        'gap', 'row-gap', 'column-gap',
        'grid-template-columns', 'grid-template-rows', 'grid-gap',
        'position', 'top', 'right', 'bottom', 'left', 'z-index',
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'border', 'border-width', 'border-style', 'border-color', 'border-radius',
        'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
        'background', 'background-color', 'background-image', 'background-size', 'background-position',
        'color', 'font-family', 'font-size', 'font-weight', 'font-style',
        'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-transform',
        'box-shadow', 'opacity', 'overflow', 'white-space', 'word-break',
        'object-fit', 'object-position', 'aspect-ratio',
        'transform', 'filter'
      ];
      
      cssProperties.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        // Só aplicar se não existir no style inline original
        if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
          if (!target.style.getPropertyValue(prop)) {
            target.style.setProperty(prop, value);
          }
        }
      });
    }
    
    // Recursivamente copiar estilos dos filhos
    const sourceChildren = source.children;
    const targetChildren = target.children;
    for (let i = 0; i < sourceChildren.length; i++) {
      if (sourceChildren[i] && targetChildren[i]) {
        copyComputedStyles(sourceChildren[i], targetChildren[i]);
      }
    }
  };
  
  copyComputedStyles(element, clone);
  return clone;
};

export function DownloadButtons({ targetRef, filename, onPrint }: DownloadButtonsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    if (!targetRef.current) {
      window.print();
      return;
    }

    // Clonar elemento com estilos computados inline
    const clonedElement = cloneWithComputedStyles(targetRef.current);
    const printContent = clonedElement.outerHTML;

    // Criar nova janela de impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Pop-up bloqueado. Permita pop-ups para imprimir.",
        variant: "destructive",
      });
      return;
    }

    // Escrever HTML com estilos inline já aplicados
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <meta charset="UTF-8">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            display: flex; 
            justify-content: center; 
            align-items: flex-start;
            min-height: 100vh;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body { 
              padding: 0;
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          // Aguardar carregamento das imagens antes de imprimir
          const images = document.querySelectorAll('img');
          let loadedCount = 0;
          const totalImages = images.length;
          
          const tryPrint = () => {
            window.print();
            // NÃO fechar automaticamente - deixar usuário decidir
          };
          
          if (totalImages === 0) {
            setTimeout(tryPrint, 500);
          } else {
            images.forEach(img => {
              if (img.complete) {
                loadedCount++;
                if (loadedCount === totalImages) setTimeout(tryPrint, 300);
              } else {
                img.onload = () => {
                  loadedCount++;
                  if (loadedCount === totalImages) setTimeout(tryPrint, 300);
                };
                img.onerror = () => {
                  loadedCount++;
                  if (loadedCount === totalImages) setTimeout(tryPrint, 300);
                };
              }
            });
            // Fallback timeout aumentado para 3 segundos
            setTimeout(tryPrint, 3000);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handlePrint} variant="default" className="gap-2">
        <Printer className="h-4 w-4" />Imprimir / Salvar PDF
      </Button>
    </div>
  );
}
