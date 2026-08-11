import { COLS, ROWS, spanOf, type StageItem } from "@/components/StagePlot";

export type RiderPreset = {
  id: string;
  label: string;
  description: string;
  channels: string[];
  /** Derivado do StageItem para não dessincronizar: quando a peça no mapa ganha um campo
   *  novo (rotação, espelho), o preset passa a poder usá-lo sem mexer neste tipo. */
  stage: Omit<StageItem, "id">[];
  sound: string;
  lighting: string;
  backline: string;
  hospitality: string;
};

/**
 * As posições são escritas na grade de referência de 18 colunas (PRESET_AUTHORED_COLS).
 * `presetToStageItems` centraliza automaticamente quando COLS cresce — não é preciso
 * reescrever coordenadas ao alargar o palco.
 * `row: 0` é o fundo do palco (upstage) e `row: 11` é a boca de cena (downstage).
 * A coluna 8 é o eixo central desta grade. Como manda a convenção de mapa de palco,
 * o desenho é a visão da plateia para o palco.
 *
 * Convenções seguidas por todos os presets:
 * - **P.A. nas pontas**: um par de `subwoofer` ancorado nas colunas 0-1 e 16-17 das
 *   cinco últimas linhas. É o enquadramento do palco, presente até nos formatos solo.
 * - **Cada retorno colado no seu instrumento**: a cunha fica nas linhas imediatamente
 *   à frente do músico que ela atende, não enfileirada na boca de cena. Um retorno
 *   solto no meio do palco não diz a quem pertence.
 * - **Voz principal ganha par L/R**: quando há um único vocalista à frente, ele leva
 *   dois retornos na boca de cena (`row: 10`), um de cada lado do eixo central.
 * - **Bateria ao centro**, no fundo — em torno da `col: 8`.
 * - **Espelhar o pedestal** quando o músico está à esquerda dele: a arte tem a girafa
 *   apontando para a direita, então `flipX` vira o microfone para quem vai cantar.
 * - **DI no pé do instrumento**: a caixa fica na célula logo abaixo do violão,
 *   cavaquinho ou teclado, como cai no chão na vida real — não ao lado.
 * - **Amplificador acompanha o instrumento**: guitarra com `cubo_guitarra`, baixo
 *   com `cubo_baixo`, contrabaixo acústico idem — o cubo atrás do respectivo músico.
 * - **Microfone**: `pedestal` quando o músico toca algo e precisa das mãos livres;
 *   `voz` (de mão) para quem só canta.
 */
