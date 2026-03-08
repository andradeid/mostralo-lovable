

## Plano: Registrar Ideias de Escalabilidade do WhatsApp no Sistema de Ideias

### Contexto
Baseado na análise de escalabilidade do sistema de chat WhatsApp que fizemos anteriormente, vou registrar essas recomendações como novas ideias no arquivo `src/data/ideasData.ts`. O último ID utilizado é **31**.

### Novas Ideias a Adicionar

**Ideia 32 - 🚀 Escalabilidade da Evolution API (VPS)**
- Status: `analyzing` | Prioridade: `high`
- Conteúdo: Recomendações de VPS por faixa de lojas (4-32GB RAM), monitoramento (Uptime Kuma/Grafana), nginx como reverse proxy, Redis para cache/deduplicação
- Fases: até 30 lojas → até 100 → 100+

**Ideia 33 - 🗄️ Otimização do Banco de Dados WhatsApp**
- Status: `idea` | Prioridade: `high`
- Conteúdo: Criação de índices otimizados nas tabelas `whatsapp_chat_messages`, `whatsapp_conversations` e `whatsapp_message_queue`. Particionamento por data para tabelas grandes. Cleanup automático de mensagens antigas (>90 dias)

**Ideia 34 - ⚡ Processamento Paralelo da Fila de Mensagens**
- Status: `idea` | Prioridade: `high`
- Conteúdo: Refatorar `whatsapp-process-queue` para usar `Promise.allSettled` em vez de loop sequencial. Implementar Dead Letter Queue para mensagens que falharam 3x. Melhorar resiliência contra perda de mensagens

### Alterações Técnicas

**Arquivo**: `src/data/ideasData.ts`
- Adicionar 3 novas ideias (IDs 32, 33, 34) antes do fechamento do array
- Seguir o padrão existente com `description`, `context`, `problem`, `technicalDetails`, `phases`, `nextSteps`

