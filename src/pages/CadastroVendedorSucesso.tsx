import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, FileText } from "lucide-react";

export default function CadastroVendedorSucesso() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Cadastro Realizado com Sucesso!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Seu cadastro foi enviado para análise. Nossa equipe irá revisar suas informações
            e você receberá um email com o resultado em até <strong>48 horas</strong>.
          </p>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próximos Passos:
            </h3>
            <ol className="space-y-3 ml-6 list-decimal text-sm">
              <li>
                <strong>Aguarde o email de aprovação</strong> – Analisaremos seu CNPJ e CNAEs
              </li>
              <li>
                <strong>Acesse sua conta</strong> – Após aprovação, faça login com o email e senha cadastrados
              </li>
              <li>
                <strong>Aceite o contrato digital</strong> – No primeiro acesso, você verá o contrato para assinatura
              </li>
              <li>
                <strong>Receba seu link de vendas</strong> – Use seu código único para indicar lojas
              </li>
              <li>
                <strong>Comece a vender!</strong> – Quanto mais vendas, mais comissões e bônus você ganha
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Lembre-se: É necessário emitir Nota Fiscal
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Para receber seus pagamentos, você precisará emitir Nota Fiscal de Serviços
                  mensalmente com o valor das comissões + bônus (se houver).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/seja-vendedor">
                Voltar para Landing Page
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/auth">
                Ir para Login
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Em caso de dúvidas, entre em contato conosco através do suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
