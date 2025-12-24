# 🧪 Como Testar como Cliente e Lojista Simultaneamente

## ⚠️ Possíveis Problemas

### 1. **Conflito de Sessões no localStorage**
- O Supabase armazena tokens de autenticação no `localStorage`
- Clientes usam `customer_${storeId}` no `localStorage`
- Se ambos usarem o mesmo navegador, pode haver conflito

### 2. **Conflito de Cookies**
- Alguns dados podem ser compartilhados via cookies
- Mesmo em navegadores diferentes, se for o mesmo domínio

### 3. **Cache do Navegador**
- Dados em cache podem causar confusão
- Imagens e assets podem ser compartilhados

---

## ✅ Formas Seguras de Testar

### **Opção 1: Navegadores Diferentes (RECOMENDADO)**

**Cliente:**
- Use **Chrome** (ou Edge)
- Acesse: `http://localhost:5173/{slug-da-loja}`
- Exemplo: `http://localhost:5173/pizzaria-joao`

**Lojista:**
- Use **Firefox** (ou outro navegador)
- Acesse: `http://localhost:5173/auth`
- Faça login como lojista

**Vantagens:**
- ✅ Sessões completamente isoladas
- ✅ localStorage separado
- ✅ Cookies separados
- ✅ Zero conflitos

---

### **Opção 2: Modo Anônimo/Privado**

**Cliente:**
- Abra uma **aba anônima** no Chrome
- Acesse a loja como cliente

**Lojista:**
- Use a **aba normal** do Chrome
- Acesse o dashboard como lojista

**Vantagens:**
- ✅ localStorage isolado na aba anônima
- ✅ Cookies isolados
- ⚠️ Mas ainda compartilha o mesmo processo do navegador

**Desvantagens:**
- ⚠️ Pode haver conflito se ambos usarem Supabase Auth
- ⚠️ Cache pode ser compartilhado

---

### **Opção 3: Perfis Diferentes do Navegador**

**Chrome:**
1. Clique no ícone de perfil (canto superior direito)
2. "Gerenciar pessoas"
3. "Adicionar pessoa"
4. Crie um perfil "Cliente" e outro "Lojista"

**Vantagens:**
- ✅ localStorage completamente isolado
- ✅ Cookies isolados
- ✅ Histórico separado
- ✅ Extensões separadas

---

### **Opção 4: Dispositivos Diferentes**

**Cliente:**
- Use o celular/tablet
- Acesse via IP local: `http://192.168.x.x:5173/{slug}`

**Lojista:**
- Use o computador
- Acesse: `http://localhost:5173/auth`

**Vantagens:**
- ✅ Zero conflitos
- ✅ Teste real de mobile
- ✅ Melhor experiência de teste

---

## 🔍 Como Verificar se Há Conflito

### 1. **Verificar localStorage**

No console do navegador (F12):

```javascript
// Ver todas as chaves do localStorage
console.log('Chaves do localStorage:', Object.keys(localStorage));

// Ver tokens do Supabase
console.log('Token Supabase:', localStorage.getItem('sb-noshwvwpjtnvndokbfjx-auth-token'));

// Ver dados do cliente
console.log('Dados do cliente:', localStorage.getItem('customer_79fedd36-6e19-42d6-b331-79f9ad777180'));
```

### 2. **Verificar Sessão Atual**

```javascript
// Ver sessão do Supabase
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão atual:', session?.user?.email);
```

### 3. **Limpar Tudo (se necessário)**

```javascript
// CUIDADO: Isso limpa TUDO do localStorage
localStorage.clear();

// Ou limpar apenas dados específicos
localStorage.removeItem('sb-noshwvwpjtnvndokbfjx-auth-token');
localStorage.removeItem('customer_79fedd36-6e19-42d6-b331-79f9ad777180');
```

---

## 🎯 Checklist de Teste

### **Como Cliente:**
- [ ] Acessar a loja pelo slug
- [ ] Fazer login como cliente
- [ ] Adicionar produtos ao carrinho
- [ ] Fazer checkout
- [ ] Ver histórico de pedidos
- [ ] Ver perfil do cliente

### **Como Lojista:**
- [ ] Fazer login no dashboard
- [ ] Ver pedidos em tempo real
- [ ] Gerenciar produtos
- [ ] Ver relatórios
- [ ] Configurar a loja

### **Testes Simultâneos:**
- [ ] Cliente faz pedido → Lojista vê no dashboard
- [ ] Lojista atualiza produto → Cliente vê mudança
- [ ] Cliente faz login → Não afeta sessão do lojista
- [ ] Lojista faz logout → Não afeta sessão do cliente

---

## 🐛 Problemas Comuns e Soluções

### **Problema 1: "Invalid login credentials"**
**Causa:** Conflito de sessões no localStorage  
**Solução:** 
- Use navegadores diferentes
- Ou limpe o localStorage antes de trocar de usuário

### **Problema 2: "Você precisa estar logado"**
**Causa:** Sessão expirada ou conflito  
**Solução:**
- Faça logout e login novamente
- Limpe o localStorage

### **Problema 3: Dados do cliente aparecem no dashboard**
**Causa:** localStorage compartilhado  
**Solução:**
- Use navegadores diferentes
- Ou use perfis diferentes do navegador

---

## 💡 Dica Final

**A melhor forma de testar é:**
1. **Cliente:** Firefox (ou modo anônimo)
2. **Lojista:** Chrome (aba normal)
3. **Ou:** Use perfis diferentes do Chrome

Isso garante zero conflitos e uma experiência de teste realista!

---

## 📝 Notas Técnicas

- O Supabase armazena tokens em: `sb-{project-ref}-auth-token`
- Clientes armazenam dados em: `customer_{storeId}`
- Cada navegador/perfil tem seu próprio `localStorage`
- Cookies são compartilhados no mesmo domínio, mas isolados por navegador

