
# Plano: Ferramenta de Importação Alquimia para Mostralo

## Objetivo

Criar uma ferramenta especializada para importar planilhas do **sistema Alquimia** (farmácia) e transformar automaticamente para o formato Mostralo, com tratamento específico para:
- Cabeçalho técnico (linhas 1-9)
- Linhas em branco entre registros
- Preços no formato brasileiro (1.050,00)
- Códigos de categoria (PER, GEN, MON, BON)
- Nomes em CAIXA ALTA

---

## Análise do Arquivo Alquimia

Baseado no arquivo enviado (`ESTOQUE_FARMACIA_01-2026-TESTEIMPORTACAO_excel.xls`):

```text
LINHAS 1-9: Cabeçalho técnico (IGNORAR)
  - "Relatorio de Produtos - Inventario"
  - "Estoque ate o Dia: 21/01/2026"
  - "Loja 001"
  - Linhas em branco

LINHA 10: Cabeçalho real das colunas
  "Nome do Produto | Apresentacao | Laboratorio | Cla | Qtde | Custo | Total Custo | Venda | Total Venda"

LINHAS 11+: Dados dos produtos (COM LINHAS VAZIAS ENTRE ELES)
  "2MG C 20 COMP REV B1 | sem dados | E.B.COSMETICOS S.A. | BON | 6 | 60,88 | 365,28 | 90,00 | 540,00"
  ""  <-- linha vazia
  "3MG 30CPR (B1) | sem dados | P&G | PER | 2 | 102,59 | 205,18 | 137,62 | 275,24"
```

### Mapeamento de Colunas

| Coluna Alquimia | Campo Mostralo | Transformação |
|-----------------|----------------|---------------|
| Nome do Produto | `nome` | CAIXA ALTA → Título |
| Cla | `categoria` | PER → "Higiene e Beleza", GEN/MON/BON → "Medicamentos" |
| Venda | `preco` | 1.050,00 → 1050.00 |
| Qtde | `quantidade_estoque` | Número inteiro |
| — | `disponivel` | Sempre "sim" |
| — | `mostrar_menu` | Sempre "sim" |
| — | `controlar_estoque` | Sempre "sim" |
| — | `alerta_estoque` | Sempre 5 |

---

## Fluxo da Ferramenta

```text
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   1. Upload      │ →  │  2. Preview      │ →  │  3. Exportar     │
│                  │    │                  │    │                  │
│ • Arraste XLS    │    │ • Dados originais│    │ • Baixar CSV     │
│ • Detecção auto  │    │ • Dados limpos   │    │ • Salvar no BD   │
│ • Regras visíveis│    │ • Editar inline  │    │ • Criar cats.    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Arquivos a Criar

### 1. Parser Alquimia - `src/lib/parseAlquimia.ts`

Funções especializadas para transformação:

- **`findDataStartRow()`**: Encontra a linha com "Nome do Produto" (geralmente linha 10)
- **`parseBrazilianPrice()`**: Converte "1.050,00" → 1050.00
- **`mapAlquimiaCategory()`**: PER → "Higiene e Beleza", GEN/MON/BON → "Medicamentos"
- **`toTitleCase()`**: "AMBROXOL CLD 30MG" → "Ambroxol Cld 30mg"
- **`filterEmptyRows()`**: Remove linhas completamente vazias entre registros
- **`parseAlquimiaFile()`**: Função principal que processa o arquivo XLS

### 2. Página Principal - `src/pages/admin/AlquimiaImportPage.tsx`

Wizard de 3 etapas com estado controlado:
- **Step 1 (Upload)**: Drag-and-drop para XLS/XLSX com regras de conversão visíveis
- **Step 2 (Preview)**: Tabela comparativa mostrando dados originais e convertidos
- **Step 3 (Export)**: Opções de baixar CSV ou salvar direto no banco

### 3. Componentes de UI

**`AlquimiaUploadStep.tsx`**:
- Área de drag-and-drop para arquivos XLS/XLSX
- Card explicando as regras de conversão automáticas
- Validação de tipo e tamanho de arquivo

**`AlquimiaPreviewStep.tsx`**:
- Tabela interativa com:
  - Nome original vs. Nome convertido
  - Preço original vs. Preço convertido  
  - Categoria mapeada
  - Quantidade em estoque
- Badge de status (válido/inválido) por linha
- Estatísticas: total de produtos, categorias identificadas
- Opção de editar valores inline

**`AlquimiaExportStep.tsx`**:
- Resumo da importação
- Botão "Baixar CSV" (gera arquivo no formato Mostralo)
- Botão "Salvar no Mostralo" (envia para Edge Function existente)
- Toggle "Criar categorias que não existem"

---

## Arquivos a Modificar

### 1. Rotas - `src/routes/storeAdminRoutes.tsx`

Adicionar nova rota:
```typescript
const AlquimiaImportPage = lazy(() => import("@/pages/admin/AlquimiaImportPage"));

<Route path="/dashboard/products/import-alquimia" element={
  <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
    <AdminLayout pageTitle="Importar do Alquimia">
      <LazyRoute><AlquimiaImportPage /></LazyRoute>
    </AdminLayout>
  </ProtectedRoute>
} />
```

### 2. Página de Produtos - `src/pages/admin/ProductsPage.tsx`

Adicionar botão/menu para acessar a importação Alquimia, próximo ao botão "Importar" existente:
- Dropdown com opções:
  - "Importação Padrão" → `/dashboard/products/import`
  - "Importar do Alquimia" → `/dashboard/products/import-alquimia`

### 3. Dependências - `package.json`

Adicionar biblioteca para ler arquivos Excel:
```json
"xlsx": "^0.18.5"
```

---

## Detalhes Técnicos

### Lógica de Processamento do Arquivo

```typescript
// 1. Ler arquivo com biblioteca xlsx
const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// 2. Encontrar linha de cabeçalho (procura "Nome do Produto")
const headerRowIndex = rawRows.findIndex(row => 
  row.some(cell => String(cell).includes('Nome do Produto'))
);

