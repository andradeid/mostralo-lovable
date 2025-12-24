# 📱 Compilar Apps Nativos - Guia Completo

Este projeto agora está preparado para compilação de apps nativos:
- 🖥️ **Windows** (.exe via Electron)
- 📱 **Android** (.apk via Capacitor)
- 🍎 **iOS** (.ipa via Capacitor)

## ⚠️ IMPORTANTE: Instalar Dependências Após Exportar

As dependências do Electron e Capacitor **NÃO** estão instaladas no Lovable porque causam conflitos com o ambiente de desenvolvimento.

**Você precisará instalá-las manualmente após exportar o projeto para GitHub:**

```bash
# Após git clone do seu repositório:
npm install

# Instalar dependências do Electron (Windows)
npm install --save-dev electron electron-builder concurrently wait-on

# Instalar dependências do Capacitor (Android/iOS)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/local-notifications @capacitor/haptics
```

## 📂 Arquivos Já Criados

Os seguintes arquivos de configuração já estão no projeto:

### Electron (Windows)
- ✅ `electron/main.js` - Processo principal
- ✅ `electron/preload.js` - Bridge seguro
- ✅ `electron-builder.yml` - Config do instalador

### Capacitor (Mobile)
- ✅ `capacitor.config.ts` - Configuração principal
- ✅ `src/utils/nativeNotifications.ts` - Notificações nativas
- ✅ `src/utils/soundPlayer.ts` - Som sem bloqueio de autoplay

### Integração no Código
- ✅ `src/contexts/NewOrdersContext.tsx` - Notificações integradas
- ✅ `src/pages/admin/CompileAppsGuidePage.tsx` - Documentação visual

## 🚀 Como Compilar

Acesse a página de documentação no admin:
**Dashboard → Sistema → Compilar Apps**

A página contém:
- ✅ Passo a passo completo para cada plataforma
- ✅ Comandos copiáveis
- ✅ FAQ com problemas comuns
- ✅ Instruções de upload e distribuição

## 📋 Scripts Disponíveis

```json
{
  "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron electron/main.js\"",
  "electron:build": "vite build && electron-builder",
  "cap:sync": "cap sync",
  "cap:android": "cap sync android && cap open android",
  "cap:ios": "cap sync ios && cap open ios"
}
```

## 🎯 Workflow Completo

1. **Exportar projeto do Lovable** → GitHub
2. **Git clone** no seu computador
3. **Instalar dependências** (comandos acima)
4. **Compilar**:
   - Windows: `npm run electron:build`
   - Android: `npm run build` → `npx cap add android` → `npm run cap:android`
   - iOS: `npm run build` → `npx cap add ios` → `npm run cap:ios`

## 📱 Onde Ficam os Apps Compilados?

- 🖥️ **Windows**: `dist-electron/Mostralo-Setup-X.X.X.exe`
- 📱 **Android**: `android/app/build/outputs/apk/release/`
- 🍎 **iOS**: Xcode → Product → Archive → Distribute App

## 🎉 Resultado Final

Após compilar, você terá:
- ✅ Som de notificações **SEM bloqueio de autoplay**
- ✅ Notificações nativas do sistema operacional
- ✅ Ícone na bandeja do Windows
- ✅ App instalável no celular
- ✅ Experiência 100% nativa

---

**Acesse a documentação completa em:** `/dashboard/compile-apps`
