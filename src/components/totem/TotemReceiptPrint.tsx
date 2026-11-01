import { createPortal } from 'react-dom';
import type { TotemReceipt } from '@/lib/totemReceipt';

/**
 * Área de impressão própria do recibo do totem. Fica escondida na tela; ao imprimir
 * (window.print()) só ela aparece no papel, em largura de bobina (80 mm).
 */
export function TotemReceiptPrint({ receipt }: { receipt: TotemReceipt }) {
  return createPortal(
    <div className="totem-receipt-print" aria-hidden="true">
      <style>{`
        .totem-receipt-print { display: none; }
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body > *:not(.totem-receipt-print) { display: none !important; }
          html, body { background: #fff !important; }
          .totem-receipt-print {
            display: block !important; width: 72mm; color: #000; background: #fff;
            font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.35;
          }
          .totem-receipt-print .r-center { text-align: center; }
          .totem-receipt-print .r-store { font-size: 15px; font-weight: 700; }
          .totem-receipt-print .r-pass { font-size: 34px; font-weight: 700; margin: 2px 0; }
          .totem-receipt-print .r-sep { border-top: 1px dashed #000; margin: 6px 0; }
          .totem-receipt-print .r-row { display: flex; justify-content: space-between; gap: 8px; }
          .totem-receipt-print .r-detail { padding-left: 10px; font-size: 11px; }
          .totem-receipt-print .r-total { font-size: 14px; font-weight: 700; }
        }
      `}</style>
      <div className="r-center r-store">{receipt.storeName}</div>
      <div className="r-center">{receipt.dateTime}</div>
      <div className="r-sep" />
      <div className="r-center">SENHA</div>
      <div className="r-center r-pass">{receipt.passwordNumber}</div>
      <div className="r-center">Pedido nº {receipt.passwordNumber}</div>
      <div className="r-sep" />
      {receipt.lines.map((line, idx) => (
        <div key={idx}>
          <div className="r-row">
            <span>{line.label}</span>
            <span>{line.amount}</span>
          </div>
          {line.details.map((d, j) => (
            <div key={j} className="r-detail">{d}</div>
          ))}
        </div>
      ))}
      <div className="r-sep" />
      <div className="r-row r-total">
        <span>TOTAL</span>
        <span>{receipt.total}</span>
      </div>
      <div className="r-center">Pago com Pix</div>
      <div className="r-sep" />
      <div className="r-center">Aguarde sua senha no painel</div>
      <div className="r-center">Obrigado!</div>
    </div>,
    document.body,
  );
}
