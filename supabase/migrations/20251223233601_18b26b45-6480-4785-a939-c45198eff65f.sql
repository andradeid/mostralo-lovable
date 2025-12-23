-- Documentar melhorias de segurança na tabela system_updates
INSERT INTO public.system_updates (version, title, description, category, importance, is_published, release_date)
VALUES (
  '2.7.0', 
  'Segurança Reforçada - Proteção de Dados', 
  '## 🔒 Melhorias Críticas de Segurança

Implementamos camadas adicionais de proteção para garantir a segurança dos dados do sistema.

### Row Level Security (RLS) em Cupons
- **discount_coupons**: Agora protegida com RLS
- **coupon_usage**: Agora protegida com RLS
- Apenas administradores podem gerenciar cupons
- Clientes só visualizam cupons públicos e ativos

### Rate Limiting em APIs Públicas
- **customer-auth**: 5 tentativas por minuto (previne brute force)
- **driver-self-register**: 3 cadastros por hora (previne spam)
- **salesperson-self-register**: 3 cadastros por hora (previne spam)
- Proteção dupla: por IP e por identificador (email/telefone)

### Benefícios:
- ✅ Dados de cupons protegidos contra acesso não autorizado
- ✅ Prevenção de ataques de força bruta
- ✅ Limite de cadastros fraudulentos
- ✅ Logs detalhados para auditoria', 
  'security', 
  'critical', 
  true, 
  '2025-12-23'
);