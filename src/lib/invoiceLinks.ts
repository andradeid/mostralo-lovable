// Link de pagamento da fatura de assinatura: o oficial é /pagar/<token>.
// Sem token (fatura muito antiga), cai no link antigo, que tenta redirecionar.
export function invoicePayPath(invoice: { id: string; public_token?: string | null }): string {
  return invoice.public_token ? `/pagar/${invoice.public_token}` : `/invoice-payment/${invoice.id}`;
}
