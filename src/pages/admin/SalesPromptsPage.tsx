import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromptTypeSelector } from '@/components/admin/sales/PromptTypeSelector';
import { PromptPreview } from '@/components/admin/sales/PromptPreview';
import { SavingsCalculatorDemo } from '@/components/admin/sales/SavingsCalculatorDemo';
import { generateSalesPrompt, PromptType } from '@/utils/salesPromptGenerator';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Plan = Database['public']['Tables']['plans']['Row'];

export default function SalesPromptsPage() {
  const [selectedType, setSelectedType] = useState<PromptType>('intermediate');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      const prompt = generateSalesPrompt({
        type: selectedType,
        plans,
      });
      setGeneratedPrompt(prompt);
    }
  }, [selectedType, plans]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;

      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">🤖 Gerador de Prompts de Vendas com IA</h1>
        <p className="text-muted-foreground">
          Gere prompts dinâmicos para usar com ChatGPT, Claude ou outros assistentes de IA.
          Todos os dados são atualizados automaticamente do sistema.
        </p>
      </div>

      <PromptTypeSelector selectedType={selectedType} onSelectType={setSelectedType} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PromptPreview prompt={generatedPrompt} type={selectedType} />
        </div>
        <div>
          <SavingsCalculatorDemo />
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">📋 Como usar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Escolha o tipo de prompt (Básico, Intermediário ou Agressivo)</li>
          <li>Clique em "Copiar Prompt" no preview</li>
          <li>Abra o ChatGPT, Claude ou outro assistente de IA</li>
          <li>Cole o prompt copiado</li>
          <li>Comece a conversar com seus leads usando a IA!</li>
        </ol>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> O prompt já inclui todos os dados dos planos, calculadora de economia,
            quebra de objeções, testemunhos e CTAs. Você não precisa adicionar nada!
          </p>
        </div>
      </div>
    </div>
  );
}
