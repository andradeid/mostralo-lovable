# 🎨 Abas de Edição de Planos - Implementação Completa

## 📋 **Resumo**

Implementação completa das 3 abas (Básico, Recursos, Configurações) no dialog de edição de planos, incluindo o campo "Ciclo de Cobrança" com 4 opções.

---

## ✅ **O que foi implementado**

### 1. ABA "BÁSICO"

```
┌─────────────────────────────────────────────────────────────┐
│  [  Básico  ]  [  Recursos  ]  [  Configurações  ]        │
│  ───────────                                                │
│                                                             │
│  Nome do Plano *              Status *                     │
│  ┌─────────────────────┐     ┌─────────────────────┐      │
│  │ Básico              │     │ Ativo           [v] │      │
│  └─────────────────────┘     └─────────────────────┘      │
│                                                             │
│  Descrição                                                  │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Plano ideal para pequenos negócios                │    │
│  │                                                    │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Preço (R$) *                 Ciclo de Cobrança      ⭐   │
│  ┌─────────────────────┐     ┌─────────────────────┐      │
│  │ 197                 │     │ Mensal          [v] │      │
│  └─────────────────────┘     └─────────────────────┘      │
│                               ├─ Mensal                    │
│                               ├─ Trimestral                │
│                               ├─ Semestral                 │
│                               └─ Anual                     │
│                                                             │
│  Máx. Produtos                Máx. Categorias              │
│  ┌─────────────────────┐     ┌─────────────────────┐      │
│  │ 100                 │     │ 10                  │      │
│  └─────────────────────┘     └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

#### Campos:
- **Nome do Plano** (obrigatório) - Input text
- **Status** (obrigatório) - Select: Ativo/Inativo
- **Descrição** - Textarea
- **Preço (R$)** (obrigatório) - Input number
- **Ciclo de Cobrança** ⭐ - Select: Mensal/Trimestral/Semestral/Anual
- **Máx. Produtos** - Input number (vazio = ilimitado)
- **Máx. Categorias** - Input number (vazio = ilimitado)

---

### 2. ABA "RECURSOS"

```
┌─────────────────────────────────────────────────────────────┐
│  [  Básico  ]  [  Recursos  ]  [  Configurações  ]        │
│                 ────────────                                │
│                                                             │
│  Recursos do Plano                                          │
│  Adicione os recursos incluídos neste plano (mínimo 3)     │
│                                                             │
│  ┌────────────────────────────────────┐  [+]               │
│  │ Ex: Produtos ilimitados            │                    │
│  └────────────────────────────────────┘                    │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │ ✓ 100 Produtos                          [X]  │          │
│  ├──────────────────────────────────────────────┤          │
│  │ ✓ 10 Categorias                         [X]  │          │
│  ├──────────────────────────────────────────────┤          │
│  │ ✓ Cardápio digital                      [X]  │          │
│  ├──────────────────────────────────────────────┤          │
│  │ ✓ IA básica para atendimento            [X]  │          │
│  ├──────────────────────────────────────────────┤          │
│  │ ✓ KDS para cozinha                      [X]  │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

#### Funcionalidades:
- **Campo de entrada** para adicionar novos recursos
- **Botão +** para adicionar o recurso digitado
- **Enter** também adiciona o recurso
- **Lista de recursos** adicionados com ícone de check
- **Botão X** para remover cada recurso
- **Mensagem** quando não há recursos: "Nenhum recurso adicionado ainda"

#### Armazenamento:
```typescript
features: {
  "100 Produtos": true,
  "10 Categorias": true,
  "Cardápio digital": true,
  "IA básica para atendimento": true,
  "KDS para cozinha": true
}
```

---

### 3. ABA "CONFIGURAÇÕES"

