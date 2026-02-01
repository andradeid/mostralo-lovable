
# Plano: SEO Dinâmico por Segmento da Loja

## Resumo
Usar o campo `segment` já existente nas lojas para gerar títulos SEO adequados. Farmácias mostrarão "Loja Online" em vez de "Cardápio Digital".

## Mudanças Necessárias

### 1. Migração SQL - Adicionar campo na view pública
A view `public_stores` precisa incluir o campo `segment` para que a página da loja tenha acesso a ele.

### 2. Atualizar Hook de SEO
O arquivo `src/hooks/useSEO.tsx` receberá uma função de mapeamento que retorna título e descrição baseados no segmento:

| Segmento | Título no Site |
|----------|---------------|
| alimentacao-e-bebidas | Cardápio Digital |
| saude-e-bem-estar | Loja Online |
| servicos | Catálogo de Serviços |
| Outros/Padrão | Loja Online |

### 3. Resultado Final
- **Antes**: "Farma Bella - Cardápio Digital | Mostralo"
- **Depois**: "Farma Bella - Loja Online | Mostralo"

---

## Detalhes Técnicos

### Migração SQL
```sql
CREATE OR REPLACE VIEW public_stores AS
SELECT 
  id, name, slug, description, logo_url, cover_url, 
  phone, address, city, state, business_hours, 
  theme_colors, status, created_at, segment
FROM stores
WHERE status = 'active' 
  AND (subscription_expires_at IS NULL OR subscription_expires_at > now());
```

### Hook useSEO.tsx
```typescript
const getSegmentSEO = (segment?: string) => {
  switch (segment) {
    case 'alimentacao-e-bebidas':
      return { titleSuffix: 'Cardápio Digital', keywords: 'cardápio, menu, delivery' };
    case 'saude-e-bem-estar':
      return { titleSuffix: 'Loja Online', keywords: 'farmácia, saúde, bem-estar' };
    case 'servicos':
      return { titleSuffix: 'Catálogo de Serviços', keywords: 'serviços, orçamento' };
    default:
      return { titleSuffix: 'Loja Online', keywords: 'loja, produtos, compras' };
  }
};
```

### Arquivos a Modificar
1. Nova migração SQL para view
2. `src/hooks/useSEO.tsx` - função de mapeamento
3. `src/pages/Store.tsx` - adicionar `segment?: string` na interface Store

## Risco
**Baixo** - apenas adiciona um campo à view e melhora a lógica existente.
