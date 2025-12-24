# 📱 Máscara de Telefone - SignUp

## 📋 Visão Geral

Implementação de máscara automática para o campo de telefone no formulário de cadastro (`SignUp.tsx`).

---

## ✨ Funcionalidades

### 🎯 Formatação Automática

A máscara formata automaticamente o telefone enquanto o usuário digita:

- **Telefone Fixo** (10 dígitos): `(00) 0000-0000`
- **Celular** (11 dígitos): `(00) 00000-0000`

### 🛡️ Validações

1. **Remove caracteres não numéricos** automaticamente
2. **Limita a 11 dígitos** (máximo para celular)
3. **Valida no envio**: mínimo de 10 dígitos

---

## 🔧 Implementação Técnica

### 1. Função de Formatação

```typescript
const formatPhone = (value: string) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);
  
  // Aplica a máscara conforme o tamanho
  if (limited.length <= 10) {
    // Formato: (00) 0000-0000
    return limited
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    // Formato: (00) 00000-0000
    return limited
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
};
```

### 2. Aplicação no updateFormData

```typescript
const updateFormData = (field: keyof SignUpFormData, value: string) => {
  // Aplica máscara de telefone se o campo for phone
  if (field === 'phone') {
    const formatted = formatPhone(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  } else {
    setFormData(prev => ({ ...prev, [field]: value }));
  }
};
```

### 3. Validação no Submit

```typescript
const validateStep2 = () => {
  // ... outras validações

  // Valida telefone (mínimo 10 dígitos)
  const phoneNumbers = formData.phone.replace(/\D/g, '');
  if (phoneNumbers.length < 10) {
    toast({
      title: 'Telefone inválido',
      description: 'Digite um telefone válido com DDD...',
      variant: 'destructive',
    });
    return false;
  }

  return true;
};
```

### 4. Input com Atributos Corretos

```tsx
<Input
  id="phone"
  type="tel"           // Melhora UX em mobile
  value={formData.phone}
  onChange={(e) => updateFormData('phone', e.target.value)}
  placeholder="(00) 00000-0000"
  maxLength={15}       // Limita caracteres visíveis
  required
/>
```

---

## 📱 Exemplos de Uso

### ✅ Entradas Válidas

| Usuário Digita | Sistema Formata |
|---------------|-----------------|
| `11999887766` | `(11) 99988-7766` |
| `1133334444` | `(11) 3333-4444` |
| `(11) 9 9988-7766` | `(11) 99988-7766` |
| `11 9 9988 7766` | `(11) 99988-7766` |

### ❌ Entradas Inválidas (Bloqueadas na Validação)

| Entrada | Motivo | Mensagem |
|---------|--------|----------|
| `(11) 9999` | Menos de 10 dígitos | "Digite um telefone válido com DDD" |
| `1199988` | Menos de 10 dígitos | "Digite um telefone válido com DDD" |
| *(vazio)* | Campo obrigatório | "Preencha todos os campos pessoais e da empresa" |

---

## 🎨 Experiência do Usuário

### Desktop
- Aceita qualquer formato de entrada
- Remove automaticamente caracteres especiais
- Formata enquanto digita

### Mobile
- `type="tel"` abre teclado numérico
- Facilita digitação
- Menos erros de entrada

---

## 🔄 Fluxo Completo

1. **Usuário digita** qualquer coisa no campo
2. **Sistema remove** caracteres não numéricos
3. **Sistema aplica** máscara automaticamente
4. **Usuário vê** número formatado em tempo real
5. **No submit**, sistema valida se tem 10-11 dígitos
6. **Se válido**, salva no banco já formatado

---

## 🗃️ Armazenamento

O telefone é salvo **formatado** no banco de dados:

```typescript
phone: formData.phone  // Ex: "(11) 99988-7766"
```

**Vantagens:**
- ✅ Mantém formatação consistente
- ✅ Fácil exibição em relatórios
- ✅ Não precisa reformatar ao mostrar

**Alternativa (se preferir apenas números):**
```typescript
phone: formData.phone.replace(/\D/g, '')  // Ex: "11999887766"
```

---

## 🚀 Melhorias Futuras

### 📋 Sugestões

1. **Validação de DDD**: verificar se DDD existe
2. **API de Validação**: integrar com API de telefonia
3. **Validação de Operadora**: verificar se número é válido para a operadora
4. **WhatsApp Integration**: detectar se é número válido do WhatsApp

### 🛠️ Como Implementar (Exemplo)

```typescript
// Validação de DDD
const validDDDs = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
  '21', '22', '24', // RJ
  // ... adicionar outros DDDs
];

const ddd = phoneNumbers.slice(0, 2);
if (!validDDDs.includes(ddd)) {
  toast({
    title: 'DDD inválido',
    description: 'Digite um DDD válido do Brasil.',
    variant: 'destructive',
  });
  return false;
}
```

---

## 📝 Notas

- **Não usa biblioteca externa**: implementação leve e customizada
- **Zero dependências**: apenas JavaScript/TypeScript nativo
- **Performance**: extremamente rápida
- **Manutenibilidade**: código simples e fácil de entender

---

## 🔗 Arquivos Relacionados

- **Componente**: `src/pages/SignUp.tsx`
- **Documentação**: `FUNCIONALIDADE_CADASTRO_COM_APROVACAO.md`
- **Banco de Dados**: Tabela `profiles` (coluna `phone`)

---

## ✅ Checklist de Implementação

- [x] Criar função `formatPhone()`
- [x] Atualizar `updateFormData()` para aplicar máscara
- [x] Adicionar validação em `validateStep2()`
- [x] Definir `type="tel"` no input
- [x] Adicionar `maxLength={15}`
- [x] Testar com telefone fixo (10 dígitos)
- [x] Testar com celular (11 dígitos)
- [x] Testar validação (menos de 10 dígitos)
- [x] Documentar implementação

---

**Data de Implementação:** 22/11/2024  
**Versão:** 1.0  
**Status:** ✅ Completo e Funcional

