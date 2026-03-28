
-- ================================================================
-- MOSTRALO: Otimização de Performance via Indexação (v2)
-- ================================================================

-- 1. CHECKOUT & IDENTIFICAÇÃO
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_created_at ON public.orders USING btree (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_store_entrada ON public.orders USING btree (store_id, created_at DESC) WHERE status = 'entrada';
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_tokens_token_unique ON public.customer_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_store_id ON public.customer_tokens USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_customer_id ON public.customer_tokens USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_stores_store_customer ON public.customer_stores USING btree (store_id, customer_id);

-- 2. CARDÁPIO
CREATE INDEX IF NOT EXISTS idx_categories_store_menu ON public.categories USING btree (store_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_products_store_category_available ON public.products USING btree (store_id, category_id, is_available);
CREATE INDEX IF NOT EXISTS idx_addons_store_category_available ON public.addons USING btree (store_id, category_id, is_available);

-- 3. MENSAGERIA
CREATE INDEX IF NOT EXISTS idx_chat_messages_store_id ON public.whatsapp_chat_messages USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_remote_jid ON public.whatsapp_chat_messages USING btree (remote_jid);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.whatsapp_chat_messages USING btree ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_store_status ON public.whatsapp_instances USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_pending ON public.whatsapp_message_queue USING btree (status, attempts, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_conversations_store_id ON public.whatsapp_conversations USING btree (store_id);

-- 4. AGENDAMENTOS
CREATE INDEX IF NOT EXISTS idx_bookings_professional_status ON public.bookings USING btree (professional_id, status, booking_date);
CREATE INDEX IF NOT EXISTS idx_professionals_store_id ON public.professionals USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_professionals_store_active ON public.professionals USING btree (store_id, is_active);

-- 5. FKs CRÍTICAS
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_comandas_store_opened ON public.comandas USING btree (store_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda_prep ON public.comanda_items USING btree (comanda_id, preparation_status);
CREATE INDEX IF NOT EXISTS idx_banners_store_active ON public.banners USING btree (store_id, is_active, display_order);
