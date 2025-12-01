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
    <div className="bg-muted p-4 rounded-lg space-y-2">
      {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm bg-background px-3 py-2 rounded border">
          {command}
        </code>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(command, label)}
        >
          {copiedCommand === label ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📱 Como Compilar Apps Nativos</h1>
        <p className="text-muted-foreground text-lg">
          Guia completo para compilar aplicativos Windows (.exe), Android (.apk) e iOS (.ipa)
        </p>
      </div>

      {/* Visão Geral */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Visão Geral do Processo
          </CardTitle>
          <CardDescription>
            Arquivos de configuração já estão no projeto. Você só precisa compilar!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Estrutura de Arquivos Criada</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="font-medium mt-2">Os seguintes arquivos já foram criados automaticamente:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code>electron/</code> - Pasta com arquivos do Electron (Windows)</li>
                <li><code>capacitor.config.ts</code> - Configuração do Capacitor (Android/iOS)</li>
                <li><code>electron-builder.yml</code> - Configuração do instalador .exe</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader>
                <Monitor className="h-8 w-8 mb-2 text-blue-500" />
                <CardTitle className="text-lg">Windows</CardTitle>
                <CardDescription>Electron</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Aplicativo desktop nativo para Windows 10/11</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 mb-2 text-green-500" />
                <CardTitle className="text-lg">Android</CardTitle>
                <CardDescription>Capacitor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">App nativo para dispositivos Android</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Apple className="h-8 w-8 mb-2 text-gray-500" />
                <CardTitle className="text-lg">iOS</CardTitle>
                <CardDescription>Capacitor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">App nativo para iPhone e iPad</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Localização dos Arquivos */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Onde Estão os Arquivos de Compilação?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Arquivos do Electron (Windows)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📁</Badge>
                  <div>
                    <code className="text-xs bg-background px-2 py-1 rounded">electron/main.js</code>
                    <p className="text-muted-foreground text-xs mt-1">Processo principal com janela e tray</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📁</Badge>
                  <div>
                    <code className="text-xs bg-background px-2 py-1 rounded">electron/preload.js</code>
                    <p className="text-muted-foreground text-xs mt-1">Bridge seguro para APIs nativas</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📄</Badge>
                  <div>
                    <code className="text-xs bg-background px-2 py-1 rounded">electron-builder.yml</code>
                    <p className="text-muted-foreground text-xs mt-1">Configuração do instalador .exe</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Arquivos do Capacitor (Android/iOS)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📄</Badge>
                  <div>
                    <code className="text-xs bg-background px-2 py-1 rounded">capacitor.config.ts</code>
                    <p className="text-muted-foreground text-xs mt-1">Configuração do Capacitor para mobile</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📁</Badge>
                  <div>
                    <code className="text-xs bg-background px-2 py-1 rounded">android/</code>
                    <p className="text-muted-foreground text-xs mt-1">Será criado após rodar <code>npx cap add android</code></p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📁</Badge>
                  <div>
                    <code className="text-xs bg-background px-2 py-1 rounded">ios/</code>
                    <p className="text-muted-foreground text-xs mt-1">Será criado após rodar <code>npx cap add ios</code></p>
                  </div>
                </li>
              </ul>
            </div>

            <Alert>
              <Download className="h-4 w-4" />
              <AlertTitle>Onde Ficam os Apps Compilados?</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <ul className="space-y-1 text-sm">
                  <li>🖥️ <strong>Windows (.exe):</strong> <code>dist-electron/Mostralo-Setup-X.X.X.exe</code></li>
                  <li>📱 <strong>Android (.apk):</strong> <code>android/app/build/outputs/apk/release/</code></li>
                  <li>🍎 <strong>iOS (.ipa):</strong> Xcode → Product → Archive → Distribute App</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Plataforma */}
      <Tabs defaultValue="windows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="windows" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Windows
          </TabsTrigger>
          <TabsTrigger value="android" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Android
          </TabsTrigger>
          <TabsTrigger value="ios" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            iOS
          </TabsTrigger>
        </TabsList>

        {/* WINDOWS */}
        <TabsContent value="windows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Compilar para Windows (Electron)
              </CardTitle>
              <CardDescription>
                Gerar instalador .exe para Windows 10/11
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Requisitos */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Requisitos
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Windows 10 ou 11</li>
                  <li>Node.js 18+ ou Bun instalado</li>
                  <li>Git instalado</li>
                </ul>
              </div>

              {/* Passo a passo */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  Passo a Passo
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">1️⃣ Exportar projeto para GitHub</p>
                    <Alert>
                      <Github className="h-4 w-4" />
                      <AlertTitle>Exportar Projeto</AlertTitle>
                      <AlertDescription>
                        Clique em "Export to GitHub" no Lovable para transferir o código completo
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div>
                    <p className="font-medium mb-2">2️⃣ Clonar repositório localmente</p>
                    <CommandBox
                      command="git clone https://github.com/seu-usuario/seu-repo.git"
                      label="git-clone"
                      description="Substitua pela URL do seu repositório"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">3️⃣ Instalar dependências</p>
                    <CommandBox
                      command="npm install"
                      label="npm-install"
                      description="Ou use 'bun install' se preferir Bun"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">4️⃣ Compilar o aplicativo</p>
                    <CommandBox
                      command="npm run electron:build"
                      label="electron-build"
                      description="Isso vai gerar o instalador .exe"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">5️⃣ Localizar o arquivo gerado</p>
                    <Alert>
                      <Download className="h-4 w-4" />
                      <AlertTitle>Arquivo Compilado</AlertTitle>
                      <AlertDescription>
                        O instalador .exe estará em: <code className="bg-muted px-2 py-1 rounded">dist-electron/Mostralo-Setup-X.X.X.exe</code>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANDROID */}
        <TabsContent value="android" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Compilar para Android (Capacitor)
              </CardTitle>
              <CardDescription>
                Gerar APK para dispositivos Android
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Requisitos */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Requisitos
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Android Studio instalado</li>
                  <li>SDK do Android configurado</li>
                  <li>Node.js 18+ ou Bun</li>
                  <li>Git instalado</li>
                </ul>
              </div>

              {/* Passo a passo */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  Passo a Passo
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">1️⃣ Clonar e instalar</p>
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
                    <p className="font-medium mb-2">2️⃣ Build do projeto React</p>
                    <CommandBox
                      command="npm run build"
                      label="npm-build"
                      description="Gerar build de produção"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">3️⃣ Adicionar plataforma Android (primeira vez)</p>
                    <CommandBox
                      command="npx cap add android"
                      label="cap-add-android"
                      description="Só precisa rodar uma vez"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">4️⃣ Sincronizar código com Android</p>
                    <CommandBox
                      command="npx cap sync android"
                      label="cap-sync-android"
                      description="Copiar build para pasta android/"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">5️⃣ Abrir no Android Studio</p>
                    <CommandBox
                      command="npx cap open android"
                      label="cap-open-android"
                      description="Abre o projeto no Android Studio"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">6️⃣ Gerar APK no Android Studio</p>
                    <Alert>
                      <Smartphone className="h-4 w-4" />
                      <AlertTitle>No Android Studio</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>1. Menu: <strong>Build → Build Bundle(s) / APK(s) → Build APK(s)</strong></p>
                        <p>2. Aguarde a compilação concluir</p>
                        <p>3. Clique em "locate" para encontrar o APK gerado</p>
                        <p className="mt-2">📁 Localização: <code className="bg-muted px-2 py-1 rounded text-xs">android/app/build/outputs/apk/release/</code></p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* iOS */}
        <TabsContent value="ios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Compilar para iOS (Capacitor)
              </CardTitle>
              <CardDescription>
                Gerar IPA para iPhone e iPad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Requisitos */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Requisitos
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Mac</strong> com macOS (obrigatório)</li>
                  <li>Xcode instalado (App Store)</li>
                  <li>Apple Developer Account ($99/ano)</li>
                  <li>Node.js 18+ ou Bun</li>
                  <li>Git instalado</li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>⚠️ Mac Obrigatório</AlertTitle>
                <AlertDescription>
                  Apps iOS só podem ser compilados em computadores Mac com Xcode. Não é possível compilar no Windows ou Linux.
                </AlertDescription>
              </Alert>

              {/* Passo a passo */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  Passo a Passo (no Mac)
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">1️⃣ Clonar e instalar</p>
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
                    <p className="font-medium mb-2">2️⃣ Build do projeto React</p>
                    <CommandBox
                      command="npm run build"
                      label="npm-build-ios"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">3️⃣ Adicionar plataforma iOS (primeira vez)</p>
                    <CommandBox
                      command="npx cap add ios"
                      label="cap-add-ios"
                      description="Só precisa rodar uma vez"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">4️⃣ Sincronizar código com iOS</p>
                    <CommandBox
                      command="npx cap sync ios"
                      label="cap-sync-ios"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">5️⃣ Abrir no Xcode</p>
                    <CommandBox
                      command="npx cap open ios"
                      label="cap-open-ios"
                      description="Abre o projeto no Xcode"
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">6️⃣ Configurar certificado e gerar IPA</p>
                    <Alert>
                      <Apple className="h-4 w-4" />
                      <AlertTitle>No Xcode</AlertTitle>
                      <AlertDescription className="space-y-2">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload e Distribuição
          </CardTitle>
          <CardDescription>
            Como disponibilizar os apps para seus lojistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>Supabase Storage</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Você pode fazer upload dos arquivos compilados (.exe, .apk) para o Supabase Storage:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
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
            <AlertTitle>Distribuição iOS</AlertTitle>
            <AlertDescription>
              Apps iOS (.ipa) precisam ser distribuídos via:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><strong>App Store</strong> - distribuição pública (requer aprovação da Apple)</li>
                <li><strong>TestFlight</strong> - testes beta (até 10.000 usuários)</li>
                <li><strong>Enterprise</strong> - distribuição interna (requer Apple Developer Enterprise, $299/ano)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Problemas Comuns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1">❓ Erro "Command not found" ao rodar npm</p>
              <p className="text-sm text-muted-foreground">
                <strong>Solução:</strong> Instale o Node.js: <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://nodejs.org</a>
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">❓ Android Studio não encontra SDK</p>
              <p className="text-sm text-muted-foreground">
                <strong>Solução:</strong> Abra Android Studio → Settings → Android SDK → Instale "Android SDK Platform" e "Android SDK Build-Tools"
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">❓ Xcode pedindo certificado</p>
              <p className="text-sm text-muted-foreground">
                <strong>Solução:</strong> Você precisa de uma conta Apple Developer ($99/ano). Acesse: <a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developer.apple.com</a>
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">❓ Erro "electron-builder" não encontrado</p>
              <p className="text-sm text-muted-foreground">
                <strong>Solução:</strong> Execute <code className="bg-muted px-2 py-1 rounded">npm install</code> novamente para instalar todas as dependências
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">❓ APK gerado, mas não instala no celular</p>
              <p className="text-sm text-muted-foreground">
                <strong>Solução:</strong> No celular, vá em Configurações → Segurança → Ative "Fontes desconhecidas" ou "Instalar apps desconhecidos"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
