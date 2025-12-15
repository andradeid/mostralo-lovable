import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CreditCard, QrCode, Presentation, Instagram, MessageSquare } from "lucide-react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { FlyerTemplate } from "./FlyerTemplate";
import { BusinessCardTemplate } from "./BusinessCardTemplate";
import { MiniQRTemplate } from "./MiniQRTemplate";
import { CommercialPresentationTemplate } from "./CommercialPresentationTemplate";
import { CommercialPresentationWhatsAppTemplate } from "./CommercialPresentationWhatsAppTemplate";
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
      case 'whatsapp': return null; // WhatsApp tem seus próprios botões
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
      story: 'story-instagram-mostralo',
      whatsapp: 'whatsapp-mostralo'
    };
    return names[selectedTemplate] || 'material-mostralo';
  };

  const showDownloadButtons = selectedTemplate !== 'whatsapp';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Material de Divulgação</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Imprima e distribua para seus leads
        </p>
      </div>

      {/* Links com QR Code */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <QrCode className="h-4 w-4 md:h-5 md:w-5" />
            Seus Links de Referência
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            QR Codes e links prontos para usar
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid md:grid-cols-2 gap-3 md:gap-6">
            <div className="p-3 md:p-4 rounded-lg bg-muted/50 border">
              <QRCodeDisplay
                url={homepageLink}
                label="🏠 Página Inicial"
                description="Mostra planos e benefícios"
                size={100}
              />
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-muted/50 border">
              <QRCodeDisplay
                url={signupLink}
                label="📝 Cadastro Direto"
                description="Vai direto para o formulário"
                size={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalização */}
      <Card className="no-print">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Personalização (Opcional)</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Adicione suas informações ao material
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="sellerName" className="text-xs md:text-sm">Seu Nome</Label>
              <Input
                id="sellerName"
                className="h-9 md:h-10 text-sm"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="sellerPhone" className="text-xs md:text-sm">Seu Telefone</Label>
              <Input
                id="sellerPhone"
                className="h-9 md:h-10 text-sm"
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
        <CardHeader className="no-print pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Escolha o Modelo</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Selecione o formato ideal para sua divulgação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate} className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 no-print">
              <TabsTrigger value="flyer" className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 text-[10px] md:text-sm py-2 md:py-1.5 px-1 md:px-3">
                <FileText className="h-4 w-4" />
                <span>Flyer</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 text-[10px] md:text-sm py-2 md:py-1.5 px-1 md:px-3">
                <CreditCard className="h-4 w-4" />
                <span>Cartões</span>
              </TabsTrigger>
              <TabsTrigger value="mini" className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 text-[10px] md:text-sm py-2 md:py-1.5 px-1 md:px-3">
                <QrCode className="h-4 w-4" />
                <span>Mini QR</span>
              </TabsTrigger>
              <TabsTrigger value="presentation" className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 text-[10px] md:text-sm py-2 md:py-1.5 px-1 md:px-3">
                <Presentation className="h-4 w-4" />
                <span>Apresentação</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 text-[10px] md:text-sm py-2 md:py-1.5 px-1 md:px-3">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="story" className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 text-[10px] md:text-sm py-2 md:py-1.5 px-1 md:px-3">
                <Instagram className="h-4 w-4" />
                <span>Story</span>
              </TabsTrigger>
            </TabsList>

            {/* Botões de Download - logo após tabs (exceto WhatsApp que tem seus próprios botões) */}
            {showDownloadButtons && getCurrentRef() && (
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 no-print">
                <DownloadButtons
                  targetRef={getCurrentRef()!}
                  filename={getFilename()}
                  paperSize={getPaperSize()}
                />
              </div>
            )}

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

            <TabsContent value="whatsapp" className="print-area">
              <CommercialPresentationWhatsAppTemplate
                referralCode={referralCode}
                homepageLink={homepageLink}
                signupLink={signupLink}
                sellerName={sellerName || undefined}
                sellerPhone={sellerPhone || undefined}
                plans={plans}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="no-print">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
            <li>📄 <strong>Flyer:</strong> Ideal para panfletagem (A5)</li>
            <li>💳 <strong>Cartões:</strong> Para entrega pessoal</li>
            <li>🏷️ <strong>Mini QR:</strong> Cole em mesas e vitrines</li>
            <li>📊 <strong>Apresentação:</strong> Para reuniões</li>
            <li>💬 <strong>WhatsApp:</strong> 7 imagens para carrossel</li>
            <li>📱 <strong>Story:</strong> Instagram e WhatsApp Status</li>
            <li>🖨️ Use papel de qualidade</li>
            <li className="text-[#25D366] font-medium">🎯 <strong>Destaque:</strong> WhatsApp Marketing = 23% clientes voltam!</li>
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
