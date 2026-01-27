
# Plano: Adicionar Crédito Mostralo no Cupom de Impressão

## Objetivo
Incluir "Feito por Mostralo - 2026" de forma discreta no rodapé do cupom de impressão do PDV.

## Alteração

**Arquivo:** `src/utils/printComanda.ts`
**Linhas:** 243-247

### Código Atual (Footer)

```html
<div class="section text-center" style="margin-top: 15px;">
  <p style="font-size: 0.9em;">Obrigado pela preferência!</p>
  <p style="font-size: 0.8em; margin-top: 5px;">${new Date().toLocaleString('pt-BR')}</p>
</div>
```

### Novo Código (Footer com Crédito)

```html
<div class="section text-center" style="margin-top: 15px;">
  <p style="font-size: 0.9em;">Obrigado pela preferência!</p>
  <p style="font-size: 0.8em; margin-top: 5px;">${new Date().toLocaleString('pt-BR')}</p>
  <p style="font-size: 0.65em; margin-top: 10px; color: #666;">Feito por Mostralo - 2026</p>
</div>
```

## Layout Visual do Footer

```text
        Obrigado pela preferência!
           27/01/2026, 15:30:00
         
         Feito por Mostralo - 2026    ← Novo (discreto, menor e cinza)
```

## Detalhes do Estilo

| Propriedade | Valor | Motivo |
|-------------|-------|--------|
| `font-size` | `0.65em` | Bem menor que os outros textos |
| `color` | `#666` | Cinza para ser discreto |
| `margin-top` | `10px` | Espaço antes para separar |

## Arquivo a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/utils/printComanda.ts` | 246 | Adicionar linha do crédito após a data |
