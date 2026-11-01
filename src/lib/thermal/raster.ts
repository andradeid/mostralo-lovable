// Cupom como imagem (bitmap ESC/POS "GS v 0"): o texto é desenhado num canvas e mandado em pontos.
// Funciona em qualquer térmica, com todos os acentos, mesmo nas que ficam presas no modo chinês.

export type RasterOp =
  | { k: 'align'; v: 'left' | 'center' | 'right' }
  | { k: 'bold'; v: boolean }
  | { k: 'size'; v: boolean | 'mid' }
  | { k: 'text'; v: string }
  | { k: 'feed'; v: number }
  | { k: 'cut' };

/** Largura em pontos da cabeça de impressão: 58 mm = 384, 80 mm = 576. */
export const dotsFor = (paper: 58 | 80) => (paper === 80 ? 576 : 384);

const GS = 0x1d;
const ESC = 0x1b;

/** Desenha as operações do cupom e devolve os bytes ESC/POS da imagem. */
export function rasterize(ops: RasterOp[], paper: 58 | 80): number[] {
  const width = dotsFor(paper);
  const cols = paper === 80 ? 48 : 32;
  const charW = width / cols; // 12 pontos por letra no papel de 58 mm
  const fontPx = Math.round(charW / 0.6); // fonte monoespaçada: largura ≈ 0,6 da altura
  const lineH = Math.round(fontPx * 1.15);

  // 1) Quebra em linhas com o estilo de cada uma
  type Line = { text: string; align: 'left' | 'center' | 'right'; bold: boolean; big: boolean | 'mid' } | { feed: number } | { cut: true };
  const lines: Line[] = [];
  let align: 'left' | 'center' | 'right' = 'left';
  let bold = false;
  let big: boolean | 'mid' = false;
  let buf = '';
  let bufStyle = { align, bold, big };
  const flush = () => { lines.push({ text: buf, ...bufStyle }); buf = ''; };
  for (const op of ops) {
    if (op.k === 'align') align = op.v;
    else if (op.k === 'bold') bold = op.v;
    else if (op.k === 'size') big = op.v;
    else if (op.k === 'text') {
      for (const ch of op.v) {
        if (!buf) bufStyle = { align, bold, big };
        if (ch === '\n') flush(); else buf += ch;
      }
    } else if (op.k === 'feed') { if (buf) flush(); lines.push({ feed: op.v }); }
    else if (op.k === 'cut') { if (buf) flush(); lines.push({ cut: true }); }
  }
  if (buf) flush();

  // 2) Altura total (corte vira comando à parte, fora da imagem)
  const heightOf = (l: Line) => ('feed' in l ? l.feed * lineH : 'cut' in l ? 0 : l.big ? lineH * 2 : lineH); // 'mid' também ocupa altura dupla
  const out: number[] = [ESC, 0x40];
  let block: Line[] = [];
  const emitBlock = () => {
    const h = block.reduce((a, l) => a + heightOf(l), 0);
    if (h > 0) out.push(...drawBlock(block, width, h, fontPx, lineH));
    block = [];
  };
  for (const l of lines) {
    if ('cut' in l) { emitBlock(); out.push(GS, 0x56, 0x42, 0x00); }
    else block.push(l);
  }
  emitBlock();
  return out;
}

function drawBlock(lines: ({ text: string; align: string; bold: boolean; big: boolean | 'mid' } | { feed: number })[], width: number, height: number, fontPx: number, lineH: number): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'top';
  let y = 0;
  for (const l of lines) {
    if ('feed' in l) { y += l.feed * lineH; continue; }
    // 'mid' = altura dupla e largura normal (como o GS ! 0x01 da impressora)
    const size = l.big === true ? fontPx * 2 : fontPx;
    const sy = l.big === 'mid' ? 2 : 1;
    ctx.font = `${l.bold ? 'bold ' : ''}${size}px "Roboto Mono", "Droid Sans Mono", "DejaVu Sans Mono", monospace`;
    const w = ctx.measureText(l.text).width;
    // Se a fonte do aparelho for mais larga que o previsto, encolhe a linha para caber no papel
    const scale = w > width ? width / w : 1;
    const x = l.align === 'center' ? (width - w * scale) / 2 : l.align === 'right' ? width - w * scale : 0;
    ctx.save();
    ctx.translate(Math.max(0, x), y + (l.big ? 2 : 1));
    ctx.scale(scale, sy);
    ctx.fillText(l.text, 0, 0);
    if (l.bold) ctx.fillText(l.text, 0.6, 0); // reforça o negrito na térmica
    ctx.restore();
    y += l.big ? lineH * 2 : lineH;
  }
  return toEscPos(ctx.getImageData(0, 0, width, height).data, width, height);
}

/** Converte a imagem em pontos pretos/brancos e monta "GS v 0" em faixas (impressoras simples têm pouco buffer). */
function toEscPos(rgba: Uint8ClampedArray, width: number, height: number): number[] {
  const bytesPerRow = Math.ceil(width / 8);
  const out: number[] = [];
  const BAND = 128;
  for (let y0 = 0; y0 < height; y0 += BAND) {
    const rows = Math.min(BAND, height - y0);
    out.push(GS, 0x76, 0x30, 0x00, bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff, rows & 0xff, (rows >> 8) & 0xff);
    for (let y = y0; y < y0 + rows; y++) {
      for (let bx = 0; bx < bytesPerRow; bx++) {
        let b = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit;
          if (x >= width) continue;
          const i = (y * width + x) * 4;
          const lum = rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114;
          if (lum < 140) b |= 0x80 >> bit;
        }
        out.push(b);
      }
    }
  }
  return out;
}
