import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CreditCard, QrCode, Presentation, Instagram } from "lucide-react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { FlyerTemplate } from "./FlyerTemplate";
import { BusinessCardTemplate } from "./BusinessCardTemplate";
import { MiniQRTemplate } from "./MiniQRTemplate";
import { CommercialPresentationTemplate } from "./CommercialPresentationTemplate";
import { SalesInstagramStory } from "./SalesInstagramStory";
import { DownloadButtons } from "./DownloadButtons";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  promotion_active?: boolean | null;
  is_popular?: boolean | null;
  features?: { text: string }[] | null;
}

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
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const flyerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const presentationRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  
  const baseUrl = window.location.origin;
  const homepageLink = `${baseUrl}/?ref=${referralCode}`;
  const signupLink = `${baseUrl}/signup?ref=${referralCode}`;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('id, name, price, discount_price, promotion_active, is_popular, features')
      .eq('status', 'active')
      .order('price', { ascending: true });
    if (data) {
      setPlans(data as Plan[]);
    }
  };

  const getCurrentRef = () => {
    switch (selectedTemplate) {
      case 'flyer': return flyerRef;
      case 'card': return cardRef;
      case 'mini': return miniRef;
      case 'presentation': return presentationRef;
      case 'story': return storyRef;
      default: return flyerRef;
    }
  };

  const getPaperSize = (): 'A4' | 'A5' => {
    return selectedTemplate === 'flyer' ? 'A5' : 'A4';
  };

  const getFilename = () => {
    const names: Record<string, string> = {
      flyer: 'flyer-mostralo',
      card: 'cartao-visita-mostralo',
      mini: 'mini-qr-mostralo',
      presentation: 'apresentacao-comercial-mostralo',
      story: 'story-instagram-mostralo'
    };
    return names[selectedTemplate] || 'material-mostralo';
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
            <TabsList className="grid w-full grid-cols-5 no-print">
              <TabsTrigger value="flyer" className="flex items-center gap-1 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Flyer A5</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-1 text-xs sm:text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Cartões</span>
              </TabsTrigger>
              <TabsTrigger value="mini" className="flex items-center gap-1 text-xs sm:text-sm">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Mini QR</span>
              </TabsTrigger>
              <TabsTrigger value="presentation" className="flex items-center gap-1 text-xs sm:text-sm">
                <Presentation className="h-4 w-4" />
                <span className="hidden sm:inline">Apresentação</span>
              </TabsTrigger>
              <TabsTrigger value="story" className="flex items-center gap-1 text-xs sm:text-sm">
                <Instagram className="h-4 w-4" />
                <span className="hidden sm:inline">Story</span>
              </TabsTrigger>
            </TabsList>

            {/* Botões de Download - logo após tabs */}
            <div className="flex justify-center gap-4 no-print">
              <DownloadButtons
                targetRef={getCurrentRef()}
                filename={getFilename()}
                paperSize={getPaperSize()}
              />
            </div>

            <TabsContent value="flyer" className="print-area">
              <div ref={flyerRef}>
                <FlyerTemplate
                  referralCode={referralCode}
                  homepageLink={homepageLink}
                  signupLink={signupLink}
                  sellerName={sellerName || undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="card" className="print-area">
              <div ref={cardRef}>
                <BusinessCardTemplate
                  referralCode={referralCode}
                  signupLink={signupLink}
                  sellerName={sellerName || undefined}
                  sellerPhone={sellerPhone || undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="mini" className="print-area">
              <div ref={miniRef}>
                <MiniQRTemplate
                  referralCode={referralCode}
                  signupLink={signupLink}
                />
              </div>
            </TabsContent>

            <TabsContent value="presentation" className="print-area">
              <div ref={presentationRef}>
                <CommercialPresentationTemplate
                  referralCode={referralCode}
                  homepageLink={homepageLink}
                  signupLink={signupLink}
                  sellerName={sellerName || undefined}
                  sellerPhone={sellerPhone || undefined}
                  plans={plans}
                />
              </div>
            </TabsContent>

            <TabsContent value="story" className="print-area overflow-auto">
              <div ref={storyRef} className="mx-auto" style={{ width: 'fit-content' }}>
                <div style={{ transform: 'scale(0.3)', transformOrigin: 'top center' }}>
                  <SalesInstagramStory
                    referralCode={referralCode}
                    signupLink={signupLink}
                    sellerName={sellerName || undefined}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle>💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>📄 <strong>Flyer A5:</strong> Ideal para panfletagem rápida</li>
            <li>💳 <strong>Cartões:</strong> Perfeito para entrega pessoal e networking</li>
            <li>🏷️ <strong>Mini QR:</strong> Recorte e cole em mesas, vitrines e sacolas</li>
            <li>📊 <strong>Apresentação:</strong> Ideal para reuniões e enviar por e-mail (4 páginas)</li>
            <li>📱 <strong>Story:</strong> Compartilhe no Instagram e WhatsApp Status</li>
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
