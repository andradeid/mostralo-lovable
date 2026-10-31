# Mostralo — pendências de SEO, blog e ajustes (31/10/2026)

## Blog (/conteudos)
- [x] Blog no modelo do SIVA (ramo `blog-mostralo`, prévia https://blog-mostralo.mostralo.pages.dev/conteudos): tema papel claro/escuro, áudio, HTML estático, sitemap do blog, llms.txt, IndexNow. Skill `artigo-seo-mostralo` criada.
- [x] 6 primeiros artigos escritos com capa: agenda-online-para-barbearia, agenda-para-nail-designer, cardapio-digital-para-pizzaria, cardapio-qr-code-na-mesa, delivery-proprio-sem-comissao, pdv-para-pequeno-negocio.
- [ ] Narração (voz Gemini Puck) e publicação no mostralo.com.br.
- [ ] Depois de publicar: colocar mostralo.com.br no Bing Webmaster (importar do Google Search Console).

## Ajustes no sistema/site encontrados pelos artigos
- [ ] /nicho-pizzarias (src/pages/public/NichoPizzariasPage.tsx, ~linhas 300-307) promete "montador de pizza meia-meia" com cálculo pelo maior valor ou pela média — o recurso não existe no sistema. Decidir: criar o meio a meio ou corrigir a página. (Procons tratam cobrar pelo sabor mais caro como abusivo; média ou proporcional são as opções seguras.)
- [ ] O site fala em "fechamento de caixa", mas o PDV não tem abertura/fechamento formal com sangria e suprimento (só histórico de vendas por dia e forma de pagamento). Decidir: criar ou ajustar o texto.
- [ ] O Mostralo não emite nota fiscal (NFC-e). A integração Focus NFe está só como ideia em src/data/ideasData.ts; o comprovante diz "Documento sem valor fiscal".
- [ ] Comissão de vendedores no painel da loja só existe para profissionais do agendamento (a de "vendedores" é a dos parceiros do Mostralo).
- [ ] Mesa: a opção "Mesa Chamando" existe como permissão, mas não há botão de chamar o garçom no fluxo do cliente. A tela "Cozinha (KDS)" e a sugestão de complemento depois do item existem, mas não estão na lista de recursos divulgados.

## Google Search Console (mostralo.com.br) — situação em 31/10/2026
- Sitemap índice lido hoje: 582 endereços. 156 páginas indexadas; ~3,2 mil fora do índice.
- 2.824 "Excluída pela tag noindex": lojas de teste (farma-bella-exemplo, -2, -3) — de propósito.
- 322 "Rastreada, mas não indexada": produtos de lojas reais (Fabricius, Stark Pizzaria, Navalha Barbearia, FarmaBella). Causa provável: a página da loja/produto chega ao Google só com title, description e JSON-LD; o corpo (#root) vem vazio sem JavaScript.
- 26 soft 404 e 22 duplicadas sem canônica: validação já iniciada no Google.
- Snippets do produto: 180 válidos (faltam aggregateRating/review, opcionais).
- [ ] Colocar texto da loja e do produto no HTML (nome, descrição, preço, foto, link da loja, outros produtos da categoria) nas Pages Functions (functions/_lib/seo.ts, withStorePage/withProductPage), escondido com JavaScript como no blog — para Google, Bing e IAs.
- [ ] Endereço dos produtos perde letras acentuadas ("Água com gás" → /produto/gua-com-gas-500-ml; "Guaraná" → guaran-antarctica). Corrigir o gerador de slug para os produtos novos; os antigos ficam ou ganham redirecionamento 301.
- [ ] Conferir no Google Merchant Center se os feeds das lojas (/loja/<slug>/feed.xml) estão cadastrados (listagens gratuitas na aba Shopping).
- [ ] Página inicial e páginas de nicho legíveis sem JavaScript (como foi feito no SIVA).
- [ ] public/robots.txt aponta para mostralo.me (a função robots.txt.ts responde no lugar, então não afeta hoje; ajustar para não confundir).

## Bugs e ajustes do sistema achados ao escrever os artigos (31/10/2026)
Ninguém corrigiu ainda. Os artigos foram escritos sem prometer o que está quebrado; quando corrigir, dá para atualizar os artigos citados.

### Totem (artigos: totem-de-autoatendimento, como-reduzir-fila-na-lanchonete)
- [ ] **Pix do totem cai na conta Efí do Mostralo, não na do lojista**: `src/components/totem/TotemPayment.tsx` chama `efi-create-pix-charge` sem `store_id`, então não há split.
- [ ] Tempo limite do Pix não chega à cobrança: o totem manda `expiracao`, a função lê `expiracao_segundos` (vale 1 h; a tela conta 1–10 min).
- [ ] "Imprimir Recibo Automaticamente" (TotemConfigPage) não é usado pelo totem.
- [ ] Pedido do totem não aparece na tela da Cozinha (KDS): os itens ficam num campo que o KDS não lê.
- [ ] Pedido do totem aparece como "Delivery" no Histórico Completo dos relatórios.
- [ ] A senha do totem entra na Chamada de Senhas quando o Pix é confirmado, não quando o pedido fica pronto.

### Promoções e cupons (artigos: cupom-de-desconto-delivery, cupom-de-black-friday, cupom-de-natal, promocao-leve-x-pague-y, black-friday-*)
- [ ] Ao **criar**, "Valor Fixo" é salvo como percentual (`PromotionForm.tsx`) → desconto zero no checkout. Ao editar e salvar de novo, fica certo.
- [ ] Ao criar, "Preço Promocional" também não grava o desconto.
- [ ] Ao criar, "Aplicar em Delivery" e "Aplicar em Retirada" não entram no insert (fica o padrão: ligado).
- [ ] **Data de Término acaba um dia antes**: salva 00:00 do dia escolhido. Corrigir para 23:59:59.
- [ ] Dias Permitidos e Hora Início/Término só são conferidos no navegador; `create-guest-order-v2` confere só as datas.
- [ ] Promoção só com "Brinde / Produto Grátis" não salva ("Selecione pelo menos um benefício") e o brinde não é calculado no `promotionCalculator`.
- [ ] Leve X Pague Y com "Categorias Específicas": `CheckoutDialog.tsx` manda `category_id: undefined` → não aplica.
- [ ] Leve X Pague Y com quantidade escolhida na tela do produto: preço já vai com desconto e o servidor recusa com `price_mismatch`; com "Todos os Produtos" pode dar desconto em dobro na tela.
- [ ] Não existe aviso "faltam R$ X para o frete grátis" (só para pedido mínimo).

### Agendamento (artigos: como-conseguir-avaliacoes-no-google, agenda-*, aluguel-de-quadra-online)
- [ ] **Avaliação no Google**: `{google_review}` só é trocado no envio de teste; no envio automático (`process-pending-reviews`) o cliente recebe o texto cru. O `{link}` do teste vai para o Google, o real vai para a página do Mostralo.
- [ ] "Exibir publicamente" (`show_public_reviews`) e "Pesquisa de satisfação" não fazem nada.
- [ ] "Exigir sinal" (serviço e Configurações > Pagamentos) não é usado na página pública de agendamento.
- [ ] Não existe serviço/agendamento recorrente (os artigos de barbearia e nail que diziam isso foram corrigidos em 31/10; a narração deles ainda menciona de leve).
- [ ] Horário por profissional é só por dia da semana (não por data); dia especial só fecha ou encurta, não amplia.
- [ ] Cupom não vale para agendamento.
- [ ] Cada quadra/profissional exige um e-mail próprio.

### Estoque, relatórios e painel (artigos: controle-de-estoque-para-delivery, relatorio-de-vendas-pequeno-negocio, pdv-integrado-ao-delivery)
- [ ] **Pedido online, QR Code da mesa e totem não baixam estoque** (só PDV e comandas chamam `decrement_product_stock`).
- [ ] Remover item da comanda não devolve o estoque; repor estoque não reativa o produto sozinho.
- [ ] Botões PDF e CSV dos relatórios só fazem `console.log`.
- [ ] Etiquetas de cliente: dá para filtrar, mas não há tela (em rota) para atribuir.
- [ ] Aviso "Configure a localização do estabelecimento primeiro na aba Geral" está errado: o botão Mapa fica na aba Entrega.
- [ ] Não há botão de dividir conta na comanda; taxa de serviço fixa em 10%.

### Cardápio na TV e Google Shopping (artigos: cardapio-digital-na-tv, produtos-no-google-shopping)
- [ ] Painel Digital promete "atualizações automáticas", mas `usePublicSignage.ts` busca as mídias uma vez (precisa recarregar a página). Não há programação por horário nem conteúdo diferente por TV.
- [ ] **Dois feeds do Google Shopping diferentes**: o painel mostra a função do Supabase `google-shopping-feed` (com frete, id interno) e o site tem `/loja/<slug>/feed.xml` (sem frete, id "loja-produto"). Escolher um oficial para não duplicar no Merchant Center. O mini-guia da aba Geral usa nomes antigos do Merchant Center.

### Páginas de nicho com promessas sem base
- [ ] /nicho-hamburguerias: "Taxa 0% por pedido" sem a ressalva do pagamento online; "WhatsApp Marketing de Resgate +35%" e "R$ 3.000+/mês" sem base.
- [ ] /nicho-arenas: promete agenda que bloqueia sozinha os horários do mensalista e "PIX automático" — não existe no agendamento.
- [ ] /funcionalidades: "múltiplas impressoras (cozinha, caixa, bar)" — não há impressora por via no código.
- [ ] Não existe vale-presente nem emissão de nota fiscal (artigos não prometem).

### Recursos que existem mas ainda não são citados nos artigos (decidir se podem)
- Avisos de encomenda pelo WhatsApp (confirmar, lembrete na véspera, resumo do dia seguinte), Clube de Assinaturas do agendamento, controle de estoque com alerta, KDS, Chamada de Senhas, cobrança PIX automática no agendamento.
