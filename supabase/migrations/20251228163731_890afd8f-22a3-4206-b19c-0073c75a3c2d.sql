-- Inserir etiquetas padrão para lojas existentes que ainda não têm
INSERT INTO public.customer_labels (store_id, name, color, label_type, is_system, description)
SELECT s.id, label.name, label.color, label.label_type, true, label.description
FROM public.stores s
CROSS JOIN (
  VALUES 
    ('Agendamento Online', '#22c55e', 'origin', 'Cliente veio pelo agendamento online'),
    ('WhatsApp', '#25d366', 'origin', 'Cliente veio pelo WhatsApp'),
    ('Loja Física', '#8b5cf6', 'origin', 'Cliente veio presencialmente'),
    ('Indicação', '#f97316', 'origin', 'Cliente veio por indicação'),
    ('Redes Sociais', '#ef4444', 'origin', 'Cliente veio pelas redes sociais'),
    ('Delivery', '#3b82f6', 'channel', 'Comprou via delivery'),
    ('Totem', '#6366f1', 'channel', 'Comprou via totem'),
    ('E-commerce', '#ec4899', 'channel', 'Comprou via e-commerce'),
    ('Balcão', '#14b8a6', 'channel', 'Comprou no balcão')
) AS label(name, color, label_type, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_labels cl 
  WHERE cl.store_id = s.id AND cl.name = label.name
);