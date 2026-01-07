
-- Adicionar módulo dental à tabela de módulos
INSERT INTO modules (id, name, key, description, is_active)
VALUES (
  gen_random_uuid(),
  'Gestão Odontológica',
  'dental',
  'Módulo completo para clínicas odontológicas com prontuário, odontograma, planos de tratamento e documentos clínicos',
  true
);
