import { Button } from "@/components/ui/button";
import { Printer, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadButtonsProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename: string;
  paperSize?: 'A4' | 'A5';
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
      
      // Lista de propriedades CSS importantes para preservar (SEM box-shadow)
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
        'opacity', 'overflow', 'white-space', 'word-break',
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
      
      // Garantir que não há sombra
      target.style.boxShadow = 'none';
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

// Função para converter imagens para base64
const convertImagesToBase64 = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(async (img) => {
    if (img.src.startsWith('data:')) return;
    
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          img.src = reader.result as string;
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(blob);
      });
    } catch {
      // Se falhar, mantém a imagem original
    }
  });
  
  await Promise.all(promises);
};

// Função para gerar PNG usando SVG foreignObject
const generatePng = async (element: HTMLElement, scale: number = 2): Promise<string> => {
  const clone = cloneWithComputedStyles(element);
  clone.style.boxShadow = 'none';
  
  // Converter imagens para base64
  await convertImagesToBase64(clone);
  
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  
  // Criar SVG com foreignObject
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}">
      <foreignObject width="${width}" height="${height}" transform="scale(${scale})">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;
  
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      URL.revokeObjectURL(svgUrl);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Falha ao carregar imagem'));
    };
    img.src = svgUrl;
  });
};

export function DownloadButtons({ targetRef, filename, paperSize = 'A4', onPrint }: DownloadButtonsProps) {
  const isA5 = paperSize === 'A5';
  const pageWidth = isA5 ? '148mm' : '210mm';
  const pageHeight = isA5 ? '210mm' : '297mm';
  const scale = isA5 ? 0.7 : 1;
  
  // Download como PNG em alta qualidade
  const handleDownloadPng = async () => {
    if (!targetRef.current) {
      toast({
        title: "Erro",
        description: "Elemento não encontrado para gerar imagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Gerando imagem...",
        description: "Aguarde enquanto a imagem é processada.",
      });

      const dataUrl = await generatePng(targetRef.current, 2);

      // Criar link e fazer download
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Download concluído!",
        description: "Imagem PNG salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar imagem PNG. Tente usar a prévia A5 para salvar.",
        variant: "destructive",
      });
    }
  };

  // Prévia do material
  const handlePreview = () => {
    if (!targetRef.current) {
      toast({
        title: "Erro",
        description: "Elemento não encontrado para prévia.",
        variant: "destructive",
      });
      return;
    }

    const clonedElement = cloneWithComputedStyles(targetRef.current);
    clonedElement.style.boxShadow = 'none';

    const windowWidth = isA5 ? 620 : 900;
    const windowHeight = isA5 ? 880 : 1000;
    const previewWindow = window.open('', '_blank', `width=${windowWidth},height=${windowHeight}`);
    if (!previewWindow) {
      toast({
        title: "Erro",
        description: "Pop-up bloqueado. Permita pop-ups para visualizar.",
        variant: "destructive",
      });
      return;
    }

    const sizeLabel = isA5 ? 'A5' : 'A4';
    const sizeInfo = isA5 ? '148mm × 210mm' : '210mm × 297mm';
    const contentScale = isA5 ? 0.7 : 0.85;
    const printScale = isA5 ? 0.65 : 0.75;

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prévia ${sizeLabel} - ${filename}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            display: flex; 
            justify-content: center; 
            align-items: flex-start;
            min-height: 100vh;
            margin: 0;
            padding: 60px 20px 20px;
            background: #e5e5e5;
            font-family: Arial, sans-serif;
          }
          .page-container {
            width: ${pageWidth};
            min-height: ${pageHeight};
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            overflow: hidden;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 5mm;
            border-radius: 4px;
          }
          .content {
            transform: scale(${contentScale});
            transform-origin: top center;
          }
          .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1a1a2e;
            color: white;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
          }
          .header h1 { font-size: 14px; font-weight: 600; }
          .header span { font-size: 12px; opacity: 0.8; }
          .print-btn {
            background: #f97316;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
          }
          .print-btn:hover { background: #ea580c; }
          img { max-width: 100%; height: auto; }
          @page { 
            size: ${sizeLabel} portrait; 
            margin: 5mm; 
          }
          @media print {
            body { 
              background: white; 
              padding: 0;
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
            .header { display: none; }
            .page-container { 
              box-shadow: none; 
              width: 100%;
              height: auto;
              border-radius: 0;
              padding-top: 0;
            }
            .content {
              transform: scale(${printScale});
              transform-origin: top center;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Prévia ${sizeLabel} - ${filename}</h1>
            <span>Tamanho: ${sizeInfo}</span>
          </div>
          <button class="print-btn" onclick="window.print()">🖨️ Imprimir ${sizeLabel}</button>
        </div>
        <div class="page-container">
          <div class="content">
            ${clonedElement.outerHTML}
          </div>
        </div>
      </body>
      </html>
    `);

    previewWindow.document.close();
  };

  // Impressão padrão
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    if (!targetRef.current) {
      window.print();
      return;
    }

    const clonedElement = cloneWithComputedStyles(targetRef.current);
    clonedElement.style.boxShadow = 'none';
    const printContent = clonedElement.outerHTML;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Pop-up bloqueado. Permita pop-ups para imprimir.",
        variant: "destructive",
      });
      return;
    }

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
            align-items: center;
            min-height: 100vh;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          @page { 
            size: ${paperSize} portrait; 
            margin: 5mm; 
          }
          @media print {
            body { 
              padding: 0;
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
            body > * {
              transform: scale(0.65);
              transform-origin: top center;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          const images = document.querySelectorAll('img');
          let loadedCount = 0;
          const totalImages = images.length;
          
          const tryPrint = () => {
            window.print();
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
      <Button onClick={handlePreview} variant="outline" className="gap-2">
        <Eye className="h-4 w-4" />Prévia {paperSize}
      </Button>
      <Button onClick={handlePrint} variant="default" className="gap-2">
        <Printer className="h-4 w-4" />Imprimir / PDF
      </Button>
      <Button onClick={handleDownloadPng} variant="secondary" className="gap-2">
        <Download className="h-4 w-4" />Baixar PNG
      </Button>
    </div>
  );
}
