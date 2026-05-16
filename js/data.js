/* AgroCommerce — Camada de Dados B2C (v2)
   Modelo: marketplace multi-loja (produtor compra de fornecedores verificados)
*/
'use strict';

/* ── Chaves do localStorage ───────────────────────────────── */
const DATA_VERSION = '2.1';
const STORE = {
  INIT:            'agroB2C_init',
  USERS:           'agroB2C_v1_users',
  STORES:          'agroB2C_v1_stores',
  PRODUCTS:        'agroB2C_v1_products',
  ORDERS:          'agroB2C_v1_orders',
  REVIEWS:         'agroB2C_v1_reviews',
  CART:            'agroB2C_v1_cart',
  SESSION:         'agroB2C_v1_session',
  FAVS:            'agroB2C_v1_favs',
  ANALYTICS_PREFS: 'agro_analytics_prefs_v1',
};

/* ── Seed Data ────────────────────────────────────────────── */
const SEED = {

  users: [
    { id:0, name:'Administrador', type:'admin', email:'admin@agrocommerce.com.br', phone:'', cpfCnpj:'', verified:true, storeId:null, address:'', city:'Lucas do Rio Verde', state:'MT', rating:5.0, totalReviews:0, bio:'Conta administrativa da plataforma.', createdAt:'2026-01-01', initials:'AD', color:'#37474F' },
    { id:1, name:'José Rodrigues', type:'comprador', email:'jose.rodrigues@email.com', phone:'(65) 99812-3344', cpfCnpj:'123.456.789-00', verified:true, storeId:null, address:'Fazenda Boa Vista, km 38, Rod. MT-242', city:'Lucas do Rio Verde', state:'MT', rating:4.8, totalReviews:12, bio:'Produtor rural há 15 anos. Crio gado nelore e cultivo soja na região de Lucas do Rio Verde, MT.', createdAt:'2026-02-15', initials:'JR', color:'#2E7D32' },
    { id:2, name:'Maria Aparecida Santos', type:'comprador', email:'maria.santos@email.com', phone:'(66) 99724-5566', cpfCnpj:'987.654.321-00', verified:true, storeId:null, address:'Sítio Esperança Verde, zona rural', city:'Sorriso', state:'MT', rating:4.9, totalReviews:8, bio:'Pequena produtora de hortifrutigranjeiros e criadora de aves caipiras em Sorriso, MT.', createdAt:'2026-03-01', initials:'MA', color:'#9C27B0' },
    { id:3, name:'Carlos Eduardo Lima', type:'lojista', email:'carlos@racaoverde.com.br', phone:'(65) 3614-2200', cpfCnpj:'12.345.678/0001-90', verified:true, storeId:1, address:'Av. Mato Grosso, 1250', city:'Lucas do Rio Verde', state:'MT', rating:4.9, totalReviews:48, bio:'Fundador da RaçãoVerde. 12 anos de experiência em nutrição animal no agronegócio mato-grossense.', createdAt:'2026-01-10', initials:'RV', color:'#4CAF50' },
    { id:4, name:'AgroInsumos MT LTDA', type:'lojista', email:'vendas@agroinsumos.com.br', phone:'(65) 3519-8800', cpfCnpj:'98.765.432/0001-11', verified:true, storeId:2, address:'Rod. BR-163, km 812', city:'Lucas do Rio Verde', state:'MT', rating:4.7, totalReviews:35, bio:'Distribuidor autorizado de fertilizantes e corretivos. Parceria com as maiores fabricantes nacionais.', createdAt:'2026-01-20', initials:'AI', color:'#1565C0' },
    { id:5, name:'DefenAgro Distribuidora', type:'lojista', email:'defensivos@defenagro.com.br', phone:'(65) 3612-9900', cpfCnpj:'45.678.901/0001-22', verified:true, storeId:3, address:'Av. das Indústrias, 350', city:'Sorriso', state:'MT', rating:4.6, totalReviews:29, bio:'Distribuidora homologada de defensivos agrícolas. Todos os produtos com NF e receituário agronômico.', createdAt:'2026-02-01', initials:'DA', color:'#E65100' },
    { id:6, name:'VetPrime Saúde Animal', type:'lojista', email:'vet@vetprime.com.br', phone:'(65) 3711-5500', cpfCnpj:'67.890.123/0001-33', verified:true, storeId:4, address:'Rua do Comércio, 85', city:'Sinop', state:'MT', rating:4.8, totalReviews:21, bio:'Especialistas em saúde animal. Medicamentos veterinários, vitaminas e suplementos para rebanhos bovinos.', createdAt:'2026-02-10', initials:'VP', color:'#C62828' },
    { id:7, name:'Sementes CampoMT', type:'lojista', email:'sementes@campomt.com.br', phone:'(66) 3420-7700', cpfCnpj:'89.012.345/0001-44', verified:true, storeId:5, address:'Rod. MT-208, km 22', city:'Sorriso', state:'MT', rating:4.9, totalReviews:31, bio:'Sementes certificadas para o Cerrado. Soja, milho e pastagens de alta performance adaptadas à região.', createdAt:'2026-01-15', initials:'SC', color:'#00695C' },
    { id:8, name:'AgroCentro Insumos', type:'lojista', email:'contato@agrocentro.com.br', phone:'(65) 3512-4400', cpfCnpj:'11.222.333/0001-55', verified:true, storeId:6, address:'Av. das Flores, 890', city:'Lucas do Rio Verde', state:'MT', rating:4.6, totalReviews:19, bio:'Revenda de sementes certificadas e insumos para safra. Soja, milho e pastagens com atendimento técnico.', createdAt:'2026-02-18', initials:'AC', color:'#558B2F' },
    { id:9, name:'FertiAgro MT Distribuidora', type:'lojista', email:'vendas@fertiagromt.com.br', phone:'(65) 3411-6600', cpfCnpj:'22.333.444/0001-66', verified:true, storeId:7, address:'Rod. BR-163, km 798', city:'Lucas do Rio Verde', state:'MT', rating:4.5, totalReviews:23, bio:'Distribuidor de fertilizantes e defensivos com preços de atacado. Frota própria para entrega na lavoura.', createdAt:'2026-02-25', initials:'FM', color:'#0277BD' },
    { id:10, name:'NutriCampo Pecuária', type:'lojista', email:'nutricampo@nutrimt.com.br', phone:'(66) 3524-8800', cpfCnpj:'33.444.555/0001-77', verified:true, storeId:8, address:'Rua Pioneiros, 415', city:'Sorriso', state:'MT', rating:4.7, totalReviews:27, bio:'Nutrição animal e saúde do rebanho. Rações de alta performance e medicamentos veterinários com NF.', createdAt:'2026-03-05', initials:'NC', color:'#6A1B9A' },
  ],

  stores: [
    { id:1, ownerId:3, name:'RaçãoVerde', segmento:'racao', description:'Especialistas em nutrição animal. Linha completa de rações para bovinos, suínos, aves e peixes das melhores marcas do mercado. Entrega em toda a região de Lucas do Rio Verde.', rating:4.9, totalReviews:48, verified:true, createdAt:'2026-01-10' },
    { id:2, ownerId:4, name:'AgroInsumos MT', segmento:'adubo', description:'Distribuidor autorizado de fertilizantes, adubos e corretivos de solo. Entrega para toda a região de Lucas do Rio Verde e municípios vizinhos com frota própria.', rating:4.7, totalReviews:35, verified:true, createdAt:'2026-01-20' },
    { id:3, ownerId:5, name:'DefenAgro', segmento:'defensivo', description:'Defensivos agrícolas regularizados com nota fiscal. Herbicidas, inseticidas e fungicidas das principais marcas. Atendimento técnico incluso para aplicação segura.', rating:4.6, totalReviews:29, verified:true, createdAt:'2026-02-01' },
    { id:4, ownerId:6, name:'VetPrime', segmento:'medicamento', description:'Saúde animal com qualidade e confiança. Medicamentos veterinários de venda livre, vitaminas e suplementos para seu rebanho. Registro no MAPA em todos os produtos.', rating:4.8, totalReviews:21, verified:true, createdAt:'2026-02-10' },
    { id:5, ownerId:7, name:'Sementes CampoMT', segmento:'sementes', description:'Sementes certificadas para a próxima safra. Variedades de soja, milho e pastagem selecionadas para o Cerrado mato-grossense. Germinação garantida acima de 90%.', rating:4.9, totalReviews:31, verified:true, createdAt:'2026-01-15' },
    { id:6, ownerId:8, name:'AgroCentro Insumos', segmento:'sementes', description:'Sementes certificadas com laudo de germinação e suporte técnico incluso. Cultivares de soja, milho híbrido e pastagens para o Cerrado. Entrega em Lucas do Rio Verde e região.', rating:4.6, totalReviews:19, verified:true, createdAt:'2026-02-18' },
    { id:7, ownerId:9, name:'FertiAgro MT', segmento:'adubo', description:'Fertilizantes e defensivos com preço de atacado para produtores rurais. Entrega com frota própria direto na lavoura. Parceiro de grandes distribuidores nacionais.', rating:4.5, totalReviews:23, verified:true, createdAt:'2026-02-25' },
    { id:8, ownerId:10, name:'NutriCampo', segmento:'racao', description:'Rações de alto desempenho e medicamentos veterinários para bovinos, aves e suínos. Produtos com registro MAPA e nota fiscal em todos os pedidos. Atendimento em Sorriso e arredores.', rating:4.7, totalReviews:27, verified:true, createdAt:'2026-03-05' },
  ],

  products: [
    /* ─── RaçãoVerde (storeId: 1) ─────────────────────────── */
    {
      id:1, storeId:1, category:'racao', featured:true,
      title:'Ração Bovinos Confinamento 30% PB',
      description:'Ração concentrada com 30% de Proteína Bruta para bovinos em confinamento. Formulação balanceada com minerais, vitaminas e aminoácidos essenciais para máximo ganho de peso. Aprovada pelo MAPA.\n\nAnálise Garantida:\n• PB mínimo: 30%\n• EE mínimo: 4%\n• MM máximo: 14%\n• Umidade máxima: 13%\n\nIdeal para bovinos em fase de terminação. Indique ao médico veterinário para programa de confinamento.',
      price:189.90, unit:'saco 40kg', stock:450,
      images:['itens/racao-bovino-30pb.png','https://placehold.co/700x500/e8f5e9/2E7D32?text=Análise+Nutricional','https://placehold.co/700x500/e8f5e9/2E7D32?text=Embalagem+40kg'],
      rating:4.9, totalReviews:18, active:true, createdAt:'2026-02-01'
    },
    {
      id:2, storeId:1, category:'racao', featured:false,
      title:'Ração Frango de Corte Inicial 22% PB',
      description:'Ração completa para frangos de corte na fase inicial, fornecida entre o 7º e o 21º dia de vida — período que determina o peso final da ave no abate. Formulação com 22% de Proteína Bruta (PB), coccidiostático preventivo e aminoácidos essenciais (Metionina e Lisina).\n\nComposição Base: Milho + farelo de soja + núcleos minerais e vitamínicos (A, D₃, E, complexo B, Zinco, Selênio).\nForma física: Triturada ou farelada para fácil ingestão por aves jovens.\nConsumo estimado: 1,0 a 1,5 kg por ave durante a fase inicial.\n\nAnálise Garantida:\n• PB mínimo: 22%\n• EM: 3.000 kcal/kg\n• Ca: 0,9% • P disponível: 0,45%\n\nDisponível em embalagens de 20 kg e 40 kg.',
      price:125.50, unit:'saco 40kg', stock:280,
      images:['itens/racao-frango.png','https://placehold.co/700x500/e8f5e9/2E7D32?text=Tabela+Nutricional'],
      rating:4.7, totalReviews:12, active:true, createdAt:'2026-02-10'
    },
    {
      id:3, storeId:1, category:'racao', featured:false,
      title:'Sal Mineral Completo para Bovinos',
      description:'Suplemento mineral e proteico para bovinos de corte em fase de terminação. Corrige deficiências das pastagens, melhora a conversão alimentar e antecipa o abate com melhor acabamento de carcaça — valorizando o preço da arroba.\n\nDiferenciais: Minerais quelatados (maior absorção), ureia de liberação lenta (mais segurança) e aditivos de performance.\nConsumo estimado: 100 a 150 g/animal/dia.\nEspaçamento de cocho recomendado: 5 a 7 cm por animal.\n\nAnálise Garantida:\n• Ca: 17% • P: 8% • Na: 11%\n• Zn: 4.000 mg/kg • Cu: 600 mg/kg\n• Vitaminas A, D₃ e E incluídas',
      price:89.90, unit:'saco 30kg', stock:200,
      images:['itens/sal-mineral.png','https://placehold.co/700x500/e8f5e9/2E7D32?text=Análise+Mineral+Completa'],
      rating:4.8, totalReviews:9, active:true, createdAt:'2026-03-01'
    },
    /* ─── AgroInsumos MT (storeId: 2) ─────────────────────── */
    {
      id:4, storeId:2, category:'adubo', featured:true,
      title:'Fertilizante NPK 10-10-10',
      description:'Fertilizante granulado com formulação equilibrada NPK 10-10-10. Ideal para adubação de manutenção em pastagens, horticultura e culturas anuais.\n\nGarantias:\n• N total: 10%\n• P₂O₅ solúvel em CNA+H₂O: 10%\n• K₂O total: 10%\n\nAplicação: broadcast ou em sulco de plantio conforme análise de solo. Embalagem de 50 kg com palletização.',
      price:165.00, unit:'saco 50kg', stock:380,
      images:['itens/npk-10-10-10.jpeg','https://placehold.co/700x500/e3f0ff/1565C0?text=NPK+10-10-10+Análise','https://placehold.co/700x500/e3f0ff/1565C0?text=Granulometria+Uniforme'],
      rating:4.7, totalReviews:15, active:true, createdAt:'2026-01-25'
    },
    {
      id:5, storeId:2, category:'adubo', featured:false,
      title:'Ureia 45% Nitrogênio Granulada',
      description:'Fertilizante sólido com a maior concentração de nitrogênio disponível no mercado (45% N). Estimula o desenvolvimento de folhas, caules e raízes em culturas exigentes como milho, cana-de-açúcar e pastagens.\n\nUso em Pecuária: Atua como fonte de Nitrogênio Não Proteico (NNP) para ruminantes — bactérias do rúmen convertem a ureia em proteína microbiana, essencial para manter o ganho de peso na época seca.\n\nCuidados de Aplicação:\n• Aplicar com solo úmido para evitar volatilização (pode perder até 30% de N em solo seco).\n• Para bovinos: usar exclusivamente Ureia Pecuária. Dose máxima: 40g / 100kg PV / dia. Período de adaptação obrigatório.\n\nGarantias:\n• N total: 45% • N-Amídico: 45% • Umidade máx.: 1%',
      price:198.00, unit:'saco 50kg', stock:220,
      images:['itens/ureia.jpg','https://placehold.co/700x500/e3f0ff/1565C0?text=Granulação+Uniforme'],
      rating:4.6, totalReviews:8, active:true, createdAt:'2026-02-05'
    },
    {
      id:6, storeId:2, category:'adubo', featured:false,
      title:'Superfosfato Simples 18% P₂O₅',
      description:'Um dos fertilizantes mais tradicionais para a fase de plantio. Fornece simultaneamente Fósforo, Cálcio e Enxofre — três nutrientes essenciais que o Super Triplo não entrega juntos.\n\nPor que usar no Cerrado: O enxofre (12%) é frequentemente deficiente nos solos da região e não precisa ser comprado separado. O fósforo (18%) deve ser colocado no sulco, abaixo ou ao lado da semente, para raízes alcançarem desde a germinação — sem contato direto para não queimá-la.\n\nIndicações: Milho, soja, feijão, hortaliças, frutíferas e reforma de pastagens.\nForma física: Granulado — compatível com plantadeiras e distribuidoras.\n\nGarantias:\n• P₂O₅ solúvel em CNA+H₂O: 18% • Ca: 18% a 20% • S: 10% a 12%',
      price:142.00, unit:'saco 50kg', stock:160,
      images:['itens/superfosfato.webp','https://placehold.co/700x500/e3f0ff/1565C0?text=Análise+Garantida'],
      rating:4.8, totalReviews:6, active:true, createdAt:'2026-02-20'
    },
    /* ─── DefenAgro (storeId: 3) ──────────────────────────── */
    {
      id:7, storeId:3, category:'defensivo', featured:false,
      title:'Herbicida Glifosato 480g/L',
      description:'Herbicida sistêmico não seletivo para controle total de plantas daninhas de folha larga e estreita. Absorvido pelas folhas e translocado até as raízes — elimina a planta por completo, não apenas a parte aérea.\n\nConcentração: 480 g/L de Glifosato (equivalente ácido: 356 g/L).\nUso pós-emergente: Aplicar com as plantas daninhas em crescimento ativo.\nVersatilidade: Dessecação pré-plantio em soja, milho e algodão; limpeza de bordas e áreas improdutivas.\n\nIA: Sal isopropilamina de glifosato 480 g/L\nModo de ação: Inibição da enzima EPSPS\nDPI: 7 dias | Registro MAPA\nNota Fiscal emitida. Receituário agronômico obrigatório.',
      price:145.00, unit:'galão 20L', stock:120,
      images:['itens/glifosato.jpg','https://placehold.co/700x500/fff3e0/E65100?text=Registro+MAPA+N.F.'],
      rating:4.6, totalReviews:11, active:true, createdAt:'2026-02-08'
    },
    {
      id:8, storeId:3, category:'defensivo', featured:false,
      title:'Inseticida Clorantraniliprole 200g/L',
      description:'Inseticida de alta performance do grupo das diamidas antranílicas — padrão ouro no mercado para controle de lagartas de difícil manejo. A lagarta para de se alimentar em minutos após o contato com a folha tratada.\n\nPragas-alvo:\n• Lagarta-do-cartucho (Spodoptera frugiperda) em milho\n• Falsa-medideira e Lagarta-da-maçã em soja e algodão\n• Traça-das-crucíferas em hortaliças\n\nVantagens:\n• Altamente seletivo a inimigos naturais — ideal para Manejo Integrado de Pragas (MIP)\n• Longo efeito residual, reduzindo o número de aplicações\n• Baixa toxicidade para o aplicador\n\nIA: Clorantraniliprole 200 g/L | Grupo IRAC: 28\nCarência: 21 dias | DPI: 12 horas\nReceituário agronômico obrigatório.',
      price:320.00, unit:'frasco 200mL', stock:85,
      images:['itens/clorantraniliprole.png','https://placehold.co/700x500/fff3e0/E65100?text=Controle+de+Lagartas'],
      rating:4.7, totalReviews:7, active:true, createdAt:'2026-02-15'
    },
    {
      id:9, storeId:3, category:'defensivo', featured:false,
      title:'Fungicida Tebuconazol 200g/L',
      description:'Fungicida sistêmico do grupo dos triazóis, com ação preventiva e curativa — interrompe o desenvolvimento do fungo já instalado na planta. Versátil e eficaz em culturas de grande escala e hortifrúti.\n\nPrincipais alvos:\n• Soja: Ferrugem-asiática e Mancha-parda\n• Milho: Ferrugem-polissora e Mancha-de-Phacosphaeria\n• Trigo: Ferrugem-da-folha e Giberela\n• Frutas: Oídio em uva, manchas em tomate e batata\n\nEmbalagem de 20 L: Ideal para grandes áreas. Reduz o custo por hectare aplicado. Formulação de boa estabilidade e fácil mistura em tanque.\n\nIA: Tebuconazol 200 g/L | Grupo FRAC: G1\nCarência: 30 dias (soja) | Toxicidade: Classe III\nVolume de calda: 100 a 150 L/ha | Registro MAPA.',
      price:185.00, unit:'frasco 1L', stock:95,
      images:['itens/tebuconazol.jpg','https://placehold.co/700x500/fff3e0/E65100?text=Ferrugem+Asiática'],
      rating:4.5, totalReviews:5, active:true, createdAt:'2026-03-01'
    },
    /* ─── VetPrime (storeId: 4) ───────────────────────────── */
    {
      id:10, storeId:4, category:'medicamento', featured:true,
      title:'Ivermectina 1% Injetável Bovinos',
      description:'Endectocida injetável de amplo espectro (Ourofino Saúde Animal). Controla vermes gastrintestinais, pulmonares e parasitas externos — bernes, carrapatos, piolhos e sarna — com uma única aplicação subcutânea.\n\nAplicação: Via subcutânea na região da tábua do pescoço ou atrás da paleta.\nDosagem: 1 mL para cada 50 kg de peso vivo.\nRendimento: Frasco 500 mL trata até 1.000 kg de peso vivo.\n\nComposição: Ivermectina 10 mg/mL (1%)\nCarência: 49 dias (carne) | 28 dias (leite)\nRegistro MAPA | Nota fiscal em todos os pedidos.',
      price:89.90, unit:'frasco 500mL', stock:200,
      images:['itens/ivermectina.jpeg','https://placehold.co/700x500/fce4ec/c62828?text=Amplo+Espectro+Bovinos'],
      rating:4.8, totalReviews:14, active:true, createdAt:'2026-02-12'
    },
    {
      id:11, storeId:4, category:'medicamento', featured:false,
      title:'Vitamina ADE Injetável Bovinos',
      description:'Complexo vitamínico injetável altamente concentrado (Vit ADE — Calbos). Essencial para prevenir e tratar carências das vitaminas lipossolúveis A, D e E, que afetam crescimento, reprodução e imunidade.\n\nFunção de cada vitamina:\n• Vitamina A: Saúde da visão, pele e mucosas; crescimento.\n• Vitamina D₃: Metabolismo do cálcio e fósforo; previne raquitismo.\n• Vitamina E: Antioxidante potente; melhora fertilidade e resposta imune.\n\nIndicações: Animais em convalescença, crescimento atrasado, retenção de placenta, período da seca (pastagens perdem teor vitamínico).\nEspécies: Bovinos, equinos, ovinos, caprinos e suínos.\n\nComposição/mL: Vit. A: 200.000 UI | Vit. D₃: 40.000 UI | Vit. E: 50 mg\nVia: IM ou SC | Dose bovinos adultos: 5 a 10 mL | Carência: 30 dias.',
      price:67.50, unit:'frasco 500mL', stock:180,
      images:['itens/vitamina-ade.jpg','https://placehold.co/700x500/fce4ec/c62828?text=Vitaminas+A+D3+E'],
      rating:4.9, totalReviews:10, active:true, createdAt:'2026-02-20'
    },
    {
      id:12, storeId:4, category:'medicamento', featured:false,
      title:'Complexo B + C Injetável',
      description:'Antianêmico injetável clássico composto por Ferro Dextrano e Vitamina B12 (Ferron B12 — Calbos). Indispensável na criação de leitões e eficaz na recuperação de bezerros e bovinos debilitados.\n\nPara que serve:\n• Leitões (3º dia de vida): Previne a anemia ferropriva — leitões nascem com baixas reservas de ferro e o leite da porca é pobre nesse mineral. Sem aplicação surgem palidez, fraqueza e alta mortalidade.\n• Bezerros e bovinos: Recuperação após parasitoses intensas (tristeza parasitária, verminoses) ou grandes perdas de sangue.\n\nComposição e ação:\n• Ferro Dextrano: Repõe ferro para formação de hemoglobina (transporte de O₂).\n• Vitamina B12: Estimula formação de células vermelhas, apetite e metabolismo.\n\nVia: Intramuscular profunda\nDose: Leitões 1–2 mL | Bezerros 2–5 mL | Bovinos adultos 5–10 mL',
      price:45.00, unit:'frasco 100mL', stock:240,
      images:['itens/complexo-b.jpg','https://placehold.co/700x500/fce4ec/c62828?text=Vitaminas+do+Grupo+B'],
      rating:4.7, totalReviews:8, active:true, createdAt:'2026-03-05'
    },
    /* ─── Sementes CampoMT (storeId: 5) ───────────────────── */
    {
      id:13, storeId:5, category:'sementes', featured:true,
      title:'Semente Soja TMG 7063 IPRO',
      description:'Cultivar com tecnologia IPRO (resistência a lagartas e percevejos), GMR 6.3, ciclo semiprecoce. Alta adaptação ao Cerrado mato-grossense e excelente potencial produtivo.\n\nCaracterísticas agronômicas:\n• GMR: 6.3 | Ciclo: Semiprecoce (~110 dias)\n• Crescimento: Determinado\n• Resistência IPRO: lagartas e percevejos\n\nTratamento industrial: Fungicida + Inseticida + Inoculante\nGerminação mínima garantida: 90%',
      price:420.00, unit:'saco 50kg', stock:500,
      images:['itens/semente-soja.jpg','https://placehold.co/700x500/e0f2f1/00695C?text=TMG+7063+IPRO','https://placehold.co/700x500/e0f2f1/00695C?text=Certificação+MAPA+RENASEM'],
      rating:4.9, totalReviews:22, active:true, createdAt:'2026-01-20'
    },
    {
      id:14, storeId:5, category:'sementes', featured:false,
      title:'Semente Milho 2B710 PW',
      description:'Híbrido simples de milho da Brevant Sementes (Corteva Agriscience), com foco em estabilidade produtiva e alto potencial para o Cerrado mato-grossense.\n\nTecnologia PowerCore® (PW): Combina proteínas inseticidas Bt para controle de lagarta-do-cartucho (Spodoptera frugiperda) e tolerância aos herbicidas glifosato e glufosinato — reduzindo o custo com inseticidas na lavoura.\n\nCaracterísticas agronômicas:\n• Ciclo: Precoce | Tipo de grão: Semiduro\n• Pop. recomendada: 55.000 a 65.000 plantas/ha\n• Potencial produtivo: acima de 180 sc/ha\n• Excelente qualidade de raiz e sanidade de colmo\n\nEmbalagem: 60.000 sementes/saco\nCertificação MAPA | Germinação garantida.',
      price:380.00, unit:'60.000 sementes', stock:300,
      images:['itens/milho-2b710.jpg','https://placehold.co/700x500/e0f2f1/00695C?text=Híbrido+PowerCore®'],
      rating:4.8, totalReviews:16, active:true, createdAt:'2026-01-25'
    },
    {
      id:15, storeId:5, category:'sementes', featured:false,
      title:'Brachiaria Brizantha MG-5 VC 60%',
      description:'Cultivar MG-5 Vitória (também conhecida como Xaraés ou Toledo) — uma das forrageiras mais produtivas do Cerrado, desenvolvida pela EMBRAPA. Destaca-se pela rápida rebrota e excelente adaptação a solos de média e alta fertilidade.\n\nPor que escolher a MG-5:\n• Produtividade: 10 a 18 toneladas de matéria seca (MS) por hectare/ano.\n• Qualidade: Proteína bruta de 8% a 13% e ótima palatabilidade — superior à cultivar MG-4.\n• Resistência à cigarrinha-das-pastagens (Mahanarva spp.) pelo crescimento cespitoso (touceiras), que expõe mais a base ao sol.\n• Suporta frio e encharcamentos temporários melhor que o capim Marandu.\n\nEspecificações da semente:\n• VC: 60% • Germinação mín.: 50% • Pureza mín.: 80%\nTaxa de semeadura: 8 a 12 kg/ha SPV | Certificado RENASEM.',
      price:145.00, unit:'saco 10kg', stock:420,
      images:['itens/brachiaria.jpg','https://placehold.co/700x500/e0f2f1/00695C?text=Certificado+RENASEM'],
      rating:4.7, totalReviews:11, active:true, createdAt:'2026-02-01'
    },
    /* ─── AgroCentro Insumos (storeId: 6) — concorre com loja 5 ─ */
    {
      id:16, storeId:6, category:'sementes', featured:true,
      title:'Semente Soja P98Y30 RR',
      description:'Cultivar de soja convencional RR (Roundup Ready) com GMR 8.0, excelente adaptação ao Cerrado mato-grossense. Alta produtividade em solos de média e alta fertilidade, com boa tolerância ao acamamento.\n\nCaracterísticas agronômicas:\n• GMR: 8.0 | Ciclo: Médio (~115 dias)\n• Crescimento: Indeterminado\n• Tolerância ao herbicida glifosato\n• Boa resistência à Ferrugem-asiática\n\nTratamento de sementes incluso: Fungicida + Inseticida.\nGerminação mínima garantida: 88%\nCertificação MAPA | RENASEM.',
      price:395.00, unit:'saco 50kg', stock:380,
      images:['itens/semente-soja.jpg','https://placehold.co/700x500/e0f2f1/558B2F?text=P98Y30+RR+Cerrado'],
      rating:4.6, totalReviews:14, active:true, createdAt:'2026-02-20'
    },
    {
      id:17, storeId:6, category:'sementes', featured:false,
      title:'Semente Milho DKB390 PRO3',
      description:'Híbrido simples de milho da Dekalb (Bayer), com tecnologia PRO3 — stack que combina três eventos Bt para controle de lagarta-do-cartucho, lagarta-da-espiga e tolerância a herbicidas glifosato e glufosinato.\n\nDestaques agronômicos:\n• Ciclo: Precoce | Tipo de grão: Semiduro alaranjado\n• Excelente aptidão para silagem e grão\n• Tolerância a doenças foliares e boa estabilidade\n• Pop. recomendada: 55.000 a 62.000 plantas/ha\n• Potencial produtivo: acima de 200 sc/ha em boas condições\n\nEmbalagem: 60.000 sementes/saco\nCertificação MAPA | Germinação garantida acima de 90%.',
      price:410.00, unit:'60.000 sementes', stock:250,
      images:['itens/milho-2b710.jpg','https://placehold.co/700x500/e0f2f1/558B2F?text=DKB390+PRO3'],
      rating:4.5, totalReviews:9, active:true, createdAt:'2026-03-01'
    },
    {
      id:18, storeId:6, category:'sementes', featured:false,
      title:'Brachiaria Marandu VC 55%',
      description:'O capim-marandu (Brachiaria brizantha cv. Marandu) é a forrageira mais cultivada no Brasil — escolha consolidada para pastagens de bovinos de corte e leite no Cerrado.\n\nVantagens:\n• Alta produção de biomassa: 8 a 15 t MS/ha/ano.\n• Boa resistência à seca — mantém valor nutritivo no período seco.\n• Compatível com diferentes sistemas: pastejo contínuo, rotacionado e integração lavoura-pecuária.\n• Menor custo por hectare vs. cultivares mais novas.\n\nEspecificações:\n• VC: 55% • Germinação mín.: 45% • Pureza mín.: 80%\nTaxa de semeadura: 8 a 10 kg/ha SPV\nCertificado RENASEM | Procedência garantida.',
      price:128.00, unit:'saco 10kg', stock:350,
      images:['itens/brachiaria.jpg','https://placehold.co/700x500/e0f2f1/558B2F?text=Marandu+VC+55%25'],
      rating:4.4, totalReviews:8, active:true, createdAt:'2026-03-10'
    },
    /* ─── FertiAgro MT (storeId: 7) — concorre com lojas 2 e 3 ─ */
    {
      id:19, storeId:7, category:'adubo', featured:true,
      title:'Fertilizante NPK 10-10-10',
      description:'Formulação granulada equilibrada NPK 10-10-10 para adubação de manutenção em pastagens, culturas anuais e horticultura. Granulometria uniforme compatível com distribuidoras e plantadeiras.\n\nGarantias:\n• N total: 10% • P₂O₅ solúvel CNA+H₂O: 10% • K₂O total: 10%\n\nVenda direta ao produtor com preço de atacado. Disponível em pallets de 40 sacos. Entrega com frota própria na lavoura.',
      price:158.00, unit:'saco 50kg', stock:500,
      images:['itens/npk-10-10-10.jpeg','https://placehold.co/700x500/e3f0ff/0277BD?text=NPK+10-10-10+Atacado'],
      rating:4.5, totalReviews:17, active:true, createdAt:'2026-02-28'
    },
    {
      id:20, storeId:7, category:'adubo', featured:false,
      title:'Ureia 46% Nitrogênio Granulada',
      description:'Fertilizante nitrogenado de alta concentração (46% N) — levemente superior à ureia padrão 45%, com menor custo por kg de nitrogênio aplicado. Ideal para cobertura em pastagens, milho e cana-de-açúcar.\n\nAplicação: Em cobertura com solo úmido para minimizar a volatilização.\nGranulometria: 2 a 4 mm, livre de pó, ideal para distribuidoras centrífugas.\n\nGarantias:\n• N total: 46% • N-Amídico: 46% • Umidade máx.: 0,5%\nNota fiscal emitida. Disponível em sacos de 50 kg.',
      price:185.00, unit:'saco 50kg', stock:300,
      images:['itens/ureia.jpg','https://placehold.co/700x500/e3f0ff/0277BD?text=Ureia+46%25+N'],
      rating:4.6, totalReviews:11, active:true, createdAt:'2026-03-05'
    },
    {
      id:21, storeId:7, category:'defensivo', featured:false,
      title:'Herbicida Glifosato 480g/L',
      description:'Herbicida sistêmico não seletivo para controle pré e pós-emergente de plantas daninhas em lavouras de soja, milho e algodão RR. Absorção foliar com translocação até as raízes.\n\nConcentração: 480 g/L de Glifosato.\nUso: Dessecação pré-plantio e manejo de áreas improdutivas.\nDPI: 7 dias | Registro MAPA\n\nVenda direta ao produtor com nota fiscal e preço competitivo. Receituário agronômico obrigatório.',
      price:138.50, unit:'galão 20L', stock:180,
      images:['itens/glifosato.jpg','https://placehold.co/700x500/fff3e0/0277BD?text=Glifosato+Preço+Atacado'],
      rating:4.4, totalReviews:13, active:true, createdAt:'2026-03-08'
    },
    /* ─── NutriCampo (storeId: 8) — concorre com lojas 1 e 4 ── */
    {
      id:22, storeId:8, category:'racao', featured:true,
      title:'Ração Bovinos Confinamento 32% PB',
      description:'Ração concentrada premium com 32% de Proteína Bruta — formulação de alto desempenho para bovinos de corte em confinamento intensivo. Minerais quelatados, vitaminas lipossolúveis e aditivos de performance.\n\nAnálise Garantida:\n• PB mínimo: 32% • EE mínimo: 5% • MM máximo: 12% • Umidade máxima: 12%\n\nIndicado para animais na fase de terminação com alvo de peso acima de 550 kg. Maior aporte proteico reduz dias de confinamento e antecipa o abate.\nRegistro MAPA.',
      price:198.00, unit:'saco 40kg', stock:320,
      images:['itens/racao-bovino-30pb.png','https://placehold.co/700x500/e8f5e9/6A1B9A?text=32%25+PB+Confinamento'],
      rating:4.7, totalReviews:16, active:true, createdAt:'2026-03-10'
    },
    {
      id:23, storeId:8, category:'racao', featured:false,
      title:'Ração Aves Postura 17% PB',
      description:'Ração completa para galinhas poedeiras em fase de produção. Formulação balanceada com cálcio reforçado para maior qualidade e espessura da casca do ovo.\n\nComposição: Milho, farelo de soja, calcário, fosfato bicálcico, premix vitamínico e mineral.\nForma física: Farelada ou peletizada.\n\nAnálise Garantida:\n• PB mínimo: 17% • Ca: 3,5% • P disponível: 0,35% • EM: 2.850 kcal/kg\n\nIdeal para criação caipira e granjas de pequeno porte. Disponível em sacos de 20 kg e 40 kg.',
      price:98.00, unit:'saco 40kg', stock:260,
      images:['itens/racao-frango.png','https://placehold.co/700x500/e8f5e9/6A1B9A?text=Postura+17%25+PB'],
      rating:4.6, totalReviews:12, active:true, createdAt:'2026-03-15'
    },
    {
      id:24, storeId:8, category:'medicamento', featured:false,
      title:'Ivermectina 1% Injetável Bovinos',
      description:'Endectocida injetável de amplo espectro para controle de endo e ectoparasitas em bovinos. Elimina vermes gastrintestinais, pulmonares, bernes, carrapatos, piolhos e sarnas com aplicação subcutânea única.\n\nDosagem: 1 mL / 50 kg de peso vivo.\nRendimento: Frasco 500 mL trata até 1.000 kg PV.\n\nComposição: Ivermectina 10 mg/mL (1%)\nCarência: 49 dias (carne) | 28 dias (leite)\nRegistro MAPA | Nota fiscal em todos os pedidos.',
      price:82.50, unit:'frasco 500mL', stock:220,
      images:['itens/ivermectina.jpeg','https://placehold.co/700x500/fce4ec/6A1B9A?text=Ivermectina+1%25'],
      rating:4.6, totalReviews:10, active:true, createdAt:'2026-03-18'
    },
  ],

  orders: [
    {
      id:1, buyerId:1,
      items:[
        { productId:1, storeId:1, storeName:'RaçãoVerde', title:'Ração Bovinos Confinamento 30% PB', price:189.90, quantity:5, unit:'saco 40kg', image:'itens/racao-bovino-30pb.png' },
        { productId:4, storeId:2, storeName:'AgroInsumos MT', title:'Fertilizante NPK 10-10-10', price:165.00, quantity:3, unit:'saco 50kg', image:'itens/npk-10-10-10.jpeg' },
      ],
      totalValue:1444.50,
      deliveryAddress:'Fazenda Boa Vista, km 38, Rod. MT-242, Lucas do Rio Verde – MT, CEP 78455-000',
      paymentMethod:'Boleto Bancário',
      status:'delivered',
      createdAt:'2026-04-10T14:00:00Z',
    },
    {
      id:2, buyerId:1,
      items:[
        { productId:13, storeId:5, storeName:'Sementes CampoMT', title:'Semente Soja TMG 7063 IPRO', price:420.00, quantity:2, unit:'saco 50kg', image:'itens/semente-soja.jpg' },
      ],
      totalValue:840.00,
      deliveryAddress:'Fazenda Boa Vista, km 38, Rod. MT-242, Lucas do Rio Verde – MT, CEP 78455-000',
      paymentMethod:'PIX',
      status:'shipped',
      createdAt:'2026-04-28T09:00:00Z',
    },
    {
      id:3, buyerId:2,
      items:[
        { productId:7, storeId:3, storeName:'DefenAgro', title:'Herbicida Glifosato 480g/L', price:145.00, quantity:4, unit:'galão 20L', image:'itens/glifosato.jpg' },
      ],
      totalValue:580.00,
      deliveryAddress:'Sítio Esperança Verde, zona rural, Sorriso – MT, CEP 78890-000',
      paymentMethod:'Cartão de Crédito',
      status:'confirmed',
      createdAt:'2026-05-02T11:00:00Z',
    },
  ],

  reviews: [
    { id:1, orderId:1, productId:1, reviewerId:1, reviewerName:'José R.', storeId:1, rating:5, comment:'Ração de excelente qualidade! Meu rebanho está com muito mais ganho de peso. Entrega foi rápida e o produto chegou sem avarias.', createdAt:'2026-04-15T09:00:00Z' },
    { id:2, orderId:1, productId:4, reviewerId:1, reviewerName:'José R.', storeId:2, rating:5, comment:'Fertilizante chegou certinho, na data prometida. Boa granulação e produto original com nota fiscal. Voltarei a comprar.', createdAt:'2026-04-15T09:30:00Z' },
    { id:3, orderId:null, productId:13, reviewerId:2, reviewerName:'Maria A.', storeId:5, rating:5, comment:'Sementes com germinação excelente, acima de 90%. Equipe da Sementes CampoMT super atenciosa e produto bem embalado.', createdAt:'2026-03-20T14:00:00Z' },
    { id:4, orderId:null, productId:10, reviewerId:1, reviewerName:'José R.', storeId:4, rating:4, comment:'Ivermectina de qualidade, produto original com nota fiscal e dentro do prazo. Embalagem bem protegida na entrega.', createdAt:'2026-03-10T10:00:00Z' },
    { id:5, orderId:null, productId:7, reviewerId:2, reviewerName:'Maria A.', storeId:3, rating:4, comment:'Produto regularizado, com nota fiscal e receituário. Preço competitivo para a região de Sorriso.', createdAt:'2026-04-01T11:00:00Z' },
  ],
};

