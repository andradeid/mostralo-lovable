import { Delete, X } from 'lucide-react';

interface TotemNumericKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  type: 'phone' | 'cpf';
  themeColor: string;
  darkMode: boolean;
}

export function TotemNumericKeyboard({
  value,
  onChange,
  onClose,
  type,
  themeColor,
  darkMode,
}: TotemNumericKeyboardProps) {
  const maxLength = type === 'phone' ? 11 : 11;
  
  const formatPhone = (digits: string): string => {
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCPF = (digits: string): string => {
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const format = type === 'phone' ? formatPhone : formatCPF;
  const digits = value.replace(/\D/g, '');
  const formattedValue = format(digits);

  const handleDigit = (digit: string) => {
    if (digits.length < maxLength) {
      onChange(digits + digit);
    }
  };

  const handleBackspace = () => {
    onChange(digits.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      {/* Área de fechar - clicar fora */}
      <div className="flex-1" onClick={onClose} />

      {/* Keyboard Container */}
      <div
        className="rounded-t-3xl p-6 pb-8"
        style={{ backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{type === 'phone' ? '📱' : '🪪'}</span>
            <span 
              className="font-semibold text-lg"
              style={{ color: darkMode ? '#ffffff' : '#000000' }}
            >
              {type === 'phone' ? 'Digite seu Telefone' : 'Digite seu CPF'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6" style={{ color: darkMode ? '#ffffff' : '#000000' }} />
          </button>
        </div>

        {/* Display */}
        <div
          className="text-center py-6 mb-6 rounded-2xl border-2"
          style={{
            borderColor: themeColor,
            backgroundColor: darkMode ? '#262626' : '#f9fafb',
          }}
        >
          <span
            className="text-4xl font-bold tracking-wider"
            style={{ color: darkMode ? '#ffffff' : '#000000' }}
          >
            {formattedValue || (type === 'phone' ? '(00) 00000-0000' : '000.000.000-00')}
          </span>
          {!formattedValue && (
            <p 
              className="text-sm mt-2"
              style={{ color: darkMode ? '#a1a1a1' : '#6b7280' }}
            >
              Toque nos números abaixo
            </p>
          )}
        </div>

        {/* Keyboard Grid */}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((key) => {
            const isBackspace = key === '⌫';
            const isClear = key === 'C';
            const isSpecial = isBackspace || isClear;

            return (
              <button
                key={key}
                onClick={() => {
                  if (isBackspace) handleBackspace();
                  else if (isClear) handleClear();
                  else handleDigit(key);
                }}
                className="h-16 rounded-2xl font-bold text-2xl transition-all duration-150 active:scale-95 active:opacity-80"
                style={{
                  backgroundColor: isSpecial
                    ? (darkMode ? '#333333' : '#e5e7eb')
                    : themeColor,
                  color: isSpecial
                    ? (darkMode ? '#ffffff' : '#374151')
                    : '#ffffff',
                }}
              >
                {isBackspace ? <Delete className="h-7 w-7 mx-auto" /> : key}
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          disabled={digits.length === 0}
          className="w-full h-14 mt-4 rounded-2xl font-bold text-lg transition-all duration-150 active:scale-98 disabled:opacity-50"
          style={{
            backgroundColor: themeColor,
            color: '#ffffff',
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
