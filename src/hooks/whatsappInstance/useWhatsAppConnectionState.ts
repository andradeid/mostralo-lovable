// Estado da conexão: carregando ação, QR Code, código de pareamento e contagem regressiva.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { useState, useRef } from "react";

export function useWhatsAppConnectionState() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<'qrcode' | 'paircode'>('qrcode');
  const [pairingPhone, setPairingPhone] = useState('');
  const [qrCountdown, setQrCountdown] = useState<number>(0);
  const [uazapiCreating, setUazapiCreating] = useState(false);
  const autoQrTriedRef = useRef(false);

  return {
    actionLoading,
    setActionLoading,
    qrCode,
    setQrCode,
    pairCode,
    setPairCode,
    connectionMode,
    setConnectionMode,
    pairingPhone,
    setPairingPhone,
    qrCountdown,
    setQrCountdown,
    uazapiCreating,
    setUazapiCreating,
    autoQrTriedRef,
  };
}