/* ── Camada de Armazenamento ──────────────────────────────── */
const Storage = {
  init() {
    var stored = localStorage.getItem(STORE.INIT);
    if (stored === DATA_VERSION) return;
    /* versão diferente ou primeira visita — re-seed de dados de referência */
    localStorage.setItem(STORE.USERS,    JSON.stringify(SEED.users));
    localStorage.setItem(STORE.STORES,   JSON.stringify(SEED.stores));
    localStorage.setItem(STORE.PRODUCTS, JSON.stringify(SEED.products));
    localStorage.setItem(STORE.ORDERS,   JSON.stringify(SEED.orders));
    localStorage.setItem(STORE.REVIEWS,  JSON.stringify(SEED.reviews));
    if (!stored) {
      /* primeira visita — inicializa carrinho e favoritos também */
      localStorage.setItem(STORE.CART,   JSON.stringify([]));
      localStorage.setItem(STORE.FAVS,   JSON.stringify([]));
    }
    localStorage.setItem(STORE.INIT, DATA_VERSION);
  },
  reset() {
    Object.values(STORE).forEach(function (k) { localStorage.removeItem(k); });
    this.init();
  },
  _get(key)        { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  _set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },

  /* ── Users ──────────────────────────────────────────────── */
  getUsers()     { return this._get(STORE.USERS); },
  getUser(id)    { return this.getUsers().find(function (u) { return u.id === id; }) || null; },
  saveUser(user) {
    var users = this.getUsers();
    var idx = users.findIndex(function (u) { return u.id === user.id; });
    if (idx >= 0) users[idx] = user; else users.push(user);
    this._set(STORE.USERS, users);
  },

  /* ── Stores ─────────────────────────────────────────────── */
  getStores()      { return this._get(STORE.STORES); },
  getStore(id)     { return this.getStores().find(function (s) { return s.id === id; }) || null; },
  saveStore(store) {
    var stores = this.getStores();
    var idx = stores.findIndex(function (s) { return s.id === store.id; });
    if (idx >= 0) stores[idx] = store; else stores.push(store);
    this._set(STORE.STORES, stores);
  },

  /* ── Products ───────────────────────────────────────────── */
  getProducts()           { return this._get(STORE.PRODUCTS); },
  getProduct(id)          { return this.getProducts().find(function (p) { return p.id === id; }) || null; },
  getProductsByStore(sid) { return this.getProducts().filter(function (p) { return p.storeId === sid && p.active; }); },
  saveProduct(product)    {
    var items = this.getProducts();
    var idx = items.findIndex(function (p) { return p.id === product.id; });
    if (idx >= 0) items[idx] = product; else items.push(product);
    this._set(STORE.PRODUCTS, items);
  },

  /* ── Cart ───────────────────────────────────────────────── */
  getCart()    { return this._get(STORE.CART); },
  addToCart(item) {
    var cart = this.getCart();
    var existing = cart.find(function (c) { return c.productId === item.productId; });
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    this._set(STORE.CART, cart);
  },
  updateCartItem(productId, quantity) {
    var cart = this.getCart();
    var item = cart.find(function (c) { return c.productId === productId; });
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        cart = cart.filter(function (c) { return c.productId !== productId; });
      }
    }
    this._set(STORE.CART, cart);
  },
  removeFromCart(productId) {
    var cart = this.getCart().filter(function (c) { return c.productId !== productId; });
    this._set(STORE.CART, cart);
  },
  clearCart() { this._set(STORE.CART, []); },
  getCartCount() { return this.getCart().reduce(function (n, c) { return n + c.quantity; }, 0); },
  getCartTotal() { return this.getCart().reduce(function (t, c) { return t + c.price * c.quantity; }, 0); },

  /* ── Orders ─────────────────────────────────────────────── */
  getOrders()              { return this._get(STORE.ORDERS); },
  getOrder(id)             { return this.getOrders().find(function (o) { return o.id === id; }) || null; },
  getOrdersByBuyer(uid)    { return this.getOrders().filter(function (o) { return o.buyerId === uid; }); },
  createOrder(buyerId, items, address, paymentMethod) {
    var orders = this.getOrders();
    var newId  = Math.max(0, ...orders.map(function (o) { return o.id; })) + 1;
    var total  = items.reduce(function (t, i) { return t + i.price * i.quantity; }, 0);
    var order  = {
      id: newId, buyerId: buyerId, items: items,
      totalValue: parseFloat(total.toFixed(2)),
      deliveryAddress: address,
      paymentMethod: paymentMethod,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    this._set(STORE.ORDERS, orders);
    return order;
  },

  /* ── Reviews ────────────────────────────────────────────── */
  getReviews()             { return this._get(STORE.REVIEWS); },
  getReviewsByProduct(pid) { return this.getReviews().filter(function (r) { return r.productId === pid; }); },
  getReviewsByStore(sid)   { return this.getReviews().filter(function (r) { return r.storeId === sid; }); },
  addReview(review) {
    var items = this.getReviews();
    review.id        = Math.max(0, ...items.map(function (r) { return r.id; })) + 1;
    review.createdAt = new Date().toISOString();
    items.push(review);
    this._set(STORE.REVIEWS, items);
    /* recalculate product rating */
    var product = this.getProduct(review.productId);
    if (product) {
      var pRev = items.filter(function (r) { return r.productId === product.id; });
      product.rating       = parseFloat((pRev.reduce(function (s, r) { return s + r.rating; }, 0) / pRev.length).toFixed(1));
      product.totalReviews = pRev.length;
      this.saveProduct(product);
    }
    /* recalculate store rating */
    var store = this.getStore(review.storeId);
    if (store) {
      var sRev = items.filter(function (r) { return r.storeId === store.id; });
      store.rating       = parseFloat((sRev.reduce(function (s, r) { return s + r.rating; }, 0) / sRev.length).toFixed(1));
      store.totalReviews = sRev.length;
      this.saveStore(store);
    }
    return review;
  },

  /* ── Session ────────────────────────────────────────────── */
  getSession()   { var s = localStorage.getItem(STORE.SESSION); return s !== null ? parseInt(s, 10) : null; },
  setSession(id) { localStorage.setItem(STORE.SESSION, String(id)); },
  clearSession() { localStorage.removeItem(STORE.SESSION); },

  /* ── Favorites ──────────────────────────────────────────── */
  getFavs()          { return this._get(STORE.FAVS); },
  isFav(productId)   { return this.getFavs().includes(productId); },
  toggleFav(productId) {
    var favs = this.getFavs();
    var idx  = favs.indexOf(productId);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(productId);
    this._set(STORE.FAVS, favs);
    return idx < 0;
  },

  /* ── Analytics Prefs ─────────────────────────────────────── */
  getAnalyticsPrefs() {
    try { return JSON.parse(localStorage.getItem(STORE.ANALYTICS_PREFS)) || {}; } catch(_) { return {}; }
  },
  saveAnalyticsPrefs(prefs) {
    try { localStorage.setItem(STORE.ANALYTICS_PREFS, JSON.stringify(prefs)); } catch(_) {}
  },
};

