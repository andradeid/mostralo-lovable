UPDATE system_updates 
SET 
  description = '## Chamada de Senhas, Pedidos e Mesas

Sistema completo para exibição em **TVs e painéis** do seu estabelecimento:

### Recursos Visuais:
- 🎫 **Chamada de senhas** - Filas organizadas
- 🍽️ **Chamada de pedidos** - Para praça de alimentação
- 🪑 **Chamada de mesas** - Para restaurantes
- 📺 **Painel público** - URL única para TVs
- 📜 **Histórico** - Últimas chamadas na lateral

### 🔊 Sistema de Voz Inteligente:
- 🎵 **Beep sonoro** - Alerta simples e rápido
- 🗣️ **Voz do navegador** - Síntese de voz gratuita
- 🎤 **ElevenLabs** - Vozes humanizadas premium com IA!
  - Múltiplas vozes masculinas e femininas
  - Qualidade profissional de áudio
  - Suporte completo a português brasileiro
  - API key própria opcional por loja

### Personalização:
- Textos customizados com variáveis ({tipo}, {numero}, {cliente})
- Saudações automáticas por horário (Bom dia/tarde/noite)
- Prefixos e sufixos personalizados
- Cores e layout por loja

Configure seu painel e surpreenda seus clientes!',
  version = 'v2.1.1',
  updated_at = now()
WHERE id = 'ba1125a2-4112-4a66-9a6d-e070ffe95db8';