// Aba Aparência: tema e embed da página pública de agendamento.
// JSX movido da BookingSettingsPage sem mudança.
import { BookingAppearancePanel } from '@/components/admin/booking/BookingAppearancePanel';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface AparenciaSectionProps {
  formData: BookingSettingsForm;
  setFormData: React.Dispatch<React.SetStateAction<BookingSettingsForm>>;
  storeLocation: BookingStoreLocation;
}

export function AparenciaSection({ formData, setFormData, storeLocation }: AparenciaSectionProps) {
  return (
    <BookingAppearancePanel
      value={{
        theme_primary_color: formData.theme_primary_color,
        theme_background_color: formData.theme_background_color,
        theme_text_color: formData.theme_text_color,
        theme_mode: formData.theme_mode,
        theme_font_family: formData.theme_font_family,
        theme_radius: formData.theme_radius,
        embed_hide_header: formData.embed_hide_header,
      }}
      onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
      storePrimaryColor={storeLocation.theme_colors?.primary || null}
      storeName={storeLocation.name}
      storeSlug={storeLocation.slug}
    />
  );
}
