import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardList, Star, Trophy, Sparkles, Medal, Info } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; points: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: "experience",
    question: "Você já trabalhou com vendas antes?",
    options: [
      { value: "yes_years", label: "Sim, tenho mais de 2 anos de experiência", points: 25 },
      { value: "yes_some", label: "Sim, tenho alguma experiência (menos de 2 anos)", points: 15 },
      { value: "no", label: "Não, mas estou disposto(a) a aprender", points: 10 },
    ],
  },
  {
    id: "availability",
    question: "Quantas horas por semana você pode dedicar?",
    options: [
      { value: "full", label: "30+ horas (dedicação integral)", points: 20 },
      { value: "partial", label: "15-30 horas (tempo parcial)", points: 15 },
      { value: "casual", label: "5-15 horas (casual)", points: 8 },
    ],
  },
  {
    id: "network",
    question: "Você conhece empresários ou donos de restaurantes/comércios?",
    options: [
      { value: "many", label: "Sim, conheço vários na minha região", points: 20 },
      { value: "some", label: "Conheço alguns que posso abordar", points: 12 },
      { value: "few", label: "Não conheço, mas sei como prospectar", points: 8 },
    ],
  },
  {
    id: "digital",
    question: "Como você avalia suas habilidades digitais?",
    options: [
      { value: "advanced", label: "Avançado - uso várias ferramentas digitais", points: 15 },
      { value: "intermediate", label: "Intermediário - me viro bem com tecnologia", points: 10 },
      { value: "basic", label: "Básico - preciso de ajuda às vezes", points: 5 },
    ],
  },
  {
    id: "communication",
    question: "Como você prefere se comunicar com clientes?",
    options: [
      { value: "all", label: "Presencial, telefone e WhatsApp", points: 12 },
      { value: "remote", label: "Principalmente WhatsApp e telefone", points: 8 },
      { value: "digital", label: "Prefiro comunicação por texto", points: 5 },
    ],
  },
  {
    id: "goal",
    question: "Qual é sua principal motivação para ser vendedor?",
    options: [
      { value: "main_income", label: "Quero fazer disso minha renda principal", points: 8 },
      { value: "extra_income", label: "Busco uma renda extra consistente", points: 6 },
      { value: "trying", label: "Quero experimentar e ver se gosto", points: 4 },
    ],
  },
];

interface QualificationQuizProps {
  value: Record<string, string>;
  onChange: (answers: Record<string, string>, score: number, level: string) => void;
}

export function QualificationQuiz({ value, onChange }: QualificationQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(value || {});

  // Calcular score e nível quando as respostas mudam
  useEffect(() => {
    const score = calculateScore(answers);
    const level = getQualificationLevel(score);
    onChange(answers, score, level);
  }, [answers]);

  const calculateScore = (ans: Record<string, string>): number => {
    let total = 0;
    QUESTIONS.forEach((q) => {
      const answer = ans[q.id];
      if (answer) {
        const option = q.options.find((o) => o.value === answer);
        if (option) total += option.points;
      }
    });
    return total;
  };

  const getQualificationLevel = (score: number): string => {
    if (score >= 80) return "top";
    if (score >= 60) return "promising";
    if (score >= 40) return "beginner";
    return "evaluation";
  };

  const getLevelInfo = (level: string) => {
    const levels: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
      top: { 
        label: "🥇 Top Candidate", 
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
        icon: <Trophy className="w-4 h-4" />,
        description: "Perfil altamente qualificado!"
      },
      promising: { 
        label: "🥈 Promissor", 
        color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        icon: <Star className="w-4 h-4" />,
        description: "Bom potencial de vendas"
      },
      beginner: { 
        label: "🥉 Iniciante", 
        color: "bg-green-500/10 text-green-600 border-green-500/30",
        icon: <Sparkles className="w-4 h-4" />,
        description: "Pronto para começar!"
      },
      evaluation: { 
        label: "📋 Em Avaliação", 
        color: "bg-gray-500/10 text-gray-600 border-gray-500/30",
        icon: <Medal className="w-4 h-4" />,
        description: "Vamos te conhecer melhor"
      },
    };
    return levels[level] || levels.evaluation;
  };

  const currentScore = calculateScore(answers);
  const currentLevel = getQualificationLevel(currentScore);
  const levelInfo = getLevelInfo(currentLevel);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Não se preocupe!</strong> Este questionário é apenas para conhecermos seu perfil.
          Experiência prévia <strong>não é obrigatória</strong> - queremos entender melhor quem você é.
        </AlertDescription>
      </Alert>

      {/* Score atual */}
      {answeredCount > 0 && (
        <Card className={`border-2 ${levelInfo.color}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {levelInfo.icon}
                <span className="font-semibold">{levelInfo.label}</span>
              </div>
              <Badge variant="outline">
                {currentScore}/100 pontos
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {levelInfo.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Perguntas */}
      <div className="space-y-6">
        {QUESTIONS.map((q, index) => (
          <Card key={q.id} className={answers[q.id] ? "border-primary/30" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {index + 1}
                </span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
              >
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                        answers[q.id] === option.value ? "bg-primary/5 border-primary" : ""
                      }`}
                      onClick={() => setAnswers({ ...answers, [q.id]: option.value })}
                    >
                      <RadioGroupItem value={option.value} id={`${q.id}-${option.value}`} />
                      <Label 
                        htmlFor={`${q.id}-${option.value}`} 
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-muted-foreground">
        {answeredCount} de {QUESTIONS.length} perguntas respondidas
        {allAnswered && (
          <span className="ml-2 text-green-600">✓ Completo</span>
        )}
      </div>
    </div>
  );
}
