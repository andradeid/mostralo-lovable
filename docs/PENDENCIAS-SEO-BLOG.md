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
