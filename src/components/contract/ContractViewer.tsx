import { Store } from "lucide-react";

interface ContractViewerProps {
  contractText: string;
  companyName: string;
  companyCnpj: string;
  companyCity: string;
  companyState: string;
  version: string;
  salespersonName?: string;
  salespersonCnpj?: string;
  acceptedAt?: string;
  verificationHash?: string;
}

export function ContractViewer({
  contractText,
  companyName,
  companyCnpj,
  companyCity,
  companyState,
  version,
  salespersonName,
  salespersonCnpj,
  acceptedAt,
  verificationHash,
}: ContractViewerProps) {
  // Parse contract text into sections
  const sections = contractText.split(/\n(?=\d+\.\s)/).filter(Boolean);

  return (
    <div className="bg-background border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{companyName}</h2>
            <p className="text-sm text-muted-foreground">CNPJ: {companyCnpj}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-xs text-muted-foreground">Versão</span>
            <p className="font-semibold">{version}</p>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="p-6 space-y-4">
        {sections.map((section, index) => {
          // Check if it's a header section (title)
          const isTitle = section.includes("CONTRATO DE PRESTAÇÃO");
          const isDeclaration = section.includes("DECLARAÇÃO DE ACEITE");
          
          if (isTitle) {
            return (
              <div key={index} className="text-center py-4">
                <h1 className="text-lg font-bold uppercase tracking-wide">
                  {section.split("\n")[0]}
                </h1>
              </div>
            );
          }

          if (isDeclaration) {
            return (
              <div key={index} className="mt-8 pt-6 border-t-2 border-dashed">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-bold text-center mb-4">
                    DECLARAÇÃO DE ACEITE ELETRÔNICO
                  </h3>
                  <div className="space-y-2 text-sm">
                    {section.split("\n").filter(line => line.startsWith("✓")).map((line, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{line.replace("✓ ", "")}</span>
                      </div>
                    ))}
                  </div>
                  
                  {acceptedAt && (
                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
                      <p><strong>Data do aceite:</strong> {acceptedAt}</p>
                      {verificationHash && (
                        <p><strong>Hash:</strong> {verificationHash.substring(0, 16)}...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Regular numbered section
          const match = section.match(/^(\d+)\.\s+/);
          if (match) {
            const number = match[1];
            const rest = section.substring(match[0].length);
            const lines = rest.split("\n");
            const title = lines[0];
            const content = lines.slice(1).join("\n");

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {number}
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <div className="ml-10 text-sm text-muted-foreground whitespace-pre-wrap">
                  {content.trim()}
                </div>
              </div>
            );
          }

          // Fallback for other content
          return (
            <div key={index} className="text-sm whitespace-pre-wrap">
              {section}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-muted/30 p-4 border-t text-center text-xs text-muted-foreground">
        <p>Foro: {companyCity}/{companyState} • Versão {version}</p>
        {salespersonName && (
          <p className="mt-1">
            Contratado: {salespersonName} {salespersonCnpj && `(CNPJ: ${salespersonCnpj})`}
          </p>
        )}
      </div>
    </div>
  );
}