/* ── Utilitários de Formatação ────────────────────────────── */
const Fmt = {
  currency(v) { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); },
  date(iso)   {
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
  },
  relativeDate(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7)  return days + ' dias atrás';
    if (days < 30) return Math.floor(days / 7) + ' semana' + (Math.floor(days / 7) > 1 ? 's' : '') + ' atrás';
    return Fmt.date(iso);
  },
  stars(rating) {
    var full = Math.floor(rating);
    var half = rating - full >= 0.5;
    var html = '';
    for (var i = 0; i < 5; i++) {
      if (i < full)            html += '<i class="fa-solid fa-star"></i>';
      else if (i === full && half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
      else                     html += '<i class="fa-regular fa-star"></i>';
    }
    return html;
  },
  categoryLabel(cat) {
    return { racao:'Ração', adubo:'Adubos', defensivo:'Defensivos', medicamento:'Medicamentos', sementes:'Sementes', outros:'Outros' }[cat] || cat;
  },
  categoryIcon(cat) {
    return { racao:'fa-cow', adubo:'fa-flask', defensivo:'fa-shield', medicamento:'fa-syringe', sementes:'fa-seedling', outros:'fa-box' }[cat] || 'fa-tag';
  },
  categoryColor(cat) {
    return { racao:'badge-racao', adubo:'badge-adubo', defensivo:'badge-defensivo', medicamento:'badge-medicamento', sementes:'badge-sementes', outros:'badge-outros' }[cat] || '';
  },
  segmentoLabel(seg) {
    return { racao:'Ração Animal', adubo:'Adubos & Fertilizantes', defensivo:'Defensivos Agrícolas', medicamento:'Medicamentos Vet.', sementes:'Sementes', ferramentas:'Ferramentas', outros:'Outros' }[seg] || seg;
  },
  orderStatus(status) {
    return { confirmed:'Confirmado', shipped:'Em transporte', delivered:'Entregue', cancelled:'Cancelado' }[status] || status;
  },
  orderStatusClass(status) {
    return { confirmed:'badge-warning', shipped:'badge-info', delivered:'badge-success', cancelled:'badge-danger' }[status] || '';
  },
  urlParam(key) { return new URLSearchParams(window.location.search).get(key); },
  avatar(user, size) {
    size = size || '28px';
    return '<span class="avatar" style="width:' + size + ';height:' + size + ';font-size:.65rem;background:' + (user.color || '#2E7D32') + '">' + user.initials + '</span>';
  },
};

/* ── Toast ──────────────────────────────────────────────────── */
const Toast = {
  _c: null,
  _ensure() {
    if (!this._c) {
      this._c = document.createElement('div');
      this._c.className = 'toast-container';
      document.body.appendChild(this._c);
    }
    return this._c;
  },
  show(message, type, duration) {
    type = type || 'success'; duration = duration || 3500;
    var wrap = this._ensure();
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    var icons = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info', warning:'fa-triangle-exclamation' };
    el.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.success) + '"></i><span>' + message + '</span>';
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 400);
    }, duration);
  },
};

/* ── Shared nav utils (cartCount badge, modal helpers) ──────── */
function updateCartBadge() {
  var badge = document.getElementById('cartBadge');
  var count = Storage.getCartCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function openModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

/* ── Inicializar ─────────────────────────────────────────────── */
Storage.init();
