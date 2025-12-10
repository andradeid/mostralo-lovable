import { useEffect, useRef } from "react";

interface ContractQRCodeProps {
  verificationHash: string;
  size?: number;
}

export function ContractQRCode({ verificationHash, size = 120 }: ContractQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && verificationHash) {
      const verificationUrl = `${window.location.origin}/verificar-contrato?hash=${verificationHash}`;
      
      // Simple QR code generation using canvas
      // For production, consider using a library like qrcode.react
      drawQRPlaceholder(canvasRef.current, verificationUrl, size);
    }
  }, [verificationHash, size]);

  const drawQRPlaceholder = (canvas: HTMLCanvasElement, url: string, size: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // QR pattern placeholder (simplified visual)
    const moduleSize = Math.floor(size / 25);
    ctx.fillStyle = '#000000';

    // Position patterns (corners)
    const drawPositionPattern = (x: number, y: number) => {
      // Outer
      ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
    };

    drawPositionPattern(moduleSize * 2, moduleSize * 2);
    drawPositionPattern(size - moduleSize * 9, moduleSize * 2);
    drawPositionPattern(moduleSize * 2, size - moduleSize * 9);

    // Center pattern
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, moduleSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = `${Math.floor(size / 12)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('QR', size / 2, size / 2 + 4);
  };

  if (!verificationHash) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded border" />
      <p className="text-xs text-muted-foreground text-center max-w-[120px]">
        Acesse a URL para verificar autenticidade
      </p>
    </div>
  );
}
