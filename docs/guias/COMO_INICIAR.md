# 🚀 Como Iniciar o Servidor Mostralo

## Método 1: Script Automático (MAIS FÁCIL) ⭐

### Windows:

**Opção A: Clique duplo**
1. Vá até a pasta do projeto
2. Dê **duplo clique** em `iniciar-mostralo.bat`
3. Aguarde o servidor iniciar
4. Abra: http://localhost:5173

**Opção B: PowerShell (mais recursos)**
1. Clique com botão direito em `iniciar-mostralo.ps1`
2. Escolha "Executar com PowerShell"
3. Aguarde o servidor iniciar
4. Abra: http://localhost:5173

---

## Método 2: Manual (Terminal)

### 1. Abra o Terminal/PowerShell

### 2. Navegue até o projeto:
```bash
cd "C:\Users\PC\Projetos Cursor\.mostralo"
```

### 3. Inicie o servidor:
```bash
bun run dev
```

### 4. Abra o navegador:
```
http://localhost:5173
```

---

## ⚡ Comandos Úteis

### Parar o servidor:
```
Ctrl + C (no terminal)
```

### Reiniciar o servidor:
```
Ctrl + C (parar)
bun run dev (iniciar novamente)
```

### Ver logs em tempo real:
```
Os logs aparecem automaticamente no terminal
```

---

## 🐛 Problemas Comuns

### "Porta 5173 em uso"
**Solução:**
```bash
# Encontrar o processo
netstat -ano | findstr ":5173"

# Finalizar (substitua XXXX pelo PID)
taskkill /F /PID XXXX

# Tentar novamente
bun run dev
```

### "Bun não encontrado"
**Solução:**
1. Instale o Bun: https://bun.sh
2. Ou use npm: `npm run dev`

### "Página em branco"
**Solução:**
1. Verifique se o servidor está rodando (terminal deve estar ativo)
2. Limpe o cache: Ctrl+Shift+R no navegador
3. Tente outra porta (edite `vite.config.ts`)

---

## 📱 Acessos Rápidos

| Página | URL |
|--------|-----|
| Home | http://localhost:5173/ |
| Login Admin | http://localhost:5173/auth |
| Dashboard | http://localhost:5173/dashboard |
| Cardápio | http://localhost:5173/loja/[slug] |

---

## 💡 Dicas

- ✅ Deixe o terminal aberto enquanto usa o sistema
- ✅ Use Ctrl+C para parar antes de fechar
- ✅ O servidor reinicia automaticamente ao editar código (Hot Reload)
- ✅ Abra o DevTools (F12) para ver logs do navegador

---

**Última atualização:** 22/11/2024