```
┌─────────────────────────────────────────────────────────────┐
│  [  Básico  ]  [  Recursos  ]  [  Configurações  ]        │
│                                 ───────────────             │
│                                                             │
│  Status                                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Ativo                                           [v] │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Marcar como "Mais Popular"              [Toggle]  │     │
│  │ Apenas um plano pode ter esta marcação           │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### Campos:
- **Status** - Select: Ativo/Inativo
- **Mais Popular** - Switch (toggle on/off)
  - **Nota:** Apenas um plano deve ter is_popular = true

---

## 🔧 **Componentes Utilizados**

### Shadcn/ui Components

```tsx
// Novos imports adicionados
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
```

### Estrutura das Tabs

```tsx
<Tabs defaultValue="basico" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="basico">Básico</TabsTrigger>
    <TabsTrigger value="recursos">Recursos</TabsTrigger>
    <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
  </TabsList>

  <TabsContent value="basico">
    {/* Conteúdo da aba Básico */}
  </TabsContent>

  <TabsContent value="recursos">
    {/* Conteúdo da aba Recursos */}
  </TabsContent>

  <TabsContent value="configuracoes">
    {/* Conteúdo da aba Configurações */}
  </TabsContent>
</Tabs>
```

---

## 📊 **Estados Adicionados**

### Form Data

```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  price: 0,
  billing_cycle: 'monthly',
  max_products: null as number | null,
  max_categories: null as number | null,
  status: 'active' as 'active' | 'inactive',
  is_popular: false,                    // ✅ NOVO
  features: {} as Record<string, boolean> // ✅ NOVO
});

const [newFeature, setNewFeature] = useState(''); // ✅ NOVO
```

### Funções

```typescript
// Adicionar recurso
const handleAddFeature = () => {
  if (newFeature.trim()) {
    setFormData({
      ...formData,
      features: { ...formData.features, [newFeature.trim()]: true }
    });
    setNewFeature('');
  }
};

// Remover recurso
const handleRemoveFeature = (featureKey: string) => {
  const newFeatures = { ...formData.features };
  delete newFeatures[featureKey];
  setFormData({ ...formData, features: newFeatures });
};
```

---

## 💾 **Salvamento no Banco**

### Query Atualizada

```typescript
const { error } = await supabase
  .from('plans')
  .update({
    name: formData.name,
    description: formData.description,
    price: formData.price,
    billing_cycle: formData.billing_cycle,
    max_products: formData.max_products,
    max_categories: formData.max_categories,
    status: formData.status,
    is_popular: formData.is_popular,      // ✅ NOVO
    features: formData.features,          // ✅ NOVO
    updated_at: new Date().toISOString()
  })
  .eq('id', selectedPlan.id);
```

### Estrutura no Banco

```sql
-- Tabela: plans
-- Colunas adicionadas:
is_popular    BOOLEAN DEFAULT FALSE
features      JSONB   DEFAULT '{}'
billing_cycle billing_cycle_type DEFAULT 'monthly'
```

---

## 🎯 **Ciclo de Cobrança - 4 Opções**

### Select Options

| Valor | Label | Duração |
|-------|-------|---------|
| `monthly` | Mensal | 30 dias |
| `quarterly` | Trimestral | 90 dias |
| `biannual` | Semestral | 180 dias |
| `annual` | Anual | 365 dias |

### Código

```tsx
<Select
  value={formData.billing_cycle}
  onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione o ciclo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="monthly">Mensal</SelectItem>
    <SelectItem value="quarterly">Trimestral</SelectItem>
    <SelectItem value="biannual">Semestral</SelectItem>
    <SelectItem value="annual">Anual</SelectItem>
  </SelectContent>
</Select>
```

---

## 🧪 **Como Testar**

### Passo 1: Recarregar Página

```
1. Pressione: CTRL + SHIFT + R
2. Ou F12 > Console > Digite:
   localStorage.clear(); sessionStorage.clear(); location.reload(true);
