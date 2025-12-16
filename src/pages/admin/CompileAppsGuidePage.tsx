import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Monitor, 
  Smartphone, 
  Apple, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  FolderOpen,
  Github,
  Terminal,
  Download,
  Upload,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function CompileAppsGuidePage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(label);
    toast.success(`Comando copiado: ${label}`);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const CommandBox = ({ 
    command, 
    label, 
    description 
  }: { 
    command: string; 
    label: string; 
    description?: string;
  }) => (
    <div className="bg-muted p-3 md:p-4 rounded-lg space-y-2">
      {description && <p className="text-xs md:text-sm text-muted-foreground">{description}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <code className="block text-xs md:text-sm bg-background px-2 md:px-3 py-2 rounded border whitespace-nowrap">
            {command}
          </code>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(command, label)}
          className="h-8 w-full sm:w-auto shrink-0"
        >
          {copiedCommand === label ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
              <span className="sm:hidden">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1.5" />
              <span className="sm:hidden">Copiar</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const faqItems = [
    { 
      question: 'Erro "Command not found" ao rodar npm', 
      answer: 'Instale o Node.js:', 
      link: 'https://nodejs.org' 
    },
    { 
      question: 'Android Studio não encontra SDK', 
      answer: 'Abra Android Studio → Settings → Android SDK → Instale "Android SDK Platform" e "Android SDK Build-Tools"' 
    },
    { 
      question: 'Xcode pedindo certificado', 
      answer: 'Você precisa de uma conta Apple Developer ($99/ano). Acesse:', 
      link: 'https://developer.apple.com' 
    },
    { 
      question: 'Erro "electron-builder" não encontrado', 
      answer: 'Execute npm install novamente para instalar todas as dependências' 
    },
    { 
      question: 'APK gerado, mas não instala no celular', 
      answer: 'No celular, vá em Configurações → Segurança → Ative "Fontes desconhecidas" ou "Instalar apps desconhecidos"' 
    },
  ];

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-4 max-w-6xl">
      {/* Header Responsivo */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-bold mb-1 md:mb-2 flex items-center gap-2">
          📱 <span className="hidden sm:inline">Como </span>Compilar Apps<span className="hidden md:inline"> Nativos</span>
        </h1>
        <p className="text-xs md:text-sm lg:text-lg text-muted-foreground">
          <span className="hidden sm:inline">Guia completo para compilar aplicativos </span>
          Windows (.exe), Android (.apk) e iOS (.ipa)
        </p>
      </div>

      {/* Visão Geral */}
      <Card className="mb-4 md:mb-8">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileCode className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Visão Geral do </span>Processo
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Arquivos de configuração já estão no projeto. Você só precisa compilar!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm md:text-base">Estrutura de Arquivos Criada</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="font-medium mt-2 text-xs md:text-sm">Os seguintes arquivos já foram criados automaticamente:</p>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li><code className="text-[10px] md:text-xs">electron/</code> - Pasta com arquivos do Electron (Windows)</li>
                <li><code className="text-[10px] md:text-xs">capacitor.config.ts</code> - Configuração do Capacitor (Android/iOS)</li>
                <li><code className="text-[10px] md:text-xs">electron-builder.yml</code> - Configuração do instalador .exe</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Grid de 3 Plataformas - Lado a lado no mobile */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-6">
            <Card className="p-0">
              <CardHeader className="p-2 md:p-4 pb-1 md:pb-2 flex flex-col items-center text-center">
                <Monitor className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-blue-500" />
                <CardTitle className="text-xs md:text-lg">Windows</CardTitle>
                <CardDescription className="text-[10px] md:text-sm">Electron</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4 pt-0 hidden md:block">
                <p className="text-sm text-center">Aplicativo desktop nativo para Windows 10/11</p>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardHeader className="p-2 md:p-4 pb-1 md:pb-2 flex flex-col items-center text-center">
                <Smartphone className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-green-500" />
                <CardTitle className="text-xs md:text-lg">Android</CardTitle>
                <CardDescription className="text-[10px] md:text-sm">Capacitor</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4 pt-0 hidden md:block">
                <p className="text-sm text-center">App nativo para dispositivos Android</p>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardHeader className="p-2 md:p-4 pb-1 md:pb-2 flex flex-col items-center text-center">
                <Apple className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-gray-500" />
                <CardTitle className="text-xs md:text-lg">iOS</CardTitle>
                <CardDescription className="text-[10px] md:text-sm">Capacitor</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4 pt-0 hidden md:block">
                <p className="text-sm text-center">App nativo para iPhone e iPad</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Localização dos Arquivos */}
      <Card className="mb-4 md:mb-8">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FolderOpen className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Onde Estão os </span>Arquivos<span className="hidden sm:inline"> de Compilação?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-4">
            <div className="bg-muted p-3 md:p-4 rounded-lg">
              <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <Monitor className="h-4 w-4" />
                Arquivos do Electron (Windows)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] md:text-xs p-0.5 md:p-1">📁</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                      <code className="text-[10px] md:text-xs bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">electron/main.js</code>
                    </div>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">Processo principal com janela e tray</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] md:text-xs p-0.5 md:p-1">📁</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                      <code className="text-[10px] md:text-xs bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">electron/preload.js</code>
                    </div>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">Bridge seguro para APIs nativas</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] md:text-xs p-0.5 md:p-1">📄</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                      <code className="text-[10px] md:text-xs bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">electron-builder.yml</code>
                    </div>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">Configuração do instalador .exe</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-muted p-3 md:p-4 rounded-lg">
              <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <Smartphone className="h-4 w-4" />
                Arquivos do Capacitor (Android/iOS)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] md:text-xs p-0.5 md:p-1">📄</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                      <code className="text-[10px] md:text-xs bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">capacitor.config.ts</code>
                    </div>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">Configuração do Capacitor para mobile</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] md:text-xs p-0.5 md:p-1">📁</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                      <code className="text-[10px] md:text-xs bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">android/</code>
                    </div>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">Será criado após rodar <code className="text-[10px]">npx cap add android</code></p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] md:text-xs p-0.5 md:p-1">📁</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                      <code className="text-[10px] md:text-xs bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">ios/</code>
                    </div>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">Será criado após rodar <code className="text-[10px]">npx cap add ios</code></p>
                  </div>
                </li>
              </ul>
            </div>

            <Alert>
              <Download className="h-4 w-4" />
              <AlertTitle className="text-sm md:text-base">Onde Ficam os Apps Compilados?</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <ul className="space-y-2 text-xs md:text-sm">
                  <li className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">🖥️ <strong>Windows (.exe):</strong></span>
                    <code className="text-[10px] md:text-xs bg-muted/50 px-2 py-1 rounded block overflow-x-auto whitespace-nowrap scrollbar-hide">dist-electron/Mostralo-Setup-X.X.X.exe</code>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">📱 <strong>Android (.apk):</strong></span>
                    <code className="text-[10px] md:text-xs bg-muted/50 px-2 py-1 rounded block overflow-x-auto whitespace-nowrap scrollbar-hide">android/app/build/outputs/apk/release/</code>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">🍎 <strong>iOS (.ipa):</strong></span>
                    <span className="text-[10px] md:text-xs">Xcode → Product → Archive</span>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Plataforma - Compactas no mobile */}
      <Tabs defaultValue="windows" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-10 md:h-11">
          <TabsTrigger value="windows" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
            <Monitor className="h-4 w-4" />
            <span className="hidden xs:inline">Windows</span>
            <span className="xs:hidden">Win</span>
          </TabsTrigger>
          <TabsTrigger value="android" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
            <Smartphone className="h-4 w-4" />
            <span className="hidden xs:inline">Android</span>
            <span className="xs:hidden">And</span>
          </TabsTrigger>
          <TabsTrigger value="ios" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
            <Apple className="h-4 w-4" />
            <span>iOS</span>
          </TabsTrigger>
        </TabsList>

        {/* WINDOWS */}
        <TabsContent value="windows" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Monitor className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Compilar para </span>Windows (Electron)
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Gerar instalador .exe para Windows 10/11
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
              {/* Requisitos */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Requisitos
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li>Windows 10 ou 11</li>
                  <li>Node.js 18+ ou Bun instalado</li>
                  <li>Git instalado</li>
                </ul>
              </div>

              {/* Passo a passo */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  Passo a Passo
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">1️⃣ Exportar projeto para GitHub</p>
                    <Alert>
                      <Github className="h-4 w-4" />
                      <AlertTitle className="text-sm md:text-base">Exportar Projeto</AlertTitle>
                      <AlertDescription className="text-xs md:text-sm">
                        Clique em "Export to GitHub" no Lovable para transferir o código completo
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">2️⃣ Clonar repositório localmente</p>
                    <CommandBox
                      command="git clone https://github.com/seu-usuario/seu-repo.git"
                      label="git-clone"
                      description="Substitua pela URL do seu repositório"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">3️⃣ Instalar dependências</p>
                    <CommandBox
                      command="npm install"
                      label="npm-install"
                      description="Ou use 'bun install' se preferir Bun"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">4️⃣ Compilar o aplicativo</p>
                    <CommandBox
                      command="npm run electron:build"
                      label="electron-build"
                      description="Isso vai gerar o instalador .exe"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">5️⃣ Localizar o arquivo gerado</p>
                    <Alert>
                      <Download className="h-4 w-4" />
                      <AlertTitle className="text-sm md:text-base">Arquivo Compilado</AlertTitle>
                      <AlertDescription className="text-xs md:text-sm">
                        O instalador .exe estará em: 
                        <code className="bg-muted px-2 py-1 rounded text-[10px] md:text-xs block mt-1 overflow-x-auto whitespace-nowrap scrollbar-hide">dist-electron/Mostralo-Setup-X.X.X.exe</code>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANDROID */}
        <TabsContent value="android" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Smartphone className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Compilar para </span>Android (Capacitor)
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Gerar APK para dispositivos Android
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
              {/* Requisitos */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Requisitos
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li>Android Studio instalado</li>
                  <li>SDK do Android configurado</li>
                  <li>Node.js 18+ ou Bun</li>
                  <li>Git instalado</li>
                </ul>
              </div>

              {/* Passo a passo */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  Passo a Passo
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">1️⃣ Clonar e instalar</p>
                    <div className="space-y-2">
                      <CommandBox
                        command="git clone https://github.com/seu-usuario/seu-repo.git"
                        label="git-clone-android"
                      />
                      <CommandBox
                        command="npm install"
                        label="npm-install-android"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">2️⃣ Build do projeto React</p>
                    <CommandBox
                      command="npm run build"
                      label="npm-build"
                      description="Gerar build de produção"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">3️⃣ Adicionar plataforma Android (primeira vez)</p>
                    <CommandBox
                      command="npx cap add android"
                      label="cap-add-android"
                      description="Só precisa rodar uma vez"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">4️⃣ Sincronizar código com Android</p>
                    <CommandBox
                      command="npx cap sync android"
                      label="cap-sync-android"
                      description="Copiar build para pasta android/"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">5️⃣ Abrir no Android Studio</p>
                    <CommandBox
                      command="npx cap open android"
                      label="cap-open-android"
                      description="Abre o projeto no Android Studio"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">6️⃣ Gerar APK no Android Studio</p>
                    <Alert>
                      <Smartphone className="h-4 w-4" />
                      <AlertTitle className="text-sm md:text-base">No Android Studio</AlertTitle>
                      <AlertDescription className="space-y-1 md:space-y-2 text-xs md:text-sm">
                        <p>1. Menu: <strong>Build → Build Bundle(s) / APK(s) → Build APK(s)</strong></p>
                        <p>2. Aguarde a compilação concluir</p>
                        <p>3. Clique em "locate" para encontrar o APK gerado</p>
                        <p className="mt-2">📁 Localização: <code className="bg-muted px-2 py-1 rounded text-[10px] md:text-xs block mt-1 overflow-x-auto whitespace-nowrap scrollbar-hide">android/app/build/outputs/apk/release/</code></p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* iOS */}
        <TabsContent value="ios" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Apple className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Compilar para </span>iOS (Capacitor)
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Gerar IPA para iPhone e iPad
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
              {/* Requisitos */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Requisitos
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li><strong>Mac</strong> com macOS (obrigatório)</li>
                  <li>Xcode instalado (App Store)</li>
                  <li>Apple Developer Account ($99/ano)</li>
                  <li>Node.js 18+ ou Bun</li>
                  <li>Git instalado</li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm md:text-base">⚠️ Mac Obrigatório</AlertTitle>
                <AlertDescription className="text-xs md:text-sm">
                  Apps iOS só podem ser compilados em computadores Mac com Xcode. Não é possível compilar no Windows ou Linux.
                </AlertDescription>
              </Alert>

              {/* Passo a passo */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  Passo a Passo (no Mac)
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">1️⃣ Clonar e instalar</p>
                    <div className="space-y-2">
                      <CommandBox
                        command="git clone https://github.com/seu-usuario/seu-repo.git"
                        label="git-clone-ios"
                      />
                      <CommandBox
                        command="npm install"
                        label="npm-install-ios"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">2️⃣ Build do projeto React</p>
                    <CommandBox
                      command="npm run build"
                      label="npm-build-ios"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">3️⃣ Adicionar plataforma iOS (primeira vez)</p>
                    <CommandBox
                      command="npx cap add ios"
                      label="cap-add-ios"
                      description="Só precisa rodar uma vez"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">4️⃣ Sincronizar código com iOS</p>
                    <CommandBox
                      command="npx cap sync ios"
                      label="cap-sync-ios"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">5️⃣ Abrir no Xcode</p>
                    <CommandBox
                      command="npx cap open ios"
                      label="cap-open-ios"
                      description="Abre o projeto no Xcode"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-sm md:text-base">6️⃣ Configurar certificado e gerar IPA</p>
                    <Alert>
                      <Apple className="h-4 w-4" />
                      <AlertTitle className="text-sm md:text-base">No Xcode</AlertTitle>
                      <AlertDescription className="space-y-1 md:space-y-2 text-xs md:text-sm">
                        <p>1. Configure o <strong>Signing & Capabilities</strong> com sua conta Apple Developer</p>
                        <p>2. Menu: <strong>Product → Archive</strong></p>
                        <p>3. Janela de Archives → <strong>Distribute App</strong></p>
                        <p>4. Escolha método de distribuição (App Store, Ad Hoc, Enterprise)</p>
                        <p>5. Aguarde a geração do .ipa</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload e Distribuição */}
      <Card className="mt-4 md:mt-8">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Upload className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Upload e </span>Distribuição
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Como disponibilizar os apps para seus lojistas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertTitle className="text-sm md:text-base">Supabase Storage</AlertTitle>
            <AlertDescription className="text-xs md:text-sm">
              <p className="mb-2">Você pode fazer upload dos arquivos compilados (.exe, .apk) para o Supabase Storage:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse o Supabase Dashboard → Storage</li>
                <li>Crie um bucket público chamado "apps"</li>
                <li>Faça upload do .exe e .apk</li>
                <li>Copie as URLs públicas dos arquivos</li>
                <li>Disponibilize os links para seus lojistas baixarem</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Alert>
            <Apple className="h-4 w-4" />
            <AlertTitle className="text-sm md:text-base">Distribuição iOS</AlertTitle>
            <AlertDescription className="text-xs md:text-sm">
              Apps iOS (.ipa) precisam ser distribuídos via:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>App Store</strong> - distribuição pública (requer aprovação da Apple)</li>
                <li><strong>TestFlight</strong> - testes beta (até 10.000 usuários)</li>
                <li><strong>Enterprise</strong> - distribuição interna (requer Apple Developer Enterprise, $299/ano)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* FAQ - Cards Separados */}
      <Card className="mt-4 md:mt-8">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
            Problemas Comuns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid gap-2 md:gap-3">
            {faqItems.map((item, index) => (
              <div key={index} className="p-3 md:p-4 rounded-lg border bg-muted/30">
                <p className="font-medium text-xs md:text-sm mb-1.5 md:mb-2 flex items-start gap-2">
                  <span className="shrink-0">❓</span>
                  <span>{item.question}</span>
                </p>
                <div className="text-[10px] md:text-sm text-muted-foreground pl-5 md:pl-6">
                  <span className="font-semibold text-foreground">Solução: </span>
                  {item.answer}
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline ml-1 break-all"
                    >
                      {item.link}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
