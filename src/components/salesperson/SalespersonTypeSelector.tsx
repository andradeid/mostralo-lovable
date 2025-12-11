import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Info,
  ArrowRight,
  Sparkles 
} from "lucide-react";

type SalespersonType = 'affiliate' | 'partner' | null;

interface SalespersonTypeSelectorProps {
  selectedType: SalespersonType;
  onSelectType: (type: 'affiliate' | 'partner') => void;
  onContinue: () => void;
}

export function SalespersonTypeSelector({ 
  selectedType, 
  onSelectType, 
  onContinue 
}: SalespersonTypeSelectorProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Como você quer se cadastrar?</CardTitle>
        <CardDescription className="text-base">
          Escolha a opção que melhor se encaixa no seu perfil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Card Afiliado */}
          <Card 
            className={`cursor-pointer border-2 transition-all hover:border-primary/50 ${
              selectedType === 'affiliate' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
            }`}
            onClick={() => onSelectType('affiliate')}
          >
            <CardHeader className="pb-2">
              <Badge className="w-fit" variant="secondary">
                <User className="w-3 h-3 mr-1" />
                Sem CNPJ
              </Badge>
              <CardTitle className="text-lg flex items-center gap-2">
                Afiliado
                {selectedType === 'affiliate' && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>
                Para quem não tem empresa aberta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary mb-3">5-7%</div>
              <p className="text-xs text-muted-foreground mb-3">de comissão por venda</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Cadastro apenas com CPF</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Início rápido (2 etapas)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Pagamento via PIX</span>
                </li>
                <li className="flex items-start gap-2 text-amber-600">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Limite: R$ 1.900/mês</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Sem bônus trimestral</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card Parceiro PJ */}
          <Card 
            className={`cursor-pointer border-2 transition-all hover:border-primary/50 relative overflow-hidden ${
              selectedType === 'partner' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
            }`}
            onClick={() => onSelectType('partner')}
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
              <Sparkles className="w-3 h-3 inline mr-1" />
              RECOMENDADO
            </div>
            <CardHeader className="pb-2">
              <Badge className="w-fit">
                <Building2 className="w-3 h-3 mr-1" />
                Com MEI/CNPJ
              </Badge>
              <CardTitle className="text-lg flex items-center gap-2">
                Parceiro PJ
                {selectedType === 'partner' && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>
                Para quem tem MEI ou empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary mb-3">10%</div>
              <p className="text-xs text-muted-foreground mb-3">de comissão por venda</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>CNPJ ativo + CNAE compatível</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ganhos <strong>ilimitados</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Bônus até R$ 8.500/trimestre</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Contrato formal PJ</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Pode emitir Nota Fiscal</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Info MEI */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Não tem MEI mas quer ganhar mais?</strong>{' '}
            <a 
              href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Abra seu MEI gratuitamente →
            </a>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={onContinue}
          disabled={!selectedType}
          className="w-full"
          size="lg"
        >
          Continuar com {selectedType === 'affiliate' ? 'Afiliado' : selectedType === 'partner' ? 'Parceiro PJ' : '...'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
