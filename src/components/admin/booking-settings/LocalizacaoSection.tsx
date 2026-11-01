// Aba Localização: endereço no mapa, localização na confirmação e fuso horário.
// JSX movido da BookingSettingsPage sem mudança.
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { MapLocationPicker } from '@/components/admin/store-config/MapLocationPicker';
import { BotTimezoneCard } from '@/components/admin/bot/BotTimezoneCard';
import { TRow, SectionTitle } from './SettingsFields';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface LocalizacaoSectionProps {
  storeId: string | null;
  storeLocation: BookingStoreLocation;
  showMapPicker: boolean;
  setShowMapPicker: (show: boolean) => void;
  handleLocationSelect: (lat: number, lng: number, address: string) => void;
  formData: BookingSettingsForm;
  updateField: UpdateBookingSettingsField;
}

export function LocalizacaoSection({ storeId, storeLocation, showMapPicker, setShowMapPicker, handleLocationSelect, formData, updateField }: LocalizacaoSectionProps) {
  return (
    <div>
      <SectionTitle title="Localização e Fuso Horário" description="Configure o endereço e fuso da sua loja" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Endereço</p>
          {storeLocation.latitude && storeLocation.longitude ? (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">📍 {storeLocation.address || 'Localização definida'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {storeLocation.latitude?.toFixed(6)}, {storeLocation.longitude?.toFixed(6)}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => setShowMapPicker(true)}>Alterar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowMapPicker(true)}>
              <MapPin className="h-4 w-4 mr-2" /> Selecionar no mapa
            </Button>
          )}
          {showMapPicker && (
            <MapLocationPicker
              onLocationSelect={handleLocationSelect}
              initialLat={storeLocation.latitude || undefined}
              initialLng={storeLocation.longitude || undefined}
              initialQuery={storeLocation.address}
              onClose={() => setShowMapPicker(false)}
            />
          )}
          <TRow
            id="send_location_confirmation"
            label="Enviar localização na confirmação"
            tip="Inclui o link 'Como chegar' na mensagem de confirmação"
            checked={formData.send_location_in_confirmation}
            onChange={(checked) => updateField('send_location_in_confirmation', checked)}
            disabled={!storeLocation.latitude || !storeLocation.longitude}
          />
          {formData.send_location_in_confirmation && storeLocation.latitude && storeLocation.longitude && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              💡 Use <code className="bg-muted px-1 rounded text-xs">{'{localizacao}'}</code> nos templates de mensagem
            </p>
          )}
          {(!storeLocation.latitude || !storeLocation.longitude) && (
            <p className="text-xs text-amber-600">⚠️ Defina a localização para habilitar esta opção.</p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Fuso horário</p>
          <BotTimezoneCard storeId={storeId} context="booking" />
        </div>
      </div>
    </div>
  );
}
