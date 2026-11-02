// Certificado digital A1: o envio é feito no cadastro da empresa na Focus NFe (o Mostralo não guarda o .pfx).
// CONFERIR NA FOCUS: se o cadastro passar a ser pela API de Empresas (campos de certificado não confirmados
// na pesquisa), trocar este passo por um upload que vai direto para uma função do servidor.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export function FiscalCertificateStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Certificado digital A1</CardTitle>
        <CardDescription>É a "assinatura" da empresa nas notas. Sem ele a SEFAZ não aceita nada.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li>Compre ou renove um <b>e-CNPJ A1</b> (arquivo .pfx) numa certificadora. O tipo A3 (cartão/token) não serve.</li>
          <li>Envie o arquivo e a senha no cadastro da empresa na <b>Focus NFe</b> (ou mande para o suporte do Mostralo fazer).</li>
          <li>No mesmo cadastro, informe o <b>CSC e o ID do token</b> da NFC-e (homologação e produção).</li>
          <li>Copie os <b>tokens da empresa</b> (homologação e produção) para o quadro "Chaves de acesso" abaixo.</li>
        </ol>
        <p className="text-xs text-muted-foreground">O certificado vence em 1 ano. Renove antes para não parar de emitir.</p>
      </CardContent>
    </Card>
  );
}
