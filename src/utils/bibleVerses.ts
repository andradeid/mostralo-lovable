export interface BibleVerse {
  text: string;
  reference: string;
  book: string;
  category: 'diligencia' | 'preguica' | 'planejamento' | 'perseveranca' | 'fe' | 'prosperidade' | 'comunicacao';
}

export const bibleVerses: BibleVerse[] = [
  // DILIGÊNCIA E TRABALHO (25 versículos)
  {
    text: "A alma dos diligentes se fartará.",
    reference: "Provérbios 13:4",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "A mão dos diligentes dominará, mas os negligentes serão tributários.",
    reference: "Provérbios 12:24",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Viste um homem diligente na sua obra? Perante reis será posto; não permanecerá entre os de posição inferior.",
    reference: "Provérbios 22:29",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "O que lavra a sua terra virá a fartar-se de pão, mas o que segue os ociosos se fartará de pobreza.",
    reference: "Provérbios 28:19",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Vai ter com a formiga, ó preguiçoso; olha para os seus caminhos e sê sábio.",
    reference: "Provérbios 6:6",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "O trabalhador tem direito ao seu sustento.",
    reference: "Provérbios 10:4",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Anda na presença dos sábios e serás sábio; mas o companheiro dos tolos sofrerá.",
    reference: "Provérbios 13:20",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "O pensamento do diligente tende só à abundância, mas o de todo apressado, à pobreza.",
    reference: "Provérbios 21:5",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "O homem diligente alcançará riquezas.",
    reference: "Provérbios 10:4",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados, porque o Senhor, o seu Deus, vai com vocês.",
    reference: "Deuteronômio 31:6",
    book: "Deuteronômio",
    category: "diligencia"
  },
  {
    text: "Tudo quanto te vier à mão para fazer, faze-o conforme as tuas forças.",
    reference: "Eclesiastes 9:10",
    book: "Eclesiastes",
    category: "diligencia"
  },
  {
    text: "O preguiçoso deseja, e nada alcança, mas a alma dos diligentes se fartará.",
    reference: "Provérbios 13:4",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Melhor é o fim das coisas do que o princípio delas; melhor é o paciente de espírito do que o soberbo de espírito.",
    reference: "Eclesiastes 7:8",
    book: "Eclesiastes",
    category: "diligencia"
  },
  {
    text: "Semeai para vós em justiça, colhei segundo a misericórdia.",
    reference: "Oseias 10:12",
    book: "Oseias",
    category: "diligencia"
  },
  {
    text: "O que semeia a iniquidade segará males.",
    reference: "Provérbios 22:8",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Na lavoura há abundância de trigo, mas há quem seja destruído por não ter juízo.",
    reference: "Provérbios 13:23",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "O trabalhador cuidadoso terá fartura.",
    reference: "Provérbios 12:11",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Quem cuida da figueira comerá do seu fruto.",
    reference: "Provérbios 27:18",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Não trabalheis pela comida que perece, mas pela que permanece para a vida eterna.",
    reference: "João 6:27",
    book: "João",
    category: "diligencia"
  },
  {
    text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor.",
    reference: "Colossenses 3:23",
    book: "Colossenses",
    category: "diligencia"
  },
  {
    text: "Aquele que não trabalha, também não coma.",
    reference: "2 Tessalonicenses 3:10",
    book: "2 Tessalonicenses",
    category: "diligencia"
  },
  {
    text: "Trabalhem de boa vontade, como se estivessem servindo ao Senhor.",
    reference: "Efésios 6:7",
    book: "Efésios",
    category: "diligencia"
  },
  {
    text: "Os planos do diligente conduzem à abundância.",
    reference: "Provérbios 21:5",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "O que ajunta no verão é filho prudente, mas o que dorme na sega é filho que causa vergonha.",
    reference: "Provérbios 10:5",
    book: "Provérbios",
    category: "diligencia"
  },
  {
    text: "Em todo trabalho há proveito, mas ficar só em palavras leva à pobreza.",
    reference: "Provérbios 14:23",
    book: "Provérbios",
    category: "diligencia"
  },

  // ADVERTÊNCIAS CONTRA A PREGUIÇA (20 versículos)
  {
    text: "O preguiçoso diz: Um leão está no caminho; um leão está nas ruas.",
    reference: "Provérbios 26:13",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O desejo do preguiçoso o mata, porque as suas mãos recusam trabalhar.",
    reference: "Provérbios 21:25",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "Preguiçoso, até quando ficarás deitado? Quando te levantarás do teu sono?",
    reference: "Provérbios 6:9",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "Um pouco de sono, uma breve soneca, um pequeno descanso de braços cruzados, e a pobreza o surpreenderá.",
    reference: "Provérbios 6:10-11",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "A preguiça faz cair em sono profundo, e a alma indolente padecerá fome.",
    reference: "Provérbios 19:15",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O caminho do preguiçoso é como uma sebe de espinhos.",
    reference: "Provérbios 15:19",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "Como a porta se revolve nos seus gonzos, assim se revolve o preguiçoso na sua cama.",
    reference: "Provérbios 26:14",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O preguiçoso mete a mão no prato, e não tem disposição nem de levá-la à boca.",
    reference: "Provérbios 26:15",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O preguiçoso é mais sábio a seus próprios olhos do que sete homens que respondem com bom senso.",
    reference: "Provérbios 26:16",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "Passei pelo campo do preguiçoso e pela vinha do homem falto de entendimento; e eis que toda estava cheia de cardos.",
    reference: "Provérbios 24:30-31",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O preguiçoso não assará a sua caça, mas o precioso tesouro do homem é ser diligente.",
    reference: "Provérbios 12:27",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "A alma do preguiçoso deseja, e coisa nenhuma alcança.",
    reference: "Provérbios 13:4",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O ocioso na sua obra é irmão do desperdiçador.",
    reference: "Provérbios 18:9",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "Pela muita preguiça se enfraquece o teto, e pela frouxidão das mãos a casa goteja.",
    reference: "Eclesiastes 10:18",
    book: "Eclesiastes",
    category: "preguica"
  },
  {
    text: "Se alguém não quer trabalhar, também não coma.",
    reference: "2 Tessalonicenses 3:10",
    book: "2 Tessalonicenses",
    category: "preguica"
  },
  {
    text: "Não ameis o sono, para que não empobreçais.",
    reference: "Provérbios 20:13",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O que ama o prazer empobrecerá.",
    reference: "Provérbios 21:17",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O preguiçoso esconde a mão no prato; não se dá ao trabalho de levá-la à boca.",
    reference: "Provérbios 19:24",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O que relaxa na sua obra é irmão do que é destruidor.",
    reference: "Provérbios 18:9",
    book: "Provérbios",
    category: "preguica"
  },
  {
    text: "O dorminhoco não lavrará por causa do inverno; mas na sega buscará e nada haverá.",
    reference: "Provérbios 20:4",
    book: "Provérbios",
    category: "preguica"
  },

  // PLANEJAMENTO E SABEDORIA (15 versículos)
  {
    text: "Os planos bem elaborados levam à fartura; mas o apressado sempre acaba na miséria.",
    reference: "Provérbios 21:5",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Entregue ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.",
    reference: "Provérbios 16:3",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Muitos são os planos no coração do homem, mas o que prevalece é o propósito do Senhor.",
    reference: "Provérbios 19:21",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "O sábio de coração recebe os mandamentos.",
    reference: "Provérbios 10:8",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "O princípio da sabedoria é: Adquire a sabedoria; sim, com tudo o que possuis adquire o entendimento.",
    reference: "Provérbios 4:7",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Sem conselho, os planos se dispersam, mas havendo muitos conselheiros eles se firmam.",
    reference: "Provérbios 15:22",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.",
    reference: "Provérbios 3:5",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.",
    reference: "Provérbios 16:9",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Com sabedoria se edifica a casa, e com inteligência ela se firma.",
    reference: "Provérbios 24:3",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Porque qual é o homem que, querendo edificar uma torre, não se assenta primeiro a fazer as contas dos gastos?",
    reference: "Lucas 14:28",
    book: "Lucas",
    category: "planejamento"
  },
  {
    text: "A sabedoria é a coisa principal; adquire, pois, a sabedoria.",
    reference: "Provérbios 4:7",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Conselhos na presença de muitos conselheiros.",
    reference: "Provérbios 11:14",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Mas os planos do diligente tendem à fartura.",
    reference: "Provérbios 21:5",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Pela sabedoria se edifica a casa, e pela inteligência ela se firma.",
    reference: "Provérbios 24:3",
    book: "Provérbios",
    category: "planejamento"
  },
  {
    text: "Procure saber o estado das suas ovelhas, cuide bem dos seus rebanhos.",
    reference: "Provérbios 27:23",
    book: "Provérbios",
    category: "planejamento"
  },

  // PERSEVERANÇA E RESILIÊNCIA (15 versículos)
  {
    text: "E não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desanimarmos.",
    reference: "Gálatas 6:9",
    book: "Gálatas",
    category: "perseveranca"
  },
  {
    text: "Portanto, meus amados irmãos, sede firmes, inabaláveis e sempre abundantes na obra do Senhor.",
    reference: "1 Coríntios 15:58",
    book: "1 Coríntios",
    category: "perseveranca"
  },
  {
    text: "O justo cairá sete vezes, mas se levantará.",
    reference: "Provérbios 24:16",
    book: "Provérbios",
    category: "perseveranca"
  },
  {
    text: "Posso todas as coisas naquele que me fortalece.",
    reference: "Filipenses 4:13",
    book: "Filipenses",
    category: "perseveranca"
  },
  {
    text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.",
    reference: "Isaías 41:10",
    book: "Isaías",
    category: "perseveranca"
  },
  {
    text: "Pois o Senhor teu Deus estará contigo por onde quer que andares.",
    reference: "Josué 1:9",
    book: "Josué",
    category: "perseveranca"
  },
  {
    text: "A esperança que se adia faz o coração adoecer, mas o desejo cumprido é árvore de vida.",
    reference: "Provérbios 13:12",
    book: "Provérbios",
    category: "perseveranca"
  },
  {
    text: "Tudo tem o seu tempo determinado, e há tempo para todo propósito debaixo do céu.",
    reference: "Eclesiastes 3:1",
    book: "Eclesiastes",
    category: "perseveranca"
  },
  {
    text: "Não deixe que a sua boca o leve ao pecado, nem desanime diante das dificuldades.",
    reference: "Eclesiastes 5:6",
    book: "Eclesiastes",
    category: "perseveranca"
  },
  {
    text: "Porque sete vezes cairá o justo, e se levantará; mas os ímpios tropeçarão no mal.",
    reference: "Provérbios 24:16",
    book: "Provérbios",
    category: "perseveranca"
  },
  {
    text: "Os que semeiam em lágrimas colherão com alegria.",
    reference: "Salmos 126:5",
    book: "Salmos",
    category: "perseveranca"
  },
  {
    text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz.",
    reference: "Jeremias 29:11",
    book: "Jeremias",
    category: "perseveranca"
  },
  {
    text: "Ainda que a figueira não floresça, eu me alegrarei no Senhor.",
    reference: "Habacuque 3:17-18",
    book: "Habacuque",
    category: "perseveranca"
  },
  {
    text: "Combati o bom combate, acabei a carreira, guardei a fé.",
    reference: "2 Timóteo 4:7",
    book: "2 Timóteo",
    category: "perseveranca"
  },
  {
    text: "Portanto, não lanceis fora a vossa confiança, que tem grande recompensa.",
    reference: "Hebreus 10:35",
    book: "Hebreus",
    category: "perseveranca"
  },

  // FÉ E CONFIANÇA EM DEUS (15 versículos)
  {
    text: "Confia no Senhor de todo o teu coração.",
    reference: "Provérbios 3:5",
    book: "Provérbios",
    category: "fe"
  },
  {
    text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.",
    reference: "Salmos 37:5",
    book: "Salmos",
    category: "fe"
  },
  {
    text: "O Senhor é o meu pastor; nada me faltará.",
    reference: "Salmos 23:1",
    book: "Salmos",
    category: "fe"
  },
  {
    text: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    book: "Filipenses",
    category: "fe"
  },
  {
    text: "Buscai primeiro o reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.",
    reference: "Mateus 6:33",
    book: "Mateus",
    category: "fe"
  },
  {
    text: "Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
    reference: "Provérbios 3:6",
    book: "Provérbios",
    category: "fe"
  },
  {
    text: "A bênção do Senhor enriquece, e não acrescenta dores.",
    reference: "Provérbios 10:22",
    book: "Provérbios",
    category: "fe"
  },
  {
    text: "Bem-aventurado o homem que teme ao Senhor e que muito se deleita nos seus mandamentos.",
    reference: "Salmos 112:1",
    book: "Salmos",
    category: "fe"
  },
  {
    text: "Confiai no Senhor perpetuamente; porque o Senhor Deus é uma rocha eterna.",
    reference: "Isaías 26:4",
    book: "Isaías",
    category: "fe"
  },
  {
    text: "O Senhor é bom, fortaleza no dia da angústia, e conhece os que nele confiam.",
    reference: "Naum 1:7",
    book: "Naum",
    category: "fe"
  },
  {
    text: "Aquietai-vos e sabei que eu sou Deus.",
    reference: "Salmos 46:10",
    book: "Salmos",
    category: "fe"
  },
  {
    text: "Porque pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus.",
    reference: "Efésios 2:8",
    book: "Efésios",
    category: "fe"
  },
  {
    text: "Ora, a fé é a certeza das coisas que se esperam, a convicção de fatos que se não veem.",
    reference: "Hebreus 11:1",
    book: "Hebreus",
    category: "fe"
  },
  {
    text: "E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus.",
    reference: "Romanos 8:28",
    book: "Romanos",
    category: "fe"
  },
  {
    text: "Lança o teu pão sobre as águas, porque, depois de muitos dias, o acharás.",
    reference: "Eclesiastes 11:1",
    book: "Eclesiastes",
    category: "fe"
  },

  // PROSPERIDADE E RECOMPENSA (10 versículos)
  {
    text: "Honra ao Senhor com os teus bens e com as primícias de toda a tua renda; assim, se encherão fartamente os teus celeiros.",
    reference: "Provérbios 3:9-10",
    book: "Provérbios",
    category: "prosperidade"
  },
  {
    text: "Trazei todos os dízimos à casa do tesouro, e provai-me nisto, diz o Senhor dos Exércitos.",
    reference: "Malaquias 3:10",
    book: "Malaquias",
    category: "prosperidade"
  },
  {
    text: "Bem-aventurado o homem que teme ao Senhor. A riqueza e a prosperidade estarão na sua casa.",
    reference: "Salmos 112:1-3",
    book: "Salmos",
    category: "prosperidade"
  },
  {
    text: "O bom deixa uma herança aos filhos de seus filhos, mas a riqueza do pecador é depositada para o justo.",
    reference: "Provérbios 13:22",
    book: "Provérbios",
    category: "prosperidade"
  },
  {
    text: "Quem dá ao pobre empresta ao Senhor, e este lhe pagará o seu benefício.",
    reference: "Provérbios 19:17",
    book: "Provérbios",
    category: "prosperidade"
  },
  {
    text: "Dai, e ser-vos-á dado; boa medida, recalcada, sacudida e transbordando vos deitarão no vosso regaço.",
    reference: "Lucas 6:38",
    book: "Lucas",
    category: "prosperidade"
  },
  {
    text: "A alma generosa prosperará, e quem dá alívio aos outros, alívio receberá.",
    reference: "Provérbios 11:25",
    book: "Provérbios",
    category: "prosperidade"
  },
  {
    text: "Algumas pessoas dão generosamente, mas acabam com mais ainda; outras não dão o que devem e empobrecem.",
    reference: "Provérbios 11:24",
    book: "Provérbios",
    category: "prosperidade"
  },
  {
    text: "Riqueza e honra estão comigo, assim como prosperidade duradoura e justiça.",
    reference: "Provérbios 8:18",
    book: "Provérbios",
    category: "prosperidade"
  },
  {
    text: "O salário do justo conduz para a vida.",
    reference: "Provérbios 10:16",
    book: "Provérbios",
    category: "prosperidade"
  },

  // PALAVRAS E COMUNICAÇÃO (10 versículos)
  {
    text: "A resposta branda desvia o furor, mas a palavra dura suscita a ira.",
    reference: "Provérbios 15:1",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "A morte e a vida estão no poder da língua; o que bem a utiliza come do seu fruto.",
    reference: "Provérbios 18:21",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "O homem se alegra em dar uma resposta adequada, e como é boa uma palavra dita na hora certa!",
    reference: "Provérbios 15:23",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "A palavra dita a seu tempo quão boa é!",
    reference: "Provérbios 15:23",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "O favo de mel são as palavras suaves: doces para a alma e medicina para o corpo.",
    reference: "Provérbios 16:24",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "A língua dos sábios adorna a sabedoria, mas a boca dos tolos derrama a estultícia.",
    reference: "Provérbios 15:2",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "Quem guarda a boca e a língua, guarda a sua alma das angústias.",
    reference: "Provérbios 21:23",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "Seja a vossa palavra sempre agradável, temperada com sal, para que saibais como responder a cada um.",
    reference: "Colossenses 4:6",
    book: "Colossenses",
    category: "comunicacao"
  },
  {
    text: "A língua branda quebranta os ossos.",
    reference: "Provérbios 25:15",
    book: "Provérbios",
    category: "comunicacao"
  },
  {
    text: "O coração do justo medita no que há de responder, mas a boca dos ímpios derrama coisas más.",
    reference: "Provérbios 15:28",
    book: "Provérbios",
    category: "comunicacao"
  }
];

