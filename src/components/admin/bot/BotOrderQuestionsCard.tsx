import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Plus, Trash2, GripVertical, MapPin, CreditCard, MessageSquare, Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useBotOrderQuestions, OrderQuestion } from "@/hooks/useBotOrderQuestions";

interface BotOrderQuestionsCardProps {
  storeId: string;
  disabled?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <MessageSquare className="h-3.5 w-3.5" />,
  location: <MapPin className="h-3.5 w-3.5 text-green-500" />,
  payment: <CreditCard className="h-3.5 w-3.5 text-blue-500" />,
  options: <ListChecks className="h-3.5 w-3.5 text-purple-500" />,
};

const typeLabels: Record<string, string> = {
  text: 'Texto',
  location: 'Localização',
  payment: 'Pagamento',
  options: 'Opções',
};

export function BotOrderQuestionsCard({ storeId, disabled }: BotOrderQuestionsCardProps) {
  const { questions, loading, saving, initializeDefaults, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useBotOrderQuestions(storeId);
  const [newQuestion, setNewQuestion] = useState('');
  const [newType, setNewType] = useState<'text' | 'location' | 'payment' | 'options'>('text');

  // Inicializar perguntas padrão se não existirem
  useEffect(() => {
    if (!loading && questions.length === 0) {
      initializeDefaults();
    }
  }, [loading, questions.length, initializeDefaults]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(questions);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    reorderQuestions(reordered.map((q, i) => ({ ...q, sort_order: i })));
  };

  const handleAdd = async () => {
    if (!newQuestion.trim()) return;
    await addQuestion(newQuestion.trim(), newType);
    setNewQuestion('');
    setNewType('text');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
          Perguntas do Pedido
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure as perguntas que o bot fará para fechar o pedido. Arraste para reordenar.
        </p>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {questions.map((q, index) => (
                  <Draggable key={q.id} draggableId={q.id} index={index} isDragDisabled={disabled}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border transition-colors ${
                          snapshot.isDragging ? 'bg-muted shadow-md' : 'bg-background'
                        } ${!q.enabled ? 'opacity-50' : ''}`}
                      >
                        <div {...provided.dragHandleProps} className="shrink-0 cursor-grab">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="shrink-0">{typeIcons[q.question_type]}</div>
                        <Input
                          value={q.question_text}
                          onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                          className="flex-1 h-8 text-xs sm:text-sm"
                          disabled={disabled}
                        />
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] shrink-0">
                          {typeLabels[q.question_type]}
                        </Badge>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={q.is_required}
                            onCheckedChange={(checked) => updateQuestion(q.id, { is_required: checked })}
                            disabled={disabled}
                          />
                          <span className="text-[9px] text-muted-foreground hidden sm:inline">
                            {q.is_required ? 'Obrig.' : 'Opc.'}
                          </span>
                        </div>
                        <Switch
                          checked={q.enabled}
                          onCheckedChange={(checked) => updateQuestion(q.id, { enabled: checked })}
                          disabled={disabled}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => deleteQuestion(q.id)}
                          disabled={disabled || saving}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Adicionar nova pergunta */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Input
            placeholder="Nova pergunta..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 h-8 text-xs sm:text-sm"
            disabled={disabled}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="location">Localização</SelectItem>
              <SelectItem value="payment">Pagamento</SelectItem>
              <SelectItem value="options">Opções</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={disabled || !newQuestion.trim() || saving}
            className="h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
