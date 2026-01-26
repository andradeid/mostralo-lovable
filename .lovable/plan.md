
# Plano: Adicionar Suporte Nativo a XLS/XLSX

## Objetivo

Instalar a biblioteca `xlsx` (SheetJS) e atualizar o parser do Alquimia para aceitar arquivos Excel nativos (.xls, .xlsx) além de CSV.

---

## Alterações Necessárias

### 1. Instalar Dependência - `package.json`

Adicionar a biblioteca `xlsx` nas dependências:
```json
"xlsx": "^0.18.5"
```

---

### 2. Atualizar Parser - `src/lib/parseAlquimia.ts`

Modificar a função `parseAlquimiaFile` para:
- Detectar o tipo de arquivo (CSV vs XLS/XLSX)
- Usar a biblioteca `xlsx` para ler arquivos Excel
- Manter a lógica existente para CSV como fallback

```typescript
import * as XLSX from 'xlsx';

export async function parseAlquimiaFile(file: File): Promise<AlquimiaProduct[]> {
  const extension = file.name.toLowerCase().split('.').pop();
  
  if (extension === 'xls' || extension === 'xlsx') {
    // Usar biblioteca xlsx para arquivos Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return processRows(rawRows);
  } else {
    // Usar parser CSV existente
    const text = await file.text();
    return parseAlquimiaCSV(text);
  }
}
```

---

### 3. Atualizar Upload - `AlquimiaUploadStep.tsx`

Modificar para aceitar os novos formatos:
- Atualizar o atributo `accept` do input: `.csv,.txt,.xls,.xlsx`
- Atualizar as mensagens e validações

---

## Arquivos a Modificar

| Ação | Arquivo |
|------|---------|
| Editar | `package.json` (adicionar xlsx) |
| Editar | `src/lib/parseAlquimia.ts` (suporte XLS/XLSX) |
| Editar | `src/components/admin/products/import/AlquimiaUploadStep.tsx` (aceitar novos formatos) |

---

## Resultado Esperado

Após a implementação:
1. A ferramenta aceitará arquivos `.csv`, `.xls` e `.xlsx`
2. Arquivos Excel serão processados automaticamente pela biblioteca xlsx
3. O usuário não precisará mais exportar manualmente para CSV
4. Toda a lógica de transformação (preços, categorias, nomes) continuará funcionando
