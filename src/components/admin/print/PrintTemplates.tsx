import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChefHat, Truck } from "lucide-react";
import { PrintTemplate } from "@/types/print";

interface PrintTemplatesProps {
  onSelectTemplate: (template: PrintTemplate) => void;
}

export function PrintTemplates({ onSelectTemplate }: PrintTemplatesProps) {
  const templates: PrintTemplate[] = [
    {
      name: "Completo - Minimalista",
      description: "Todas as seções, estilo limpo e organizado",
      document_type: "complete",
      print_type: "thermal_80mm",
      sections: {
        header: true,
        orderInfo: true,
        customerInfo: true,
        items: true,
        totals: true,
        payment: true,
        footer: true,
      },
      styles: {
        fontSize: "medium",
        fontFamily: "sans-serif",
        headerAlign: "center",
        itemsAlign: "left",
        boldTitles: true,
        showSeparators: true,
      },
      custom_texts: {
        headerText: "WhatsApp: (00) 0000-0000",
        footerText: "Obrigado pela preferência! Volte sempre!",
      },
    },
    {
      name: "Cozinha - Simplificado",
      description: "Apenas itens e observações para a cozinha",
      document_type: "kitchen",
      print_type: "thermal_80mm",
      sections: {
        header: false,
        orderInfo: true,
        customerInfo: false,
        items: true,
        totals: false,
        payment: false,
        footer: false,
      },
      styles: {
        fontSize: "large",
        fontFamily: "monospace",
        headerAlign: "center",
        itemsAlign: "left",
        boldTitles: true,
        showSeparators: true,
      },
      custom_texts: {
        headerText: "",
        footerText: "",
      },
    },
    {
      name: "Entregador - Endereço",
      description: "Foco em dados de entrega e localização",
      document_type: "delivery",
      print_type: "thermal_58mm",
      sections: {
        header: false,
        orderInfo: true,
        customerInfo: true,
        items: true,
        totals: true,
        payment: true,
        footer: false,
      },
      styles: {
        fontSize: "medium",
        fontFamily: "monospace",
        headerAlign: "left",
        itemsAlign: "left",
        boldTitles: true,
        showSeparators: true,
      },
      custom_texts: {
        headerText: "",
        footerText: "Boa entrega!",
      },
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "complete":
        return <FileText className="h-8 w-8" />;
      case "kitchen":
        return <ChefHat className="h-8 w-8" />;
      case "delivery":
        return <Truck className="h-8 w-8" />;
      default:
        return <FileText className="h-8 w-8" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Templates Prontos</h3>
        <p className="text-sm text-muted-foreground">
          Escolha um template para começar rapidamente
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((template, index) => (
          <Card key={index} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center justify-center mb-4 text-primary">
                {getIcon(template.document_type)}
              </div>
              <CardTitle className="text-center">{template.name}</CardTitle>
              <CardDescription className="text-center">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => onSelectTemplate(template)}
                className="w-full"
                variant="outline"
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
