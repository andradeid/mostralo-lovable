-- Tabela de contatos WhatsApp sincronizados
CREATE TABLE public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  push_name TEXT,
  profile_picture_url TEXT,
  is_whatsapp_valid BOOLEAN DEFAULT true,
  is_business BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'sync',
  source_group_id TEXT,
  source_group_name TEXT,
  customer_id UUID REFERENCES public.customers(id),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, phone_number)
);

-- Tabela de etiquetas de contatos
CREATE TABLE public.whatsapp_contact_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f97316',
  description TEXT,
  contacts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, name)
);

-- Tabela de relação N:N contatos-etiquetas
CREATE TABLE public.whatsapp_contact_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.whatsapp_contact_labels(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  UNIQUE(contact_id, label_id)
);

-- Tabela de grupos WhatsApp sincronizados
CREATE TABLE public.whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  group_jid TEXT NOT NULL,
  name TEXT,
  description TEXT,
  picture_url TEXT,
  owner_phone TEXT,
  participants_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_extracted BOOLEAN DEFAULT false,
  extracted_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, group_jid)
);

-- Tabela de configuração de auto-sincronização
CREATE TABLE public.whatsapp_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_contacts BOOLEAN DEFAULT true,
  sync_groups BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contact_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contact_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sync_config ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_contacts
CREATE POLICY "Store owners can manage their whatsapp contacts"
ON public.whatsapp_contacts FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_contacts.store_id AND stores.owner_id = auth.uid()
));

-- Policies para whatsapp_contact_labels
CREATE POLICY "Store owners can manage their whatsapp labels"
ON public.whatsapp_contact_labels FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_contact_labels.store_id AND stores.owner_id = auth.uid()
));

-- Policies para whatsapp_contact_label_assignments
CREATE POLICY "Store owners can manage label assignments"
ON public.whatsapp_contact_label_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM whatsapp_contacts wc
  JOIN stores s ON s.id = wc.store_id
  WHERE wc.id = whatsapp_contact_label_assignments.contact_id AND s.owner_id = auth.uid()
));

-- Policies para whatsapp_groups
CREATE POLICY "Store owners can manage their whatsapp groups"
ON public.whatsapp_groups FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_groups.store_id AND stores.owner_id = auth.uid()
));

-- Policies para whatsapp_sync_config
CREATE POLICY "Store owners can manage their sync config"
ON public.whatsapp_sync_config FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_sync_config.store_id AND stores.owner_id = auth.uid()
));

-- Função para atualizar contacts_count nas labels
CREATE OR REPLACE FUNCTION public.update_whatsapp_label_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE whatsapp_contact_labels SET contacts_count = contacts_count + 1 WHERE id = NEW.label_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE whatsapp_contact_labels SET contacts_count = contacts_count - 1 WHERE id = OLD.label_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar contador
CREATE TRIGGER trg_update_label_count
AFTER INSERT OR DELETE ON public.whatsapp_contact_label_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_label_count();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_whatsapp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers de updated_at
CREATE TRIGGER trg_whatsapp_contacts_updated_at
BEFORE UPDATE ON public.whatsapp_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

CREATE TRIGGER trg_whatsapp_labels_updated_at
BEFORE UPDATE ON public.whatsapp_contact_labels
FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

CREATE TRIGGER trg_whatsapp_sync_config_updated_at
BEFORE UPDATE ON public.whatsapp_sync_config
FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

-- Índices para performance
CREATE INDEX idx_whatsapp_contacts_store ON public.whatsapp_contacts(store_id);
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(phone_number);
CREATE INDEX idx_whatsapp_contacts_source ON public.whatsapp_contacts(source);
CREATE INDEX idx_whatsapp_groups_store ON public.whatsapp_groups(store_id);
CREATE INDEX idx_whatsapp_labels_store ON public.whatsapp_contact_labels(store_id);