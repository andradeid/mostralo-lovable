// Aba Agenda: horários de funcionamento da loja.
// JSX movido da BookingSettingsPage sem mudança.
import { BusinessHoursManager } from '@/components/admin/store-config/BusinessHoursManager';
import { SectionTitle } from './SettingsFields';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface AgendaSectionProps {
  storeLocation: BookingStoreLocation;
  handleBusinessHoursChange: (hours: any) => void;
}

export function AgendaSection({ storeLocation, handleBusinessHoursChange }: AgendaSectionProps) {
  return (
    <div>
      <SectionTitle title="Agenda e Disponibilidade" description="Configure os horários de funcionamento da sua loja" />
      <BusinessHoursManager value={storeLocation.business_hours || {}} onChange={handleBusinessHoursChange} />
    </div>
  );
}
