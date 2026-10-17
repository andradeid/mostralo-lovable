# Atualização da comunicação de preços

## Continuação de 17/10/2026

- `src/components/gestao-360/FAQ360.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/admin/sales/ColdLeadsGuideTab.tsx`
- `src/lib/mostraloPricing.ts`
- `src/lib/mostraloPricing.test.ts`
- `src/pages/admin/ProspectingGuidePage.tsx`
- `src/pages/admin/SalesPromptsPage.tsx`
- `src/pages/admin/ProposalBuilderPage.tsx`
- `src/pages/admin/SubscriptionPage.tsx`
- `src/pages/public/PublicProposalPage.tsx`
- `src/utils/salesPromptGenerator.ts`
- `src/utils/coldLeadPromptGenerator.ts`
- `src/utils/qualificationSurveyPromptGenerator.ts`
- `src/utils/recruitmentPromptGenerator.ts`
- `src/pages/public/NichoBarbeariasPage.tsx`
- `src/pages/public/NichoBarbeariasV2Page.tsx`
- `AGENTS.md`
- `roadmap.md`

## Catálogo compartilhado da etapa anterior

- `src/hooks/useMostraloPlans.ts`
- `src/components/pricing/MostraloPlansSection.tsx`
- `src/components/pricing/FounderOffer.tsx`
- `src/components/pricing/PlanPrice.tsx`
- `src/components/pricing/PricingText.tsx`
- `supabase/functions/mostralo-pricing/index.ts`
- `src/components/admin/SubscriberEditDialog.tsx`
- `src/components/landing/PlansSection.tsx`
- `src/components/landing/SavingsCalculator.tsx`
- `src/components/admin/sales/SavingsCalculatorDemo.tsx`
- `src/pages/SignUp.tsx`

O catálogo também substitui ofertas nas páginas de nicho, CentralAgendamento, OfertaEspecial, Acougues, Supermercados, BioMundoProposta e guia-vendedor.

## Onde havia valores fixos

Calculadoras da home e demo, guias de vendas e prospecção, textos de IA de vendas/qualificação/recrutamento, ofertas de nicho e oferta especial, comparativos BI, ModulesPage, QualificationBenefitsPage e calculadoras de Suplementos, Supermercados, LojistasLocais e BioMundo.

A varredura final não encontrou 397.90, 597.90, 997.90, 497.90 ou 249,90 fora dos testes. R$397+ no comparativo da home é preço do concorrente, não Mostralo. R$129 é a oferta fixa solicitada para fundadores. Valores de produtos, serviços de lojas e faturamentos de exemplo foram preservados.

## Validações

- Seis testes de regras passaram.
- Home real exibiu Agenda/Essencial R$197, Completo R$347 e Sob medida a partir de R$597.
- Calculadora mudou ao selecionar Completo e não apresentou economia no faturamento zero.
- Barbearias prioriza Agenda; pizzarias prioriza Essencial.
- Celular 390px sem transbordamento horizontal.
- Oferta de fundador visível com vagas disponíveis.
- Cadastro abre, mas não foi criado usuário de teste.
- Prévia: build OK.
- Aplicação do desconto e renovação não foram exercitadas autenticadas: projeto externo não oferece sessão gerenciada.

Nenhuma fatura, cobrança, preço cadastrado de plano ou módulo de loja existente foi alterado nesta continuação. Propostas existentes continuam com valores negociados.
