-- Inserir módulo de Material de Marketing
INSERT INTO modules (name, description, icon, key, is_active)
VALUES (
  'Material de Marketing',
  'Gerar material de divulgação, cardápios e QR Codes para impressão e download',
  'QrCode',
  'marketing_material',
  true
)
ON CONFLICT DO NOTHING;