-- Inserir as 4 novidades dos novos módulos
INSERT INTO public.system_updates (version, title, description, category, importance, release_date, is_published) VALUES
-- PDV - Ponto de Venda
('2.7.0', 'PDV - Ponto de Venda', 
'Novo sistema de vendas rápidas no balcão com interface touchscreen otimizada.

**Principais recursos:**
- 🛒 Carrinho em tempo real com cálculo automático
- ➕ Suporte completo a adicionais e complementos
- 💳 Formas de pagamento: Dinheiro, PIX, Cartão
- 📋 Histórico de pedidos do balcão
- 🖨️ Impressão de comprovante (opcional)
- ⚡ Interface rápida e intuitiva para atendimento ágil',
'feature', 'important', '2025-12-25', true),

-- Comandas Digitais
('2.7.1', 'Comandas Digitais', 
'Sistema completo de gestão de mesas com comandas digitais em tempo real.

**Principais recursos:**
- 🍽️ Gestão visual de mesas com status em tempo real
- 📱 QR Code exclusivo para cada mesa
- 👁️ Visualização instantânea dos itens consumidos
- 🔄 Status: Aberta, Fechando, Paga
- 📊 Histórico completo de consumo por mesa
- 🔗 Integração automática com KDS da cozinha',
'feature', 'important', '2025-12-25', true),

-- App do Garçom
('2.7.2', 'App do Garçom', 
'Aplicativo mobile para garçons adicionarem itens diretamente às comandas.

**Principais recursos:**
- 📱 Adicionar itens diretamente pelo celular
- 📷 Scanner QR Code das mesas
- 👀 Visualização da comanda atual da mesa
- ✏️ Suporte a observações e adicionais
- 📲 Interface otimizada para smartphones
- 🔄 Sincronização em tempo real com o sistema',
'feature', 'important', '2025-12-25', true),

-- KDS - Kitchen Display System
('2.7.3', 'KDS - Sistema de Cozinha', 
'Tela de exibição profissional para a cozinha com gestão de preparo em tempo real.

**Principais recursos:**
- 🖥️ Tela dedicada para exibição na cozinha
- 📦 Exibe itens de comandas E pedidos delivery/balcão
- ⏱️ Tempo de espera com cores: 🟢 Verde, 🟡 Amarelo, 🔴 Vermelho
- 🔘 Botões de ação: "Preparando" e "Pronto!"
- 🔔 Alerta sonoro para novos itens
- 🏷️ Diferenciação visual: 🍽️ Mesa, 📦 Delivery, 🏪 Balcão
- ⚡ Atualização em tempo real sem recarregar',
'feature', 'important', '2025-12-25', true);