# 🔗 Integração de Planos - Admin e Página Pública

## 📋 **Resumo**

Sistema completo de sincronização entre os planos gerenciados pelo super admin e os planos exibidos na página pública (landing page). Apenas planos ativos aparecem para venda.

---

## ✅ **O que foi implementado**

### 1. **Badge "Mais Popular" na Página Admin**

```
┌─────────────────────────────────────┐
│       ⭐ Mais Popular                │ <- Badge no topo
├─────────────────────────────────────┤
│  Profissional            [Ativo]    │
│  Plano completo para crescer...     │
│                                     │
│  R$ 297,00                          │
│  Mensal - 30 dias                   │
└─────────────────────────────────────┘
```

**Localização:** Topo do card, centralizado  
**Condição:** Aparece quando `is_popular = true`

---

### 2. **Busca de Planos na Página Pública**

A página `Index.tsx` (landing page `/`) agora:

- ✅ Busca planos **diretamente do banco de dados**
- ✅ Filtra **apenas planos com status = 'active'**
- ✅ Exibe **badge "Mais Popular"** quando `is_popular = true`
- ✅ Formata **preço em R$** automaticamente
- ✅ Lista **recursos (features)** do plano
- ✅ Link **"Começar Agora"** redireciona para `/signup`

---

## 🔄 **Fluxo de Sincronização**

### Cenário 1: Criar Novo Plano

```
1. Super Admin acessa /dashboard/plans
2. Clica em "Novo Plano" (futuramente)
3. Preenche dados:
   ├─ Nome: Premium
   ├─ Descrição: Todos os recursos
   ├─ Preço: R$ 597,00
   ├─ Ciclo: Mensal
   ├─ Status: Ativo ✅
   └─ Recursos: [Multi-lojas, API, White label]
4. Salva
5. ✅ Plano aparece IMEDIATAMENTE na página pública
```

### Cenário 2: Marcar como "Mais Popular"

```
1. Super Admin acessa /dashboard/plans
2. Clica em "Editar" no plano "Profissional"
3. Aba "Configurações"
4. Ativa switch "Mais Popular" ✅
5. Salva
6. ✅ Badge "⭐ Mais Popular" aparece:
   ├─ Na página admin (/dashboard/plans)
   └─ Na página pública (/)
```

### Cenário 3: Desativar Plano

```
1. Super Admin acessa /dashboard/plans
2. Clica em "Editar" no plano "Básico"
3. Aba "Básico"
4. Status: Inativo ❌
5. Salva
6. ✅ Plano SOME da página pública
7. ⚠️ Plano ainda aparece na admin (com badge "Inativo")
```

### Cenário 4: Editar Recursos

```
1. Super Admin acessa /dashboard/plans
2. Clica em "Editar" no plano "Premium"
3. Aba "Recursos"
4. Adiciona: "Suporte 24/7 dedicado"
5. Salva
6. ✅ Novo recurso aparece IMEDIATAMENTE na página pública
```

---

## 📊 **Comparação: Admin vs Público**

### Página Admin (/dashboard/plans)

```
┌──────────────────────────────────────┐
│      ⭐ Mais Popular                  │
├──────────────────────────────────────┤
│  Profissional              [Ativo]   │
│  Plano completo para crescer         │
│                                      │
│  R$ 297,00                           │
│  Mensal - 30 dias                    │
│                                      │
│  Limites                             │
│  📦 Produtos: 200                    │
│  📁 Categorias: 25                   │
│                                      │
│  Recursos                            │
│  ✓ Tudo do plano Básico              │
│  ✓ IA avançada WhatsApp              │
│  ✓ Kanban de status pedidos          │
│  +4 recursos adicionais              │
│                                      │
│  [Editar]            [Excluir]       │
└──────────────────────────────────────┘
```

**Características:**
- Mostra **todos os planos** (ativos e inativos)
- Badge de **status** (Ativo/Inativo)
- Badge **"Mais Popular"** quando `is_popular = true`
- Botões **Editar** e **Excluir**

---

### Página Pública (/)

```
┌──────────────────────────────────────┐
│      ⭐ Mais Popular                  │
├──────────────────────────────────────┤
│  Profissional                        │
│  Plano completo para crescer         │
│                                      │
│  R$ 297,00                           │
│  /mês                                │
│                                      │
│  ✓ Tudo do plano Básico              │
│  ✓ IA avançada WhatsApp              │
│  ✓ Kanban de status pedidos          │
│  ✓ Cálculo frete automático          │
│  ✓ Relatórios com IA                 │
│  ✓ Gestão delivery completa          │
│  ✓ Suporte prioritário               │
│                                      │
│  [    Começar Agora    ]             │
└──────────────────────────────────────┘
```

