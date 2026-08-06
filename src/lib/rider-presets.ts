import type { StageItem, StageKind } from "@/components/StagePlot";

export type RiderPreset = {
  id: string;
  label: string;
  description: string;
  channels: string[];
  stage: { kind: StageKind; label: string; col: number; row: number }[];
  sound: string;
  lighting: string;
  backline: string;
  hospitality: string;
};

export const RIDER_PRESETS: RiderPreset[] = [
  {
    id: "voz_violao",
    label: "Voz + Violão",
    description: "Formato acústico solo: 2 canais, retorno único e mínimo de backline.",
    channels: ["Voz principal — SM58 com pedestal girafa", "Violão — DI ativo (saída do captador)"],
    stage: [
      { kind: "voz", label: "Voz principal", col: 1, row: 2 },
      { kind: "violao", label: "Violão", col: 2, row: 2 },
      { kind: "monitor", label: "Monitor 1", col: 1, row: 1 },
    ],
    sound:
      "P.A. compatível com o local, mesa digital com no mínimo 4 canais, 1 monitor de palco (ou sistema in-ear), 2 pedestais girafa e cabos XLR/P10 em bom estado.",
    lighting: "Iluminação frontal branca quente e contraluz simples. Não são exigidos efeitos.",
    backline: "1 banqueta sem braços, 1 suporte de violão e 1 mesa de apoio para setlist e água.",
    hospitality:
      "Camarim com espelho, 2 garrafas de água sem gás em temperatura ambiente e ponto de energia.",
  },
  {
    id: "trio_acustico",
    label: "Trio Acústico",
    description: "Voz, violão e percussão leve: 6 canais e 3 retornos.",
    channels: [
      "Voz principal — SM58",
      "Voz 2 / backing — SM58",
      "Violão — DI ativo",
      "Cajón / percussão — SM57",
      "Shaker / overhead — condensador",
    ],
    stage: [
      { kind: "voz", label: "Voz principal", col: 1, row: 2 },
      { kind: "violao", label: "Violão", col: 2, row: 2 },
      { kind: "bateria", label: "Percussão / cajón", col: 2, row: 1 },
      { kind: "monitor", label: "Monitor 1", col: 1, row: 1 },
    ],
    sound:
      "Mesa digital com no mínimo 8 canais, 3 monitores de palco independentes, 3 pedestais girafa, 1 DI ativo e cabeamento XLR/P10 revisado.",
    lighting: "Iluminação frontal quente com contraluz simples; sem exigência de efeitos.",
    backline:
      "2 banquetas sem braço, 1 suporte de violão, 1 cajón (quando não trazido pelo grupo) e mesa de apoio.",
    hospitality: "Camarim para 3 pessoas, 6 garrafas de água, frutas e ponto de energia.",
  },
  {
    id: "samba_pagode",
    label: "Samba / Pagode",
    description: "Roda de samba com percussão completa, cavaco e banjo — 12 canais.",
    channels: [
      "Voz principal — SM58",
      "Voz 2 — SM58",
      "Voz 3 — SM58",
      "Cavaquinho — DI",
      "Banjo — DI",
      "Violão 7 cordas — DI",
      "Pandeiro — condensador",
      "Tantã — SM57",
      "Repique de mão — SM57",
      "Surdo — Beta 52",
    ],
    stage: [
      { kind: "tantan", label: "Surdo / tantã", col: 2, row: 0 },
      { kind: "pandeiro", label: "Pandeiro + voz", col: 1, row: 1 },
      { kind: "guitarra", label: "Cavaco / banjo", col: 2, row: 1 },
      { kind: "violao", label: "Violão 7 cordas", col: 3, row: 1 },
      { kind: "voz", label: "Voz principal", col: 1, row: 2 },
      { kind: "monitor", label: "Monitor mesa de samba", col: 2, row: 2 },
    ],
    sound:
      "Mesa digital de 16 canais, 4 mixes de monitor, P.A. compatível com o público, 6 pedestais girafa e 3 DIs ativos. Formato em roda com mesa central quando possível.",
    lighting:
      "Iluminação ambiente quente sobre a roda, 4 LED PARs e contraluz frontal para captação de vídeo.",
    backline:
      "Mesa de samba central (ou praticável), 6 banquetas, apoio para instrumentos de percussão e amplificação para violão 7 cordas.",
    hospitality:
      "Camarim para 6 pessoas, 12 garrafas de água, refrigerantes, cerveja gelada (quando aplicável) e refeição quente.",
  },
  {
    id: "banda_completa",
    label: "Banda Completa (5 integrantes)",
    description: "Voz, guitarra, baixo, teclado e bateria com 16 canais e 5 retornos.",
    channels: [
      "Bumbo — Beta 52",
      "Caixa — SM57",
      "Hi-hat — condensador",
      "Tom 1 — e604",
      "Tom 2 — e604",
      "Overhead L — condensador",
      "Overhead R — condensador",
      "Baixo — DI",
      "Guitarra — SM57 no combo",
      "Teclado L — DI",
      "Teclado R — DI",
      "Voz principal — SM58/Beta58",
      "Backing vocal 1 — SM58",
      "Backing vocal 2 — SM58",
    ],
    stage: [
      { kind: "bateria", label: "Bateria", col: 1, row: 0 },
      { kind: "teclado", label: "Teclado", col: 3, row: 0 },
      { kind: "baixo", label: "Baixo", col: 0, row: 1 },
      { kind: "guitarra", label: "Guitarra", col: 3, row: 1 },
      { kind: "voz", label: "Voz principal", col: 1, row: 2 },
      { kind: "monitor", label: "Monitor voz", col: 2, row: 2 },
    ],
    sound:
      "Mesa digital de 24 canais com no mínimo 5 mixes de monitor independentes, P.A. adequado ao público esperado, 5 monitores de palco, praticável para bateria e cabeamento completo.",
    lighting:
      "Mínimo de 8 refletores LED PAR, 4 moving heads, 2 canhões de contraluz e máquina de fumaça, com operador durante a passagem de som e o show.",
    backline:
      'Bateria completa (bumbo 22", caixa, 2 toms, estantes e banco — pratos e caixa do próprio músico), amplificador de baixo 500W, amplificador de guitarra valvulado, suporte de teclado em X duplo, 4 pedestais girafa e 2 pedestais retos.',
    hospitality:
      "Camarim exclusivo com 5 assentos, espelho, energia, banheiro próximo, 12 garrafas de água, refrigerantes, frutas e refeição quente para 5 pessoas (1 opção vegetariana).",
  },
  {
    id: "trio_eletrico",
    label: "Trio elétrico / Bloco",
    description: "Estrutura de carro de som e cortejo com in-ear e alta pressão sonora.",
    channels: [
      "Voz 1 — sem fio Shure",
      "Voz 2 — sem fio Shure",
      "Guitarra — DI/mic",
      "Baixo — DI",
      "Bateria — kit completo (8 canais)",
      "Percussão — 2 canais",
    ],
    stage: [
      { kind: "bateria", label: "Bateria (fundo)", col: 2, row: 0 },
      { kind: "guitarra", label: "Guitarra", col: 0, row: 1 },
      { kind: "baixo", label: "Baixo", col: 3, row: 1 },
      { kind: "voz", label: "Voz 1 (frente)", col: 1, row: 2 },
      { kind: "voz", label: "Voz 2 (frente)", col: 2, row: 2 },
    ],
    sound:
      "Sistema de trio com mínimo 60.000W RMS, mesa digital, sistema in-ear para 6 canais, 4 microfones sem fio e técnico próprio do carro de som.",
    lighting:
      "Iluminação estrutural do trio com operador, strobo e contraluz frontal para captação de imagem.",
    backline:
      "Bateria completa fixada, amplificadores de guitarra e baixo, 2 praticáveis e proteção contra chuva em toda a área de equipamentos.",
    hospitality:
      "Área reservada no trio, 24 garrafas de água geladas, isotônicos, toalhas e apoio de produção para embarque/desembarque.",
  },
  {
    id: "duo_educacional",
    label: "Duo / Workshop educacional",
    description: "Formato para escolas, oficinas e apresentações didáticas.",
    channels: [
      "Voz + fala — SM58",
      "Instrumento harmônico — DI",
      "Áudio de apoio (notebook) — P2 estéreo",
    ],
    stage: [
      { kind: "voz", label: "Voz / condução", col: 1, row: 1 },
      { kind: "teclado", label: "Instrumento harmônico", col: 2, row: 1 },
      { kind: "monitor", label: "Monitor", col: 1, row: 0 },
    ],
    sound:
      "Caixa amplificada ou P.A. compatível com a sala, 2 canais de microfone, 1 entrada auxiliar para áudio e cabo P2.",
    lighting: "Iluminação ambiente da sala, sem exigência técnica adicional.",
    backline:
      "2 banquetas, 1 mesa de apoio, projetor com HDMI (quando houver conteúdo visual) e quadro branco.",
    hospitality:
      "Água para 2 pessoas, sala de apoio para guarda de instrumentos e acesso ao espaço 60 minutos antes.",
  },
];

export function presetToStageItems(preset: RiderPreset): StageItem[] {
  return preset.stage.map((s) => ({ ...s, id: crypto.randomUUID() }));
}
