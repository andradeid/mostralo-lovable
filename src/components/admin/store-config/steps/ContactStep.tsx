import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Instagram, Facebook, Globe, BarChart3, Target, MessageCircle, MapPin, Code, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { MapLocationPicker } from "../MapLocationPicker";

interface ContactStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export function ContactStep({ formData, updateFormData }: ContactStepProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    updateFormData({
      latitude: lat,
      longitude: lng,
      address: address || formData.address,
      google_maps_link: `https://www.google.com/maps?q=${lat},${lng}`,
    });
  };

  return (
    <div className="space-y-6">
      {showMapPicker && (
        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          initialLat={formData.latitude}
          initialLng={formData.longitude}
          onClose={() => setShowMapPicker(false)}
        />
      )}
      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              ATENÇÃO: Será o número no qual você receberá os pedidos
            </p>
            <Input
              id="whatsapp"
              value={formData.whatsapp || ''}
              onChange={(e) => updateFormData({ whatsapp: e.target.value })}
              placeholder="(61) 99959-102_"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">E-mail de contato</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email || ''}
              onChange={(e) => updateFormData({ contact_email: e.target.value })}
              placeholder="ingabeachsports@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram do Estabelecimento</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              ATENÇÃO: Usar Link Completo, Conforme Exemplo.
            </p>
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={(e) => updateFormData({ instagram: e.target.value })}
              placeholder="https://www.instagram.com/ingabeachsports"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook do Estabelecimento</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              ATENÇÃO: Usar Link Completo, Conforme Exemplo.
            </p>
            <Input
              id="facebook"
              value={formData.facebook || ''}
              onChange={(e) => updateFormData({ facebook: e.target.value })}
              placeholder="https://www.facebook.com/seu_negocio/"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Digite o endereço ou use o botão abaixo para selecionar no mapa.
            </p>
            <div className="flex gap-2">
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => updateFormData({ address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - estado"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMapPicker(true)}
                className="shrink-0"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Mapa
              </Button>
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-muted-foreground">
                Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_maps_link">Link do Google Maps</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Link gerado automaticamente ao selecionar localização no mapa, ou cole manualmente.
            </p>
            <Input
              id="google_maps_link"
              value={formData.google_maps_link || ''}
              onChange={(e) => updateFormData({ google_maps_link: e.target.value })}
              placeholder="https://www.google.com/maps?q=-15.7801,-47.9292"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
            Nosso Sistema permite que cada loja tenha seu acompanhamento de métricas, para isso basta preencher os campos abaixo com Id Google Analytics e ID Face Book Pixel.
          </p>

          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">ID Google Analytics.</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Usar apenas o ID - Para Maiores informações:<br/>
              https://support.google.com/sites/answer/97459?hl=pt.
            </p>
            <Input
              id="google_analytics_id"
              value={formData.google_analytics_id || ''}
              onChange={(e) => updateFormData({ google_analytics_id: e.target.value })}
              placeholder="ID Google Analytics."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Face Book Pixel.</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Usar apenas o ID - Para Maiores informações:<br/>
              https://pt-br.facebook.com/business/help/952192354843755?id=1205376682832142
            </p>
            <Input
              id="facebook_pixel_id"
              value={formData.facebook_pixel_id || ''}
              onChange={(e) => updateFormData({ facebook_pixel_id: e.target.value })}
              placeholder="ID Facebook pixel."
            />
          </div>
        </CardContent>
      </Card>

      {/* Scripts Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="w-4 h-4 mr-2" />
            Scripts Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              <strong>Atenção:</strong> Insira apenas scripts de fontes confiáveis. Scripts maliciosos podem comprometer a segurança da sua loja e dos seus clientes.
            </AlertDescription>
          </Alert>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="examples">
              <AccordionTrigger className="text-sm">Ver exemplos de uso</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <strong>Botão WhatsApp Flutuante:</strong>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{`<a href="https://wa.me/5511999999999" target="_blank" 
   style="position:fixed; bottom:20px; right:20px; z-index:9999;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
       alt="WhatsApp" width="60">
</a>`}</pre>
                  </div>
                  <div>
                    <strong>Chat Tidio:</strong>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{`<script src="//code.tidio.co/SEU_CODIGO.js" async></script>`}</pre>
                  </div>
                  <div>
                    <strong>Google Analytics:</strong>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{`<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXX');
</script>`}</pre>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-2">
            <Label htmlFor="head_scripts">Scripts no Head</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Meta tags, CSS externo, scripts de analytics. Executados antes do conteúdo carregar.
            </p>
            <Textarea
              id="head_scripts"
              value={formData.head_scripts || ''}
              onChange={(e) => updateFormData({ head_scripts: e.target.value })}
              placeholder="<script>...</script> ou <link>..."
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_start_scripts">Scripts no Início do Body</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Raramente usado. Para elementos que precisam aparecer antes do conteúdo.
            </p>
            <Textarea
              id="body_start_scripts"
              value={formData.body_start_scripts || ''}
              onChange={(e) => updateFormData({ body_start_scripts: e.target.value })}
              placeholder="<div>...</div> ou <script>..."
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_end_scripts">Scripts no Final do Body ⭐</Label>
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              <strong>Recomendado para widgets!</strong> Botões flutuantes de WhatsApp, chatbots (Tidio, Chatwoot, Drift, Crisp), etc.
            </p>
            <Textarea
              id="body_end_scripts"
              value={formData.body_end_scripts || ''}
              onChange={(e) => updateFormData({ body_end_scripts: e.target.value })}
              placeholder="<script>...</script> ou <a>..."
              className="font-mono text-sm min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}