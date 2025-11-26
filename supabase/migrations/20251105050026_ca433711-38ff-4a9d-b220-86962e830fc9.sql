-- Habilitar extensão pgcrypto para funções de criptografia
-- Necessária para a função create_customer_auth_user() que usa gen_salt() e crypt()

CREATE EXTENSION IF NOT EXISTS pgcrypto;