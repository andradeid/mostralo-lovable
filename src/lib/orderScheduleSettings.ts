import { z } from 'zod';
import type { ScheduledOrdersSettings } from '@/utils/scheduledOrdersValidation';

export const orderScheduleSchema = z.object({
  flow_enabled: z.boolean(),
  prep_lead_minutes: z.union([z.literal(60), z.literal(120), z.literal(180), z.literal(240), z.literal(360), z.literal(480), z.literal(720), z.literal(1440)]),
  pickup_interval_minutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
  max_orders_per_day: z.number().int().positive().nullable(),
  max_orders_per_slot: z.number().int().positive().nullable(),
  notify_confirmation: z.boolean(),
  notify_day_before: z.boolean(),
  day_before_hour: z.number().int().min(0).max(23),
  notify_before_minutes: z.union([z.literal(30), z.literal(60), z.literal(120)]).nullable(),
  notify_store_summary: z.boolean(),
});
export type OrderScheduleSettings = z.infer<typeof orderScheduleSchema>;
export const defaultOrderScheduleSettings: OrderScheduleSettings = {
  flow_enabled: false, prep_lead_minutes: 240, pickup_interval_minutes: 30,
  max_orders_per_day: null, max_orders_per_slot: null,
  notify_confirmation: true, notify_day_before: true, day_before_hour: 18,
  notify_before_minutes: 60, notify_store_summary: true,
};

export function mergeScheduledOrders(value?: Partial<ScheduledOrdersSettings> | null): ScheduledOrdersSettings {
  return {
    ...value,
    enabled: value?.enabled ?? false,
    hide_asap: value?.hide_asap ?? false,
    pickup_settings: { min_advance_value: 1, min_advance_unit: 'hours', max_advance_value: 4, max_advance_unit: 'days', ...value?.pickup_settings },
    delivery_settings: { min_advance_value: 90, min_advance_unit: 'minutes', max_advance_value: 4, max_advance_unit: 'days', time_interval: 15, ...value?.delivery_settings },
  };
}