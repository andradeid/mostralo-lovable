import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  UserPlus, 
  Settings, 
  Key, 
  FileText, 
  QrCode,
  ExternalLink,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Terminal
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function EfiSetupGuide() {
  const { toast } = useToast();
  const [copiedCommand, setCopiedCommand] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes");
    setCopiedCommand(true);
    toast({
      title: "Comando copiado!",
      description: "Cole no terminal para converter o certificado.",
    });
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          📚 Guia de Configuração EFI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {/* Passo 1: Criar Conta */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>Criar Conta na EFI (Gerencianet)</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-11 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Acesse o site de cadastro da EFI</li>
                <li>Escolha <strong>"Pessoa Jurídica"</strong> (recomendado) ou "Pessoa Física"</li>
                <li>Preencha seus dados pessoais e documentos</li>
                <li>Envie os documentos solicitados para verificação</li>
                <li>Aguarde a aprovação (geralmente 1-2 dias úteis)</li>
                <li>Após aprovação, você receberá um e-mail de confirmação</li>
              </ol>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://sistema.sejaefi.com.br/criar-conta" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Criar Conta EFI
                </a>
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2: Criar Aplicação */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Criar Aplicação na API</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-11 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Acesse o <strong>Painel EFI</strong> com seu login</li>
                <li>No menu lateral, clique em <strong>"API"</strong> → <strong>"Minhas Aplicações"</strong></li>
                <li>Clique no botão <strong>"Nova Aplicação"</strong></li>
                <li>Preencha um nome descritivo (ex: "Mostralo PIX")</li>
                <li>
                  Marque as permissões necessárias:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>✅ <strong>Emitir cobranças</strong></li>
                    <li>✅ <strong>Gerenciar cobranças</strong></li>
                    <li>✅ <strong>Criar/modificar chaves PIX</strong></li>
                  </ul>
                </li>
                <li>Clique em <strong>"Criar aplicação"</strong></li>
              </ol>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://sistema.sejaefi.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Acessar Painel EFI
                </a>
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 3: Obter Credenciais */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  3
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span>Obter Credenciais (Client ID e Secret)</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-11 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Na lista de aplicações, clique na aplicação que você criou</li>
                <li>Clique em <strong>"Visualizar credenciais"</strong></li>
                <li>
                  Copie o <strong>Client ID</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Formato: <code className="bg-muted px-1 rounded">Client_Id_xxxxxxxx...</code></li>
                  </ul>
                </li>
                <li>
                  Copie o <strong>Client Secret</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Formato: <code className="bg-muted px-1 rounded">Client_Secret_xxxxxxxx...</code></li>
                  </ul>
                </li>
              </ol>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600">Atenção!</p>
                  <p className="text-amber-600/80">
                    O <strong>Client Secret só é exibido uma única vez</strong>! 
                    Copie e guarde em local seguro. Se perder, será necessário gerar novas credenciais.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 4: Gerar Certificado */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  4
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Gerar Certificado PEM</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-11 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Na sua aplicação, vá na aba <strong>"Certificados"</strong></li>
                <li>
                  Escolha o ambiente:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>Homologação</strong> - Para testar (Sandbox)</li>
                    <li><strong>Produção</strong> - Para cobranças reais</li>
                  </ul>
                </li>
                <li>Clique em <strong>"Gerar novo certificado"</strong></li>
                <li>Baixe o arquivo (pode ser <code className="bg-muted px-1 rounded">.pem</code> ou <code className="bg-muted px-1 rounded">.p12</code>)</li>
              </ol>

              <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Se baixou arquivo .p12, converta para .pem:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background p-2 rounded border font-mono">
                    openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={copyCommand}
                  >
                    {copiedCommand ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Execute este comando no terminal (requer OpenSSL instalado)
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600">Dica</p>
                  <p className="text-blue-600/80">
                    Depois de gerar o arquivo .pem, você pode fazer upload direto aqui ou 
                    copiar e colar o conteúdo do arquivo.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 5: Criar Chave PIX */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  5
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>Criar Chave PIX EVP</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-11 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>No menu do Painel EFI, vá em <strong>"API"</strong> → <strong>"Minhas Chaves PIX"</strong></li>
                <li>Clique em <strong>"Cadastrar nova chave"</strong></li>
                <li>Escolha <strong>"Chave aleatória (EVP)"</strong></li>
                <li>A chave será gerada automaticamente</li>
                <li>
                  Copie a chave (formato UUID):
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Exemplo: <code className="bg-muted px-1 rounded">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code></li>
                  </ul>
                </li>
                <li>Cole no campo <strong>"Chave PIX EVP"</strong> abaixo</li>
              </ol>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Recomendado: Chave EVP é mais segura que CPF/CNPJ/Email/Telefone
              </Badge>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Links Úteis */}
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm font-medium">🔗 Links Úteis</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://sistema.sejaefi.com.br/criar-conta" 
                target="_blank" 
                rel="noopener noreferrer"
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Criar Conta
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://sistema.sejaefi.com.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Painel EFI
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://dev.sejaefi.com.br/docs/api-pix" 
                target="_blank" 
                rel="noopener noreferrer"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Documentação API
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://sejaefi.com.br/suporte" 
                target="_blank" 
                rel="noopener noreferrer"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Suporte EFI
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
