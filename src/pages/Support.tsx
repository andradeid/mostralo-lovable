import { usePageSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Clock, MessageCircle, FileText, Zap } from "lucide-react";

export default function Support() {
  usePageSEO({
    title: "Suporte | Mostralo Digital Catalog",
    description: "Central de ajuda e suporte da plataforma Mostralo. Encontre respostas, entre em contato e obtenha ajuda técnica.",
    keywords: "suporte, ajuda, contato, FAQ, mostralo, atendimento"
  });

  const faqs = [
    {
      question: "Como criar minha primeira loja?",
      answer: "Após fazer login, acesse 'Minha Loja' no painel administrativo e siga o assistente de configuração. Você poderá definir informações básicas, aparência e produtos."
    },
    {
      question: "Posso personalizar as cores da minha loja?",
      answer: "Sim! Na seção 'Aparência' da configuração da loja, você pode personalizar cores, logo e outras configurações visuais para combinar com a identidade da sua marca."
    },
    {
      question: "Como meus clientes fazem pedidos?",
      answer: "Seus clientes acessam sua loja através do link personalizado, navegam pelo catálogo e podem entrar em contato via WhatsApp para finalizar pedidos."
    },
    {
      question: "Existe limite de produtos?",
      answer: "Os limites variam conforme o plano escolhido. O plano Básico permite até 50 produtos, o Profissional até 200 e o Empresarial é ilimitado."
    },
    {
      question: "Como alterar meu plano?",
      answer: "Vá até 'Planos' no menu administrativo para visualizar opções disponíveis e fazer upgrade/downgrade do seu plano atual."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-[1080px]">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Estamos aqui para ajudar! Encontre respostas rápidas ou entre em contato conosco.
            </p>
          </div>

          {/* Contact Options */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">Email</CardTitle>
                <CardDescription>Resposta em até 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-primary font-medium">suporte@mostralo.com.br</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="w-8 h-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">WhatsApp</CardTitle>
                <CardDescription>Atendimento rápido</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Abrir WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">Horário</CardTitle>
                <CardDescription>Segunda à Sexta</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground font-medium">9h às 18h</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Perguntas Frequentes</h2>
              <p className="text-muted-foreground">
                Encontre respostas para as dúvidas mais comuns
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Quick Help */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Ajuda Rápida</h2>
              <p className="text-muted-foreground">
                Recursos para resolver problemas comuns
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
                  <CardTitle>Guia de Início</CardTitle>
                  <CardDescription>
                    Aprenda a configurar sua loja em poucos passos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Zap className="w-8 h-8 mx-auto text-primary mb-2" />
                  <CardTitle>Tutoriais</CardTitle>
                  <CardDescription>
                    Vídeos e guias para recursos avançados
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <MessageCircle className="w-8 h-8 mx-auto text-primary mb-2" />
                  <CardTitle>Status do Sistema</CardTitle>
                  <CardDescription>
                    Verifique a disponibilidade dos serviços
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Contact Form */}
          <section>
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Entre em Contato</CardTitle>
                <CardDescription>
                  Não encontrou o que procurava? Envie sua mensagem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" placeholder="Seu nome completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Problema Técnico</SelectItem>
                      <SelectItem value="billing">Cobrança e Pagamento</SelectItem>
                      <SelectItem value="feature">Solicitação de Recurso</SelectItem>
                      <SelectItem value="general">Dúvida Geral</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Descreva sua dúvida ou problema em detalhes..."
                    className="min-h-32"
                    required 
                  />
                </div>

                <Button className="w-full" size="lg">
                  Enviar Mensagem
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar esta mensagem, você concorda com nossos{" "}
                  <a href="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Back Link */}
          <div className="pt-8 border-t">
            <div className="text-center">
              <a 
                href="/" 
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
              >
                ← Voltar para o início
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}