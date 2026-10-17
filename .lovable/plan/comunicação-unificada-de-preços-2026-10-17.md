# Comunicação unificada de preços

## Resultado
- Um catálogo compartilhado, carregado dos planos ativos e seus módulos, alimentará home, páginas de nicho, calculadoras, FAQ, cadastro, assinatura e sugestões de propostas.
- Mostrar Agenda e Essencial como entrada por tipo de negócio, Completo com “mais escolhido” e Sob medida com “a partir de” e “Falar com especialista”. Ocultar Essencial Anual na divulgação e cadastro.
- Preservar preços personalizados, propostas já negociadas, faturas, cobrança e módulos das lojas existentes. Não alterar os preços ou módulos cadastrados dos planos.
- Remover preços fixos e preços riscados da comunicação do Mostralo, mantendo valores de produtos das lojas e exemplos de faturamento que não representem mensalidades.
- Usar o texto padrão solicitado e a chamada anual com WhatsApp comercial.

## Sócio fundador
- Mostrar a oferta de R$ 129 nas páginas de serviços com agenda, com vagas calculadas pelas lojas cujo motivo começa com “Sócio fundador”; esconder ao esgotar.
- Adicionar o atalho na edição da loja: preencher valor e próximo número disponível, sem salvar até a confirmação do master.
- Revalidar o limite ao salvar para impedir que duas edições simultâneas ultrapassem dez participantes. Não substituir nenhum desconto existente automaticamente.

## Detalhes técnicos
- Criar hook com cache React Query e componentes reutilizáveis para catálogo, preço e disponibilidade, com estados de carregamento/erro sem valores fictícios.
- Ler a disponibilidade por uma função segura que devolve apenas contagem/vagas, nunca dados das lojas. A atribuição de vaga exige JWT e papel master validado no servidor; incluir função transacional para impedir concorrência. Isso requer uma migration de funções, sem alterar tabelas, preços ou lógica de cobrança.
- Propostas personalizadas e renovações atuais mantêm seus valores; o catálogo será usado somente na comunicação e em novas sugestões explícitas.
- Testar ordem, ocultação do anual, leitura de preços, cálculos e limite de dez vagas. Verificar páginas públicas no computador/celular e apontar telas autenticadas não verificáveis nesta conexão externa.

## Entrega
- Listar todos os arquivos alterados e os locais onde havia preços fixos.
- Informar qualquer pendência de acesso ou divergência dos módulos atualmente cadastrados, sem alterá-los.