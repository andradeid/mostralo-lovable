import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Check, Facebook, Linkedin, MessageCircle, Instagram, ShoppingBag, Download, User, Flame, Hash, HelpCircle, Frown, Rocket, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BonusTier } from '@/utils/recruitmentPromptGenerator';

interface RecruitmentPostsGeneratorProps {
  bonusTiers: BonusTier[];
}

interface PostTemplate {
  id: string;
  title: string;
  content: string;
  hashtags?: string;
  platform: string;
}

interface Headline {
  id: string;
  short: string;
  long: string;
  tip: string;
}

interface HeadlineCategory {
  id: string;
  name: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  headlines: Headline[];
}

export function RecruitmentPostsGenerator({ bonusTiers }: RecruitmentPostsGeneratorProps) {
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterWhatsApp, setRecruiterWhatsApp] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>(['provocativas']);

  const baseUrl = window.location.origin;
  const signupLink = `${baseUrl}/seja-vendedor`;

  // Calcular bônus total
  const totalBonus = bonusTiers.reduce((acc, tier) => acc + tier.bonus_amount, 0);
  const formattedTotalBonus = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBonus);

  const getSignupLinkWithSource = (source: string) => `${signupLink}?source=post_${source}`;

  const getRecruiterInfo = () => {
    if (recruiterName && recruiterWhatsApp) {
      return `\n\n📞 Fale comigo: ${recruiterName}\n📱 WhatsApp: ${recruiterWhatsApp}`;
    }
    if (recruiterName) {
      return `\n\n👤 ${recruiterName}`;
    }
    return '';
  };

  // Headlines estratégicas por categoria
  const headlineCategories: HeadlineCategory[] = [
    {
      id: 'provocativas',
      name: 'Provocativas',
      emoji: '🔥',
      icon: <Flame className="h-4 w-4" />,
      color: 'text-red-500',
      description: 'Geram reação emocional e curiosidade',
      headlines: [
        { id: 'prov-1', short: 'Cansou de enriquecer seu chefe?', long: 'Cansou de bater meta pra enriquecer seu chefe enquanto você mal paga as contas?', tip: 'Facebook, WhatsApp' },
        { id: 'prov-2', short: 'Seu salário paga suas contas?', long: 'Seu salário mal paga as contas e você continua aceitando isso?', tip: 'Facebook, Instagram' },
        { id: 'prov-3', short: 'Trabalha muito e ganha pouco?', long: 'Trabalha 8h por dia pra ganhar pouco e ainda agradecer?', tip: 'WhatsApp Status' },
        { id: 'prov-4', short: 'Chefe te trata como número?', long: 'Seu chefe te trata como número e você ainda defende a empresa?', tip: 'LinkedIn, Facebook' },
      ]
    },
    {
      id: 'numeros',
      name: 'Com Números',
      emoji: '💰',
      icon: <Hash className="h-4 w-4" />,
      color: 'text-green-500',
      description: 'Prova social e valores concretos',
      headlines: [
        { id: 'num-1', short: `R$ 1.000 a R$ 10.000/mês de casa`, long: `Ganhe de R$ 1.000 a R$ 10.000 por mês trabalhando de casa, sem horário fixo`, tip: 'Todas as plataformas' },
        { id: 'num-2', short: `Bônus de até ${formattedTotalBonus}/trimestre`, long: `Além da comissão, receba bônus de até ${formattedTotalBonus} por trimestre`, tip: 'LinkedIn, Facebook' },
        { id: 'num-3', short: '10% de comissão por venda', long: 'Ganhe 10% de comissão em cada venda - e o cliente paga TODO mês', tip: 'OLX, Facebook' },
        { id: 'num-4', short: 'R$ 400 por cliente, todo mês', long: 'Cada cliente vale R$ 400/mês pra você. Quantos você consegue?', tip: 'WhatsApp, Instagram' },
      ]
    },
    {
      id: 'perguntas',
      name: 'Perguntas',
      emoji: '🤔',
      icon: <HelpCircle className="h-4 w-4" />,
      color: 'text-blue-500',
      description: 'Geram curiosidade e engajamento',
      headlines: [
        { id: 'perg-1', short: 'E se você ganhasse TODO mês?', long: 'E se cada cliente que você vendesse pagasse comissão TODO mês, pra sempre?', tip: 'Facebook, LinkedIn' },
        { id: 'perg-2', short: 'Quanto vale sua hora hoje?', long: 'Quanto você ganha por hora hoje? E se pudesse ganhar R$ 50, R$ 100 por hora?', tip: 'Instagram, WhatsApp' },
        { id: 'perg-3', short: 'Você está satisfeito com seu salário?', long: 'Você está satisfeito com o quanto ganha ou só se conformou?', tip: 'LinkedIn, Facebook' },
        { id: 'perg-4', short: 'Home office interessa?', long: 'Trabalhar de casa, sem horário fixo e ganhando bem te interessa?', tip: 'Todas as plataformas' },
      ]
    },
    {
      id: 'dor',
      name: 'Dor / Problema',
      emoji: '😤',
      icon: <Frown className="h-4 w-4" />,
      color: 'text-orange-500',
      description: 'Identificação com frustrações reais',
      headlines: [
        { id: 'dor-1', short: 'Bateu meta e perdeu o bônus?', long: 'Bateu meta o mês todo e o bônus sumiu no mês seguinte?', tip: 'Facebook, LinkedIn' },
        { id: 'dor-2', short: 'Cansou de depender de patrão?', long: 'Cansou de depender de patrão pra ter dinheiro no final do mês?', tip: 'WhatsApp, Instagram' },
        { id: 'dor-3', short: 'Trânsito te rouba horas?', long: 'Perde 2-3 horas por dia no trânsito indo trabalhar pra ganhar pouco?', tip: 'Facebook, OLX' },
        { id: 'dor-4', short: 'CLT te dá segurança?', long: 'Sua CLT te dá "segurança" mas não sobra dinheiro pro fim de semana?', tip: 'LinkedIn, Facebook' },
      ]
    },
    {
      id: 'aspiracionais',
      name: 'Aspiracionais',
      emoji: '🚀',
      icon: <Rocket className="h-4 w-4" />,
      color: 'text-purple-500',
      description: 'Despertam desejo e sonhos',
      headlines: [
        { id: 'asp-1', short: 'Acorde e veja dinheiro caindo', long: 'Imagine acordar e ver dinheiro caindo na conta de clientes que você vendeu meses atrás', tip: 'Instagram, Facebook' },
        { id: 'asp-2', short: 'Trabalhe de qualquer lugar', long: 'Trabalhe da praia, de casa, do café - onde você quiser, quando quiser', tip: 'Instagram, WhatsApp' },
        { id: 'asp-3', short: 'Sua agenda, suas regras', long: 'Chega de bater ponto. Sua agenda, suas regras, seu dinheiro', tip: 'Facebook, LinkedIn' },
        { id: 'asp-4', short: 'Liberdade financeira é real', long: 'Liberdade financeira não é sonho. É decisão. Quer dar o primeiro passo?', tip: 'Todas as plataformas' },
      ]
    },
    {
      id: 'urgencia',
      name: 'Urgência / FOMO',
      emoji: '⏰',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-500',
      description: 'Criam senso de escassez',
      headlines: [
        { id: 'urg-1', short: '3 vagas. Amanhã não tem.', long: 'Só tenho 3 vagas na minha equipe. Amanhã não vou mais aceitar.', tip: 'WhatsApp, Instagram' },
        { id: 'urg-2', short: 'Última chamada esta semana', long: 'Última chamada pra entrar no time esta semana. Depois só mês que vem.', tip: 'Facebook, WhatsApp' },
        { id: 'urg-3', short: 'Enquanto você pensa, outros agem', long: 'Enquanto você pensa se vale a pena, outros já estão ganhando.', tip: 'LinkedIn, Facebook' },
        { id: 'urg-4', short: 'O mercado não espera', long: 'O mercado de delivery cresce todo dia. Vai ficar só olhando?', tip: 'Todas as plataformas' },
      ]
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCopyHeadline = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Frase copiada!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Templates do Facebook
  const facebookPosts: PostTemplate[] = [
    {
      id: 'fb-short',
      title: 'Curta (Compartilhamento rápido)',
      platform: 'facebook',
      content: `🚀 Renda extra trabalhando de casa?

Procuro vendedores para plataforma de delivery.
✅ Comissão até 10%
✅ Home office 100%
✅ Bônus até ${formattedTotalBonus}/trimestre

👉 ${getSignupLinkWithSource('facebook')}${getRecruiterInfo()}`,
      hashtags: '#vagasemprego #homeoffice #rendaextra #vendedor #oportunidade'
    },
    {
      id: 'fb-complete',
      title: 'Completa (Todos os benefícios)',
      platform: 'facebook',
      content: `🔥 VAGA: Representante Comercial - 100% Home Office 🔥

Estou recrutando vendedores para uma plataforma de delivery que está crescendo MUITO!

💰 GANHOS:
• Afiliado (CPF): 5-7% de comissão, até R$ 1.900/mês
• Parceiro PJ (CNPJ): 10% de comissão ILIMITADA + bônus trimestrais até ${formattedTotalBonus}

✅ O QUE VOCÊ PRECISA:
• Celular com internet
• Boa comunicação
• Vontade de ganhar dinheiro

🎯 BENEFÍCIOS:
• Trabalhe de onde quiser
• Sem horário fixo
• Sem metas obrigatórias
• Material de vendas pronto
• IA para ajudar nas conversas
• Treinamento completo

🚀 Comece HOJE! Cadastro gratuito:
👉 ${getSignupLinkWithSource('facebook')}${getRecruiterInfo()}

Comenta "EU QUERO" que te mando mais informações! 👇`,
      hashtags: '#vagas #emprego #homeoffice #rendaextra #trabalheemcasa #vendedor #oportunidade #renda #dinheiro'
    },
    {
      id: 'fb-question',
      title: 'Pergunta (Gerar engajamento)',
      platform: 'facebook',
      content: `❓ Você está satisfeito com seu salário atual?

Se pudesse ganhar R$ 1.000 a R$ 10.000 por mês trabalhando de casa, você toparia?

Estou recrutando pessoas para vender uma plataforma de delivery.

✅ Sem experiência necessária
✅ Sem investimento inicial
✅ Comissão recorrente (ganha TODO mês)
✅ Bônus trimestrais até ${formattedTotalBonus}

Interessado? Comenta "QUERO SABER MAIS" 👇

Ou cadastre-se direto: ${getSignupLinkWithSource('facebook')}${getRecruiterInfo()}`,
      hashtags: '#emprego #oportunidade #trabalho #homeoffice #rendaextra'
    }
  ];

  // Templates do LinkedIn
  const linkedinPosts: PostTemplate[] = [
    {
      id: 'li-formal',
      title: 'Vaga Formal',
      platform: 'linkedin',
      content: `🔍 OPORTUNIDADE: Representante Comercial - Home Office

📋 Modelo de Contratação:
• Pessoa Física (Afiliado): Comissão 5-7%
• Pessoa Jurídica (Parceiro): Comissão 10% + Bônus

💼 Sobre a Oportunidade:
Buscamos profissionais para comercialização de plataforma SaaS para o mercado de delivery e varejo. Atuação 100% remota com flexibilidade de horários.

✅ Requisitos:
• Boa comunicação verbal e escrita
• Proatividade e organização
• Acesso à internet
• Disponibilidade para atendimento via WhatsApp

🎯 Benefícios:
• Trabalho 100% remoto
• Flexibilidade total de horários
• Comissão recorrente mensal
• Bônus trimestral até ${formattedTotalBonus}
• Treinamento completo
• Material de vendas e IA de apoio

📩 Inscreva-se: ${getSignupLinkWithSource('linkedin')}${getRecruiterInfo()}

#Vagas #Emprego #HomeOffice #Vendas #RepresentanteComercial #Oportunidade`
    },
    {
      id: 'li-story',
      title: 'Storytelling (Narrativa pessoal)',
      platform: 'linkedin',
      content: `Há alguns meses eu não imaginava que poderia trabalhar de casa e ter liberdade financeira.

Hoje, faço parte de um time que está revolucionando o mercado de delivery no Brasil - ajudando restaurantes a se libertarem das taxas abusivas de marketplaces.

E agora estou expandindo meu time.

🎯 Procuro pessoas que:
• Querem trabalhar de casa
• Buscam renda extra ou nova carreira
• Gostam de se comunicar
• Têm vontade de crescer

💰 O que oferecemos:
• Comissão recorrente de 5% a 10%
• Bônus trimestrais até ${formattedTotalBonus}
• Sem horário fixo
• Treinamento completo

Não precisa de experiência. Precisa de vontade.

Interessado? Me mande uma mensagem ou acesse:
👉 ${getSignupLinkWithSource('linkedin')}${getRecruiterInfo()}

#Carreira #Oportunidade #Vendas #HomeOffice #CrescimentoProfissional`
    }
  ];

  // Templates OLX/Classificados
  const classifiedsPosts: PostTemplate[] = [
    {
      id: 'olx-main',
      title: 'Anúncio Principal',
      platform: 'olx',
      content: `TÍTULO: Vendedor Home Office - Comissão até 10% + Bônus

DESCRIÇÃO:
Empresa de tecnologia contrata representantes comerciais para venda de plataforma de delivery.

🏠 TRABALHO 100% HOME OFFICE

💰 QUANTO VOCÊ GANHA:
- Afiliado (CPF): 5-7% por venda, até R$ 1.900/mês
- Parceiro (CNPJ): 10% por venda, SEM LIMITE + bônus até ${formattedTotalBonus}/trimestre

✅ O QUE PRECISA:
- Celular com WhatsApp
- Internet
- Vontade de vender

🎁 O QUE OFERECEMOS:
- Treinamento gratuito
- Material de vendas pronto
- IA para ajudar nas conversas
- Suporte da equipe
- Pagamento mensal via PIX

❌ NÃO PRECISA:
- Experiência
- Investimento
- CNPJ (opcional)

📲 CADASTRE-SE GRÁTIS:
${getSignupLinkWithSource('olx')}${getRecruiterInfo()}`
    }
  ];

  // Templates WhatsApp Status
  const whatsappPosts: PostTemplate[] = [
    {
      id: 'wa-provocative',
      title: 'Provocativo',
      platform: 'whatsapp',
      content: `💰 Quer ganhar R$ 1.000 a R$ 10.000/mês de casa?

Tô recrutando vendedores. 
Sem horário. Sem meta. Sem chefe.

Me chama! 👇`
    },
    {
      id: 'wa-earnings',
      title: 'Foco em Ganhos',
      platform: 'whatsapp',
      content: `🚀 Oportunidade:

✅ Home office 100%
✅ Comissão até 10%
✅ Bônus ${formattedTotalBonus}/trimestre
✅ Sem experiência

Quer saber mais? Me manda um "OI"!`
    },
    {
      id: 'wa-story-short',
      title: 'Para Stories',
      platform: 'whatsapp',
      content: `Quer trabalhar de casa? 🏠

Estou recrutando vendedores!

💰 Ganhe de R$ 1.000 a R$ 10.000/mês
⏰ Horário livre
📱 Só precisa de celular

Arrasta pra cima ou me chama! 👆`
    }
  ];

  // Templates Instagram
  const instagramPosts: PostTemplate[] = [
    {
      id: 'ig-feed',
      title: 'Post Feed',
      platform: 'instagram',
      content: `🚀 VAGA: Vendedor Home Office

Procuro pessoas que querem:
✅ Trabalhar de casa
✅ Ter horário flexível
✅ Ganhar comissão recorrente
✅ Receber bônus trimestrais

💰 Ganhos: R$ 1.000 a R$ 10.000/mês
🏠 100% home office
📚 Treinamento incluso

❌ Não precisa de experiência
❌ Não precisa investir nada

Link na bio! 👆${getRecruiterInfo()}`,
      hashtags: '#vaga #emprego #homeoffice #trabalheemcasa #rendaextra #vendedor #oportunidade #trabalho #renda #dinheiro #liberdadefinanceira #empreendedorismo'
    },
    {
      id: 'ig-reels',
      title: 'Legenda para Reels',
      platform: 'instagram',
      content: `Quer trabalhar de casa e ganhar bem? 👀

Tô recrutando vendedores!

O que você ganha:
💰 Comissão até 10%
🎁 Bônus até ${formattedTotalBonus}
🏠 Home office

O que precisa:
📱 Celular
💬 Saber conversar

Só isso!

Comenta "EU QUERO" 👇${getRecruiterInfo()}`,
      hashtags: '#vagas #trabalho #homeoffice #rendaextra #oportunidade'
    }
  ];

  const handleCopy = async (id: string, content: string, hashtags?: string) => {
    const fullContent = hashtags ? `${content}\n\n${hashtags}` : content;
    await navigator.clipboard.writeText(fullContent);
    setCopiedId(id);
    toast.success('Texto copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    const allPosts = [
      '═══════════════════════════════════════',
      '📱 FACEBOOK',
      '═══════════════════════════════════════',
      ...facebookPosts.map(p => `\n--- ${p.title} ---\n${p.content}\n${p.hashtags || ''}`),
      '\n═══════════════════════════════════════',
      '💼 LINKEDIN',
      '═══════════════════════════════════════',
      ...linkedinPosts.map(p => `\n--- ${p.title} ---\n${p.content}`),
      '\n═══════════════════════════════════════',
      '🛒 OLX / CLASSIFICADOS',
      '═══════════════════════════════════════',
      ...classifiedsPosts.map(p => `\n--- ${p.title} ---\n${p.content}`),
      '\n═══════════════════════════════════════',
      '📲 WHATSAPP STATUS',
      '═══════════════════════════════════════',
      ...whatsappPosts.map(p => `\n--- ${p.title} ---\n${p.content}`),
      '\n═══════════════════════════════════════',
      '📸 INSTAGRAM',
      '═══════════════════════════════════════',
      ...instagramPosts.map(p => `\n--- ${p.title} ---\n${p.content}\n${p.hashtags || ''}`),
    ].join('\n');

    await navigator.clipboard.writeText(allPosts);
    toast.success('Todos os textos copiados!');
  };

  const renderPostCard = (post: PostTemplate) => (
    <Card key={post.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{post.title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(post.id, post.content, post.hashtags)}
          >
            {copiedId === post.id ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 mb-3">
          <pre className="text-sm whitespace-pre-wrap font-sans">{post.content}</pre>
        </div>
        {post.hashtags && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.split(' ').map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {post.content.length} caracteres
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Headlines Estratégicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Headlines Estratégicas
          </CardTitle>
          <CardDescription>
            Frases de abertura poderosas categorizadas por gatilho mental. Use no início dos seus posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {headlineCategories.map((category) => (
            <Collapsible 
              key={category.id}
              open={openCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("p-1.5 rounded-md bg-muted", category.color)}>
                      {category.icon}
                    </span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.emoji} {category.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.headlines.length} frases
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-normal">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    openCategories.includes(category.id) && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid gap-2 pl-2 border-l-2 border-muted ml-4">
                  {category.headlines.map((headline) => (
                    <div 
                      key={headline.id}
                      className="bg-muted/50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">"{headline.short}"</p>
                          <p className="text-xs text-muted-foreground">"{headline.long}"</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleCopyHeadline(`${headline.id}-short`, headline.short)}
                          >
                            {copiedId === `${headline.id}-short` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleCopyHeadline(`${headline.id}-long`, headline.long)}
                          >
                            {copiedId === `${headline.id}-long` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="text-xs">Longa</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          💡 {headline.tip}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Personalização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personalizar Textos
          </CardTitle>
          <CardDescription>
            Adicione suas informações de contato (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recruiterName">Seu Nome</Label>
              <Input
                id="recruiterName"
                placeholder="Ex: João Silva"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiterWhatsApp">Seu WhatsApp</Label>
              <Input
                id="recruiterWhatsApp"
                placeholder="Ex: (11) 99999-9999"
                value={recruiterWhatsApp}
                onChange={(e) => setRecruiterWhatsApp(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Suas informações serão adicionadas automaticamente ao final de cada texto
          </p>
        </CardContent>
      </Card>

      {/* Botão Copiar Tudo */}
      <div className="flex justify-end">
        <Button onClick={handleCopyAll} variant="default">
          <Download className="h-4 w-4 mr-2" />
          Copiar Todos os Textos
        </Button>
      </div>

      {/* Abas por Plataforma */}
      <Tabs defaultValue="facebook" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-max md:w-full flex md:grid md:grid-cols-5 h-auto p-1 gap-1">
            <TabsTrigger value="facebook" className="shrink-0 text-xs px-3 py-2 flex items-center gap-1">
              <Facebook className="h-4 w-4" />
              <span className="hidden sm:inline">Facebook</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="shrink-0 text-xs px-3 py-2 flex items-center gap-1">
              <Linkedin className="h-4 w-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="olx" className="shrink-0 text-xs px-3 py-2 flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">OLX</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="shrink-0 text-xs px-3 py-2 flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="instagram" className="shrink-0 text-xs px-3 py-2 flex items-center gap-1">
              <Instagram className="h-4 w-4" />
              <span className="hidden sm:inline">Instagram</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="facebook" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              Facebook
            </h3>
            <p className="text-sm text-muted-foreground">
              3 versões otimizadas para grupos e feed
            </p>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            {facebookPosts.map(renderPostCard)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="linkedin" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-700" />
              LinkedIn
            </h3>
            <p className="text-sm text-muted-foreground">
              Versão formal e storytelling para rede profissional
            </p>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            {linkedinPosts.map(renderPostCard)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="olx" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              OLX / Classificados
            </h3>
            <p className="text-sm text-muted-foreground">
              Formato para sites de classificados e grupos de emprego
            </p>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            {classifiedsPosts.map(renderPostCard)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Status
            </h3>
            <p className="text-sm text-muted-foreground">
              Textos curtos para status e mensagens
            </p>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            {whatsappPosts.map(renderPostCard)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Instagram
            </h3>
            <p className="text-sm text-muted-foreground">
              Legendas para feed e reels com hashtags
            </p>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            {instagramPosts.map(renderPostCard)}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dicas */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3">💡 Dicas para Divulgação:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Facebook:</strong> Poste em grupos de emprego, renda extra e home office</li>
            <li>• <strong>LinkedIn:</strong> Use a versão formal e conecte com profissionais da área</li>
            <li>• <strong>OLX:</strong> Publique na categoria "Vagas de Emprego" da sua cidade</li>
            <li>• <strong>WhatsApp:</strong> Use os textos curtos para status e listas de transmissão</li>
            <li>• <strong>Instagram:</strong> Poste no feed e stories, use todos os hashtags</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