// Função helper para buscar versículos por categoria
export const getVersesByCategory = (category: BibleVerse['category']): BibleVerse[] => {
  return bibleVerses.filter(verse => verse.category === category);
};

// Função para pegar um versículo aleatório de uma categoria
export const getRandomVerse = (category?: BibleVerse['category']): BibleVerse => {
  const verses = category ? getVersesByCategory(category) : bibleVerses;
  const randomIndex = Math.floor(Math.random() * verses.length);
  return verses[randomIndex];
};

// Função para pegar versículo contextual baseado em horário e progresso
export const getContextualVerse = (hour: number, progressPercentage: number): BibleVerse => {
  // Manhã (5h-11h): Diligência
  if (hour >= 5 && hour < 12) {
    return getRandomVerse('diligencia');
  }
  
  // Tarde (12h-17h): Perseverança ou Preguiça (dependendo do progresso)
  if (hour >= 12 && hour < 18) {
    if (progressPercentage < 30) {
      return getRandomVerse('preguica'); // Cobrança
    }
    return getRandomVerse('perseveranca');
  }
  
  // Noite (18h-23h): Fé e Prosperidade
  if (hour >= 18 && hour < 24) {
    if (progressPercentage >= 80) {
      return getRandomVerse('prosperidade'); // Celebração
    }
    return getRandomVerse('fe');
  }
  
  // Madrugada (0h-4h): Planejamento (preparação para o dia)
  return getRandomVerse('planejamento');
};
