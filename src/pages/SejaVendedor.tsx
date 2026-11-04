import { Link } from "react-router-dom";
import { ArrowRight, Check, Store, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Programa de parceiros (/seja-vendedor). Página curta, em tom papel (igual ao blog), com fotos:
 * quem chega lê pouco, então o vídeo explica e a página mostra os passos, os nichos, as duas formas
 * de participar e o cadastro. Valores conferidos com o sistema: afiliado (CPF) 5–7% com limite de
 * R$ 1.900/mês; parceiro (PJ) 10%. O bônus trimestral saiu da página (o sistema não calcula sozinho).
 */

const AFFILIATE = "/cadastro-vendedor?type=affiliate";
const PARTNER = "/cadastro-vendedor?type=partner";

const STEPS = [
  { n: 1, img: "/vendedor/passo1-indica.webp", title: "Você indica", text: "Manda seu link ou seu cupom para o dono do negócio." },
  { n: 2, img: "/vendedor/passo2-assina.webp", title: "Ele assina", text: "A gente instala, configura e treina. Você não precisa saber de tecnologia." },
  { n: 3, img: "/vendedor/passo3-recebe.webp", title: "Você recebe todo mês", text: "Enquanto o cliente pagar, a sua comissão cai por Pix." },
];

const NICHES = [
  { img: "/parceiro/barbeiro-mob.webp", label: "Barbearias" },
  { img: "/parceiro/nail-mob.webp", label: "Salões e unhas" },
  { img: "/parceiro/estetica-mob.webp", label: "Estética" },
  { img: "/vendedor/nicho-arena.webp", label: "Arenas e quadras" },
  { img: "/vendedor/nicho-petshop.webp", label: "Pet shops" },
  { img: "/vendedor/nicho-delivery.webp", label: "Lanchonetes e delivery" },
  { img: "/vendedor/nicho-pizzaria.webp", label: "Pizzarias e açaí" },
  { img: "/vendedor/nicho-confeitaria.webp", label: "Confeitaria e encomendas" },
];

const MORE = ["Estúdios de tatuagem e pilates", "Consultórios e clínicas", "Hamburguerias", "Restaurantes", "Sorveterias", "Mercadinhos e lojas"];

const GIVES = ["Seu link e seu cupom", "Painel com suas vendas e comissões", "Mensagens prontas para o WhatsApp", "Suporte da equipe Mostralo"];

const FAQ = [
  { q: "Preciso ter CNPJ?", a: "Não. Com CPF você entra como afiliado (5 a 7%, até R$ 1.900 por mês). Com MEI ou CNPJ você entra como parceiro (10%, sem limite)." },
  { q: "Preciso entender de sistema?", a: "Não. Seu trabalho é apresentar. A instalação, a configuração e o treinamento do cliente são por nossa conta." },
  { q: "Quando eu recebo?", a: "Você pede o pagamento no seu painel a partir do dia 1º e recebe por Pix. Parceiro PJ envia a nota fiscal." },
  { q: "Para quem posso indicar?", a: "Para qualquer negócio que agenda horário ou vende: barbearia, salão, estética, delivery, lanchonete, confeitaria e lojas." },
];

function SectionTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
      {kicker && <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">{kicker}</p>}
      <h2 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
    </div>
  );
}