// 3. Extrair cabeçalhos e dados
const headers = rawRows[headerRowIndex];
const dataRows = rawRows.slice(headerRowIndex + 1);

// 4. Filtrar linhas vazias (CRÍTICO - dica do Gemini)
const validRows = dataRows.filter(row => 
  row.some(cell => cell && String(cell).trim() !== '')
);

// 5. Mapear cada linha para produto Mostralo
const products = validRows.map(row => ({
  nome: toTitleCase(row[nomeIndex]),
  preco: parseBrazilianPrice(row[vendaIndex]),
  categoria: mapAlquimiaCategory(row[claIndex]),
  quantidade_estoque: parseInt(row[qtdeIndex]) || 0,
  disponivel: true,
  mostrar_menu: true,
  controlar_estoque: true,
  alerta_estoque: 5,
}));
```

### Conversão de Preço Brasileiro

```typescript
function parseBrazilianPrice(value: string | number): number {
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  // Remove pontos de milhar, troca vírgula por ponto
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
// "1.050,00" → "1050.00" → 1050.00
```

### Motor de Categorias

```typescript
function mapAlquimiaCategory(cla: string): string {
  const code = String(cla).toUpperCase().trim();
  
  if (code === 'PER') return 'Higiene e Beleza';
  if (['GEN', 'MON', 'BON'].includes(code)) return 'Medicamentos';
  
  return 'Outros'; // Fallback para códigos desconhecidos
}
```

### Conversão para Título

```typescript
function toTitleCase(text: string): string {
  if (!text) return '';
  
  return String(text)
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
// "AMBROXOL CLD 30MG" → "Ambroxol Cld 30mg"
```

### Exportar para CSV Mostralo

```typescript
function exportToMostraloCSV(products: AlquimiaProduct[]): string {
  const headers = [
    'nome', 'preco', 'categoria', 'disponivel', 
    'mostrar_menu', 'controlar_estoque', 'quantidade_estoque', 'alerta_estoque'
  ];
  
  const rows = products.map(p => [
    `"${p.nome}"`,           // Aspas para nomes com vírgula
    p.preco.toFixed(2),
    `"${p.categoria}"`,
    'sim', 'sim', 'sim',
    p.quantidade_estoque,
    5
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
```

---

## Interface do Preview

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Pré-visualização dos Dados Convertidos                                          │
├────────────────────────┬────────────────────────┬──────────────┬────────┬───────┤
│ Nome Original          │ Nome Convertido        │ Categoria    │ Preço  │ Qtde  │
├────────────────────────┼────────────────────────┼──────────────┼────────┼───────┤
│ AMBROXOL CLD 30MG      │ Ambroxol Cld 30mg      │ Medicamentos │ 30,00  │ 1     │
│ BEBE FPS70 120ML       │ Bebe Fps70 120ml       │ Hig. e Beleza│ 84,99  │ 1     │
│ CANFORA POTE UNID      │ Canfora Pote Unid      │ Hig. e Beleza│ 0,70   │ 133   │
│ ...                    │ ...                    │ ...          │ ...    │ ...   │
└────────────────────────┴────────────────────────┴──────────────┴────────┴───────┘

Resumo: 12 produtos válidos | 2 categorias identificadas
```

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/lib/parseAlquimia.ts` |
| Criar | `src/pages/admin/AlquimiaImportPage.tsx` |
| Criar | `src/components/admin/products/import/AlquimiaUploadStep.tsx` |
| Criar | `src/components/admin/products/import/AlquimiaPreviewStep.tsx` |
| Criar | `src/components/admin/products/import/AlquimiaExportStep.tsx` |
| Editar | `src/routes/storeAdminRoutes.tsx` (adicionar rota) |
| Editar | `src/pages/admin/ProductsPage.tsx` (adicionar menu de importação) |
| Editar | `package.json` (adicionar xlsx) |

---

## Resultado Esperado

1. Usuário acessa "Importar do Alquimia" no menu de produtos
2. Faz upload do arquivo XLS do sistema de farmácia
3. Sistema automaticamente:
   - Pula as 9 primeiras linhas de cabeçalho técnico
   - Ignora linhas vazias entre registros
   - Encontra a coluna de dados correta
4. Vê preview com dados convertidos:
   - "AMBROXOL CLD 30MG" → "Ambroxol Cld 30mg"
   - "1.050,00" → "1050.00" (R$ 1.050,00 na exibição)
   - "PER" → "Higiene e Beleza"
   - "BON" → "Medicamentos"
5. Pode editar qualquer valor antes de confirmar
6. Escolhe salvar direto no banco ou baixar CSV limpo

---

## Sobre o Preço

O preço será armazenado no banco como número puro (ex: `1050.00`), mas será **exibido ao usuário no formato brasileiro** (R$ 1.050,00), pois o sistema Mostralo já possui formatação de moeda nos componentes de exibição.

---

## Reuso de Código

A ferramenta reutilizará:
- **Hook `useProductImport`**: Para validação e importação via Edge Function
- **Edge Function `import-products`**: Já existente e funcional
- **Padrão visual** dos componentes de importação existentes
