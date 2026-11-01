// Aba Avaliações: avaliação de profissionais e link do Google Review (encurtar e testar).
// JSX movido da BookingSettingsPage sem mudança.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ExternalLink, Link2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Tip, TRow, SectionTitle } from './SettingsFields';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface AvaliacoesSectionProps {
  formData: BookingSettingsForm;
  updateField: UpdateBookingSettingsField;
  shortenedUrl: string | null;
  setShortenedUrl: (url: string | null) => void;
  isShortening: boolean;
  handleShortenUrl: () => void;
  testPhone: string;
  setTestPhone: (phone: string) => void;
  handleTestReview: () => void;
  isSendingTest: boolean;
}

export function AvaliacoesSection({ formData, updateField, shortenedUrl, setShortenedUrl, isShortening, handleShortenUrl, testPhone, setTestPhone, handleTestReview, isSendingTest }: AvaliacoesSectionProps) {
  return (
    <div>
      <SectionTitle title="Avaliações de Profissionais" description="Configure o sistema de avaliação de atendimentos" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Sistema de avaliações</p>
          <TRow
            id="enable_professional_reviews_section"
            label="Habilitar avaliações"
            tip="Clientes recebem um link para avaliar o profissional após o atendimento"
            checked={formData.enable_professional_reviews}
            onChange={(checked) => updateField('enable_professional_reviews', checked)}
          />
          {formData.enable_professional_reviews && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Template da mensagem</Label>
                <Textarea value={formData.review_message_template} onChange={(e) => updateField('review_message_template', e.target.value)} rows={3} className="text-xs" />
                <p className="text-xs text-muted-foreground">{'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{link}'}</p>
              </div>
              <div className="grid gap-3 grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Enviar após</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min={0} max={1440} value={formData.review_delay_minutes} onChange={(e) => updateField('review_delay_minutes', Number(e.target.value))} className="w-16 h-9" />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Link expira em</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min={1} max={30} value={formData.review_expiry_days} onChange={(e) => updateField('review_expiry_days', Number(e.target.value))} className="w-16 h-9" />
                    <span className="text-xs text-muted-foreground">dias</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Exibir publicamente</Label>
                  <div className="flex items-center h-9">
                    <Switch checked={formData.show_public_reviews} onCheckedChange={(checked) => updateField('show_public_reviews', checked)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Review */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Google Review</p>
            <Tip text="Link de avaliação da sua loja no Google Maps" />
          </div>
          <div className="space-y-2">
            <Input type="url" placeholder="https://search.google.com/local/writereview?placeid=..." value={formData.google_review_url} onChange={(e) => { updateField('google_review_url', e.target.value); setShortenedUrl(null); }} className="h-9" />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">{'{google_review}'}</code> nos templates
            </p>
          </div>
          {formData.google_review_url && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleShortenUrl} disabled={isShortening || !!shortenedUrl}>
                  {isShortening ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                  {shortenedUrl ? 'Encurtado ✓' : 'Encurtar link'}
                </Button>
                <a href={formData.google_review_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Abrir
                </a>
              </div>
              {shortenedUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <code className="bg-background px-2 py-1 rounded border break-all flex-1">{shortenedUrl}</code>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(shortenedUrl); toast.success('Copiado!'); }}>📋 Copiar</Button>
                </div>
              )}
              <div className="border-t pt-2 space-y-1.5">
                <Label className="text-xs font-medium">📱 Testar via WhatsApp</Label>
                <div className="flex items-center gap-2">
                  <Input type="tel" placeholder="(11) 99999-9999" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 h-8 text-xs" />
                  <Button type="button" variant="default" size="sm" onClick={handleTestReview} disabled={!testPhone || isSendingTest} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                    {isSendingTest ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
