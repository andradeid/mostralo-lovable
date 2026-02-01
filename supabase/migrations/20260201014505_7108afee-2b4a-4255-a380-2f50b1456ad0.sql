INSERT INTO store_modules (store_id, module_id, is_enabled)
VALUES ('2f2bebec-f638-4bea-825b-9c18ba719a7a', 'f90241f3-ea31-44e4-aa49-722b8b32e564', true)
ON CONFLICT (store_id, module_id) DO UPDATE SET is_enabled = true