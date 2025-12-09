import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, FileText, CreditCard, QrCode, Download } from "lucide-react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { FlyerTemplate } from "./FlyerTemplate";
import { BusinessCardTemplate } from "./BusinessCardTemplate";
import { MiniQRTemplate } from "./MiniQRTemplate";

interface SharePageContentProps {
  referralCode: string;
  defaultName?: string;
  defaultPhone?: string;
}

export function SharePageContent({ 
  referralCode,
  defaultName = "",
  defaultPhone = ""
}: SharePageContentProps) {
  const [sellerName, setSellerName] = useState(defaultName);
  const [sellerPhone, setSellerPhone] = useState(defaultPhone);
  const [selectedTemplate, setSelectedTemplate] = useState("flyer");
  
  const baseUrl = window.location.origin;
  const homepageLink = `${baseUrl}/?ref=${referralCode}`;
  const signupLink = `${baseUrl}/signup?ref=${referralCode}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Material de Divulgação</h1>
        <p className="text-muted-foreground">
          Imprima e distribua para seus leads
        </p>
      </div>

      {/* Links com QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Seus Links de Referência
          </CardTitle>
          <CardDescription>
            QR Codes e links prontos para usar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <QRCodeDisplay
                url={homepageLink}
                label="🏠 Página Inicial"
                description="Mostra planos e benefícios"
                size={150}
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <QRCodeDisplay
                url={signupLink}
                label="📝 Cadastro Direto"
                description="Vai direto para o formulário"
                size={150}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalização */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Personalização (Opcional)</CardTitle>
          <CardDescription>
            Adicione suas informações ao material
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellerName">Seu Nome</Label>
              <Input
                id="sellerName"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerPhone">Seu Telefone</Label>
              <Input
                id="sellerPhone"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader className="no-print">
          <CardTitle>Escolha o Modelo</CardTitle>
          <CardDescription>
            Selecione o formato ideal para sua divulgação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 no-print">
              <TabsTrigger value="flyer" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Flyer A4</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Cartão</span>
              </TabsTrigger>
              <TabsTrigger value="mini" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Mini QR</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flyer" className="print-area">
              <FlyerTemplate
                referralCode={referralCode}
                homepageLink={homepageLink}
                signupLink={signupLink}
                sellerName={sellerName || undefined}
              />
            </TabsContent>

            <TabsContent value="card" className="print-area">
              <BusinessCardTemplate
                referralCode={referralCode}
                signupLink={signupLink}
                sellerName={sellerName || undefined}
                sellerPhone={sellerPhone || undefined}
              />
            </TabsContent>

            <TabsContent value="mini" className="print-area">
              <MiniQRTemplate
                referralCode={referralCode}
                signupLink={signupLink}
              />
            </TabsContent>
          </Tabs>

          {/* Botão de Impressão */}
          <div className="flex justify-center gap-4 mt-6 no-print">
            <Button onClick={handlePrint} size="lg" className="gap-2">
              <Printer className="h-5 w-5" />
              Imprimir Material
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle>💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>📄 <strong>Flyer A4:</strong> Ideal para murais, balcões e panfletagem</li>
            <li>💳 <strong>Cartão de Visita:</strong> Perfeito para entrega pessoal e networking</li>
            <li>🏷️ <strong>Mini QR:</strong> Recorte e cole em mesas, vitrines, sacolas e embalagens</li>
            <li>🖨️ Use papel de qualidade para melhor resultado na impressão</li>
          </ul>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print,
          header,
          nav,
          aside,
          footer,
          [data-sidebar],
          [class*="sidebar"],
          [class*="Sidebar"] {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
