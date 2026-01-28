
## Plano: Tornar a página Gestão 360° a página inicial

### Objetivo
Fazer com que a rota `/` (página inicial) exiba o conteúdo da página **Gestão 360°** ao invés da landing atual focada em delivery/iFood.

### Estratégia Escolhida
Vou implementar um **redirecionamento automático** - a forma mais segura que não quebra nenhuma funcionalidade existente.

### O que vai acontecer:
1. Ao acessar `/` (raiz), o usuário será redirecionado automaticamente para `/gestao-360`
2. Toda a lógica de captura de referência de vendedores (`?ref=codigo`) será preservada
3. A página antiga de landing focada em delivery continua disponível caso precise no futuro

### Alterações Técnicas

#### Arquivo: `src/pages/Index.tsx`
- Adicionar redirecionamento automático para `/gestao-360` no início do componente
- Preservar a lógica de captura do código de referência antes do redirect
- Manter a lógica de redirecionamento para usuários logados (store_admin → dashboard, delivery_driver → delivery-panel)

```
Fluxo atual:  / → Landing delivery/iFood
Novo fluxo:   / → Redireciona para /gestao-360 → Landing Gestão 360°
```

### Preservação de Funcionalidades
- Links com `?ref=codigo` continuarão funcionando (referência de vendedores)
- Usuários logados serão redirecionados para seus dashboards normalmente
- Página `/gestao-360` permanece funcionando independentemente
- Nenhuma rota existente será quebrada

### Benefício da abordagem
Se no futuro quiser reverter ou usar a landing antiga, basta remover uma linha de código.