export const RIDER_PRESETS: RiderPreset[] = [
  {
    id: "voz_violao",
    label: "Voz + Violão",
    description: "Formato acústico solo: 2 canais, retorno único e mínimo de backline.",
    channels: ["Voz principal — SM58 com pedestal girafa", "Violão — DI ativo (saída do captador)"],
    stage: [
      { kind: "pedestal", label: "Voz principal", col: 8, row: 4 },
      { kind: "violao", label: "Violão", col: 10, row: 5 },
      { kind: "di_box", label: "DI violão", col: 10, row: 8 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — voz", col: 5, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — voz", col: 9, row: 10 },
    ],
    sound:
      "P.A. compatível com o local, montado nas duas pontas do palco, mesa digital com no mínimo 4 canais, 1 cunha de retorno na boca de cena (ou sistema in-ear), 1 DI ativo para o violão, 2 pedestais girafa e cabos XLR/P10 em bom estado.",
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
      "Cajón — SM57 (batida) + Beta 91 (grave)",
      "Shaker / overhead — condensador",
    ],
    stage: [
      { kind: "cajon", label: "Cajón", col: 10, row: 1 },
      { kind: "monitor", label: "Monitor — cajón", col: 10, row: 4 },
      { kind: "pedestal", label: "Voz 2 / backing", col: 14, row: 1, flipX: true },
      { kind: "pedestal", label: "Voz principal", col: 5, row: 4 },
      { kind: "violao", label: "Violão", col: 7, row: 5 },
      { kind: "di_box", label: "DI violão", col: 7, row: 8 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — voz", col: 5, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — voz", col: 9, row: 10 },
    ],
    sound:
      "Mesa digital com no mínimo 8 canais, 3 monitores de palco independentes (2 na boca de cena e 1 para o cajón), P.A. nas duas pontas do palco, 3 pedestais girafa, 1 DI ativo para o violão e cabeamento XLR/P10 revisado.",
    lighting: "Iluminação frontal quente com contraluz simples; sem exigência de efeitos.",
    backline:
      "2 banquetas sem braço, 1 suporte de violão, 1 cajón (quando não trazido pelo grupo) e mesa de apoio.",
    hospitality: "Camarim para 3 pessoas, 6 garrafas de água, frutas e ponto de energia.",
  },
  {
    id: "samba_pagode",
    label: "Samba / Pagode",
    description: "Roda de samba com percussão completa, cavaquinho e banjo — 12 canais.",
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
      { kind: "praticavel", label: "Praticável central", col: 6, row: 0 },
      { kind: "tantan", label: "Surdo / tantã", col: 3, row: 1 },
      { kind: "pandeiro", label: "Pandeiro", col: 12, row: 1 },
      { kind: "banjo", label: "Banjo", col: 14, row: 1 },
      { kind: "di_box", label: "DI banjo", col: 14, row: 3 },
      { kind: "monitor", label: "Monitor — percussão", col: 3, row: 4 },
      { kind: "pedestal", label: "Voz 2", col: 1, row: 2 },
      { kind: "pedestal", label: "Voz principal", col: 8, row: 4 },
      { kind: "pedestal", label: "Voz 3", col: 16, row: 1, flipX: true },
      { kind: "cavaco", label: "Cavaquinho", col: 4, row: 6 },
      { kind: "di_box", label: "DI cavaquinho", col: 4, row: 9 },
      { kind: "violao", label: "Violão 7 cordas", col: 11, row: 5 },
      { kind: "di_box", label: "DI violão", col: 11, row: 8 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — voz", col: 6, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — voz", col: 10, row: 10 },
    ],
    sound:
      "Mesa digital de 16 canais, 4 mixes de monitor com 2 cunhas na boca de cena, P.A. em torre nas duas pontas do palco, 6 pedestais girafa e 3 DIs ativos (cavaquinho, banjo e violão 7 cordas). Disposição em roda com praticável central quando possível.",
    lighting:
      "Iluminação ambiente quente sobre a roda, 4 LED PARs e contraluz frontal para captação de vídeo.",
    backline:
      "Praticável central, 6 banquetas, apoio para instrumentos de percussão e amplificação para violão 7 cordas.",
    hospitality:
      "Camarim para 6 pessoas, 12 garrafas de água, refrigerantes, cerveja gelada (quando aplicável) e refeição quente.",
  },
  {
    id: "forro_pe_de_serra",
    label: "Forró pé de serra",
    description: "Trio clássico: sanfona, zabumba e triângulo — 6 canais e 2 retornos.",
    channels: [
      "Voz principal — SM58 (pedestal do sanfoneiro)",
      "Sanfona / teclado do baixo — DI",
      "Sanfona / fole — condensador em pedestal girafa",
      "Zabumba (pele grave) — Beta 52",
      "Zabumba (bacalhau) — SM57",
      "Triângulo — condensador",
    ],
    stage: [
      { kind: "triangulo", label: "Triângulo", col: 6, row: 1 },
      { kind: "tantan", label: "Zabumba", col: 10, row: 1 },
      { kind: "monitor", label: "Monitor — zabumba / triângulo", col: 7, row: 4 },
      { kind: "pedestal", label: "Voz principal", col: 7, row: 6 },
      { kind: "sanfona", label: "Sanfona", col: 9, row: 6 },
      { kind: "di_box", label: "DI sanfona", col: 9, row: 9 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — voz", col: 3, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — voz", col: 11, row: 10 },
    ],
    sound:
      "Mesa digital com no mínimo 8 canais, 2 mixes de monitor independentes, P.A. compatível com o público, 3 pedestais girafa, 1 DI ativo e 1 pedestal reto para o triângulo.",
    lighting:
      "Iluminação frontal quente sobre os três músicos e contraluz simples. Sem exigência de efeitos.",
    backline:
      "1 banqueta sem braços para o sanfoneiro, 1 pedestal de zabumba (quando não trazido pelo grupo), 1 mesa de apoio e ponto de energia próximo ao sanfoneiro.",
    hospitality:
      "Camarim para 3 pessoas, 6 garrafas de água sem gás, café e refeição quente quando o show ultrapassar 2 horas.",
  },
  {
    id: "quarteto_jazz",
    label: "Quarteto de Jazz",
    description: "Piano, contrabaixo acústico, guitarra e bateria — 11 canais e 4 retornos.",
    channels: [
      "Bumbo — Beta 52 (ou D112)",
      "Caixa — SM57",
      "Hi-hat — condensador",
      "Overhead L — condensador",
      "Overhead R — condensador",
      "Contrabaixo acústico — DI do captador + condensador no cavalete",
      "Piano L — condensador (ou DI, se digital)",
      "Piano R — condensador (ou DI, se digital)",
      "Guitarra — SM57 no combo",
      "Microfone de apresentação — SM58 em pedestal girafa",
    ],
    stage: [
      { kind: "piano", label: "Piano", col: 1, row: 0 },
      { kind: "cubo_guitarra", label: "Cubo de guitarra", col: 6, row: 0 },
      { kind: "bateria", label: "Bateria", col: 9, row: 0 },
      { kind: "cubo_baixo", label: "Cubo do contrabaixo", col: 14, row: 0 },
      { kind: "guitarra", label: "Guitarra", col: 6, row: 3 },
      { kind: "monitor", label: "Monitor — piano", col: 1, row: 5 },
      { kind: "monitor", label: "Monitor — guitarra", col: 5, row: 5 },
      { kind: "monitor", label: "Monitor — bateria", col: 9, row: 4 },
      { kind: "contrabaixo", label: "Contrabaixo acústico", col: 14, row: 3 },
      { kind: "monitor", label: "Monitor — contrabaixo", col: 12, row: 8, flipX: true },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
    ],
    sound:
      "Mesa digital com no mínimo 16 canais e 4 mixes de monitor independentes, um por músico — a dinâmica do jazz é acústica e cada cunha precisa de volume próprio. P.A. em torre nas duas pontas, 2 condensadores para o piano, 1 condensador para o cavalete do contrabaixo, 1 DI ativo e 1 pedestal girafa para apresentação.",
    lighting:
      "Luz frontal quente e homogênea sobre os quatro músicos, sem efeitos, sem strobo e sem mudança de cor durante os temas. Contraluz suave para captação de vídeo.",
    backline:
      "Piano de cauda afinado no dia (ou piano digital de 88 teclas com ação pesada e pedal sustain), banco de piano com altura regulável, amplificador de contrabaixo acústico, banqueta para o guitarrista e 2 estantes de partitura com luz.",
    hospitality:
      "Camarim para 4 pessoas com espelho e cabides, 8 garrafas de água sem gás em temperatura ambiente, café, frutas e refeição leve quando o show ultrapassar 2 horas.",
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
      { kind: "cubo_baixo", label: "Cubo de baixo", col: 1, row: 0 },
      { kind: "bateria", label: "Bateria", col: 6, row: 0 },
      { kind: "cubo_guitarra", label: "Cubo de guitarra", col: 13, row: 0 },
      { kind: "baixo", label: "Baixo", col: 1, row: 3 },
      { kind: "di_box", label: "DI baixo", col: 4, row: 3 },
      { kind: "teclado", label: "Teclado", col: 12, row: 3 },
      { kind: "monitor", label: "Monitor — bateria", col: 6, row: 4 },
      { kind: "monitor", label: "Monitor — baixo", col: 0, row: 5 },
      { kind: "di_box", label: "DI teclado", col: 12, row: 5 },
      { kind: "guitarra", label: "Guitarra", col: 14, row: 5 },
      { kind: "pedestal", label: "Backing 1 — baixo", col: 4, row: 5, flipX: true },
      { kind: "pedestal", label: "Backing 2 — guitarra", col: 10, row: 5 },
      { kind: "monitor", label: "Monitor — guitarra", col: 12, row: 7, flipX: true },
      { kind: "voz", label: "Voz principal", col: 8, row: 8 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — voz", col: 5, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — voz", col: 9, row: 10 },
    ],
    sound:
      "Mesa digital de 24 canais com no mínimo 5 mixes de monitor independentes: 2 cunhas na boca de cena (voz e guitarra), 1 cunha para a bateria e in-ear ou cunha extra para baixo e teclado. P.A. adequado ao público esperado, em torre nas duas pontas do palco, praticável para bateria e cabeamento completo.",
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
      { kind: "cubo_guitarra", label: "Cubo de guitarra", col: 1, row: 0 },
      { kind: "bateria", label: "Bateria (fundo)", col: 6, row: 0 },
      { kind: "cubo_baixo", label: "Cubo de baixo", col: 14, row: 0 },
      { kind: "guitarra", label: "Guitarra", col: 1, row: 3 },
      { kind: "baixo", label: "Baixo", col: 14, row: 3 },
      { kind: "monitor", label: "Monitor — bateria", col: 6, row: 4 },
      { kind: "monitor", label: "Monitor — guitarra", col: 1, row: 5 },
      { kind: "monitor", label: "Monitor — baixo", col: 12, row: 5, flipX: true },
      { kind: "di_box", label: "DI baixo", col: 16, row: 5 },
      { kind: "voz", label: "Voz 1 (frente)", col: 6, row: 8 },
      { kind: "voz", label: "Voz 2 (frente)", col: 10, row: 8 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — vocais", col: 4, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — vocais", col: 10, row: 10 },
    ],
    sound:
      "Sistema de trio com mínimo 60.000W RMS distribuído nas torres das duas pontas, mesa digital, sistema in-ear para 6 canais mais 2 cunhas de apoio na boca de cena para os vocais, 4 microfones sem fio e técnico próprio do carro de som.",
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
      { kind: "pedestal", label: "Voz / condução", col: 7, row: 4 },
      { kind: "teclado", label: "Instrumento harmônico", col: 9, row: 5 },
      { kind: "di_box", label: "DI do instrumento", col: 9, row: 7 },
      { kind: "subwoofer", label: "P.A. esquerdo", col: 0, row: 7 },
      { kind: "subwoofer", label: "P.A. direito", col: 16, row: 7 },
      { kind: "monitor_esquerdo", label: "Monitor L — voz", col: 5, row: 10 },
      { kind: "monitor_direito", label: "Monitor R — voz", col: 9, row: 10 },
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

/** Largura de grade em que as posições dos presets foram desenhadas. Quando COLS cresce,
 * os presets são centralizados no palco novo em vez de ficarem encostados à esquerda. */
const PRESET_AUTHORED_COLS = 18;

/** As posições vêm na grade em que o preset foi desenhado (PRESET_AUTHORED_COLS). O
 * deslocamento centraliza no palco atual e o clamp garante que nada estoure a borda caso
 * o porte (span) de algum elemento mude. */
export function presetToStageItems(preset: RiderPreset): StageItem[] {
  const offset = Math.max(0, Math.floor((COLS - PRESET_AUTHORED_COLS) / 2));
  return preset.stage.map((s) => {
    const span = spanOf(s.kind);
    return {
      ...s,
      id: crypto.randomUUID(),
      col: Math.max(0, Math.min(COLS - span.w, s.col + offset)),
      row: Math.max(0, Math.min(ROWS - span.h, s.row)),
    };
  });
}