export default function SejaVendedor() {
  return (
    <div className="paper min-h-screen bg-background text-foreground [color-scheme:light]">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary md:text-2xl">
            <Store className="h-7 w-7" aria-hidden="true" />
            Mostralo
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <a href="#cadastro">Quero ser parceiro</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Topo com foto */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:gap-12 md:px-6 md:py-16">
        <div>
          <p className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Programa de parceiros</p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">
            Indique o Mostralo.<br /><span className="text-primary">Receba todo mês.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Apresente o sistema para barbearias, salões e deliveries da sua cidade. Enquanto o cliente pagar, você ganha.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#cadastro">Quero ser parceiro <ArrowRight className="ml-1 h-4 w-4" /></a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#video"><PlayCircle className="mr-1 h-4 w-4" /> Ver o vídeo</a>
            </Button>
          </div>
        </div>
        <picture>
          <source media="(max-width: 767px)" srcSet="/vendedor/hero-mob.webp" />
          <img
            src="/vendedor/hero-desk.webp"
            alt="Parceiro do Mostralo mostrando o sistema no celular para o dono de uma barbearia"
            className="aspect-square w-full rounded-3xl object-cover shadow-xl md:aspect-[4/3]"
            loading="eager"
          />
        </picture>
      </section>

      {/* Vídeo */}
      <section id="video" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-8 md:px-6 md:py-12">
        <SectionTitle kicker="Em menos de 2 minutos" title="Veja como funciona" />
        <video
          className="aspect-video w-full rounded-2xl bg-black shadow-xl"
          src="/vendedor/video-programa.mp4"
          poster="/vendedor/video-capa.jpg"
          controls
          preload="none"
          playsInline
        />
      </section>

      {/* 3 passos */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <SectionTitle kicker="Simples assim" title="Três passos" />
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <img src={s.img} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="p-5">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{s.n}</span>
                  <h3 className="font-display text-xl font-bold">{s.title}</h3>
                </div>
                <p className="text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Para quem indicar */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <SectionTitle kicker="Cliente não falta" title="Para quem indicar" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {NICHES.map((n) => (
            <div key={n.label} className="relative overflow-hidden rounded-2xl shadow-sm">
              <img src={n.img} alt={n.label} className="aspect-[3/4] w-full object-cover" loading="lazy" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10 text-sm font-semibold text-white md:text-base">
                {n.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {MORE.map((m) => (
            <span key={m} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium">{m}</span>
          ))}
        </div>
        <p className="mt-4 text-center font-semibold">Se agenda horário ou vende, pode usar o Mostralo.</p>
      </section>

      {/* Duas formas */}
      <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
        <SectionTitle kicker="Quanto você ganha" title="Escolha como participar" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Só com CPF</p>
            <h3 className="mt-1 font-display text-2xl font-bold">Afiliado</h3>
            <p className="mt-3 font-display text-5xl font-extrabold text-primary">5 a 7%</p>
            <p className="text-muted-foreground">de cada mensalidade paga</p>
            <ul className="mt-5 space-y-2">
              {["Cadastro rápido", "Recebe por Pix", "Até R$ 1.900 por mês"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{t}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant="outline" size="lg" asChild>
              <Link to={AFFILIATE}>Entrar como afiliado</Link>
            </Button>
          </div>
          <div className="relative rounded-3xl border-2 border-primary bg-card p-6 shadow-lg md:p-8">
            <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">Ganha mais</span>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Com MEI ou CNPJ</p>
            <h3 className="mt-1 font-display text-2xl font-bold">Parceiro</h3>
            <p className="mt-3 font-display text-5xl font-extrabold text-primary">10%</p>
            <p className="text-muted-foreground">de cada mensalidade paga</p>
            <ul className="mt-5 space-y-2">
              {["Sem limite de ganhos", "Contrato de parceria", "Recebe por Pix com nota fiscal"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{t}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full" size="lg" asChild>
              <Link to={PARTNER}>Entrar como parceiro</Link>
            </Button>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
          Não tem MEI?{" "}
          <a className="font-semibold text-primary underline-offset-4 hover:underline" href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener noreferrer">
            Abra de graça no gov.br
          </a>
          . Para parceiro, o CNPJ precisa ter atividade de vendas ou publicidade; a gente confere com você.
        </p>
      </section>

      {/* O que você recebe */}
      <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="rounded-3xl bg-primary/10 p-6 text-center md:p-8">
          <h2 className="font-display text-2xl font-extrabold md:text-3xl">Você não começa sozinho</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {GIVES.map((g) => (
              <span key={g} className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium shadow-sm">
                <Check className="h-4 w-4 text-primary" />{g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Dúvidas */}
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <SectionTitle title="Dúvidas rápidas" />
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-4">
          {FAQ.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className={i === FAQ.length - 1 ? "border-b-0" : ""}>
              <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Cadastro */}
      <section id="cadastro" className="scroll-mt-20 px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-foreground p-8 text-center text-background md:p-12">
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">Bora começar?</h2>
          <p className="mx-auto mt-3 max-w-md opacity-80">Escolha como quer participar. Seu cadastro é analisado em até 48 horas.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to={AFFILIATE}>Afiliado (CPF)</Link>
            </Button>
            <Button size="lg" asChild>
              <Link to={PARTNER}>Parceiro (MEI ou CNPJ)</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
      </footer>
    </div>
  );
}
