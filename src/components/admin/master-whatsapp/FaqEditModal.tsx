import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Loader2 } from 'lucide-react';
import { MasterFaqItem, CreateFaqInput, UpdateFaqInput } from '@/hooks/useMasterFaq';

interface FaqEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq?: MasterFaqItem | null;
  onSave: (data: CreateFaqInput | UpdateFaqInput) => Promise<boolean>;
  saving: boolean;
}

const categoryOptions = [
  { value: 'sales', label: '💰 Vendas', description: 'Perguntas sobre preços, planos, recursos' },
  { value: 'support', label: '🎧 Suporte', description: 'Dúvidas técnicas e problemas' },
  { value: 'recruitment', label: '👥 Recrutamento', description: 'Programa de parceiros (oculto)' },
];

export function FaqEditModal({ open, onOpenChange, faq, onSave, saving }: FaqEditModalProps) {
  const [category, setCategory] = useState<'sales' | 'support' | 'recruitment'>('sales');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [priority, setPriority] = useState(5);
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!faq;

  // Reset form when modal opens/closes or faq changes
  useEffect(() => {
    if (open && faq) {
      setCategory(faq.category);
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setKeywords(faq.keywords || []);
      setPriority(faq.priority);
      setIsActive(faq.is_active);
    } else if (open && !faq) {
      setCategory('sales');
      setQuestion('');
      setAnswer('');
      setKeywords([]);
      setPriority(5);
      setIsActive(true);
    }
  }, [open, faq]);

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) {
      return;
    }

    const data = {
      category,
      question: question.trim(),
      answer: answer.trim(),
      keywords,
      priority,
      is_active: isActive,
    };

    const success = await onSave(
      isEditing ? { id: faq!.id, ...data } : data
    );

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Pergunta' : 'Nova Pergunta'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações da pergunta do FAQ'
              : 'Adicione uma nova pergunta à base de conhecimento do bot'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category === 'recruitment' && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Perguntas de recrutamento são ativadas por keywords, não aparecem no menu inicial
              </p>
            )}
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Pergunta</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Quanto custa o Mostralo?"
            />
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label htmlFor="answer">Resposta</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite a resposta completa que o bot deve dar..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Dica: Use emojis para deixar a resposta mais amigável 😊
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords (palavras-chave para matching)</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma keyword e pressione Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Prioridade: {priority}</Label>
              <span className="text-xs text-muted-foreground">
                {priority >= 8 ? '🔥 Alta' : priority >= 5 ? '📊 Normal' : '📉 Baixa'}
              </span>
            </div>
            <Slider
              value={[priority]}
              onValueChange={([v]) => setPriority(v)}
              min={1}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Perguntas com maior prioridade aparecem primeiro nos resultados
            </p>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativa</Label>
              <p className="text-xs text-muted-foreground">
                Perguntas inativas não são consideradas pelo bot
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saving || !question.trim() || !answer.trim()}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
