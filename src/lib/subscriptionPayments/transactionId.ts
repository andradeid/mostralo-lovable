// Helper para extrair EndToEndId do campo notes
export const extractTransactionId = (notes: string | null): string | null => {
  if (!notes) return null;
  
  // Tentar extrair EndToEndId do JSON
  try {
    const parsed = JSON.parse(notes);
    if (parsed.EndToEndId) return parsed.EndToEndId;
    if (parsed.endToEndId) return parsed.endToEndId;
    if (parsed.e2eId) return parsed.e2eId;
  } catch {
    // Se não for JSON, tentar encontrar padrão de ID
    // CORRIGIDO: Aceitar letras e números (alfanumérico) após o "E"
    const match = notes.match(/E[a-zA-Z0-9]{20,35}/);
    if (match) return match[0];
    
    // Alternativamente, buscar após "EndToEndId:"
    const endToEndMatch = notes.match(/EndToEndId:\s*([a-zA-Z0-9]+)/);
    if (endToEndMatch) return endToEndMatch[1];
  }
  
  return null;
};
