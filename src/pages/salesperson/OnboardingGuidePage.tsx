import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Copy, 
  Check, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Building, 
  FileText, 
  MapPin, 
  CreditCard,
  MessageCircle,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  tip?: string;
  example?: string;
  field: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  emoji: string;
  questions: Question[];
}

const ONBOARDING_SECTIONS: Section[] = [
  {
    id: 'login',
    title: 'Dados de Login',
    icon: Mail,
    emoji: '📧',
    questions: [
      {
        id: 'email',
        question: 'Qual o melhor email para criar sua conta? Esse será seu login.',
        tip: 'O email é importante para recuperação de senha e notificações',
        example: 'joao@suaempresa.com.br',
        field: 'Email'
      },
      {
        id: 'password',
        question: 'Quer que eu gere uma senha temporária ou prefere escolher uma?',
        tip: 'Mínimo 6 caracteres. Recomende uma senha segura.',
        example: 'Mínimo 6 caracteres',
        field: 'Senha'
      }
    ]
  },
  {
    id: 'personal',
    title: 'Dados Pessoais',
    icon: User,
    emoji: '👤',
    questions: [
      {
        id: 'full_name',
        question: 'Qual o nome completo do responsável pela loja?',
        tip: 'Nome que aparecerá como responsável no sistema',
        example: 'João da Silva Santos',
        field: 'Nome Completo'
      },
      {
        id: 'phone',
        question: 'Qual o número de telefone/WhatsApp para contato?',
        tip: 'WhatsApp preferencial para suporte rápido',
        example: '(11) 99999-9999',
        field: 'Telefone/WhatsApp'
      }
    ]
  },
  {
    id: 'company',
    title: 'Dados da Empresa',
    icon: Building,
    emoji: '🏪',
    questions: [
      {
        id: 'company_name',
        question: 'Qual o nome da sua empresa/loja? Isso vai aparecer no cardápio.',
        tip: 'Nome comercial que seus clientes conhecem',
        example: 'Pizzaria Bella Napoli',
        field: 'Nome da Loja'
      },
      {
        id: 'document',
        question: 'Você tem CNPJ? Se tiver, me passa que eu busco os dados automaticamente!',
        tip: 'Com CNPJ, preenchemos endereço e dados automaticamente. CPF também aceito.',
        example: '12.345.678/0001-90 ou 123.456.789-00',
        field: 'CPF/CNPJ'
      }
    ]
  },
  {
    id: 'address',
    title: 'Endereço',
    icon: MapPin,
    emoji: '📍',
    questions: [
      {
        id: 'address',
        question: 'Qual o endereço completo da loja?',
        tip: 'Endereço onde os clientes podem buscar pedidos ou onde fica o estabelecimento',
        example: 'Rua das Flores, 123 - Centro - São Paulo/SP',
        field: 'Endereço Completo'
      },
      {
        id: 'cep',
        question: 'Qual o CEP?',
        tip: 'O CEP ajuda a preencher outros campos automaticamente',
        example: '01234-567',
        field: 'CEP'
      }
    ]
  },
  {
    id: 'plan',
    title: 'Plano Escolhido',
    icon: CreditCard,
    emoji: '✨',
    questions: [
      {
        id: 'plan',
        question: 'Qual plano você escolheu?',
        tip: 'Lembre o cliente dos benefícios do plano que conversaram',
        example: 'Essencial, Profissional ou Empresarial',
        field: 'Plano'
      }
    ]
  }
];

const WHATSAPP_TEMPLATE = `Ótimo! Para criar sua conta, preciso de algumas informações:

📧 *Email para login:*

👤 *Nome completo:*

📱 *WhatsApp:*

🏪 *Nome da loja:*

📄 *CPF ou CNPJ:*

📍 *Endereço completo:*
(Rua, número, complemento, cidade, estado, CEP)

✨ *Plano escolhido:*

Me manda esses dados que eu já crio sua conta! 🚀`;

export default function OnboardingGuidePage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_TEMPLATE);
      setCopiedTemplate(true);
      toast.success('Mensagem copiada para o WhatsApp!');
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleCopyAllQuestions = async () => {
    const allQuestions = ONBOARDING_SECTIONS.flatMap(section => 
      section.questions.map(q => `${section.emoji} ${q.field}: "${q.question}"`)
    ).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(allQuestions);
      setCopiedQuestions(true);
      toast.success('Perguntas copiadas!');
      setTimeout(() => setCopiedQuestions(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = ONBOARDING_SECTIONS.reduce((acc, s) => acc + s.questions.length, 0);
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Guia de Cadastro - Novo Assinante
          </h1>
          <p className="text-muted-foreground">
            Use este guia para coletar todos os dados necessários para criar a conta do cliente
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'} className="text-sm">
            {completedCount}/{totalCount} campos
          </Badge>
          {progressPercentage === 100 && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completo!
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleCopyTemplate} variant="default" className="flex-1">
          {copiedTemplate ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4" />
              Copiar para WhatsApp
            </>
          )}
        </Button>
        <Button onClick={handleCopyAllQuestions} variant="outline" className="flex-1">
          {copiedQuestions ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copiar Todas Perguntas
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {ONBOARDING_SECTIONS.map((section) => {
          const Icon = section.icon;
          const sectionComplete = section.questions.every(q => checkedItems[q.id]);
          
          return (
            <Card key={section.id} className={sectionComplete ? 'border-green-500/50 bg-green-500/5' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">{section.emoji}</span>
                    <Icon className="h-4 w-4" />
                    {section.title}
                  </CardTitle>
                  {sectionComplete && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.questions.map((question) => (
                  <div 
                    key={question.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      checkedItems[question.id] 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={question.id}
                        checked={checkedItems[question.id] || false}
                        onCheckedChange={() => toggleCheck(question.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label 
                          htmlFor={question.id}
                          className="text-sm font-medium cursor-pointer leading-relaxed block"
                        >
                          💬 "{question.question}"
                        </label>
                        {question.tip && (
                          <p className="text-xs text-muted-foreground">
                            💡 {question.tip}
                          </p>
                        )}
                        {question.example && (
                          <p className="text-xs text-muted-foreground">
                            📝 Exemplo: <span className="font-mono">{question.example}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* WhatsApp Template Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Template para WhatsApp
          </CardTitle>
          <CardDescription>
            Mensagem pronta para enviar ao cliente e coletar todos os dados de uma vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ScrollArea className="h-[300px] w-full rounded-lg border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans">{WHATSAPP_TEMPLATE}</pre>
            </ScrollArea>
            <Button 
              onClick={handleCopyTemplate}
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
            >
              {copiedTemplate ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-lg">💡 Dicas para o Cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✅ <strong>CNPJ é preferível</strong> - Com ele, buscamos dados automaticamente</p>
          <p>✅ <strong>Colete TODOS os dados</strong> antes de iniciar o cadastro no sistema</p>
          <p>✅ <strong>Use o template do WhatsApp</strong> para agilizar a coleta</p>
          <p>✅ <strong>Confirme o plano escolhido</strong> antes de criar a conta</p>
          <p>⚠️ <strong>Só colete esses dados APÓS</strong> o cliente confirmar que quer fechar!</p>
        </CardContent>
      </Card>
    </div>
  );
}