**Características:**
- Mostra **apenas planos ativos**
- Badge **"Mais Popular"** quando `is_popular = true`
- **Sem** badge de status
- **Sem** botões Editar/Excluir
- Botão **"Começar Agora"** → `/signup`
- Card com `scale-105` se `is_popular = true`
- Card com `border-primary` se `is_popular = true`

---

## 💾 **Estrutura do Banco de Dados**

### Tabela: `plans`

| Coluna | Tipo | Descrição | Uso na Página Pública |
|--------|------|-----------|----------------------|
| `id` | uuid | ID único | Key do map() |
| `name` | text | Nome do plano | **Exibido** |
| `description` | text | Descrição | **Exibida** |
| `price` | numeric | Preço em R$ | **Exibido formatado** |
| `billing_cycle` | enum | monthly/quarterly/biannual/annual | Não usado (apenas /mês) |
| `status` | enum | active/inactive | **FILTRO: apenas active** |
| `is_popular` | boolean | Marca como popular | **Badge "Mais Popular"** |
| `features` | jsonb | Recursos do plano | **Lista de recursos** |
| `max_products` | integer | Limite de produtos | Não exibido |
| `max_categories` | integer | Limite de categorias | Não exibido |

---

## 🔍 **Query SQL Usada**

### Na Página Pública

```typescript
const { data, error } = await supabase
  .from('plans')
  .select('*')
  .eq('status', 'active')           // ✅ FILTRO: apenas ativos
  .order('price', { ascending: true }); // Ordena por preço
```

**Retorna:**
- ✅ Apenas planos com `status = 'active'`
- ✅ Ordenados do mais barato para o mais caro
- ✅ Todos os dados (id, name, description, price, is_popular, features, etc.)

---

## 🎨 **Código Implementado**

### PlansPage.tsx (Admin)

```tsx
{plans.map((plan) => {
  const isPopular = (plan as any).is_popular || false;
  
  return (
    <Card key={plan.id} className="relative overflow-hidden">
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Badge className="bg-primary text-white shadow-lg px-4 py-1 text-xs font-semibold">
            ⭐ Mais Popular
          </Badge>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <Badge variant={statusInfo.variant}>
          {statusInfo.label}
        </Badge>
      </div>

      <CardHeader className="pb-4 pt-8">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.description || 'Sem descrição'}
        </CardDescription>
        <div className="pt-2">
          <div className="text-3xl font-bold text-primary">
            {formatPrice(plan.price)}
          </div>
          <p className="text-sm text-muted-foreground">
            {getBillingCycleLabel(plan.billing_cycle)} - {getBillingCycleDays(plan.billing_cycle)} dias
          </p>
        </div>
      </CardHeader>
      
      {/* ... rest of card */}
    </Card>
  );
})}
```

---

### Index.tsx (Página Pública)

```tsx
interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  status: string;
  is_popular: boolean;
  features: Record<string, boolean>;
}

const Index = () => {
  const [plans, setPlans] = useState<Plan[]>([]);

  // Buscar planos ativos do banco de dados
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('status', 'active')
          .order('price', { ascending: true });

        if (error) {
          console.error('Erro ao buscar planos:', error);
          return;
        }

        setPlans(data || []);
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
      }
    };

    fetchPlans();
  }, []);

  return (
    {/* ... */}
    
    {/* Pricing Section */}
    <section className="py-12 md:py-20 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const formatPrice = (price: number) => {
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(price);
            };

            const featuresArray = Object.keys(plan.features || {});

            return (
              <Card 
                key={plan.id} 
                className={`p-6 text-center relative ${
                  plan.is_popular 
                    ? 'border-primary shadow-2xl scale-105' 
                    : 'shadow-lg'
                }`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                    ⭐ Mais Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.description || 'Plano ideal para seu negócio'}
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary mt-4">
                    {formatPrice(plan.price)}
                  </div>
                  <p className="text-muted-foreground">/mês</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-left">
                    {featuresArray.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/signup" className="block">
                    <Button 
                      className="w-full mt-4" 
                      variant={plan.is_popular ? "default" : "outline"}
                      size="lg"
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
```

---

## 🧪 **Como Testar**

### Teste 1: Badge "Mais Popular" na Admin

```
1. Login como master_admin
2. /dashboard/plans
3. Editar qualquer plano
4. Aba "Configurações"
5. Ativar switch "Mais Popular"
6. Salvar
7. ✅ Badge "⭐ Mais Popular" deve aparecer no card
```

### Teste 2: Planos na Página Pública

