# 🚀 Deploy Manual - 6 Passos Simples

## ✅ Preparação (Já Feito)
- ✅ Notepad aberto com código
- ✅ Navegador aberto no Supabase

---

## 📋 PASSO 1: Copiar Código

**No Notepad:**
```
1. Ctrl+A (seleciona tudo)
2. Ctrl+C (copia)
```

✅ Pronto! Código está na memória.

---

## 📋 PASSO 2: Criar Função

**No Navegador (Supabase Dashboard):**
```
1. Procure botão: "New Function" ou "Create Function"
2. Clique nele
```

Pode estar no canto superior direito ou no meio da página.

---

## 📋 PASSO 3: Nome da Função

**Na tela que abrir:**
```
Nome: reset-customer-password
```

**IMPORTANTE:** Digite exatamente assim (ou copie daqui)

---

## 📋 PASSO 4: Colar Código

**No editor de código que aparecer:**
```
1. Ctrl+A (seleciona todo código antigo/exemplo)
2. Ctrl+V (cola o código novo do Notepad)
```

O código vai substituir o exemplo.

---

## 📋 PASSO 5: Deploy

**Na mesma tela:**
```
1. Procure botão: "Deploy"
2. Clique nele
3. Aguarde mensagem: "Success" ou "Deployed"
```

Pode demorar 10-30 segundos. É normal!

---

## 📋 PASSO 6: Desabilitar JWT 🚨

**MUITO IMPORTANTE!**

```
1. Procure aba/seção: "Settings" ou "Configuration"
2. Encontre opção: "Verify JWT"
3. DESLIGAR (mover toggle para OFF)
4. Clicar em "Save" ou "Save Changes"
```

**Se não fizer isso, vai dar erro 401!**

---

## ✅ Teste Final

Depois dos 6 passos:

```
1. Voltar no sistema
2. Ctrl+Shift+R (recarregar)
3. Menu > Vendas > Clientes
4. Deve mostrar apenas clientes da sua loja
5. Clicar "Resetar Senha" em um cliente
6. Definir nova senha
7. Deve funcionar! ✅
```

---

## 🆘 Troubleshooting

### Não encontro "New Function"
- Pode estar escrito "Create"
- Pode estar no canto superior direito
- Pode estar no meio (se não tem nenhuma função ainda)

### Não tem editor de código
- Você clicou em "Create"?
- Pode precisar clicar em "Edit" depois de criar

### Deploy dá erro
- Verifique se o nome está correto
- Verifique se colou o código completo
- Me envie print do erro

### Continua dando erro 401
- Você desabilitou JWT? (Passo 6)
- Salvou as alterações?
- Tente recarregar o sistema

---

## 🎯 Resumo Visual

```
Notepad          Navegador
  ↓                 ↓
Ctrl+A           Create Function
Ctrl+C               ↓
  ↓              Nome: reset-customer-password
  |                 ↓
  |              Ctrl+A
  └────────→     Ctrl+V
                    ↓
                 Deploy
                    ↓
                 Success!
                    ↓
              Settings > JWT OFF
                    ↓
                 PRONTO! ✅
```

---

## ⏱️ Tempo Estimado

- Passos 1-5: **2-3 minutos**
- Passo 6: **30 segundos**
- **Total: 3 minutos**

---

**Está com dúvida em algum passo?**  
**Me avise e te ajudo!** 🚀

