-- Limpar instância de teste obsoleta (a instância foi deletada na Evolution API)
UPDATE master_admin_test_config 
SET test_instance_id = NULL, 
    test_instance_name = NULL, 
    test_instance_status = NULL, 
    test_instance_qr_code = NULL,
    bot_evolution_id = NULL,
    bot_enabled = false,
    updated_at = NOW()
WHERE id = '17fa3165-363b-433f-8c24-4afb4df57370';