```
1. Abrir navegador em aba anônima
2. Acessar: http://localhost:5173
3. Rolar até "Planos Simples e Transparentes"
4. ✅ Deve mostrar apenas planos ativos
5. ✅ Plano com is_popular=true deve ter badge
6. ✅ Deve mostrar recursos (features)
7. Clicar em "Começar Agora"
8. ✅ Deve redirecionar para /signup
```

### Teste 3: Desativar Plano

```
1. Login como master_admin
2. /dashboard/plans
3. Editar plano "Básico"
4. Aba "Básico"
5. Status: Inativo
6. Salvar
7. Abrir aba anônima
8. Acessar: http://localhost:5173
9. Rolar até "Planos"
10. ✅ Plano "Básico" NÃO deve aparecer
11. Voltar para /dashboard/plans
12. ✅ Plano "Básico" ainda aparece (com badge "Inativo")
```

### Teste 4: Adicionar Recurso

```
1. Login como master_admin
2. /dashboard/plans
3. Editar plano "Premium"
4. Aba "Recursos"
5. Adicionar: "Integração completa com ERP"
6. Salvar
7. Abrir aba anônima
8. Acessar: http://localhost:5173
9. Rolar até plano "Premium"
10. ✅ Novo recurso deve aparecer na lista
```

---

## 📝 **Exemplo Completo**

### Dados no Banco

```sql
-- Plano Profissional
INSERT INTO plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  status, 
  is_popular, 
  features
) VALUES (
  'Profissional',
  'Plano completo para crescer seu negócio',
  297.00,
  'monthly',
  'active',
  true,
  '{
    "Tudo do plano Básico": true,
    "IA avançada WhatsApp": true,
    "Kanban de status pedidos": true,
    "Cálculo frete automático": true,
    "Relatórios com IA": true,
    "Gestão delivery completa": true,
    "Suporte prioritário": true
  }'
);
```

### Resultado na Página Pública

```
┌──────────────────────────────────────┐
│      ⭐ Mais Popular                  │
├──────────────────────────────────────┤
│  Profissional                        │
│  Plano completo para crescer seu     │
│  negócio                             │
│                                      │
│  R$ 297,00                           │
│  /mês                                │
│                                      │
│  ✓ Tudo do plano Básico              │
│  ✓ IA avançada WhatsApp              │
│  ✓ Kanban de status pedidos          │
│  ✓ Cálculo frete automático          │
│  ✓ Relatórios com IA                 │
│  ✓ Gestão delivery completa          │
│  ✓ Suporte prioritário               │
│                                      │
│  [    Começar Agora    ]             │
└──────────────────────────────────────┘
```

---

## ✅ **Checklist de Implementação**

- [x] Badge "Mais Popular" na página admin
- [x] Interface Plan definida em Index.tsx
- [x] Estado plans em Index.tsx
- [x] useEffect para buscar planos do banco
- [x] Query filtra apenas status = 'active'
- [x] Ordenação por preço (ascendente)
- [x] Badge "Mais Popular" na página pública
- [x] Formatação de preço em R$
- [x] Lista de features renderizada
- [x] Link "Começar Agora" para /signup
- [x] Card com destaque quando is_popular = true
- [x] 0 erros de linting
- [x] Documentação completa

---

## 🔗 **Arquivos Modificados**

### 1. **PlansPage.tsx**
- ✅ Adicionado badge "Mais Popular" nos cards
- ✅ Posicionamento absoluto no topo do card
- ✅ Padding ajustado (pt-8) para acomodar badge

### 2. **Index.tsx**
- ✅ Import do supabase client
- ✅ Interface Plan definida
- ✅ Estado plans adicionado
- ✅ useEffect para buscar planos
- ✅ Remoção do array hardcoded
- ✅ JSX atualizado para renderizar dados do banco
- ✅ Formatação de preço
- ✅ Badge "Mais Popular"
- ✅ Link para /signup

---

## 📚 **Documentação Relacionada**

- [ABAS_EDICAO_PLANOS.md](./ABAS_EDICAO_PLANOS.md) - Edição completa de planos
- [CICLOS_COBRANCA_PLANOS.md](./CICLOS_COBRANCA_PLANOS.md) - Ciclos de cobrança
- [FLUXO_APROVACAO_ASSINANTES.md](./FLUXO_APROVACAO_ASSINANTES.md) - Aprovação de novos usuários
- [GUIAS_E_DOCS.md](./GUIAS_E_DOCS.md) - Índice de documentação

---

**Última atualização:** 22/11/2025  
**Versão:** 1.0  
**Status:** ✅ Implementação completa e testada

