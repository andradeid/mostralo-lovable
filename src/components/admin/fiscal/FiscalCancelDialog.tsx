// Cancelamento de nota com justificativa (15 a 255 letras), dentro do prazo da SEFAZ.
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { DOC_TYPE_LABEL, formatMinutes, type FiscalDocument } from '@/lib/fiscal/documents';

export function FiscalCancelDialog({ doc, minutesLeft, open, onOpenChange, onConfirm, busy }: {
  doc: FiscalDocument | null; minutesLeft: number | null; open: boolean; busy: boolean;
  onOpenChange: (open: boolean) => void; onConfirm: (justificativa: string) => void;
}) {
  const [text, setText] = useState('');
  const length = text.trim().length;
  if (!doc) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setText(''); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar {DOC_TYPE_LABEL[doc.doc_type]}{doc.numero ? ` nº ${doc.numero}` : ''}</DialogTitle>
          <DialogDescription>
            O cancelamento vai para a SEFAZ e não pode ser desfeito.
            {minutesLeft !== null && ` Prazo restante: ${formatMinutes(minutesLeft)}.`}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 255))}
          placeholder="Motivo (ex.: cliente desistiu da compra)"
          rows={3}
        />
        <p className={`text-xs ${length < 15 ? 'text-muted-foreground' : 'text-green-700'}`}>{length}/255 — mínimo 15 letras</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Voltar</Button>
          <Button variant="destructive" disabled={busy || length < 15} onClick={() => onConfirm(text.trim())}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancelar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