```

### Passo 2: Editar Plano

```
1. Login como master_admin
2. /dashboard/plans
3. Clicar em "Editar" em qualquer plano
4. ✅ Dialog deve abrir com 3 ABAS
```

### Passo 3: Testar Aba "Básico"

```
1. Verificar campo "Ciclo de Cobrança"
2. Clicar no select
3. ✅ Deve mostrar 4 opções
4. Selecionar "Trimestral"
5. Modificar outros campos
6. Clicar em "Salvar Plano"
7. ✅ Deve salvar sem erros
```

### Passo 4: Testar Aba "Recursos"

```
1. Clicar na aba "Recursos"
2. Digitar: "Suporte prioritário"
3. Clicar no botão [+]
4. ✅ Recurso deve aparecer na lista
5. Adicionar mais 2-3 recursos
6. Clicar no [X] em um recurso
7. ✅ Recurso deve ser removido
8. Clicar em "Salvar Plano"
9. ✅ Deve salvar os recursos
```

### Passo 5: Testar Aba "Configurações"

```
1. Clicar na aba "Configurações"
2. Verificar Switch "Mais Popular"
3. Ativar o switch
4. ✅ Toggle deve mudar para ON
5. Clicar em "Salvar Plano"
6. ✅ Deve salvar is_popular = true
```

### Passo 6: Verificar Card do Plano

```
1. Após salvar, verificar o card do plano
2. ✅ Deve mostrar os recursos salvos
3. ✅ Deve mostrar badge "Mais Popular" (se ativado)
4. ✅ Deve mostrar "Trimestral - 90 dias" (se selecionado)
```

---

## 📝 **Exemplo Completo**

### Dados do Plano

```json
{
  "id": "uuid",
  "name": "Plano Pro",
  "description": "Plano ideal para negócios em crescimento",
  "price": 497.00,
  "billing_cycle": "quarterly",
  "max_products": 500,
  "max_categories": 50,
  "status": "active",
  "is_popular": true,
  "features": {
    "500 Produtos": true,
    "50 Categorias": true,
    "Cardápio digital avançado": true,
    "IA completa para atendimento": true,
    "KDS para cozinha": true,
    "Relatórios avançados": true,
    "Suporte prioritário": true
  },
  "created_at": "2025-11-22T00:00:00Z",
  "updated_at": "2025-11-22T12:00:00Z"
}
```

### Card Renderizado

```
┌──────────────────────────────────┐
│  Plano Pro      [Mais Popular]   │
├──────────────────────────────────┤
│  Plano ideal para negócios em    │
│  crescimento                     │
│                                  │
│  R$ 497,00                       │
│  Trimestral - 90 dias            │
│                                  │
│  Limites                         │
│  📦 Produtos: 500                │
│  📁 Categorias: 50               │
│                                  │
│  Recursos                        │
│  ✓ 500 Produtos                  │
│  ✓ 50 Categorias                 │
│  ✓ Cardápio digital avançado     │
│  ✓ IA completa para atendimento  │
│  ✓ KDS para cozinha              │
│  ✓ Relatórios avançados          │
│  ✓ Suporte prioritário           │
│  +7 recursos adicionais          │
│                                  │
│  [Editar]         [Excluir]      │
└──────────────────────────────────┘
```

---

## ✅ **Checklist de Implementação**

- [x] Componente Tabs importado
- [x] Componente Switch importado
- [x] Estado `is_popular` adicionado
- [x] Estado `features` adicionado
- [x] Aba "Básico" com Ciclo de Cobrança
- [x] Aba "Recursos" com lista dinâmica
- [x] Aba "Configurações" com Switch
- [x] Funções `handleAddFeature` e `handleRemoveFeature`
- [x] Query de salvamento atualizada
- [x] 0 erros de linting
- [x] Documentação criada

---

## 🔗 **Arquivos Modificados**

- ✅ **PlansPage.tsx**
  - Imports: Tabs, TabsList, TabsTrigger, TabsContent, Switch
  - Estados: is_popular, features, newFeature
  - Funções: handleAddFeature, handleRemoveFeature
  - Dialog: Estrutura completa com 3 abas
  - Query: Salvamento com is_popular e features

---

## 🚀 **Próximos Passos**

1. **Recarregar o navegador** (CTRL + SHIFT + R)
2. **Testar todas as abas**
3. **Salvar um plano** com todos os campos preenchidos
4. **Verificar no banco** se foi salvo corretamente
5. **Aprovar um novo assinante** e verificar vencimento

---

## 📚 **Documentação Relacionada**

- [CICLOS_COBRANCA_PLANOS.md](./CICLOS_COBRANCA_PLANOS.md) - Ciclos de cobrança
- [FLUXO_APROVACAO_ASSINANTES.md](./FLUXO_APROVACAO_ASSINANTES.md) - Aprovação de assinantes
- [GUIAS_E_DOCS.md](./GUIAS_E_DOCS.md) - Índice de documentação

---

**Última atualização:** 22/11/2025  
**Versão:** 1.0  
**Status:** ✅ Implementação completa

